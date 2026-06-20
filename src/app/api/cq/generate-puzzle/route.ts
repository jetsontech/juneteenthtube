import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type PuzzleSourceType = "photo" | "video";

interface PhotoRow {
    id: string;
    title?: string | null;
    caption?: string | null;
    photo_url?: string | null;
    state?: string | null;
    created_at?: string | null;
}

interface VideoRow {
    id: string;
    title?: string | null;
    thumbnail_url?: string | null;
    category?: string | null;
    state?: string | null;
    created_at?: string | null;
}

interface GeneratedQuestion {
    question: string;
    options: string[];
    answerIndex: number;
    explanation: string;
}

function normalizeMediaUrl(url?: string | null): string {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("/")) return url;

    const base =
        process.env.NEXT_PUBLIC_S3_PUBLIC_DOMAIN ||
        process.env.S3_PUBLIC_DOMAIN ||
        "https://media.culturequest.vip";

    const bucketPrefix = "pub-efcc4aa0b3b24e3d97760577b0ec20bd/";
    const path = url.startsWith(bucketPrefix) ? url.slice(bucketPrefix.length) : url;

    return `${base}/${path.replace(/^\/+/, "")}`;
}

function stableIndex(seed: string, max: number) {
    if (max <= 0) return 0;
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
        hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    return hash % max;
}

function buildQuestions(source: {
    type: PuzzleSourceType;
    title: string;
    caption: string;
    category: string;
    state: string;
}): GeneratedQuestion[] {
    const label = source.type === "video" ? "video" : "photo";
    const titleAnswer = source.title || "Untitled CultureQuest memory";
    const categoryAnswer = source.category || (source.type === "video" ? "Community" : "Photos");
    const stateAnswer = source.state || "GLOBAL";

    return [
        {
            question: `Which archive item did you just restore?`,
            options: [
                titleAnswer,
                "Juneteenth National Independence Day Act",
                "Galveston General Order No. 3",
                "A CultureQuest welcome reel",
            ],
            answerIndex: 0,
            explanation: `This ${label} puzzle was generated from "${titleAnswer}".`,
        },
        {
            question: `What collection signal best describes this ${label}?`,
            options: [
                categoryAnswer,
                "Sports & Firsts",
                "Civil Rights",
                "Cookout & Culture",
            ],
            answerIndex: 0,
            explanation: `CultureQuest tagged this item as ${categoryAnswer}.`,
        },
        {
            question: `Which region is attached to this archive item?`,
            options: [
                stateAnswer,
                "Texas",
                "Georgia",
                "GLOBAL",
            ],
            answerIndex: 0,
            explanation: `The source record currently points to ${stateAnswer}.`,
        },
    ].map((q, index) => {
        const correct = q.options[q.answerIndex];
        const shuffled = [...q.options].sort((a, b) =>
            stableIndex(`${source.title}-${index}-${a}`, 997) -
            stableIndex(`${source.title}-${index}-${b}`, 997)
        );
        return {
            ...q,
            options: shuffled,
            answerIndex: Math.max(0, shuffled.indexOf(correct)),
        };
    });
}

async function fetchPhotos(limit: number) {
    const { data, error } = await supabaseAdmin
        .from("photos")
        .select("id,title,caption,photo_url,state,created_at")
        .not("photo_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("[CQ generate-puzzle photos]", error);
        return [];
    }

    return (data || []) as PhotoRow[];
}

async function fetchVideos(limit: number) {
    const { data, error } = await supabaseAdmin
        .from("videos")
        .select("id,title,thumbnail_url,category,state,created_at")
        .not("thumbnail_url", "is", null)
        .not("owner_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("[CQ generate-puzzle videos]", error);
        return [];
    }

    return (data || []) as VideoRow[];
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const sourceParam = searchParams.get("source") || "mixed";
    const seed = searchParams.get("seed") || new Date().toISOString().slice(0, 10);
    const limit = 24;

    const wantsPhotos = sourceParam === "photo" || sourceParam === "mixed";
    const wantsVideos = sourceParam === "video" || sourceParam === "mixed";

    const [photos, videos] = await Promise.all([
        wantsPhotos ? fetchPhotos(limit) : Promise.resolve([]),
        wantsVideos ? fetchVideos(limit) : Promise.resolve([]),
    ]);

    const candidates = [
        ...photos.map((photo) => ({
            id: `photo-${photo.id}`,
            sourceId: photo.id,
            type: "photo" as const,
            title: photo.title || "Community photo",
            caption: photo.caption || "A community image from the CultureQuest photo gallery.",
            category: "Photo Gallery",
            state: photo.state || "GLOBAL",
            imageUrl: normalizeMediaUrl(photo.photo_url),
        })),
        ...videos.map((video) => ({
            id: `video-${video.id}`,
            sourceId: video.id,
            type: "video" as const,
            title: video.title || "CultureQuest video",
            caption: `Generated from an uploaded ${video.category || "community"} video thumbnail.`,
            category: video.category || "Video Gallery",
            state: video.state || "GLOBAL",
            imageUrl: normalizeMediaUrl(video.thumbnail_url),
        })),
    ].filter((item) => item.imageUrl);

    if (!candidates.length) {
        return NextResponse.json(
            { error: "No photo or video media is available for puzzle generation." },
            { status: 404 }
        );
    }

    const selected = candidates[stableIndex(`${seed}-${sourceParam}`, candidates.length)];

    return NextResponse.json({
        puzzle: {
            ...selected,
            prompt:
                selected.type === "video"
                    ? "Restore the uploaded-video frame, then answer its archive questions."
                    : "Restore the gallery image, then unlock its archive questions.",
            questions: buildQuestions(selected),
        },
        ok: true,
    });
}
