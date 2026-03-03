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

const MOCK_VIDEOS: VideoProps[] = [
    // ── User's Juneteenth Reference Content ──────────────────────────────
    {
        id: "juneteenth-parade-houston",
        title: "Juneteenth Parade Houston 2024 — Full Coverage",
        thumbnail: "https://picsum.photos/seed/jun1/640/360",
        channelName: "Texas Heritage TV",
        channelAvatar: "",
        views: "142K",
        postedAt: "2 weeks ago",
        duration: "28:14",
        videoUrl: "",
        category: "Parade",
        state: "TX"
    },
    {
        id: "freedom-songs-south",
        title: "Freedom Songs of the South: A Musical Journey",
        thumbnail: "https://picsum.photos/seed/jun2/640/360",
        channelName: "Black Music Archive",
        channelAvatar: "",
        views: "89K",
        postedAt: "1 month ago",
        duration: "45:02",
        videoUrl: "",
        category: "Music",
        state: "GA"
    },
    {
        id: "dr-opal-lee",
        title: "Dr. Opal Lee: The Grandmother of Juneteenth",
        thumbnail: "https://picsum.photos/seed/jun3/640/360",
        channelName: "Civil Rights Now",
        channelAvatar: "",
        views: "214K",
        postedAt: "3 days ago",
        duration: "12:38",
        videoUrl: "",
        category: "History",
        state: "TX"
    },
    {
        id: "galveston-celebration",
        title: "Galveston Island Celebration: Where It All Began",
        thumbnail: "https://picsum.photos/seed/jun4/640/360",
        channelName: "Lone Star Stories",
        channelAvatar: "",
        views: "67K",
        postedAt: "5 days ago",
        duration: "19:55",
        videoUrl: "",
        category: "History",
        state: "TX"
    },
    {
        id: "juneteenth-foods",
        title: "Traditional Juneteenth Foods & Their African Roots",
        thumbnail: "https://picsum.photos/seed/jun5/640/360",
        channelName: "Soul Food Stories",
        channelAvatar: "",
        views: "103K",
        postedAt: "1 week ago",
        duration: "22:47",
        videoUrl: "",
        category: "Food",
        state: "GLOBAL"
    },
    {
        id: "atlanta-freedom-fest",
        title: "Atlanta Freedom Fest: Full Keynote Address",
        thumbnail: "https://picsum.photos/seed/jun6/640/360",
        channelName: "Georgia United",
        channelAvatar: "",
        views: "55K",
        postedAt: "2 days ago",
        duration: "1:02:19",
        videoUrl: "",
        category: "Speeches",
        state: "GA"
    },
    {
        id: "chicago-block-party",
        title: "Chicago South Side Block Party 2024",
        thumbnail: "https://picsum.photos/seed/jun7/640/360",
        channelName: "Chi-Town Culture",
        channelAvatar: "",
        views: "78K",
        postedAt: "3 weeks ago",
        duration: "31:08",
        videoUrl: "",
        category: "Parade",
        state: "IL"
    },
    {
        id: "spoken-word-freedom",
        title: "Spoken Word: Letters to Freedom",
        thumbnail: "https://picsum.photos/seed/jun8/640/360",
        channelName: "The Black Poets Collective",
        channelAvatar: "",
        views: "41K",
        postedAt: "6 days ago",
        duration: "18:23",
        videoUrl: "",
        category: "Music",
        state: "GLOBAL"
    },
    {
        id: "emancipation-proclamation",
        title: "The Emancipation Proclamation: History Explained",
        thumbnail: "https://picsum.photos/seed/jun9/640/360",
        channelName: "Black History 365",
        channelAvatar: "",
        views: "189K",
        postedAt: "2 months ago",
        duration: "34:11",
        videoUrl: "",
        category: "History",
        state: "GLOBAL"
    },
    // ── Archive.org Playable Content ─────────────────────────────────────
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
    deleteVideo: (id: string) => Promise<void>;
    updateVideoTitle: (id: string, newTitle: string) => Promise<void>;
    updateVideoThumbnail: (id: string, file: File) => Promise<void>;
    updateVideoFile: (id: string, file: File) => Promise<void>;
    incrementView: (id: string) => Promise<void>;
    updateUserAvatar: (publicUrl: string) => Promise<void>;
    deletePhoto: (id: string) => Promise<void>;
    updatePhotoImage: (id: string, file: File) => Promise<void>;
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
    views?: number | string;
    created_at: string;
    duration?: string;
    video_url: string;
    category?: string;
    state?: string;
    channel_name?: string;
    channel_avatar?: string;
    posted_at?: string;
    video_url_h264?: string;
    transcode_status?: 'pending' | 'processing' | 'completed' | 'failed' | null;
    owner_id?: string;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

const getMockChannelData = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('parade') || t.includes('juneteenth')) return { name: 'Juneteenth ATL', avatar: '', views: '14K', duration: '12:30' };
    if (t.includes('food') || t.includes('bbq') || t.includes('vegan')) return { name: 'ATL Eats', avatar: '', views: '5K', duration: '8:15' };
    if (t.includes('music') || t.includes('jazz') || t.includes('drum')) return { name: 'Music City', avatar: '', views: '22K', duration: '4:20' };
    if (t.includes('history')) return { name: 'History Buffs', avatar: '', views: '120K', duration: '25:00' };
    if (t.includes('speech') || t.includes('mayor')) return { name: 'City of Atlanta', avatar: '', views: '8K', duration: '15:45' };
    return { name: 'Community User', avatar: '', views: '1.5K', duration: '3:00' };
};

