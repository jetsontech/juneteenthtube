"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
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

    const [watchHistory, setWatchHistory] = useState<VideoProps[]>([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem('jt_watch_history');
            if (stored) setWatchHistory(JSON.parse(stored));
        } catch { /* noop */ }
    }, []);

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

    const [watchLater, setWatchLater] = useState<string[]>([]);

    useEffect(() => {
        try {
            const stored = localStorage.getItem('jt_watch_later');
            if (stored) setWatchLater(JSON.parse(stored));
        } catch { /* noop */ }
    }, []);

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

    const fetchVideos = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from<DBVideo>('videos')
                .select('*')
                .not('owner_id', 'is', null)
                .order('created_at', { ascending: false })
                .limit(120);

            if (error) {
                console.error('Error fetching videos:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    error
                });
                toast.error("Failed to load video feed. Please try again.");
                setVideos([]);
                return;
            }

            if (data && data.length > 0) {
                const dbVideos: VideoProps[] = data.map((video) => {
                    const mockChannel = getMockChannelData(video.title);

                    let h264Url = video.video_url_h264;
                    if (h264Url && !h264Url.startsWith('http')) {
                        const s3Domain = process.env.NEXT_PUBLIC_S3_PUBLIC_DOMAIN || "https://media.culturequest.vip";
                        h264Url = `${s3Domain}/${h264Url}`;
                    }

                    let videoUrl = video.video_url;
                    if (videoUrl && !videoUrl.startsWith('http')) {
                        const s3Domain = process.env.NEXT_PUBLIC_S3_PUBLIC_DOMAIN || "https://media.culturequest.vip";
                        if (videoUrl.startsWith('pub-efcc4aa0b3b24e3d97760577b0ec20bd/')) {
                            videoUrl = `${s3Domain}/${videoUrl.substring('pub-efcc4aa0b3b24e3d97760577b0ec20bd/'.length)}`;
                        } else {
                            videoUrl = `${s3Domain}/${videoUrl}`;
                        }
                    }

                    let thumbnail = video.thumbnail_url || "";
                    if (thumbnail) {
                        if (!thumbnail.startsWith('http') && !thumbnail.startsWith('/uploads/')) {
                            const s3Domain = process.env.NEXT_PUBLIC_S3_PUBLIC_DOMAIN || "https://media.culturequest.vip";
                            thumbnail = `${s3Domain}/${thumbnail.startsWith('/') ? thumbnail.slice(1) : thumbnail}`;
                        }
                    }
                    const duration = video.duration || mockChannel.duration || "5:00";

                    return {
                        id: video.id,
                        title: video.title,
                        thumbnail: thumbnail,
                        channelName: video.channel_name || (video.category === 'Food' ? 'ATL Foodie' : (mockChannel.name || "CultureQuestTV")),
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
            toast.error("An unexpected error occurred while loading videos.");
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchVideos();

        const channel = supabase
            .channel('video_updates')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'videos' },
                (payload: { new: DBVideo }) => {
                    const video = payload.new;
                    const s3Domain = process.env.NEXT_PUBLIC_S3_PUBLIC_DOMAIN || "https://media.culturequest.vip";

                    let h264Url = video.video_url_h264;
                    if (h264Url && !h264Url.startsWith('http')) {
                        h264Url = `${s3Domain}/${h264Url}`;
                    }

                    let thumbnail = video.thumbnail_url || "";
                    if (thumbnail) {
                        if (!thumbnail.startsWith('http') && !thumbnail.startsWith('/uploads/')) {
                            thumbnail = `${s3Domain}/${thumbnail.startsWith('/') ? thumbnail.slice(1) : thumbnail}`;
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
        const headers = getAuthHeaders({
            'Content-Type': 'application/json',
            'x-guest-id': guestId
        });
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
    }, [user, getAuthHeaders]);

    const getLikes = useCallback(async (videoId: string) => {
        const guestId = getGuestId();
        const headers = getAuthHeaders({
            'x-guest-id': guestId
        });
        if (user?.id) {
            headers['x-user-id'] = user.id;
        }

        const res = await fetch(`/api/likes?videoId=${videoId}`, { headers });
        if (!res.ok) return { likes: 0, userStatus: null };
        return await res.json();
    }, [user, getAuthHeaders]);

    const toggleLike = useCallback(async (videoId: string, type: 'like' | 'dislike') => {
        const guestId = getGuestId();
        const headers = getAuthHeaders({
            'Content-Type': 'application/json',
            'x-guest-id': guestId
        });
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
    }, [user, getAuthHeaders]);

    const getSubscription = useCallback(async (channelName: string) => {
        const guestId = getGuestId();
        const headers = getAuthHeaders({
            'x-guest-id': guestId
        });
        if (user?.id) {
            headers['x-user-id'] = user.id;
        }

        const res = await fetch(`/api/subscribe?channelName=${encodeURIComponent(channelName)}`, { headers });
        if (!res.ok) return false;
        const { subscribed } = await res.json();
        return subscribed;
    }, [user, getAuthHeaders]);

    const toggleSubscription = useCallback(async (channelName: string) => {
        const guestId = getGuestId();
        const headers = getAuthHeaders({
            'Content-Type': 'application/json',
            'x-guest-id': guestId
        });
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
    }, [user, getAuthHeaders]);

    // ... rest unchanged ...
}