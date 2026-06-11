"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { safeUUID } from '@/lib/utils';
import { getDisplayViews } from '@/lib/viewHelpers';
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
    isFeatured?: boolean;
    isTrending?: boolean;
    featuredTitle?: string;
    featuredCategory?: string;
}

const MOCK_VIDEOS: VideoProps[] = [];

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
    watchHistory: VideoProps[];
    addToHistory: (video: VideoProps) => void;
    clearHistory: () => void;
    watchLater: string[];
    addToWatchLater: (videoId: string) => void;
    removeFromWatchLater: (videoId: string) => void;
    isInWatchLater: (videoId: string) => boolean;
    toggleVideoFeatured: (id: string, currentFeatured: boolean) => Promise<void>;
    toggleVideoTrending: (id: string, currentTrending: boolean) => Promise<void>;
    updateVideoFeaturedText: (id: string, featuredTitle: string, featuredCategory: string) => Promise<void>;
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
    is_featured?: boolean;
    is_trending?: boolean;
    featured_title?: string;
    featured_category?: string;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

const getMockChannelData = (title: string | null | undefined) => {
    const t = (title || "").toLowerCase();
    if (t.includes('parade') || t.includes('juneteenth')) return { name: 'Juneteenth ATL', avatar: '', views: '14K', duration: '12:30' };
    if (t.includes('food') || t.includes('bbq') || t.includes('vegan')) return { name: 'ATL Eats', avatar: '', views: '5K', duration: '8:15' };
    if (t.includes('music') || t.includes('jazz') || t.includes('drum')) return { name: 'Music City', avatar: '', views: '22K', duration: '4:20' };
    if (t.includes('history')) return { name: 'History Buffs', avatar: '', views: '120K', duration: '25:00' };
    if (t.includes('speech') || t.includes('mayor')) return { name: 'City of Atlanta', avatar: '', views: '8K', duration: '15:45' };
    return { name: 'Community User', avatar: '', views: '1.5K', duration: '3:00' };
};

// View logic is now centralized in @/lib/viewHelpers

