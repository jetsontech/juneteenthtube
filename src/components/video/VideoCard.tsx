import Image from "next/image";
import Link from "next/link";
import { type VideoProps } from "@/context/VideoContext";
import { useState, useRef, useEffect } from "react";

export function VideoCard({ video }: { video: VideoProps }) {
    const thumb = video.thumbnail || "/placeholder-thumb.jpg";
    const [isHovered, setIsHovered] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (isHovered && videoRef.current) {
            timeout = setTimeout(() => {
                videoRef.current?.play().catch(() => { });
            }, 500); // 500ms delay before playing
        } else if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
        return () => clearTimeout(timeout);
    }, [isHovered]);

    return (
        <Link
            href={`/watch/${video.id}`}
            className="group cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex flex-col gap-3">
                <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-900 border border-white/5">
                    <Image
                        src={thumb}
                        alt={video.title}
                        fill
                        className={`object-cover transition-transform duration-500 group-hover:scale-105 ${isHovered ? 'opacity-0' : 'opacity-100'}`}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    {isHovered && video.videoUrl && (
                        <video
                            ref={videoRef}
                            src={video.videoUrl}
                            muted
                            loop
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    )}
                    <div className="absolute bottom-2 right-2 rounded bg-black/80 backdrop-blur-md px-1.5 py-0.5 text-[11px] font-medium text-white border border-white/10">
                        {video.duration}
                    </div>
                </div>
                <div className="flex gap-3 px-1">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-zinc-800 overflow-hidden relative border border-white/5">
                        {video.channelAvatar ? (
                            <Image src={video.channelAvatar} alt={video.channelName} fill className="object-cover" />
                        ) : (
                            <div className="w-full h-full bg-j-green flex items-center justify-center text-white font-bold">
                                {video.channelName.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <h3 className="line-clamp-2 text-[14px] font-semibold text-white leading-snug group-hover:text-j-gold transition-colors">
                            {video.title}
                        </h3>
                        <p className="mt-1 text-[12px] text-zinc-400 hover:text-white transition-colors">
                            {video.channelName}
                        </p>
                        <div className="flex items-center text-[12px] text-zinc-400">
                            <span>{video.views} views</span>
                            <span className="mx-1">•</span>
                            <span>{video.postedAt}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
