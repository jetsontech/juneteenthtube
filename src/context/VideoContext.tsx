"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import pLimit from 'p-limit';


export interface VideoProps {
    id: string;
    title: string;
    thumbnail: string;
    channelName: string;
    channelAvatar: string;
    views: string;
    postedAt: string;
    duration: string;
    videoUrl: string;
    category: string;
    createdAt?: string;
    state?: string;
    videoUrlH264?: string;
    transcodeStatus?: 'pending' | 'processing' | 'completed' | 'failed' | null;
    ownerId?: string;
}


// Initial Mock Data (Fallback) - Empty, user will upload their own content
// Initial Mock Data (Fallback) - Populated with Public Domain Classics for instant playback
const MOCK_VIDEOS: VideoProps[] = [
    {
        id: "within-our-gates",
        title: "Within Our Gates",
        thumbnail: "https://images.unsplash.com/photo-1590073844006-33379778ae09?q=80&w=800",
        channelName: "Maverick Black Cinema",
        channelAvatar: "",
        views: "1.2M",
        postedAt: "1920",
        duration: "1:19:00",
        videoUrl: "https://archive.org/download/WithinOurGates/WithinOurGates_512kb.mp4",
        category: "History",
        state: "GLOBAL"
    },
    {
        id: "symbol-of-the-unconquered",
        title: "The Symbol of the Unconquered",
        thumbnail: "https://images.unsplash.com/photo-1579541814924-49fef17c5be5?q=80&w=800",
        channelName: "Maverick Black Cinema",
        channelAvatar: "",
        views: "850K",
        postedAt: "1920",
        duration: "1:08:00",
        videoUrl: "https://archive.org/download/TheSymbolOfTheUnconquered1920/The%20Symbol%20Of%20the%20Unconquered%20%281920%29.mp4",
        category: "History",
        state: "GLOBAL"
    },
    {
        id: "body-and-soul",
        title: "Body and Soul",
        thumbnail: "/placeholder.svg",
        channelName: "Maverick Black Cinema",
        channelAvatar: "",
        views: "2.1M",
        postedAt: "1925",
        duration: "1:42:00",
        videoUrl: "https://archive.org/download/body-and-soul_202107/Body%20and%20Soul.mp4",
        category: "History",
        state: "GLOBAL"
    },
    {
        id: "bronze-buckaroo",
        title: "The Bronze Buckaroo",
        thumbnail: "https://images.unsplash.com/photo-1526857240824-92be52581d9f?q=80&w=800",
        channelName: "Black Westerns",
        channelAvatar: "",
        views: "940K",
        postedAt: "1939",
        duration: "58:00",
        videoUrl: "https://archive.org/download/bronze_buckaroo/the_bronze_buckaroo.mp4",
        category: "Music",
        state: "GLOBAL"
    },
    {
        id: "hi-de-ho",
        title: "Hi-De-Ho",
        thumbnail: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800",
        channelName: "Soul Stage",
        channelAvatar: "",
        views: "3.5M",
        postedAt: "1947",
        duration: "1:12:00",
        videoUrl: "https://archive.org/download/hi_de_ho/Hi-De-Ho.mp4",
        category: "Music",
        state: "GLOBAL"
    },
    {
        id: "negro-soldier",
        title: "The Negro Soldier",
        thumbnail: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800",
        channelName: "Freedom Reels",
        channelAvatar: "",
        views: "5.2M",
        postedAt: "1944",
        duration: "40:00",
        videoUrl: "https://archive.org/download/negrosoldier/negrosoldier.mp4",
        category: "History",
        state: "GLOBAL"
    },
    {
        id: "black-history-lost-stolen-pt1",
        title: "Black History: Lost, Stolen, or Strayed (Pt 1)",
        thumbnail: "https://images.unsplash.com/photo-1569025743873-ea3a9ber?q=80&w=800",
        channelName: "Freedom Reels",
        channelAvatar: "",
        views: "1.8M",
        postedAt: "1968",
        duration: "27:00",
        videoUrl: "https://archive.org/download/blackhistoryloststolenorstrayed/blackhistoryloststolenorstrayedreel1.mp4",
        category: "Speeches",
        state: "GLOBAL"
    },
    {
        id: "1950s-home-movies-detroit",
        title: "African American Family Life (Detroit)",
        thumbnail: "/placeholder.svg",
        channelName: "Home & Heritage",
        channelAvatar: "",
        views: "420K",
        postedAt: "1950",
        duration: "12:00",
        videoUrl: "https://archive.org/download/HM_African_American_Family_Detroit/HM_African_American_Family_Detroit.mp4",
        category: "History",
        state: "GLOBAL"
    },
    {
        id: "scar-of-shame",
        title: "The Scar of Shame",
        thumbnail: "/placeholder.svg",
        channelName: "Maverick Black Cinema",
        channelAvatar: "",
        views: "600K",
        postedAt: "1927",
        duration: "1:26:00",
        videoUrl: "https://archive.org/download/the-scar-of-shame_1927/the-scar-of-shame_1927.ia.mp4",
        category: "History",
        state: "GLOBAL"
    },
    {
        id: "study-negro-artists",
        title: "A Study of Negro Artists",
        thumbnail: "https://images.unsplash.com/photo-1579541814924-49fef17c5be5?q=80&w=800",
        channelName: "Soul Stage",
        channelAvatar: "",
        views: "300K",
        postedAt: "1933",
        duration: "18:00",
        videoUrl: "https://archive.org/download/StudyOfNegroArtists/StudyOfNegroArtists_512kb.mp4",
        category: "History",
        state: "GLOBAL"
    }
];

