"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { VideoProps } from '@/components/video/VideoCard';

// Initial Mock Data
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
    {
        id: "2",
        title: "Marching Bands Showdown - Centennial Olympic Park",
        thumbnail: "https://images.unsplash.com/photo-1533174072545-e8d4aa97edf9?q=80&w=600&auto=format&fit=crop",
        channelName: "ATL Vibes",
        channelAvatar: "https://i.pravatar.cc/150?u=a042581f4e29026024d",
        views: "8.5K",
        postedAt: "1 day ago",
        duration: "22:15"
    },
    {
        id: "3",
        title: "History of Black Music Festival - Full Documentary",
        thumbnail: "https://images.unsplash.com/photo-1514525253440-b393452e8d26?q=80&w=600&auto=format&fit=crop",
        channelName: "Black History 365",
        channelAvatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
        views: "45K",
        postedAt: "1 week ago",
        duration: "45:00"
    },
    {
        id: "4",
        title: "Vendor Spotlight: Best Food at the Festival",
        thumbnail: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=600&auto=format&fit=crop",
        channelName: "Foodie Tours",
        channelAvatar: "https://i.pravatar.cc/150?u=a04258114e29026302d",
        views: "2.3K",
        postedAt: "5 hours ago",
        duration: "08:45"
    },
    {
        id: "5",
        title: "Live Performance: Soul Roots Band",
        thumbnail: "https://images.unsplash.com/photo-1501612780327-45045538702b?q=80&w=600&auto=format&fit=crop",
        channelName: "Juneteenth Atlanta",
        channelAvatar: "https://juneteenthatl.com/wp-content/uploads/2024/01/Juneteenth-Atlanta-Logo.png",
        views: "15K",
        postedAt: "3 days ago",
        duration: "04:30"
    },
];

interface VideoContextType {
    videos: VideoProps[];
    uploadVideo: (file: File) => void;
    getVideoById: (id: string) => VideoProps | undefined;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export function VideoProvider({ children }: { children: ReactNode }) {
    const [videos, setVideos] = useState<VideoProps[]>(MOCK_VIDEOS);

    const uploadVideo = (file: File) => {
        // Create a local object URL for the uploaded file
        const videoUrl = URL.createObjectURL(file);

        // Create a new video object
        const newVideo: VideoProps = {
            id: Date.now().toString(),
            title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
            thumbnail: "https://images.unsplash.com/photo-1610483145520-412708686f94?q=80&w=600&auto=format&fit=crop", // Generic placeholder or we could generate one
            channelName: "Guest User",
            channelAvatar: "https://i.pravatar.cc/150?u=guest",
            views: "0",
            postedAt: "Just now",
            duration: "00:00", // We can't easily get duration without processing
            videoUrl: videoUrl // Add this custom property to VideoProps locally (need to extend type if strict)
        };

        setVideos(prev => [newVideo, ...prev]);
    };

    const getVideoById = (id: string) => {
        return videos.find(v => v.id === id);
    };

    return (
        <VideoContext.Provider value={{ videos, uploadVideo, getVideoById }}>
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
