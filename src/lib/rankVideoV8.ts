type RankedVideoInput = {
    views?: number | string | null;
    createdAt?: string | null;
};

type VideoEventInput = {
    event_type: string;
    watch_time?: number;
};

export function rankVideoV8(video: RankedVideoInput, events: VideoEventInput[]) {
    const views = Number(video.views || 0);

    const eventScore = events.reduce((score, e) => {
        if (e.event_type === "view_end") {
            return score + ((e.watch_time || 0) * 0.4);
        }

        if (e.event_type === "skip") {
            return score - 5;
        }

        if (e.event_type === "replay") {
            return score + 10;
        }

        if (e.event_type === "like") {
            return score + 20;
        }

        return score;
    }, 0);

    const createdAt = video.createdAt || new Date().toISOString();
    const freshness = 1 / ((Date.now() - new Date(createdAt).getTime()) / 36e5 + 2);

    const viralBoost = views > 10000 ? 1.2 : 1;

    return (views * 0.3 + eventScore * 0.6 + freshness * 1000) * viralBoost;
}
