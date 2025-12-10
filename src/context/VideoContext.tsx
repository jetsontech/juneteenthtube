"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { VideoProps } from '@/components/video/VideoCard';

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
    uploadVideo: (file: File, category?: string) => Promise<void>;
    getVideoById: (id: string) => VideoProps | undefined;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export function VideoProvider({ children }: { children: ReactNode }) {
    const [videos, setVideos] = useState<VideoProps[]>([]);

    // Initial Fetch from Supabase
    useEffect(() => {
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
                    const dbVideos: VideoProps[] = data.map((video: any) => ({
                        id: video.id,
                        title: video.title,
                        thumbnail: video.thumbnail_url || "https://images.unsplash.com/photo-1610483145520-412708686f94?q=80&w=600&auto=format&fit=crop",
                        channelName: "Guest User",
                        channelAvatar: "https://i.pravatar.cc/150?u=guest",
                        views: video.views?.toString() || "0",
                        postedAt: new Date(video.created_at).toLocaleDateString(),
                        duration: video.duration || "00:00",
                        videoUrl: video.video_url,
                        category: video.category || "All"
                    }));
                    setVideos(dbVideos);
                } else {
                    setVideos(MOCK_VIDEOS);
                }
            } catch (err) {
                console.error("Unexpected error fetching videos:", err);
                setVideos(MOCK_VIDEOS);
            }
        };

        fetchVideos();
    }, []);

    // --- MULTIPART UPLOAD LOGIC (For files > 50MB) ---
    const uploadMultipart = async (file: File, category: string): Promise<string> => {
        const CHUNK_SIZE = 20 * 1024 * 1024; // 20MB chunks
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

        console.log(`Starting Multipart Upload: ${file.name} (${totalChunks} chunks)`);

        // 1. INIT
        const initRes = await fetch("/api/upload-multipart", {
            method: "POST",
            body: JSON.stringify({ action: "create", filename: file.name, contentType: file.type || "video/mp4" })
        });
        if (!initRes.ok) throw new Error("Failed to init multipart upload");
        const { uploadId, key } = await initRes.json();
        console.log("Multipart Init:", uploadId);

        const parts: { ETag: string, PartNumber: number }[] = [];

        // 2. CHUNK LOOP
        for (let i = 0; i < totalChunks; i++) {
            const start = i * CHUNK_SIZE;
            const end = Math.min(start + CHUNK_SIZE, file.size);
            const chunk = file.slice(start, end);
            const partNumber = i + 1;

            console.log(`Uploading Part ${partNumber}/${totalChunks}...`);

            // Get Signed URL for Part
            const signRes = await fetch("/api/upload-multipart", {
                method: "POST",
                body: JSON.stringify({ action: "sign-part", key, uploadId, partNumber })
            });
            const { signedUrl } = await signRes.json();

            // Upload Part with Retry
            const uploadPartWithRetry = async (retries = 3): Promise<string> => {
                return new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open("PUT", signedUrl);

                    xhr.onload = () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            const etag = xhr.getResponseHeader("ETag");
                            if (etag) resolve(etag);
                            else reject(new Error("No ETag in response"));
                        } else {
                            if (retries > 1) setTimeout(() => resolve(uploadPartWithRetry(retries - 1)), 2000);
                            else reject(new Error(`Part Upload Failed: ${xhr.status}`));
                        }
                    };
                    xhr.onerror = () => {
                        if (retries > 1) setTimeout(() => resolve(uploadPartWithRetry(retries - 1)), 2000);
                        else reject(new Error("Network Error"));
                    };
                    xhr.send(chunk);
                });
            };

            const etag = await uploadPartWithRetry();
            parts.push({ ETag: etag, PartNumber: partNumber });

            // Progress Calculation (Approximate)
            const percent = Math.round((partNumber / totalChunks) * 100);
            console.log(`Part ${partNumber} Complete. Progress: ${percent}%`);
        }

        // 3. COMPLETE
        console.log("Completing Multipart Upload...");
        const completeRes = await fetch("/api/upload-multipart", {
            method: "POST",
            body: JSON.stringify({ action: "complete", key, uploadId, parts })
        });
        if (!completeRes.ok) throw new Error("Failed to complete multipart upload");

        const { publicUrl } = await completeRes.json();
        return publicUrl;
    };


    const uploadVideo = async (file: File, category: string = "All") => {
        try {
            let publicUrl = "";

            // Decision: Simple vs Multipart
            if (file.size > 50 * 1024 * 1024) {
                // > 50MB: Use Multipart
                console.log("Using Multipart Upload (>50MB)...");
                publicUrl = await uploadMultipart(file, category);
            } else {
                // < 50MB: Use Simple Upload
                console.log("Using Simple Upload (<50MB)...");
                const response = await fetch("/api/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        filename: file.name,
                        contentType: file.type || "video/mp4",
                    }),
                });

                if (!response.ok) throw new Error(`API Sign Error: ${response.status} ${response.statusText}`);
                const { signedUrl, publicUrl: simplePublicUrl, error } = await response.json();
                if (error) throw new Error(`Sign Error: ${error}`);

                // Simple XHR Upload
                await new Promise<void>((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.open("PUT", signedUrl);
                    xhr.setRequestHeader("Content-Type", file.type || "video/mp4");
                    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(new Error(`Upload Failed`));
                    xhr.onerror = () => reject(new Error("Network Error"));
                    xhr.send(file);
                });
                publicUrl = simplePublicUrl;
            }

            console.log("Step 3: Saving to DB...");

            // 3. Save Metadata to Supabase Database
            const { data: dbData, error: dbError } = await supabase
                .from('videos')
                .insert([
                    {
                        title: file.name.replace(/\.[^/.]+$/, ""),
                        video_url: publicUrl, // Use the S3 Public URL
                        thumbnail_url: "https://images.unsplash.com/photo-1610483145520-412708686f94?q=80&w=600&auto=format&fit=crop",
                        category: category,
                    }
                ])
                .select()
                .single();

            if (dbError) throw new Error(`DB Insert Failed: ${dbError.message}`);

            console.log("Upload Sequence Complete!");
            window.location.reload();

        } catch (err: any) {
            console.error("Upload process failed", err);
            throw err;
        }
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