interface VideoContextType {
    videos: VideoProps[];
    uploadVideo: (file: File, thumbnailFile?: File | null, category?: string, state?: string) => Promise<void>;
    uploadPhoto: (file: File, caption?: string, state?: string) => Promise<void>;

    getVideoById: (id: string) => VideoProps | undefined;
    isUploading: boolean;
    uploadProgress: number;
    cancelUpload: () => void;
    // New Management Functions
    deleteVideo: (id: string) => Promise<void>;
    updateVideoTitle: (id: string, newTitle: string) => Promise<void>;
    updateVideoThumbnail: (id: string, file: File) => Promise<void>;
    updateVideoFile: (id: string, file: File) => Promise<void>;
    incrementView: (id: string) => Promise<void>;
    updateUserAvatar: (publicUrl: string) => Promise<void>;
    // Photo Management Functions

    deletePhoto: (id: string) => Promise<void>;
    updatePhotoImage: (id: string, file: File) => Promise<void>;
    // Engagement
    getVideoComments: (videoId: string) => Promise<unknown[]>;
    postComment: (videoId: string, text: string, userName: string) => Promise<unknown>;
    getLikes: (videoId: string) => Promise<{ likes: number, userStatus: string | null }>;
    toggleLike: (videoId: string, type: 'like' | 'dislike') => Promise<unknown>;
    getSubscription: (channelName: string) => Promise<boolean>;
    toggleSubscription: (channelName: string) => Promise<boolean>;
    isLoading: boolean;
}

interface DBVideo {
    id: string;
    title: string;
    thumbnail_url?: string;
    views?: number | string; // Can be number or string in DB/Mock
    created_at: string;
    duration?: string;
    video_url: string;
    category?: string;
    state?: string;
    // New Columns
    channel_name?: string;
    channel_avatar?: string;
    posted_at?: string;
    // HEVC Transcoding Support
    video_url_h264?: string;
    transcode_status?: 'pending' | 'processing' | 'completed' | 'failed' | null;
    owner_id?: string;
}


const VideoContext = createContext<VideoContextType | undefined>(undefined);

// Helper to simulate rich data if DB columns are missing
const getMockChannelData = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('parade') || t.includes('juneteenth')) return { name: 'Juneteenth ATL', avatar: '', views: '14K', duration: '12:30' };
    if (t.includes('food') || t.includes('bbq') || t.includes('vegan')) return { name: 'ATL Eats', avatar: '', views: '5K', duration: '8:15' };
    if (t.includes('music') || t.includes('jazz') || t.includes('drum')) return { name: 'Music City', avatar: '', views: '22K', duration: '4:20' };
    if (t.includes('history')) return { name: 'History Buffs', avatar: '', views: '120K', duration: '25:00' };
    if (t.includes('speech') || t.includes('mayor')) return { name: 'City of Atlanta', avatar: '', views: '8K', duration: '15:45' };
    return { name: 'Community User', avatar: '', views: '1.5K', duration: '3:00' };
};

// Helper: Check if file is likely HEVC/H.265 (iPhone videos)
const isLikelyHEVC = (filename: string, mimeType?: string): boolean => {
    const hevcExtensions = ['.hevc', '.heic', '.mov'];
    const hevcMimeTypes = ['video/hevc', 'video/x-hevc', 'video/quicktime'];
    const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    const isHevcExt = hevcExtensions.includes(ext);
    const isHevcMime = mimeType ? hevcMimeTypes.some(t => mimeType.includes(t)) : false;
    // .mov files from iPhone are typically HEVC
    return isHevcExt || isHevcMime;
};

