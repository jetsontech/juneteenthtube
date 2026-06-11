import { memo } from "react";
import { VideoCard, VideoProps } from "./VideoCard";

interface VideoGridProps {
    videos: VideoProps[];
}

function VideoGridComponent({ videos }: VideoGridProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8">
            {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
            ))}
        </div>
    );
}

// Proper memoization — compare all video IDs, not just the first one
export const VideoGrid = memo(VideoGridComponent, (prevProps, nextProps) => {
    if (prevProps.videos.length !== nextProps.videos.length) return false;
    // Compare every video ID for true equality
    return prevProps.videos.every((v, i) => v.id === nextProps.videos[i]?.id);
});
