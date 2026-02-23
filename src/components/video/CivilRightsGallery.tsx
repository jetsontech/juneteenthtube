/* ════════════════════════════════════════════════════
   CINEMA PLAYER (lightweight)
   ════════════════════════════════════════════════════ */

function CivilRightsPlayer({ src, accent }: { src: string; accent: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const hideTimerRef = useRef<NodeJS.Timeout | null>(null); // FIXED: Added useRef for timer
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState("0:00");
    const [totalDuration, setTotalDuration] = useState("0:00");
    const [showControls, setShowControls] = useState(true);

    const accentBar = accent === "red" ? "bg-red-500" : accent === "blue" ? "bg-blue-500" : accent === "amber" ? "bg-amber-500" : accent === "purple" ? "bg-purple-500" : "bg-emerald-500";

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${m}:${sec.toString().padStart(2, "0")}`;
    };

    const togglePlay = () => {
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) { v.play(); setIsPlaying(true); }
        else { v.pause(); setIsPlaying(false); }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        const v = videoRef.current;
        if (!v) return;
        v.muted = !v.muted;
        setIsMuted(v.muted);
    };

    const toggleFullscreen = (e: React.MouseEvent) => {
        e.stopPropagation();
        const c = containerRef.current;
        if (!c) return;
        if (document.fullscreenElement) document.exitFullscreen();
        else c.requestFullscreen();
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        const v = videoRef.current;
        if (!v) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        v.currentTime = pct * v.duration;
    };

    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        const onTime = () => {
            setProgress((v.currentTime / v.duration) * 100);
            setCurrentTime(formatTime(v.currentTime));
        };
        const onLoaded = () => setTotalDuration(formatTime(v.duration));
        v.addEventListener("timeupdate", onTime);
        v.addEventListener("loadedmetadata", onLoaded);
        return () => {
            v.removeEventListener("timeupdate", onTime);
            v.removeEventListener("loadedmetadata", onLoaded);
        };
    }, [src]);

    // FIXED: Using useRef to manage the timeout instead of a local variable
    const handleMouseMove = () => {
        setShowControls(true);
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
        }
        if (isPlaying) {
            hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
        }
    };

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (hideTimerRef.current) {
                clearTimeout(hideTimerRef.current);
            }
        };
    }, []);

    return (
        <div ref={containerRef}
            className="relative rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10 group aspect-video cursor-pointer"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
            onClick={togglePlay}
        >
            <video ref={videoRef} src={src} poster="/placeholder.svg" preload="metadata" playsInline className="w-full h-full object-contain bg-black" />

            {/* Play overlay */}
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className={cn("p-5 rounded-full shadow-2xl", accentBar, "bg-opacity-90")}>
                        <Play className="w-10 h-10 text-white fill-white" />
                    </div>
                </div>
            )}

            {/* Controls */}
            <div className={cn(
                "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 transition-opacity duration-300",
                showControls ? "opacity-100" : "opacity-0"
            )}>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-white/20 rounded-full mb-3 cursor-pointer group/bar" onClick={handleSeek}>
                    <div className={cn("h-full rounded-full transition-all", accentBar)} style={{ width: `${progress}%` }} />
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="text-white hover:text-gray-300 transition">
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </button>
                        <button onClick={toggleMute} className="text-white hover:text-gray-300 transition">
                            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                        <span className="text-xs text-gray-400 font-mono">{currentTime} / {totalDuration}</span>
                    </div>
                    <button onClick={toggleFullscreen} className="text-white hover:text-gray-300 transition">
                        <Maximize className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