export function VideoProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [videos, setVideos] = useState<VideoProps[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Helper to fetch videos
    const fetchVideos = async () => {
        try {
            const { data, error } = await supabase
                .from('videos')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching videos:', error);
                setVideos(MOCK_VIDEOS);
                return;
            }

            if (data && data.length > 0) {
                const dbVideos: VideoProps[] = data.map((video: DBVideo) => {
                    // Smart Mocking ONLY if DB data is missing
                    const mockChannel = getMockChannelData(video.title);

                    return {
                        id: video.id,
                        title: video.title,
                        thumbnail: video.thumbnail_url || "",
                        // Prioritize DB columns -> Fallback to smart mock -> Fallback to generic default
                        channelName: video.channel_name || video.category === 'Food' ? 'ATL Foodie' : (mockChannel.name || "JuneteenthTV"),
                        channelAvatar: video.channel_avatar || mockChannel.avatar || "",
                        views: video.views?.toString() || mockChannel.views || "1.2K",
                        postedAt: video.posted_at || (video.created_at ? new Date(video.created_at).toLocaleDateString() : "Recently"),
                        duration: video.duration || mockChannel.duration || "5:00",
                        videoUrl: video.video_url,
                        category: video.category || "All",
                        createdAt: video.created_at,
                        state: video.state || "GLOBAL",
                        // HEVC Transcoding Support
                        videoUrlH264: video.video_url_h264,
                        transcodeStatus: video.transcode_status,
                        ownerId: video.owner_id
                    };

                });
                setVideos(dbVideos);
            } else {
                setVideos(MOCK_VIDEOS);
            }
        } catch (err) {
            console.error("Unexpected error fetching videos:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial Fetch
    useEffect(() => {
        fetchVideos();

        // Realtime Listener for transcoding status updates
        const channel = supabase
            .channel('video_updates')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'videos' },
                (payload) => {
                    const video = payload.new as DBVideo;
                    setVideos(prev => prev.map(v => v.id === video.id ? {
                        ...v,
                        videoUrlH264: video.video_url_h264,
                        transcodeStatus: video.transcode_status,
                        thumbnail: video.thumbnail_url || v.thumbnail
                    } : v));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel).catch(() => { });
        };
    }, []);

    // Stable callback with no dependencies
    const cancelUpload = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsUploading(false);
            setUploadProgress(0);
            console.log("Upload cancelled by user");
        }
    }, []);

    // Helper for Guest ID (Persistent non-login user tracking)
    const getGuestId = () => {
        let guestId = localStorage.getItem("jtube_guest_id");
        if (!guestId) {
            guestId = crypto.randomUUID();
            localStorage.setItem("jtube_guest_id", guestId);
        }
        return guestId;
    };

    // --- MANAGEMENT FUNCTIONS ---

    // Engagement API Wrappers
    const getVideoComments = useCallback(async (videoId: string) => {
        const res = await fetch(`/api/comments?videoId=${videoId}`);
        if (!res.ok) return [];
        const { comments } = await res.json();
        return comments || [];
    }, []);

    const postComment = useCallback(async (videoId: string, text: string, userName: string) => {
        const guestId = getGuestId();
        const res = await fetch('/api/comments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-guest-id': guestId
            },
            body: JSON.stringify({ videoId, text, userName })
        });
        if (!res.ok) throw new Error("Failed to post comment");
        return await res.json();
    }, []);

    const getLikes = useCallback(async (videoId: string) => {
        const guestId = getGuestId();
        const res = await fetch(`/api/likes?videoId=${videoId}`, {
            headers: { 'x-guest-id': guestId }
        });
        if (!res.ok) return { likes: 0, userStatus: null };
        return await res.json();
    }, []);

    const toggleLike = useCallback(async (videoId: string, type: 'like' | 'dislike') => {
        const guestId = getGuestId();
        const res = await fetch('/api/likes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-guest-id': guestId
            },
            body: JSON.stringify({ videoId, type })
        });
        if (!res.ok) throw new Error("Failed to toggle like");
        return await res.json();
    }, []);

    const getSubscription = useCallback(async (channelName: string) => {
        const guestId = getGuestId();
        const res = await fetch(`/api/subscribe?channelName=${encodeURIComponent(channelName)}`, {
            headers: { 'x-guest-id': guestId }
        });
        if (!res.ok) return false;
        const { subscribed } = await res.json();
        return subscribed;
    }, []);

    const toggleSubscription = useCallback(async (channelName: string) => {
        const guestId = getGuestId();
        const res = await fetch('/api/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-guest-id': guestId
            },
            body: JSON.stringify({ channelName })
        });
        if (!res.ok) throw new Error("Failed to toggle subscription");
        const { subscribed } = await res.json();
        return subscribed;
    }, []);

    // --- EXISTING MANAGEMENT FUNCTIONS ---

    // --- MANAGEMENT FUNCTIONS ---
    // UPDATED: Now using Server-Side API to bypass RLS issues

    const deleteVideo = useCallback(async (id: string) => {
        try {
            // Using existing delete route or admin route? 
            // For now, let's also move this to an API if RLS blocks delete, 
            // but user didn't complain about delete yet. Sticking to client delete first, 
            // or better, use the delete API we saw earlier if it exists?
            // Actually, let's keep delete as is for now unless it fails. 
            // If it fails, we should use the API too.
            const response = await fetch(`/api/videos?id=${id}`, { method: 'DELETE' });
            if (!response.ok) {
                const { error } = await response.json();
                throw new Error(error || 'Delete failed');
            }
            setVideos(prev => prev.filter(v => v.id !== id));
            console.log(`Video ${id} deleted`);
        } catch (error) {
            console.error("Error deleting video:", error);
            throw error;
        }
    }, []);

    const updateVideoTitle = useCallback(async (id: string, newTitle: string) => {
        try {
            const response = await fetch('/api/videos/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, title: newTitle })
            });

            if (!response.ok) throw new Error('Failed to update title');

            setVideos(prev => prev.map(v => v.id === id ? { ...v, title: newTitle } : v));
        } catch (error) {
            console.error("Error updating title:", error);
            throw error;
        }
    }, []);

    const updateVideoThumbnail = useCallback(async (id: string, file: File) => {
        try {
            // 1. Upload Thumbnail Image using existing API
            const response = await fetch("/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    filename: `thumb_${id}_${file.name}`,
                    contentType: file.type || "image/jpeg",
                }),
            });

            if (!response.ok) throw new Error("Failed to sign thumbnail upload");
            const { signedUrl, publicUrl } = await response.json();

            // 2. Upload to Storage (Client-side is fine for storage if bucket is public/authenticated)
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("PUT", signedUrl);
                xhr.setRequestHeader("Content-Type", file.type || "image/jpeg");
                xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(new Error("Thumbnail upload failed"));
                xhr.onerror = () => reject(new Error("Network Error during upload"));
                xhr.send(file);
            });

            // 3. Update DB via Secure API
            const updateRes = await fetch('/api/videos/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, thumbnail_url: publicUrl })
            });

            if (!updateRes.ok) throw new Error('Failed to update video record');

            // 4. Update Local State
            setVideos(prev => prev.map(v => v.id === id ? { ...v, thumbnail: publicUrl } : v));

        } catch (error) {
            console.error("Error updating thumbnail:", error);
            throw error;
        }
    }, []);

    // Update video file (replace with new video)
    const updateVideoFile = useCallback(async (id: string, file: File) => {
        try {
            setIsUploading(true);
            setUploadProgress(0);

            let publicUrl = "";

            // Use multipart for large files, simple for smaller
            if (file.size > 50 * 1024 * 1024) {
                publicUrl = await uploadMultipart(file, "");
            } else {
                // Simple upload
                const response = await fetch("/api/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        filename: `video_${id}_${Date.now()}_${file.name}`,
                        contentType: file.type || "video/mp4",
                    }),
                });

                if (!response.ok) throw new Error("Failed to sign video upload");
                const { signedUrl, publicUrl: url } = await response.json();
                publicUrl = url;

                await new Promise<void>((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open("PUT", signedUrl);
                    xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
                    xhr.upload.onprogress = (event) => {
                        if (event.lengthComputable) {
                            setUploadProgress(Math.round((event.loaded / event.total) * 100));
                        }
                    };
                    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(new Error("Video upload failed"));
                    xhr.onerror = () => reject(new Error("Network Error during upload"));
                    xhr.send(file);
                });
            }

            // Capture duration if possible
            const getDurationString = (secondCount: number): string => {
                const minutes = Math.floor(secondCount / 60);
                const seconds = Math.floor(secondCount % 60);
                return `${minutes}:${seconds.toString().padStart(2, '0')}`;
            };

            let duration = "0:00";
            try {
                const durationSeconds = await new Promise<number>((resolve) => {
                    const video = document.createElement('video');
                    video.preload = 'metadata';
                    video.onloadedmetadata = () => {
                        window.URL.revokeObjectURL(video.src);
                        resolve(video.duration);
                    };
                    video.onerror = () => resolve(0);
                    video.src = URL.createObjectURL(file);
                });
                if (durationSeconds > 0) {
                    duration = getDurationString(durationSeconds);
                }
            } catch (e) {
                console.warn("Could not capture duration", e);
            }

            // Update DB via Secure API
            const updateRes = await fetch('/api/videos/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, video_url: publicUrl, duration })
            });

            if (!updateRes.ok) throw new Error('Failed to update video record');

            // Update Local State
            setVideos(prev => prev.map(v => v.id === id ? { ...v, videoUrl: publicUrl, duration } : v));
            console.log(`Video ${id} file updated`);

        } catch (error) {
            console.error("Error updating video file:", error);
            throw error;
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    }, []);

    const incrementView = useCallback(async (id: string) => {
        try {
            // Optimistic UI update
            setVideos(prev => prev.map(v => {
                if (v.id === id) {
                    const current = parseInt(v.views.replace(/,/g, '') || "0");
                    return { ...v, views: (current + 1).toString() };
                }
                return v;
            }));

            // Background API call
            const { data } = await supabase.from('videos').select('views').eq('id', id).single();
            if (data) {
                const newViews = (data.views || 0) + 1;
                await fetch('/api/videos/update', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, views: newViews })
                });
            }
        } catch (error) {
            console.error("Error incrementing view:", error);
        }
    }, []);

    const updateUserAvatar = useCallback(async (publicUrl: string) => {
        const response = await fetch('/api/user/metadata', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatar_url: publicUrl })
        });
        if (!response.ok) throw new Error("Failed to update user avatar");
    }, []);


    // --- PHOTO MANAGEMENT FUNCTIONS ---

    const deletePhoto = useCallback(async (id: string) => {
        try {
            const response = await fetch(`/api/photos?id=${id}`, { method: 'DELETE' });
            if (!response.ok) {
                const { error } = await response.json();
                throw new Error(error || 'Delete failed');
            }
            console.log(`Photo ${id} deleted`);
        } catch (error) {
            console.error("Error deleting photo:", error);
            throw error;
        }
    }, []);

    const updatePhotoImage = useCallback(async (id: string, file: File) => {
        try {
            setIsUploading(true);
            setUploadProgress(0);

            // 1. Upload new image to storage
            const response = await fetch("/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    filename: `photo_${id}_${Date.now()}_${file.name}`,
                    contentType: file.type || "image/jpeg",
                }),
            });

            if (!response.ok) throw new Error("Failed to sign image upload");
            const { signedUrl, publicUrl } = await response.json();

            // 2. Upload to Storage
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("PUT", signedUrl);
                xhr.setRequestHeader("Content-Type", file.type || "image/jpeg");
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        setUploadProgress(Math.round((event.loaded / event.total) * 100));
                    }
                };
                xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(new Error("Image upload failed"));
                xhr.onerror = () => reject(new Error("Network Error during upload"));
                xhr.send(file);
            });

            // 3. Update DB via API
            const updateRes = await fetch('/api/photos/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, photo_url: publicUrl })
            });

            if (!updateRes.ok) throw new Error('Failed to update photo record');

            console.log(`Photo ${id} image updated`);

        } catch (error) {
            console.error("Error updating photo image:", error);
            throw error;
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    }, []);

    // --- UPLOAD LOGIC ---
    const uploadMultipart = async (file: File, _category: string): Promise<string> => {
        // Use _category to avoid lint warning, or remove it from signature if not needed (but typically kept for parity)
        // Actually, just removing the underscore or using it in a console log satisfies "unused" if we want to keep the signature.
        // Better: simply use it or remove it. Since it's unused, let's just comment it out effectively or keep it but ignore.
        // Lint said: '_category' is defined but never used. 
        // We'll just remove the parameter usage in the function body if it wasn't used, but here the error is about the argument itself.
        // We will mock usage:
        void _category;

        const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks (reduced for better reliability on slow/unstable connections)
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const signal = abortControllerRef.current?.signal;
        const limit = pLimit(2); // Reduced from 3 to 2 concurrent uploads for stability

        console.log(`Starting Multipart Upload: ${file.name} (${totalChunks} chunks)`);
        console.trace("Multipart Upload Triggered");

        if (signal?.aborted) throw new Error("Upload cancelled");

        const initRes = await fetch("/api/upload-multipart", {
            method: "POST",
            body: JSON.stringify({ action: "create", filename: file.name, contentType: file.type || "video/mp4" }),
            signal
        });
        if (!initRes.ok) {
            const errData = await initRes.json().catch(() => ({}));
            console.error("Multipart Init Failed:", errData);
            throw new Error(errData.error || `Failed to init multipart upload: ${initRes.status}`);
        }
        const { uploadId, key } = await initRes.json();

        let completedChunks = 0;
        const parts: { ETag: string, PartNumber: number }[] = [];

        const uploadPromises = Array.from({ length: totalChunks }, (_, i) => {
            return limit(async () => {
                if (signal?.aborted) throw new Error("Upload cancelled");

                const partNumber = i + 1;
                const start = i * CHUNK_SIZE;
                const end = Math.min(start + CHUNK_SIZE, file.size);
                const chunk = file.slice(start, end);

                const signRes = await fetch("/api/upload-multipart", {
                    method: "POST",
                    body: JSON.stringify({ action: "sign-part", key, uploadId, partNumber }),
                    signal
                });
                const { signedUrl } = await signRes.json();

                // Increased retries from 3 to 5 with exponential backoff
                const uploadPartWithRetry = async (retries = 5, delay = 2000): Promise<string> => {
                    return new Promise((resolve, reject) => {
                        if (signal?.aborted) {
                            reject(new Error("Upload cancelled"));
                            return;
                        }
                        const xhr = new XMLHttpRequest();
                        xhr.open("PUT", signedUrl);
                        xhr.timeout = 600000; // Increased to 10 minute timeout per chunk

                        if (signal) {
                            signal.onabort = () => {
                                xhr.abort();
                                reject(new Error("Upload cancelled"));
                            };
                        }
                        xhr.onload = () => {
                            if (xhr.status >= 200 && xhr.status < 300) {
                                const etag = xhr.getResponseHeader("ETag");
                                if (etag) resolve(etag);
                                else reject(new Error("No ETag in response"));
                            } else {
                                console.error(`Part ${partNumber} failed with status ${xhr.status}: ${xhr.responseText}`);
                                if (retries > 1 && !signal?.aborted) {
                                    const nextDelay = Math.min(delay * 1.5, 10000); // Exponential backoff, max 10s
                                    setTimeout(() => resolve(uploadPartWithRetry(retries - 1, nextDelay)), delay);
                                } else reject(new Error(`Part Upload Failed: ${xhr.status} - ${xhr.responseText?.substring(0, 200)}`));
                            }
                        };
                        xhr.onerror = (e) => {
                            console.error(`Part ${partNumber} network error:`, e);
                            if (retries > 1 && !signal?.aborted) {
                                const nextDelay = Math.min(delay * 1.5, 10000);
                                setTimeout(() => resolve(uploadPartWithRetry(retries - 1, nextDelay)), delay);
                            } else reject(new Error("Network Error"));
                        };
                        xhr.ontimeout = () => {
                            console.error(`Part ${partNumber} timed out`);
                            if (retries > 1 && !signal?.aborted) {
                                const nextDelay = Math.min(delay * 1.5, 10000);
                                setTimeout(() => resolve(uploadPartWithRetry(retries - 1, nextDelay)), delay);
                            } else reject(new Error("Upload timed out"));
                        };
                        xhr.send(chunk);
                    });
                };

                const etag = await uploadPartWithRetry();
                completedChunks++;
                const percent = Math.round((completedChunks / totalChunks) * 100);
                setUploadProgress(percent);
                return { ETag: etag, PartNumber: partNumber };
            });
        });

        const results = await Promise.all(uploadPromises);
        parts.push(...results);

        const completeRes = await fetch("/api/upload-multipart", {
            method: "POST",
            body: JSON.stringify({ action: "complete", key, uploadId, parts: parts.sort((a, b) => a.PartNumber - b.PartNumber) }),
            signal
        });
        if (!completeRes.ok) throw new Error("Failed to complete multipart upload");

        const { publicUrl } = await completeRes.json();
        return publicUrl;
    };


    const uploadVideo = useCallback(async (file: File, thumbnailFile: File | null = null, category: string = "All", state: string = "GLOBAL") => {
        console.log("uploadVideo called for:", file.name, "with thumbnail:", thumbnailFile?.name);

        console.trace("uploadVideo Call Stack");
        setIsUploading(true);

        setUploadProgress(0);

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        try {
            let publicUrl = "";

            if (file.size > 50 * 1024 * 1024) {
                publicUrl = await uploadMultipart(file, category);
            } else {
                console.log("Using Simple Upload (<50MB)...");
                const response = await fetch("/api/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        filename: file.name,
                        contentType: file.type || "video/mp4",
                    }),
                    signal
                });

                if (!response.ok) throw new Error(`API Sign Error: ${response.status} ${response.statusText}`);
                const { signedUrl, publicUrl: simplePublicUrl, error } = await response.json();
                if (error) throw new Error(`Sign Error: ${error}`);

                if (signal.aborted) throw new Error("Upload cancelled");

                await new Promise<void>((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open("PUT", signedUrl);
                    xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
                    if (signal) {
                        signal.onabort = () => {
                            xhr.abort();
                            reject(new Error("Upload cancelled"));
                        };
                    }
                    xhr.upload.onprogress = (event) => {
                        if (event.lengthComputable) {
                            const percent = Math.round((event.loaded / event.total) * 100);
                            setUploadProgress(percent);
                        }
                    };
                    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(new Error(`Upload Failed`));
                    xhr.onerror = () => reject(new Error("Network Error"));
                    xhr.send(file);
                });
                publicUrl = simplePublicUrl;
            }

            if (signal.aborted) throw new Error("Upload cancelled");

            console.log("Saving to DB...");

            // Get duration string (MM:SS)
            const getDurationString = (secondCount: number): string => {
                const minutes = Math.floor(secondCount / 60);
                const seconds = Math.floor(secondCount % 60);
                return `${minutes}:${seconds.toString().padStart(2, '0')}`;
            };

            // Capture duration if possible
            let duration = "0:00";
            try {
                const durationSeconds = await new Promise<number>((resolve) => {
                    const video = document.createElement('video');
                    video.preload = 'metadata';
                    video.onloadedmetadata = () => {
                        window.URL.revokeObjectURL(video.src);
                        resolve(video.duration);
                    };
                    video.onerror = () => resolve(0);
                    video.src = URL.createObjectURL(file);
                });
                if (durationSeconds > 0) {
                    duration = getDurationString(durationSeconds);
                }
            } catch (e) {
                console.warn("Could not capture duration", e);
            }

            // 1. Upload Thumbnail if provided
            let thumbnailPath = "";
            if (thumbnailFile) {
                console.log("Uploading custom thumbnail...");
                const thumbRes = await fetch("/api/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        filename: `thumb_${Date.now()}_${thumbnailFile.name}`,
                        contentType: thumbnailFile.type || "image/jpeg",
                    }),
                    signal
                });
                if (thumbRes.ok) {
                    const { signedUrl: thumbSignedUrl, publicUrl: thumbPublicUrl } = await thumbRes.json();
                    await new Promise<void>((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open("PUT", thumbSignedUrl);
                        xhr.setRequestHeader("Content-Type", thumbnailFile.type || "image/jpeg");
                        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(new Error("Thumbnail upload failed"));
                        xhr.onerror = () => reject(new Error("Network error during thumbnail upload"));
                        xhr.send(thumbnailFile);
                    });
                    thumbnailPath = thumbPublicUrl;
                    console.log("Custom thumbnail uploaded:", thumbnailPath);
                }
            }

            // UNIVERSAL TRANSCODING: Always trigger transcoding to H.264 for cross-platform compatibility
            const needsTranscoding = true;


            // FIX: Call the API instead of direct DB insert
            console.log('Calling API to create video record...');
            const response = await fetch('/api/videos/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: file.name.replace(/\.[^/.]+$/, ""),
                    video_url: publicUrl,
                    thumbnail_url: thumbnailPath || "",
                    category: category,
                    duration: duration,
                    state: state,
                    transcode_status: needsTranscoding ? 'pending' : null,
                    owner_id: user?.id
                })


            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error("DB Insert Failed: " + (errData.error || response.statusText));
            }
            const insertedVideo = await response.json();

            console.log("Upload Sequence Complete!");
            await fetchVideos();

            // TRIGGER TRANSCODING: If HEVC, start background transcoding
            console.log("🔄 Starting universal transcoding for cross-platform (iOS/Android) compatibility...");

            // Extract R2 key from publicUrl
            const urlParts = publicUrl.split('/');
            const sourceKey = urlParts[urlParts.length - 1];

            // Fire-and-forget transcoding (runs in background)
            fetch('/api/transcode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceKey: sourceKey,
                    videoId: insertedVideo.id
                })
            }).then(async (res) => {
                if (res.ok) {
                    const { h264Url } = await res.json();
                    // Update DB with H.264 URL
                    await supabase.from('videos').update({
                        video_url_h264: h264Url,
                        transcode_status: 'completed'
                    }).eq('id', insertedVideo.id);
                    console.log("✅ Transcoding complete:", h264Url);
                    // Refresh videos to show updated status
                    fetchVideos();
                } else {
                    // Mark as failed
                    await supabase.from('videos').update({
                        transcode_status: 'failed'
                    }).eq('id', insertedVideo.id);
                    console.error("❌ Transcoding failed");
                }
            }).catch((err) => {
                console.error("❌ Transcoding error:", err);
                supabase.from('videos').update({
                    transcode_status: 'failed'
                }).eq('id', insertedVideo.id);
            });
        } catch (err: unknown) {
            if (abortControllerRef.current?.signal.aborted || (err instanceof Error && err.message === 'Upload cancelled')) {
                console.log('Upload was cancelled');
            } else {
                console.error("Upload process failed", err);
                throw err;
            }
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            abortControllerRef.current = null;
        }
    }, []);

    const uploadPhoto = useCallback(async (file: File, caption: string = "", state: string = "GLOBAL") => {
        setIsUploading(true);
        setUploadProgress(0);

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        try {
            let publicUrl = "";

            // Photos are typically smaller, but we'll use the same 50MB threshold
            if (file.size > 50 * 1024 * 1024) {
                publicUrl = await uploadMultipart(file, "");
            } else {
                console.log("Uploading photo (<50MB)...");
                const response = await fetch("/api/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        filename: file.name,
                        contentType: file.type || "image/jpeg",
                    }),
                    signal
                });

                if (!response.ok) throw new Error(`API Sign Error: ${response.status} ${response.statusText}`);
                const { signedUrl, publicUrl: simplePublicUrl, error } = await response.json();
                if (error) throw new Error(`Sign Error: ${error}`);

                if (signal.aborted) throw new Error("Upload cancelled");

                await new Promise<void>((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open("PUT", signedUrl);
                    xhr.setRequestHeader("Content-Type", file.type || "image/jpeg");
                    if (signal) {
                        signal.onabort = () => {
                            xhr.abort();
                            reject(new Error("Upload cancelled"));
                        };
                    }
                    xhr.upload.onprogress = (event) => {
                        if (event.lengthComputable) {
                            const percent = Math.round((event.loaded / event.total) * 100);
                            setUploadProgress(percent);
                        }
                    };
                    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(new Error(`Upload Failed`));
                    xhr.onerror = () => reject(new Error("Network Error"));
                    xhr.send(file);
                });
                publicUrl = simplePublicUrl;
            }

            if (signal.aborted) throw new Error("Upload cancelled");

            console.log("Saving photo to DB...");

            // Extract title from filename
            const title = file.name.replace(/\.[^/.]+$/, "");

            const { error: dbError } = await supabase
                .from('photos')
                .insert([
                    {
                        title: title,
                        photo_url: publicUrl,
                        caption: caption || "",
                        state: state,
                        owner_id: user?.id
                    }

                ])
                .select()
                .single();

            if (dbError) throw new Error(`DB Insert Failed: ${dbError.message}`);

            console.log("Photo Upload Complete!");

        } catch (err: unknown) {
            if (abortControllerRef.current?.signal.aborted || (err instanceof Error && err.message === 'Upload cancelled')) {
                console.log('Upload was cancelled');
            } else {
                console.error("Photo upload failed", err);
                throw err;
            }
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
            abortControllerRef.current = null;
        }
    }, []);

    const getVideoById = useCallback((id: string) => {
        return videos.find(v => v.id === id);
    }, [videos]);

    const contextValue = useMemo(() => ({
        videos, uploadVideo, uploadPhoto, getVideoById, isUploading, uploadProgress, cancelUpload,
        deleteVideo, updateVideoTitle, updateVideoThumbnail, updateVideoFile, incrementView,
        deletePhoto, updatePhotoImage, updateUserAvatar,
        getVideoComments, postComment, getLikes, toggleLike, getSubscription, toggleSubscription,
        isLoading
    }), [videos, isUploading, uploadProgress, isLoading, uploadVideo, uploadPhoto, getVideoById, cancelUpload, deleteVideo, updateVideoTitle, updateVideoThumbnail, updateVideoFile, incrementView, deletePhoto, updatePhotoImage, updateUserAvatar, getVideoComments, postComment, getLikes, toggleLike, getSubscription, toggleSubscription]);


    return (
        <VideoContext.Provider value={contextValue}>
            {children}
        </VideoContext.Provider>
    );
}

export function useVideo() {
    const context = useContext(VideoContext);
    if (context === undefined) {
        throw new Error('useVideo must be used within a VideoProvider');
    }
    return context;
}
