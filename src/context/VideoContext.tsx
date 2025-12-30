"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { VideoProps } from '@/components/video/VideoCard';
import pLimit from 'p-limit';

// Initial Mock Data (Fallback)
const MOCK_VIDEOS: VideoProps[] = [
    {
        id: "1",
        title: "Juneteenth Atlanta Parade 2024 Highlights - Official Footage",
        thumbnail: "https://juneteenthatl.com/wp-content/uploads/2024/02/DSC02251.jpg",
        channelName: "Juneteenth Atlanta",
        channelAvatar: "https://juneteenthatl.com/wp-content/uploads/2024/01/Juneteenth-Atlanta-Logo.png",
        views: "12K",
        postedAt: "2 days ago",
        duration: "14:20"
    },
];

interface VideoContextType {
    videos: VideoProps[];
    uploadVideo: (file: File, category?: string, state?: string) => Promise<void>;
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
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

// Helper to simulate rich data if DB columns are missing
const getMockChannelData = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('parade') || t.includes('juneteenth')) return { name: 'Juneteenth ATL', avatar: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=100', views: '14K', duration: '12:30' };
    if (t.includes('food') || t.includes('bbq') || t.includes('vegan')) return { name: 'ATL Eats', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100', views: '5K', duration: '8:15' };
    if (t.includes('music') || t.includes('jazz') || t.includes('drum')) return { name: 'Music City', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', views: '22K', duration: '4:20' };
    if (t.includes('history')) return { name: 'History Buffs', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100', views: '120K', duration: '25:00' };
    if (t.includes('speech') || t.includes('mayor')) return { name: 'City of Atlanta', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', views: '8K', duration: '15:45' };
    return { name: 'Community User', avatar: 'https://i.pravatar.cc/150', views: '1.5K', duration: '3:00' };
};

export function VideoProvider({ children }: { children: ReactNode }) {
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
                        thumbnail: video.thumbnail_url || "https://images.unsplash.com/photo-1610483145520-412708686f94?q=80&w=600&auto=format&fit=crop",
                        // Prioritize DB columns -> Fallback to smart mock -> Fallback to generic default
                        channelName: video.channel_name || video.category === 'Food' ? 'ATL Foodie' : (mockChannel.name || "JuneteenthTV"),
                        channelAvatar: video.channel_avatar || mockChannel.avatar || "https://i.pravatar.cc/150?u=jtube",
                        views: video.views?.toString() || mockChannel.views || "1.2K",
                        postedAt: video.posted_at || (video.created_at ? new Date(video.created_at).toLocaleDateString() : "Recently"),
                        duration: video.duration || mockChannel.duration || "5:00",
                        videoUrl: video.video_url,
                        category: video.category || "All",
                        createdAt: video.created_at,
                        state: video.state || "GLOBAL"
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
    }, []);

    const cancelUpload = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsUploading(false);
            setUploadProgress(0);
            console.log("Upload cancelled by user");
        }
    };

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
    const getVideoComments = async (videoId: string) => {
        const res = await fetch(`/api/comments?videoId=${videoId}`);
        if (!res.ok) return [];
        const { comments } = await res.json();
        return comments || [];
    };

    const postComment = async (videoId: string, text: string, userName: string) => {
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
    };

    const getLikes = async (videoId: string) => {
        const guestId = getGuestId();
        const res = await fetch(`/api/likes?videoId=${videoId}`, {
            headers: { 'x-guest-id': guestId }
        });
        if (!res.ok) return { likes: 0, userStatus: null };
        return await res.json();
    };

    const toggleLike = async (videoId: string, type: 'like' | 'dislike') => {
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
    };

    const getSubscription = async (channelName: string) => {
        const guestId = getGuestId();
        const res = await fetch(`/api/subscribe?channelName=${encodeURIComponent(channelName)}`, {
            headers: { 'x-guest-id': guestId }
        });
        if (!res.ok) return false;
        const { subscribed } = await res.json();
        return subscribed;
    };

    const toggleSubscription = async (channelName: string) => {
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
    };

    // --- EXISTING MANAGEMENT FUNCTIONS ---

    // --- MANAGEMENT FUNCTIONS ---
    // UPDATED: Now using Server-Side API to bypass RLS issues

    const deleteVideo = async (id: string) => {
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
    };

    const updateVideoTitle = async (id: string, newTitle: string) => {
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
    };

    const updateVideoThumbnail = async (id: string, file: File) => {
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
    };

    // Update video file (replace with new video)
    const updateVideoFile = async (id: string, file: File) => {
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
    };

    const incrementView = async (id: string) => {
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
    };

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


    const uploadVideo = async (file: File, category: string = "All", state: string = "GLOBAL") => {
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

            const { error: dbError } = await supabase
                .from('videos')
                .insert([
                    {
                        title: file.name.replace(/\.[^/.]+$/, ""),
                        video_url: publicUrl,
                        thumbnail_url: "https://images.unsplash.com/photo-1610483145520-412708686f94?q=80&w=600&auto=format&fit=crop",
                        category: category,
                        duration: duration,
                        state: state
                    }
                ])
                .select()
                .single();

            if (dbError) throw new Error(`DB Insert Failed: ${dbError.message}`);

            console.log("Upload Sequence Complete!");
            await fetchVideos();

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
    };

    const getVideoById = (id: string) => {
        return videos.find(v => v.id === id);
    };

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        videos, uploadVideo, getVideoById, isUploading, uploadProgress, cancelUpload,
        deleteVideo, updateVideoTitle, updateVideoThumbnail, updateVideoFile, incrementView,
        getVideoComments, postComment, getLikes, toggleLike, getSubscription, toggleSubscription,
        isLoading
    }), [videos, isUploading, uploadProgress, isLoading, uploadVideo, getVideoById, cancelUpload, deleteVideo, updateVideoTitle, updateVideoThumbnail, updateVideoFile, incrementView, getVideoComments, postComment, getLikes, toggleLike, getSubscription, toggleSubscription]);

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
