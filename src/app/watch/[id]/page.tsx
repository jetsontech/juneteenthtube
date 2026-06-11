import WatchClient from "./WatchClient";
import { supabase } from "@/lib/supabase";
import { Metadata } from "next";

interface WatchPageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: WatchPageProps): Promise<Metadata> {
    const { id } = await params;
    
    try {
        const { data: video } = await supabase
            .from('videos')
            .select('title, description, thumbnail_url')
            .eq('id', id)
            .maybeSingle();
        
        if (!video) {
            return {
                title: "Watch Video | CultureQuest",
                description: "Watch and celebrate Black heritage, culture, history and music on CultureQuest."
            };
        }

        const title = video.title ? `${video.title} | CultureQuest` : "Watch Video | CultureQuest";
        const description = video.description || "Celebrating Black history, culture, and community heritage.";
        const imageUrl = video.thumbnail_url || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=800";

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                type: "video.other",
                images: [{ url: imageUrl }],
                siteName: "CultureQuest"
            },
            twitter: {
                card: "summary_large_image",
                title,
                description,
                images: [imageUrl]
            }
        };
    } catch (err) {
        console.error("--- Error generating metadata for watch page:", err);
        return {
            title: "Watch Video | CultureQuest",
            description: "Celebrating Black heritage, culture, history and music on CultureQuest."
        };
    }
}

export default async function WatchPage({ params }: WatchPageProps) {
    const { id } = await params;
    return <WatchClient videoId={id} />;
}
