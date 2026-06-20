export function useVideoTracker() {

    type VideoEventPayload = {
        videoId: string;
        type: "view_start" | "view_end" | "skip";
        progress: number;
        watchTime?: number;
    };

    const sendEvent = async (payload: VideoEventPayload) => {
        try {
            await fetch("/api/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch {
            // silent fail — never break UI
        }
    };

    const trackViewStart = (videoId: string) => {
        sendEvent({
            videoId,
            type: "view_start",
            progress: 0
        });
    };

    const trackViewEnd = (videoId: string, watchTime: number, progress: number) => {
        sendEvent({
            videoId,
            type: "view_end",
            watchTime,
            progress
        });
    };

    const trackSkip = (videoId: string) => {
        sendEvent({
            videoId,
            type: "skip",
            progress: 0
        });
    };

    return {
        trackViewStart,
        trackViewEnd,
        trackSkip
    };
}