export const extractVideoDuration = (file: File): Promise<string> => {
    if (typeof window === 'undefined') return Promise.resolve("0:00");
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        const url = URL.createObjectURL(file);
        video.onloadedmetadata = () => {
            URL.revokeObjectURL(url);
            const seconds = video.duration;
            if (!isFinite(seconds) || isNaN(seconds)) {
                resolve("0:00");
                return;
            }
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = Math.floor(seconds % 60);
            if (h > 0) {
                resolve(`${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
            } else {
                resolve(`${m}:${s.toString().padStart(2, '0')}`);
            }
        };
        video.onerror = () => {
            URL.revokeObjectURL(url);
            resolve("0:00");
        };
        video.src = url;
    });
};


export function VideoProvider({ children }: { children: ReactNode }) {
    const { user, session } = useAuth();
    const [videos, setVideos] = useState<VideoProps[]>([]);

    // Helper to generate authenticated request headers
    const getAuthHeaders = useCallback((additionalHeaders: Record<string, string> = {}) => {
        const headers: Record<string, string> = { ...additionalHeaders };
        if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        return headers;
    }, [session]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Watch History — persisted to localStorage
    const [watchHistory, setWatchHistory] = useState<VideoProps[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const stored = localStorage.getItem('jt_watch_history');
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    });

    const addToHistory = useCallback((video: VideoProps) => {
        setWatchHistory(prev => {
            const filtered = prev.filter(v => v.id !== video.id);
            const updated = [video, ...filtered].slice(0, 50);
            try { localStorage.setItem('jt_watch_history', JSON.stringify(updated)); } catch { /* noop */ }
            return updated;
        });
    }, []);

    const clearHistory = useCallback(() => {
        setWatchHistory([]);
        try { localStorage.removeItem('jt_watch_history'); } catch { /* noop */ }
    }, []);

    // Watch Later — persisted to localStorage (stores video IDs)
    const [watchLater, setWatchLater] = useState<string[]>(() => {
        if (typeof window === 'undefined') return [];
        try {
            const stored = localStorage.getItem('jt_watch_later');
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    });

    const addToWatchLater = useCallback((videoId: string) => {
        setWatchLater(prev => {
            if (prev.includes(videoId)) return prev;
            const updated = [videoId, ...prev];
            try { localStorage.setItem('jt_watch_later', JSON.stringify(updated)); } catch { /* noop */ }
            return updated;
        });
    }, []);

    const removeFromWatchLater = useCallback((videoId: string) => {
        setWatchLater(prev => {
            const updated = prev.filter(id => id !== videoId);
            try { localStorage.setItem('jt_watch_later', JSON.stringify(updated)); } catch { /* noop */ }
            return updated;
        });
    }, []);

    const isInWatchLater = useCallback((videoId: string) => {
        return watchLater.includes(videoId);
    }, [watchLater]);

    // Helper to fetch videos
    const fetchVideos = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('videos')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(120); // Scale-safe boundary for catalog queries

            if (error) {
                console.error('Error fetching videos:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    error
                });
                setVideos([]);
                return;
            }

            if (data && data.length > 0) {
                const dbVideos: VideoProps[] = data.map((video: DBVideo) => {
                    const mockChannel = getMockChannelData(video.title);

                    // Normalize H264 URL
                    let h264Url = video.video_url_h264;
                    if (h264Url && !h264Url.startsWith('http')) {
                        const s3Domain = "https://pub-efcc4aa0b3b24e3d97760577b0ec20bd.r2.dev";
                        h264Url = `${s3Domain}/${h264Url}`;
                    }

                    // Normalize original video URL (relative R2 paths)
                    let videoUrl = video.video_url;
                    if (videoUrl && !videoUrl.startsWith('http')) {
                        const s3Domain = "https://pub-efcc4aa0b3b24e3d97760577b0ec20bd.r2.dev";
                        if (videoUrl.startsWith('pub-efcc4aa0b3b24e3d97760577b0ec20bd/')) {
                            videoUrl = `${s3Domain}/${videoUrl.substring('pub-efcc4aa0b3b24e3d97760577b0ec20bd/'.length)}`;
                        } else {
                            videoUrl = `${s3Domain}/${videoUrl}`;
                        }
                    }

                    let thumbnail = video.thumbnail_url || "";
                    if (thumbnail) {
                        if (!thumbnail.startsWith('http') && !thumbnail.startsWith('/uploads/')) {
                            const s3Domain = "https://pub-efcc4aa0b3b24e3d97760577b0ec20bd.r2.dev";
                            thumbnail = `${s3Domain}/${thumbnail.startsWith('/') ? thumbnail.slice(1) : thumbnail}`;
                        }
                        if (thumbnail.includes('media.juneteenthtube.com')) {
                            thumbnail = thumbnail.replace('media.juneteenthtube.com', 'pub-efcc4aa0b3b24e3d97760577b0ec20bd.r2.dev');
                        }
                    }
                    const duration = video.duration || mockChannel.duration || "5:00";

                    return {
                        id: video.id,
                        title: video.title,
                        thumbnail: thumbnail,
                        channelName: video.channel_name || (video.category === 'Food' ? 'ATL Foodie' : (mockChannel.name || "JuneteenthTV")),
                        channelAvatar: video.channel_avatar || mockChannel.avatar || "",
                        views: getDisplayViews(
                            video.id,
                            Number(video.views) || 0,
                            0,
                            !!(user?.id && video.owner_id === user.id)
                        ).toString(),
                        postedAt: video.posted_at || (video.created_at ? new Date(video.created_at).toLocaleDateString() : "Recently"),
                        duration: duration,
                        videoUrl: videoUrl,
                        category: video.category || "All",
                        createdAt: video.created_at,
                        state: video.state || "GLOBAL",
                        videoUrlH264: h264Url,
                        transcodeStatus: video.transcode_status,
                        ownerId: video.owner_id,
                        isFeatured: video.is_featured || false,
                        isTrending: video.is_trending || false,
                        featuredTitle: video.featured_title || "",
                        featuredCategory: video.featured_category || ""
                    };
                });
                setVideos(dbVideos);
            } else {
                setVideos([]);
            }
        } catch (err) {
            console.error("Unexpected error fetching videos:", err);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

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
                    const s3Domain = "https://pub-efcc4aa0b3b24e3d97760577b0ec20bd.r2.dev";

                    let h264Url = video.video_url_h264;
                    if (h264Url && !h264Url.startsWith('http')) {
                        h264Url = `${s3Domain}/${h264Url}`;
                    }

                    // Normalize thumbnail URL
                    let thumbnail = video.thumbnail_url || "";
                    if (thumbnail) {
                        if (!thumbnail.startsWith('http') && !thumbnail.startsWith('/uploads/')) {
                            thumbnail = `${s3Domain}/${thumbnail.startsWith('/') ? thumbnail.slice(1) : thumbnail}`;
                        }
                        if (thumbnail.includes('media.juneteenthtube.com')) {
                            thumbnail = thumbnail.replace('media.juneteenthtube.com', 'pub-efcc4aa0b3b24e3d97760577b0ec20bd.r2.dev');
                        }
                    }

                    const isMyVideo = !!(user?.id && video.owner_id === user.id);
                    const dbViewsCount = Number(video.views) || 0;
                    const viewsStr = getDisplayViews(video.id, dbViewsCount, 0, isMyVideo).toString();

                    setVideos(prev => prev.map(v => v.id === video.id ? {
                        ...v,
                        videoUrlH264: h264Url,
                        transcodeStatus: video.transcode_status,
                        thumbnail: thumbnail || v.thumbnail,
                        views: viewsStr || v.views,
                        title: video.title || v.title,
                        isFeatured: video.is_featured !== undefined ? video.is_featured : v.isFeatured,
                        isTrending: video.is_trending !== undefined ? video.is_trending : v.isTrending
                    } : v));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel).catch(() => { });
        };
    }, [fetchVideos, user?.id]);

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
            guestId = safeUUID();
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
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'x-guest-id': guestId
        };
        if (user?.id) {
            headers['x-user-id'] = user.id;
        }

        const res = await fetch('/api/comments', {
            method: 'POST',
            headers,
            body: JSON.stringify({ videoId, text, userName, userId: user?.id })
        });
        if (!res.ok) throw new Error("Failed to post comment");
        return await res.json();
    }, [user]);

    const getLikes = useCallback(async (videoId: string) => {
        const guestId = getGuestId();
        const headers: Record<string, string> = {
            'x-guest-id': guestId
        };
        if (user?.id) {
            headers['x-user-id'] = user.id;
        }

        const res = await fetch(`/api/likes?videoId=${videoId}`, { headers });
        if (!res.ok) return { likes: 0, userStatus: null };
        return await res.json();
    }, [user]);

    const toggleLike = useCallback(async (videoId: string, type: 'like' | 'dislike') => {
        const guestId = getGuestId();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'x-guest-id': guestId
        };
        if (user?.id) {
            headers['x-user-id'] = user.id;
        }

        const res = await fetch('/api/likes', {
            method: 'POST',
            headers,
            body: JSON.stringify({ videoId, type, userId: user?.id })
        });
        if (!res.ok) throw new Error("Failed to toggle like");
        return await res.json();
    }, [user]);

    const getSubscription = useCallback(async (channelName: string) => {
        const guestId = getGuestId();
        const headers: Record<string, string> = {
            'x-guest-id': guestId
        };
        if (user?.id) {
            headers['x-user-id'] = user.id;
        }

        const res = await fetch(`/api/subscribe?channelName=${encodeURIComponent(channelName)}`, { headers });
        if (!res.ok) return false;
        const { subscribed } = await res.json();
        return subscribed;
    }, [user]);

    const toggleSubscription = useCallback(async (channelName: string) => {
        const guestId = getGuestId();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'x-guest-id': guestId
        };
        if (user?.id) {
            headers['x-user-id'] = user.id;
        }

        const res = await fetch('/api/subscribe', {
            method: 'POST',
            headers,
            body: JSON.stringify({ channelName, userId: user?.id })
        });
        if (!res.ok) throw new Error("Failed to toggle subscription");
        const { subscribed } = await res.json();
        return subscribed;
    }, [user]);

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
            headers: getAuthHeaders({ "Content-Type": "application/json" }),
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
                    headers: getAuthHeaders({ "Content-Type": "application/json" }),
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
            headers: getAuthHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({ action: "complete", key, uploadId, parts: parts.sort((a, b) => a.PartNumber - b.PartNumber) }),
            signal
        });
        if (!completeRes.ok) throw new Error("Failed to complete multipart upload");
        const { publicUrl } = await completeRes.json();
        return publicUrl;
    }, [getAuthHeaders]);

    const deleteVideo = useCallback(async (id: string) => {
        try {
            const response = await fetch(`/api/videos?id=${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (!response.ok) {
                const { error } = await response.json();
                throw new Error(error || 'Delete failed');
            }
            setVideos(prev => prev.filter(v => v.id !== id));
        } catch (error) {
            console.error("Error deleting video:", error);
            throw error;
        }
    }, [getAuthHeaders]);

    const updateVideoTitle = useCallback(async (id: string, newTitle: string) => {
        try {
            const response = await fetch('/api/videos/update', {
                method: 'PATCH',
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ id, title: newTitle })
            });
            if (!response.ok) throw new Error('Failed to update title');
            setVideos(prev => prev.map(v => v.id === id ? { ...v, title: newTitle } : v));
        } catch (error) {
            console.error("Error updating title:", error);
            throw error;
        }
    }, [getAuthHeaders]);

    const toggleVideoFeatured = useCallback(async (id: string, currentFeatured: boolean) => {
        const newFeatured = !currentFeatured;
        // Optimistically update local state for a fast, responsive UI
        setVideos(prev => prev.map(v => v.id === id ? { ...v, isFeatured: newFeatured } : v));

        try {
            const response = await fetch('/api/videos/update', {
                method: 'PATCH',
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ id, is_featured: newFeatured })
            });
            if (!response.ok) {
                console.warn("[VideoContext] Central database update failed. Toggled locally as fallback. Please make sure you executed 'add_featured_column.sql' in your Supabase console SQL editor to enable global sync.");
            }
        } catch (error) {
            console.warn("[VideoContext] Central database update failed. Setting locally as fallback.", error);
        }
    }, [getAuthHeaders]);

    const toggleVideoTrending = useCallback(async (id: string, currentTrending: boolean) => {
        const newTrending = !currentTrending;
        // Optimistically update local state for a fast, responsive UI
        setVideos(prev => prev.map(v => v.id === id ? { ...v, isTrending: newTrending } : v));

        try {
            const response = await fetch('/api/videos/update', {
                method: 'PATCH',
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ id, is_trending: newTrending })
            });
            if (!response.ok) {
                console.warn("[VideoContext] Central database update failed. Toggled locally as fallback.");
            }
        } catch (error) {
            console.warn("[VideoContext] Central database update failed. Setting locally as fallback.", error);
        }
    }, [getAuthHeaders]);

    const updateVideoFeaturedText = useCallback(async (id: string, featuredTitle: string, featuredCategory: string) => {
        // Optimistically update local state for a fast, responsive UI
        setVideos(prev => prev.map(v => v.id === id ? { ...v, featuredTitle, featuredCategory } : v));

        try {
            const response = await fetch('/api/videos/update', {
                method: 'PATCH',
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ id, featured_title: featuredTitle, featured_category: featuredCategory })
            });
            if (!response.ok) {
                console.warn("[VideoContext] Central database update failed. Toggled locally as fallback.");
            }
        } catch (error) {
            console.warn("[VideoContext] Central database update failed. Setting locally as fallback.", error);
        }
    }, [getAuthHeaders]);

    const updateVideoThumbnail = useCallback(async (id: string, file: File) => {
        try {
            const response = await fetch("/api/upload", {
                method: "POST",
                headers: getAuthHeaders({ "Content-Type": "application/json" }),
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
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ id, thumbnail_url: publicUrl })
            });
            setVideos(prev => prev.map(v => v.id === id ? { ...v, thumbnail: publicUrl } : v));
        } catch (error) {
            console.error("Error updating thumbnail:", error);
            throw error;
        }
    }, [getAuthHeaders]);

    const updateVideoFile = useCallback(async (id: string, file: File) => {
        try {
            setIsUploading(true);
            setUploadProgress(0);
            let publicUrl = file.size > 50 * 1024 * 1024 ? await uploadMultipart(file, "") : "";
            if (!publicUrl) {
                const response = await fetch("/api/upload", {
                    method: "POST",
                    headers: getAuthHeaders({ "Content-Type": "application/json" }),
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
            const duration = await extractVideoDuration(file);
            await fetch('/api/videos/update', {
                method: 'PATCH',
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ id, video_url: publicUrl, duration })
            });
            setVideos(prev => prev.map(v => v.id === id ? { ...v, videoUrl: publicUrl, duration } : v));
        } finally { setIsUploading(false); setUploadProgress(0); }
    }, [uploadMultipart, getAuthHeaders]);

    const incrementView = useCallback(async (id: string) => {
        setVideos(prev => prev.map(v => {
            if (v.id === id) {
                const current = parseInt(v.views?.toString()?.replace(/,/g, '') || "0");
                return { ...v, views: (current + 1).toString() };
            }
            return v;
        }));
        await fetch('/api/videos/update', {
            method: 'PATCH',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ id, increment_views: true })
        });
    }, [getAuthHeaders]);

    const updateUserAvatar = useCallback(async (publicUrl: string) => {
        await fetch('/api/user/metadata', {
            method: 'PATCH',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ avatar_url: publicUrl })
        });
    }, [getAuthHeaders]);

    const deletePhoto = useCallback(async (id: string) => {
        await fetch(`/api/photos?id=${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
    }, [getAuthHeaders]);

    const updatePhotoImage = useCallback(async (id: string, file: File) => {
        setIsUploading(true);
        const response = await fetch("/api/upload", {
            method: "POST",
            headers: getAuthHeaders({ "Content-Type": "application/json" }),
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
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ id, photo_url: publicUrl })
        });
        setIsUploading(false);
    }, [getAuthHeaders]);



    const generateVideoThumbnail = async (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const url = URL.createObjectURL(file);
            
            video.autoplay = false;
            video.muted = true;
            video.playsInline = true;
            
            video.onloadedmetadata = () => {
                video.currentTime = Math.min(1, video.duration * 0.1);
            };
            
            video.onseeked = () => {
                canvas.width = video.videoWidth || 1280;
                canvas.height = video.videoHeight || 720;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error("Canvas context is null"));
                    return;
                }
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    URL.revokeObjectURL(url);
                    if (blob) {
                        const thumbFile = new File([blob], `generated_thumb_${Date.now()}.jpg`, { type: 'image/jpeg' });
                        resolve(thumbFile);
                    } else {
                        reject(new Error("Failed to generate blob"));
                    }
                }, 'image/jpeg', 0.8);
            };
            
            video.onerror = (e) => {
                URL.revokeObjectURL(url);
                reject(e);
            };
            
            video.src = url;
        });
    };

    const uploadVideo = useCallback(async (file: File, thumbnailFile: File | null = null, category: string = "All", state: string = "GLOBAL") => {
        setIsUploading(true);
        setUploadProgress(0);
        abortControllerRef.current = new AbortController();
        try {
            const publicUrl = file.size > 50 * 1024 * 1024 ? await uploadMultipart(file, category) : (await (async () => {
                const res = await fetch("/api/upload", {
                    method: "POST",
                    headers: getAuthHeaders({ "Content-Type": "application/json" }),
                    body: JSON.stringify({ filename: file.name, contentType: file.type || "video/mp4" })
                });
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

            let activeThumbnail = thumbnailFile;
            if (!activeThumbnail) {
                try {
                    activeThumbnail = await generateVideoThumbnail(file);
                } catch (e) {
                    console.error("Failed to generate thumbnail, proceeding without it", e);
                }
            }

            const thumbUrl = activeThumbnail ? (await (async () => {
                const res = await fetch("/api/upload", {
                    method: "POST",
                    headers: getAuthHeaders({ "Content-Type": "application/json" }),
                    body: JSON.stringify({ filename: `thumb_${Date.now()}_${activeThumbnail.name}`, contentType: activeThumbnail.type || "image/jpeg" })
                });
                const { signedUrl, publicUrl: url } = await res.json();
                await new Promise<void>((resolve) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open("PUT", signedUrl);
                    xhr.onload = () => resolve();
                    xhr.send(activeThumbnail);
                });
                return url;
            })()) : "";

            const duration = await extractVideoDuration(file);
            const res = await fetch('/api/videos/create', {
                method: 'POST',
                headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify({ title: file.name.replace(/\.[^/.]+$/, ""), video_url: publicUrl, thumbnail_url: thumbUrl, category, duration, state, transcode_status: 'pending', owner_id: user?.id })
            });
            await res.json();
            fetchVideos();
        } finally { setIsUploading(false); abortControllerRef.current = null; }
    }, [user?.id, uploadMultipart, fetchVideos, getAuthHeaders]);

    const uploadPhoto = useCallback(async (file: File, caption: string = "", state: string = "GLOBAL") => {
        setIsUploading(true);
        abortControllerRef.current = new AbortController();
        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                headers: getAuthHeaders({ "Content-Type": "application/json" }),
                body: JSON.stringify({ filename: file.name, contentType: file.type || "image/jpeg" })
            });
            const { signedUrl, publicUrl } = await res.json();
            await new Promise<void>((resolve) => {
                const xhr = new XMLHttpRequest();
                xhr.open("PUT", signedUrl);
                xhr.onload = () => resolve();
                xhr.send(file);
            });
            await supabase.from('photos').insert([{ title: file.name.replace(/\.[^/.]+$/, ""), photo_url: publicUrl, caption: caption || "", state, owner_id: user?.id }]);
        } finally { setIsUploading(false); abortControllerRef.current = null; }
    }, [user?.id, getAuthHeaders]);

    const getVideoById = useCallback((id: string) => videos.find(v => v.id === id), [videos]);

    const contextValue = useMemo(() => ({
        videos, uploadVideo, uploadPhoto, getVideoById, isUploading, uploadProgress, cancelUpload,
        deleteVideo, updateVideoTitle, updateVideoThumbnail, updateVideoFile, incrementView,
        deletePhoto, updatePhotoImage, updateUserAvatar,
        getVideoComments, postComment, getLikes, toggleLike, getSubscription, toggleSubscription, isLoading,
        watchHistory, addToHistory, clearHistory,
        watchLater, addToWatchLater, removeFromWatchLater, isInWatchLater, toggleVideoFeatured, toggleVideoTrending, updateVideoFeaturedText
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [videos, isUploading, uploadProgress, isLoading, uploadVideo, uploadPhoto, getVideoById, cancelUpload, deleteVideo, updateVideoTitle, updateVideoThumbnail, updateVideoFile, incrementView, deletePhoto, updatePhotoImage, updateUserAvatar, getVideoComments, postComment, getLikes, toggleLike, getSubscription, toggleSubscription, watchHistory, addToHistory, clearHistory, watchLater, addToWatchLater, removeFromWatchLater, isInWatchLater, toggleVideoFeatured, toggleVideoTrending, updateVideoFeaturedText, getAuthHeaders]);

    return (<VideoContext.Provider value={contextValue}>{children}</VideoContext.Provider>);
}

export function useVideo() {
    const context = useContext(VideoContext);
    if (context === undefined) throw new Error('useVideo must be used within a VideoProvider');
    return context;
}
