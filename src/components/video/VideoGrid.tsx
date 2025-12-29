import { VideoCard, VideoProps } from "./VideoCard";

export function VideoGrid({ videos }: { videos: VideoProps[] }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 min-[1180px]:grid-cols-4 xl:grid-cols-4 gap-x-4 gap-y-8">
            {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
            ))}
        </div>
    );
}