export function VideoProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [videos, setVideos] = useState<VideoProps[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Helper to fetch videos
    const fetchVideos = useCallback(async () => {
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
                    const mockChannel = getMockChannelData(video.title);
                    return {
                        id: video.id,
                        title: video.title,
                        thumbnail: video.thumbnail_url || "",
                        channelName: video.channel_name || (video.category === 'Food' ? 'ATL Foodie' : (mockChannel.name || "JuneteenthTV")),
                        channelAvatar: video.channel_avatar || mockChannel.avatar || "",
                        views: video.views?.toString() || mockChannel.views || "1.2K",
                        postedAt: video.posted_at || (video.created_at ? new Date(video.created_at).toLocaleDateString() : "Recently"),
                        duration: video.duration || mockChannel.duration || "5:00",
                        videoUrl: video.video_url,
                        category: video.category || "All",
                        createdAt: video.created_at,
                        state: video.state || "GLOBAL",
                        videoUrlH264: video.video_url_h264,
                        transcodeStatus: video.transcode_status,
                        ownerId: video.owner_id
                    };
                });
                // Always merge mock content with DB videos (DB first, then mock)
                const dbIds = new Set(dbVideos.map(v => v.id));
                const uniqueMocks = MOCK_VIDEOS.filter(m => !dbIds.has(m.id));
                setVideos([...dbVideos, ...uniqueMocks]);
            } else {
                setVideos(MOCK_VIDEOS);
            }
        } catch (err) {
            console.error("Unexpected error fetching videos:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial Fetch & Realtime
    useEffect(() => {
        fetchVideos();

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
    }, [fetchVideos]);

    const cancelUpload = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsUploading(false);
            setUploadProgress(0);
        }
    }, []);

    const getGuestId = () => {
        if (typeof window === 'undefined') return "";
        let guestId = localStorage.getItem("jtube_guest_id");
        if (!guestId) {
            guestId = crypto.randomUUID();
            localStorage.setItem("jtube_guest_id", guestId);
        }
        return guestId;
    };

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
            headers: { 'Content-Type': 'application/json', 'x-guest-id': guestId },
            body: JSON.stringify({ videoId, text, userName })
        });
        if (!res.ok) throw new Error("Failed to post comment");
        return await res.json();
    }, []);

    const getLikes = useCallback(async (videoId: string) => {
        const guestId = getGuestId();
        const res = await fetch(`/api/likes?videoId=${videoId}`, { headers: { 'x-guest-id': guestId } });
        if (!res.ok) return { likes: 0, userStatus: null };
        return await res.json();
    }, []);

    const toggleLike = useCallback(async (videoId: string, type: 'like' | 'dislike') => {
        const guestId = getGuestId();
        const res = await fetch('/api/likes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-guest-id': guestId },
            body: JSON.stringify({ videoId, type })
        });
        if (!res.ok) throw new Error("Failed to toggle like");
        return await res.json();
    }, []);

    const getSubscription = useCallback(async (channelName: string) => {
        const guestId = getGuestId();
        const res = await fetch(`/api/subscribe?channelName=${encodeURIComponent(channelName)}`, { headers: { 'x-guest-id': guestId } });
        if (!res.ok) return false;
        const { subscribed } = await res.json();
        return subscribed;
    }, []);

    const toggleSubscription = useCallback(async (channelName: string) => {
        const guestId = getGuestId();
        const res = await fetch('/api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-guest-id': guestId },
            body: JSON.stringify({ channelName })
        });
        if (!res.ok) throw new Error("Failed to toggle subscription");
        const { subscribed } = await res.json();
        return subscribed;
    }, []);

    // --- UPLOAD LOGIC ---
    const uploadMultipart = useCallback(async (file: File, _category: string): Promise<string> => {
        void _category;
        const CHUNK_SIZE = 5 * 1024 * 1024;
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const signal = abortControllerRef.current?.signal;
        const limit = pLimit(2);

        if (signal?.aborted) throw new Error("Upload cancelled");
        const initRes = await fetch("/api/upload-multipart", {
            method: "POST",
            body: JSON.stringify({ action: "create", filename: file.name, contentType: file.type || "video/mp4" }),
            signal
        });
        if (!initRes.ok) throw new Error(`Failed to init multipart upload: ${initRes.status}`);
        const { uploadId, key } = await initRes.json();

        let completedChunks = 0;
        const uploadPromises = Array.from({ length: totalChunks }, (_, i) => {
            return limit(async () => {
                if (signal?.aborted) throw new Error("Upload cancelled");
                const partNumber = i + 1;
                const signRes = await fetch("/api/upload-multipart", {
                    method: "POST",
                    body: JSON.stringify({ action: "sign-part", key, uploadId, partNumber }),
                    signal
                });
                const { signedUrl } = await signRes.json();
                const etag = await (async function uploadPartWithRetry(retries = 5, delay = 2000): Promise<string> {
                    return new Promise((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.open("PUT", signedUrl);
                        xhr.onload = () => {
                            if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.getResponseHeader("ETag") || "");
                            else if (retries > 1) setTimeout(() => resolve(uploadPartWithRetry(retries - 1, delay * 1.5)), delay);
                            else reject(new Error(`Part Upload Failed: ${xhr.status}`));
                        };
                        xhr.onerror = () => retries > 1 ? setTimeout(() => resolve(uploadPartWithRetry(retries - 1, delay * 1.5)), delay) : reject(new Error("Network Error"));
                        xhr.send(file.slice(i * CHUNK_SIZE, Math.min((i + 1) * CHUNK_SIZE, file.size)));
                    });
                })();
                completedChunks++;
                setUploadProgress(Math.round((completedChunks / totalChunks) * 100));
                return { ETag: etag, PartNumber: partNumber };
            });
        });

        const parts = await Promise.all(uploadPromises);
        const completeRes = await fetch("/api/upload-multipart", {
            method: "POST",
            body: JSON.stringify({ action: "complete", key, uploadId, parts: parts.sort((a, b) => a.PartNumber - b.PartNumber) }),
            signal
        });
        if (!completeRes.ok) throw new Error("Failed to complete multipart upload");
        const { publicUrl } = await completeRes.json();
        return publicUrl;
    }, []);

    const deleteVideo = useCallback(async (id: string) => {
        try {
            const response = await fetch(`/api/videos?id=${id}`, { method: 'DELETE' });
            if (!response.ok) {
                const { error } = await response.json();
                throw new Error(error || 'Delete failed');
            }
            setVideos(prev => prev.filter(v => v.id !== id));
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
            const response = await fetch("/api/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ filename: `thumb_${id}_${file.name}`, contentType: file.type || "image/jpeg" }),
            });
            if (!response.ok) throw new Error("Failed to sign thumbnail upload");
            const { signedUrl, publicUrl } = await response.json();
            await new Promise<void>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("PUT", signedUrl);
                xhr.setRequestHeader("Content-Type", file.type || "image/jpeg");
                xhr.onload = () => resolve();
                xhr.onerror = () => reject(new Error("Network Error"));
                xhr.send(file);
            });
            await fetch('/api/videos/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, thumbnail_url: publicUrl })
            });
            setVideos(prev => prev.map(v => v.id === id ? { ...v, thumbnail: publicUrl } : v));
        } catch (error) {
            console.error("Error updating thumbnail:", error);
            throw error;
        }
    }, []);

    const updateVideoFile = useCallback(async (id: string, file: File) => {
        try {
            setIsUploading(true);
            setUploadProgress(0);
            let publicUrl = file.size > 50 * 1024 * 1024 ? await uploadMultipart(file, "") : "";
            if (!publicUrl) {
                const response = await fetch("/api/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ filename: `video_${id}_${Date.now()}_${file.name}`, contentType: file.type || "video/mp4" }),
                });
                const { signedUrl, publicUrl: url } = await response.json();
                publicUrl = url;
                await new Promise<void>((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open("PUT", signedUrl);
                    xhr.upload.onprogress = (e) => { if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100)); };
                    xhr.onload = () => resolve();
                    xhr.onerror = () => reject(new Error("Video upload failed"));
                    xhr.send(file);
                });
            }
            const duration = "0:00";
            await fetch('/api/videos/update', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, video_url: publicUrl, duration }) });
            setVideos(prev => prev.map(v => v.id === id ? { ...v, videoUrl: publicUrl, duration } : v));
        } finally { setIsUploading(false); setUploadProgress(0); }
    }, [uploadMultipart]);

    const incrementView = useCallback(async (id: string) => {
        setVideos(prev => prev.map(v => {
            if (v.id === id) {
                const current = parseInt(v.views.replace(/,/g, '') || "0");
                return { ...v, views: (current + 1).toString() };
            }
            return v;
        }));
        const { data } = await supabase.from('videos').select('views').eq('id', id).single();
        if (data) {
            await fetch('/api/videos/update', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, views: (data.views || 0) + 1 })
            });
        }
    }, []);

    const updateUserAvatar = useCallback(async (publicUrl: string) => {
        await fetch('/api/user/metadata', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avatar_url: publicUrl })
        });
    }, []);

    const deletePhoto = useCallback(async (id: string) => {
        await fetch(`/api/photos?id=${id}`, { method: 'DELETE' });
    }, []);

    const updatePhotoImage = useCallback(async (id: string, file: File) => {
        setIsUploading(true);
        const response = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ filename: `photo_${id}_${Date.now()}_${file.name}`, contentType: file.type || "image/jpeg" })
        });
        const { signedUrl, publicUrl } = await response.json();
        await new Promise<void>((resolve) => {
            const xhr = new XMLHttpRequest();
            xhr.open("PUT", signedUrl);
            xhr.onload = () => resolve();
            xhr.send(file);
        });
        await fetch('/api/photos/update', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, photo_url: publicUrl })
        });
        setIsUploading(false);
    }, []);

    const uploadVideo = useCallback(async (file: File, thumbnailFile: File | null = null, category: string = "All", state: string = "GLOBAL") => {
        setIsUploading(true);
        setUploadProgress(0);
        abortControllerRef.current = new AbortController();
        try {
            const publicUrl = file.size > 50 * 1024 * 1024 ? await uploadMultipart(file, category) : (await (async () => {
                const res = await fetch("/api/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename: file.name, contentType: file.type || "video/mp4" }) });
                const { signedUrl, publicUrl: url } = await res.json();
                await new Promise<void>((resolve) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open("PUT", signedUrl);
                    xhr.upload.onprogress = (e) => { if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100)); };
                    xhr.onload = () => resolve();
                    xhr.send(file);
                });
                return url;
            })());

            const thumbUrl = thumbnailFile ? (await (async () => {
                const res = await fetch("/api/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename: `thumb_${Date.now()}_${thumbnailFile.name}`, contentType: thumbnailFile.type || "image/jpeg" }) });
                const { signedUrl, publicUrl: url } = await res.json();
                await new Promise<void>((resolve) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open("PUT", signedUrl);
                    xhr.onload = () => resolve();
                    xhr.send(thumbnailFile);
                });
                return url;
            })()) : "";

            const res = await fetch('/api/videos/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: file.name.replace(/\.[^/.]+$/, ""), video_url: publicUrl, thumbnail_url: thumbUrl, category, duration: "0:00", state, transcode_status: 'pending', owner_id: user?.id }) });
            await res.json();
            fetchVideos();
        } finally { setIsUploading(false); abortControllerRef.current = null; }
    }, [user?.id, uploadMultipart, fetchVideos]);

    const uploadPhoto = useCallback(async (file: File, caption: string = "", state: string = "GLOBAL") => {
        setIsUploading(true);
        abortControllerRef.current = new AbortController();
        try {
            const res = await fetch("/api/upload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ filename: file.name, contentType: file.type || "image/jpeg" }) });
            const { signedUrl, publicUrl } = await res.json();
            await new Promise<void>((resolve) => {
                const xhr = new XMLHttpRequest();
                xhr.open("PUT", signedUrl);
                xhr.onload = () => resolve();
                xhr.send(file);
            });
            await supabase.from('photos').insert([{ title: file.name.replace(/\.[^/.]+$/, ""), photo_url: publicUrl, caption: caption || "", state, owner_id: user?.id }]);
        } finally { setIsUploading(false); abortControllerRef.current = null; }
    }, [user?.id]);

    const getVideoById = useCallback((id: string) => videos.find(v => v.id === id), [videos]);

    const contextValue = useMemo(() => ({
        videos, uploadVideo, uploadPhoto, getVideoById, isUploading, uploadProgress, cancelUpload,
        deleteVideo, updateVideoTitle, updateVideoThumbnail, updateVideoFile, incrementView,
        deletePhoto, updatePhotoImage, updateUserAvatar,
        getVideoComments, postComment, getLikes, toggleLike, getSubscription, toggleSubscription, isLoading
    }), [videos, isUploading, uploadProgress, isLoading, uploadVideo, uploadPhoto, getVideoById, cancelUpload, deleteVideo, updateVideoTitle, updateVideoThumbnail, updateVideoFile, incrementView, deletePhoto, updatePhotoImage, updateUserAvatar, getVideoComments, postComment, getLikes, toggleLike, getSubscription, toggleSubscription]);

    return (<VideoContext.Provider value={contextValue}>{children}</VideoContext.Provider>);
}

export function useVideo() {
    const context = useContext(VideoContext);
    if (context === undefined) throw new Error('useVideo must be used within a VideoProvider');
    return context;
}
