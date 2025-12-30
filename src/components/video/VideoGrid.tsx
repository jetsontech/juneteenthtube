import { memo } from "react";
import { VideoCard, VideoProps } from "./VideoCard";

interface VideoGridProps {
    videos: VideoProps[];
}

function VideoGridComponent({ videos }: VideoGridProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-x-4 gap-y-8">
            {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
            ))}
        </div>
    );
}

// Memoize to prevent re-renders when parent re-renders
// Only re-render if videos array actually changes
export const VideoGrid = memo(VideoGridComponent, (prevProps, nextProps) => {
    // Quick check: if lengths differ, definitely re-render
    if (prevProps.videos.length !== nextProps.videos.length) return false;

    // If same length and first video ID matches, likely the same list
    // This is a performance optimization - we trust the list hasn't changed
    return prevProps.videos[0]?.id === nextProps.videos[0]?.id;
});
