"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    Film, List, Play, Pause, Volume2, VolumeX, Maximize, SkipForward,
    Clock, User, Sparkles, Library, Tv, Music, Landmark, Home, Sword,
    ChevronRight, Radio, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════ */

interface VideoItem {
    id: string;
    title: string;
    description: string;
    source: string;
    url: string;
    year: string;
    duration: string;
    director: string;
}

interface Channel {
    id: string;
    name: string;
    number: number;
    tagline: string;
    accent: string;           // tailwind color name (yellow, amber, purple, red, emerald)
    accentBg: string;         // bg class
    accentText: string;       // text class
    accentBorder: string;     // border class
    accentGlow: string;       // shadow class
    icon: React.ElementType;
    films: VideoItem[];
}

/* ════════════════════════════════════════════════════
   CHANNEL DATA
   ════════════════════════════════════════════════════ */

const CHANNELS: Channel[] = [
    /* ──── CH 1: MAVERICK BLACK CINEMA ──── */
    {
        id: "maverick",
        name: "Maverick Black Cinema",
        number: 1,
        tagline: "Classic race films & pioneering Black filmmakers",
        accent: "yellow",
        accentBg: "bg-yellow-600",
        accentText: "text-yellow-500",
        accentBorder: "border-yellow-600/30",
        accentGlow: "shadow-yellow-600/20",
        icon: Film,
        films: [
            {
                id: "within-our-gates",
                title: "Within Our Gates",
                description: "Directed by Oscar Micheaux, this is the oldest surviving film by an African American director. A powerful response to D.W. Griffith's 'Birth of a Nation', the film tells the story of a young Black woman's efforts to raise money for a rural school while exposing the horrors of lynching.",
                source: "Archive.org",
                url: "https://archive.org/download/WithinOurGates/WithinOurGates_512kb.mp4",
                year: "1920",
                duration: "1h 19m",
                director: "Oscar Micheaux"
            },
            {
                id: "symbol-of-the-unconquered",
                title: "The Symbol of the Unconquered",
                description: "Oscar Micheaux's bold silent film follows Eve Mason, a young Black woman who travels west to claim land left to her by her grandfather. She encounters racial hostility including the Ku Klux Klan, but finds an unexpected ally.",
                source: "Archive.org",
                url: "https://archive.org/download/TheSymbolOfTheUnconquered1920/The%20Symbol%20Of%20the%20Unconquered%20%281920%29.mp4",
                year: "1920",
                duration: "1h 8m",
                director: "Oscar Micheaux"
            },
            {
                id: "body-and-soul",
                title: "Body and Soul",
                description: "Paul Robeson's screen debut. Robeson plays dual roles — a corrupt preacher and his virtuous twin brother. Originally nine reels, it was censored to five. Selected for the National Film Registry in 2019.",
                source: "Archive.org",
                url: "https://archive.org/download/body-and-soul_202107/Body%20and%20Soul.mp4",
                year: "1925",
                duration: "1h 42m",
                director: "Oscar Micheaux"
            },
            {
                id: "scar-of-shame",
                title: "The Scar of Shame",
                description: "A landmark produced by the Colored Players Film Corporation. This silent melodrama explores class divisions within the Black community through the story of a talented pianist caught between two worlds. A rare surviving 'race film'.",
                source: "Archive.org",
                url: "https://archive.org/download/the-scar-of-shame_1927/the-scar-of-shame_1927.ia.mp4",
                year: "1927",
                duration: "1h 26m",
                director: "Frank Peregini"
            },
            {
                id: "murder-in-harlem",
                title: "Murder in Harlem",
                description: "Oscar Micheaux's gripping courtroom drama follows a Black night watchman falsely accused of murdering a young woman. The real killer schemes to evade justice. An early example of Black mystery cinema.",
                source: "Archive.org",
                url: "https://archive.org/download/Murder_in_Harlem/MurderInHarlem.mp4",
                year: "1935",
                duration: "1h 36m",
                director: "Oscar Micheaux"
            },
            {
                id: "lying-lips",
                title: "Lying Lips",
                description: "Micheaux's late-career mystery follows a nightclub singer wrongly accused of murder. A detective must navigate Harlem's underworld to uncover the truth.",
                source: "Archive.org",
                url: "https://archive.org/download/lying_lips/lying_lips.mp4",
                year: "1939",
                duration: "1h 8m",
                director: "Oscar Micheaux"
            },
            {
                id: "blood-of-jesus",
                title: "The Blood of Jesus",
                description: "Spencer Williams' masterpiece and the first race film inducted into the National Film Registry. A devout Baptist woman is accidentally shot by her husband and sent to a crossroads between Heaven and Hell. Made for $5,000, it became a major commercial success.",
                source: "Archive.org",
                url: "https://archive.org/download/blood_of_jesus/blood_of_jesus.mp4",
                year: "1941",
                duration: "57m",
                director: "Spencer Williams"
            },
        ]
    },

    /* ──── CH 2: BLACK WESTERNS ──── */
    {
        id: "westerns",
        name: "Black Westerns",
        number: 2,
        tagline: "All-Black cast westerns & frontier heroes",
        accent: "amber",
        accentBg: "bg-amber-700",
        accentText: "text-amber-500",
        accentBorder: "border-amber-600/30",
        accentGlow: "shadow-amber-600/20",
        icon: Sword,
        films: [
            {
                id: "bronze-buckaroo",
                title: "The Bronze Buckaroo",
                description: "Starring Herb Jeffries as singing cowboy Bob Blake, this pioneering Black Western gave African American audiences their own cowboy hero. Blake arrives at a ranch to find the owner missing and must battle crooks to rescue him.",
                source: "Archive.org",
                url: "https://archive.org/download/bronze_buckaroo/the_bronze_buckaroo.mp4",
                year: "1939",
                duration: "58m",
                director: "Richard C. Kahn"
            },
            {
                id: "harlem-rides-the-range",
                title: "Harlem Rides the Range",
                description: "Herb Jeffries returns as Bob Blake in this all-Black Western. When a rancher is murdered over a radium mine, Blake investigates the conspiracy. Horseback chases, shootouts, and musical numbers.",
                source: "Archive.org",
                url: "https://archive.org/download/HarlemRidesTheRange/Harlem%20Rides%20The%20Range.mp4",
                year: "1939",
                duration: "54m",
                director: "Richard C. Kahn"
            },
            {
                id: "two-gun-man-from-harlem",
                title: "Two-Gun Man from Harlem",
                description: "A B-western with an all-Black cast featuring Spencer Williams and comedian Mantan Moreland. A cowboy is framed for murder and must clear his name while outsmarting the real outlaws.",
                source: "Archive.org",
                url: "https://archive.org/download/Two-gunManFromHarlem/Two-gunManFromHarlem.mp4",
                year: "1938",
                duration: "1h 3m",
                director: "Richard C. Kahn"
            },
        ]
    },

    /* ──── CH 3: SOUL STAGE ──── */
    {
        id: "soul-stage",
        name: "Soul Stage",
        number: 3,
        tagline: "Musical films, jazz legends & live performances",
        accent: "purple",
        accentBg: "bg-purple-600",
        accentText: "text-purple-400",
        accentBorder: "border-purple-500/30",
        accentGlow: "shadow-purple-500/20",
        icon: Music,
        films: [
            {
                id: "hi-de-ho",
                title: "Hi-De-Ho",
                description: "Cab Calloway plays himself in this musical race film set in the world of Harlem nightclubs. Featuring jealousy, gangsters, and Calloway's legendary bandleading and scat singing. A vibrant time capsule of Harlem's golden era of entertainment.",
                source: "Archive.org",
                url: "https://archive.org/download/hi_de_ho/Hi-De-Ho.mp4",
                year: "1947",
                duration: "1h 12m",
                director: "Josh Binney"
            },
            {
                id: "study-negro-artists",
                title: "A Study of Negro Artists",
                description: "Rare 1930s documentary capturing the vibrant Harlem Renaissance art scene. Features Black painters, sculptors, and cultural visionaries including Richmond Barthé and Aaron Douglas. From the Prelinger Archives.",
                source: "Prelinger Archives",
                url: "https://archive.org/download/StudyOfNegroArtists/StudyOfNegroArtists_512kb.mp4",
                year: "1933",
                duration: "18m",
                director: "Unknown"
            },
            {
                id: "1950s-home-movies-detroit",
                title: "African American Family Life (Detroit)",
                description: "Intimate home movies capturing mid-century African American family celebrations in Detroit — birthday parties, church picnics, neighborhood gatherings. Joy and community thriving despite systemic challenges.",
                source: "Archive.org • AAHMA",
                url: "https://archive.org/download/HM_African_American_Family_Detroit/HM_African_American_Family_Detroit.mp4",
                year: "1950s",
                duration: "12m",
                director: "Unknown"
            },
        ]
    },

    /* ──── CH 4: FREEDOM REELS ──── */
    {
        id: "freedom-reels",
        name: "Freedom Reels",
        number: 4,
        tagline: "Civil rights documentaries & social commentary",
        accent: "red",
        accentBg: "bg-red-600",
        accentText: "text-red-400",
        accentBorder: "border-red-500/30",
        accentGlow: "shadow-red-500/20",
        icon: Landmark,
        films: [
            {
                id: "negro-soldier",
                title: "The Negro Soldier",
                description: "Produced by Frank Capra for the U.S. Army, this groundbreaking WWII documentary chronicles African American contributions in every American conflict. Inducted into the National Film Registry in 2011.",
                source: "Archive.org • National Archives",
                url: "https://archive.org/download/negrosoldier/negrosoldier.mp4",
                year: "1944",
                duration: "40m",
                director: "Stuart Heisler"
            },
            {
                id: "heritage-of-slavery",
                title: "The Heritage of Slavery",
                description: "CBS News' searing 1968 documentary examining the enduring impact of slavery on American society. Traces how slavery shaped race relations, economic disparity, and social structures that persist to this day.",
                source: "Archive.org • CBS News",
                url: "https://archive.org/download/TheHeritageOfSlavery/The%20Heritage%20Of%20Slavery.mp4",
                year: "1968",
                duration: "52m",
                director: "CBS News"
            },
            {
                id: "black-history-lost-stolen-pt1",
                title: "Black History: Lost, Stolen, or Strayed (Pt 1)",
                description: "Narrated by Bill Cosby, this Emmy Award-winning CBS documentary examines how Black contributions to American history were systematically erased, distorted, or ignored. Part 1 traces the experience from slavery through the early 20th century.",
                source: "Archive.org • CBS News",
                url: "https://archive.org/download/blackhistoryloststolenorstrayed/blackhistoryloststolenorstrayedreel1.mp4",
                year: "1968",
                duration: "27m",
                director: "Perry Wolff"
            },
            {
                id: "black-history-lost-stolen-pt2",
                title: "Black History: Lost, Stolen, or Strayed (Pt 2)",
                description: "The powerful conclusion examines the Civil Rights era, the fight for equality, and ongoing institutional racism. Won the Emmy for Outstanding News Documentary Program in 1969.",
                source: "Archive.org • CBS News",
                url: "https://archive.org/download/blackhistoryloststolenorstrayed/blackhistoryloststolenorstrayedreel2.mp4",
                year: "1968",
                duration: "27m",
                director: "Perry Wolff"
            },
            {
                id: "1619-up-from-slavery",
                title: "1619: Up from Slavery",
                description: "A powerful documentary tracing the African American experience from the arrival of the first enslaved Africans in 1619 through centuries of struggle, resilience, and triumph.",
                source: "Archive.org",
                url: "https://archive.org/download/1619UpFromSlavery/1619%20Up%20From%20Slavery%2001.mp4",
                year: "2000",
                duration: "1h 30m",
                director: "PBS"
            },
        ]
    },

    /* ──── CH 5: HOME & HERITAGE ──── */
    {
        id: "home-heritage",
        name: "Home & Heritage",
        number: 5,
        tagline: "Home movies, oral histories & cultural preservation",
        accent: "emerald",
        accentBg: "bg-emerald-600",
        accentText: "text-emerald-400",
        accentBorder: "border-emerald-500/30",
        accentGlow: "shadow-emerald-500/20",
        icon: Home,
        films: [
            {
                id: "1950s-home-movies",
                title: "African American Home Movies (1950s)",
                description: "Precious mid-century home movies capturing everyday African American family life — birthday parties, church picnics, neighborhood gatherings, and holiday celebrations. Intimate glimpses of joy, love, and community.",
                source: "Archive.org • Library of Congress",
                url: "https://archive.org/download/HM_African_American_Family_Detroit/HM_African_American_Family_Detroit.mp4",
                year: "1950s",
                duration: "12m",
                director: "Unknown"
            },
            {
                id: "study-negro-artists-heritage",
                title: "Harlem Renaissance Artists",
                description: "Rare documentary footage capturing Black painters, sculptors, and cultural visionaries during the Harlem Renaissance, one of the most significant artistic movements in American history.",
                source: "Prelinger Archives",
                url: "https://archive.org/download/StudyOfNegroArtists/StudyOfNegroArtists_512kb.mp4",
                year: "1933",
                duration: "18m",
                director: "Unknown"
            },
        ]
    },
];

/* ════════════════════════════════════════════════════
   CUSTOM HTML5 VIDEO PLAYER — FAST MODE
   Auto-plays on mount, calls onEnded for auto-advance
   ════════════════════════════════════════════════════ */

function CinemaPlayer({ src, accent, onEnded, autoPlay }: { src: string; accent: string; onEnded?: () => void; autoPlay?: boolean }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState("0:00");
    const [totalDuration, setTotalDuration] = useState("0:00");
    const [showControls, setShowControls] = useState(true);
    const controlsTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

    const accentBarClass = accent === "yellow" ? "bg-yellow-500" : accent === "amber" ? "bg-amber-500" : accent === "purple" ? "bg-purple-500" : accent === "red" ? "bg-red-500" : "bg-emerald-500";
    const accentDotClass = accent === "yellow" ? "bg-yellow-400" : accent === "amber" ? "bg-amber-400" : accent === "purple" ? "bg-purple-400" : accent === "red" ? "bg-red-400" : "bg-emerald-400";
    const accentBtnBg = accent === "yellow" ? "bg-yellow-500/90" : accent === "amber" ? "bg-amber-500/90" : accent === "purple" ? "bg-purple-500/90" : accent === "red" ? "bg-red-500/90" : "bg-emerald-500/90";

    const formatTime = (s: number) => {
        if (isNaN(s)) return "0:00";
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = Math.floor(s % 60);
        return h > 0
            ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
            : `${m}:${String(sec).padStart(2, "0")}`;
    };

    const togglePlay = () => {
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) { v.play(); } else { v.pause(); }
    };
    const toggleMute = () => {
        const v = videoRef.current;
        if (!v) return;
        v.muted = !v.muted;
        setIsMuted(v.muted);
    };
    const toggleFullscreen = () => {
        const el = containerRef.current;
        if (!el) return;
        if (!document.fullscreenElement) el.requestFullscreen?.();
        else document.exitFullscreen?.();
    };
    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const v = videoRef.current;
        if (!v || !v.duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
    };

    // FAST: auto-play on mount
    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);
        const onTime = () => { if (v.duration) { setProgress((v.currentTime / v.duration) * 100); setCurrentTime(formatTime(v.currentTime)); } };
        const onLoaded = () => {
            setTotalDuration(formatTime(v.duration));
            if (autoPlay) v.play().catch(() => { });
        };
        const onEnd = () => onEnded?.();
        v.addEventListener("play", onPlay); v.addEventListener("pause", onPause);
        v.addEventListener("timeupdate", onTime); v.addEventListener("loadedmetadata", onLoaded);
        v.addEventListener("durationchange", onLoaded); v.addEventListener("ended", onEnd);
        return () => {
            v.removeEventListener("play", onPlay); v.removeEventListener("pause", onPause);
            v.removeEventListener("timeupdate", onTime); v.removeEventListener("loadedmetadata", onLoaded);
            v.removeEventListener("durationchange", onLoaded); v.removeEventListener("ended", onEnd);
        };
    }, [src, autoPlay, onEnded]);

    const handleMouseMove = () => {
        setShowControls(true);
        clearTimeout(controlsTimer.current);
        controlsTimer.current = setTimeout(() => { if (videoRef.current && !videoRef.current.paused) setShowControls(false); }, 3000);
    };

    return (
        <div ref={containerRef} className="relative rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10 group aspect-video cursor-pointer"
            onMouseMove={handleMouseMove} onMouseLeave={() => isPlaying && setShowControls(false)} onClick={togglePlay}>
            <video ref={videoRef} src={src} preload="metadata" playsInline className="w-full h-full object-contain bg-black" />
            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity">
                    <div className={cn("w-20 h-20 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-2xl", accentBtnBg)}>
                        <Play className="w-8 h-8 text-black ml-1" fill="black" />
                    </div>
                </div>
            )}
            {/* FAST Channel bug: on-screen channel indicator */}
            <div className={cn("absolute top-4 left-4 flex items-center gap-2 pointer-events-none transition-opacity duration-500",
                showControls || !isPlaying ? "opacity-100" : "opacity-0")}>
                <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-1.5 border border-white/10">
                    <Radio className="w-3 h-3 text-red-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">FAST</span>
                </div>
            </div>
            <div className={cn("absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-4 pt-10 transition-opacity duration-300",
                showControls || !isPlaying ? "opacity-100" : "opacity-0")} onClick={(e) => e.stopPropagation()}>
                <div className="h-1.5 bg-white/20 rounded-full mb-3 cursor-pointer group/bar hover:h-2.5 transition-all" onClick={handleSeek}>
                    <div className={cn("h-full rounded-full relative", accentBarClass)} style={{ width: `${progress}%` }}>
                        <div className={cn("absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-lg opacity-0 group-hover/bar:opacity-100 transition-opacity", accentDotClass)} />
                    </div>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={togglePlay} className="text-white hover:text-yellow-400 transition-colors">{isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}</button>
                        <button onClick={toggleMute} className="text-white hover:text-yellow-400 transition-colors">{isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</button>
                        <span className="text-xs text-gray-300 font-mono tabular-nums">{currentTime} / {totalDuration}</span>
                    </div>
                    <button onClick={toggleFullscreen} className="text-white hover:text-yellow-400 transition-colors"><Maximize className="w-5 h-5" /></button>
                </div>
            </div>
        </div>
    );
}

/* ════════════════════════════════════════════════════
   CHANNEL GUIDE STRIP
   ════════════════════════════════════════════════════ */

function ChannelGuide({ channels, activeId, onSelect }: { channels: Channel[]; activeId: string; onSelect: (id: string) => void }) {
    return (
        <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
            {channels.map((ch) => {
                const Icon = ch.icon;
                const isActive = ch.id === activeId;
                return (
                    <button
                        key={ch.id}
                        onClick={() => onSelect(ch.id)}
                        className={cn(
                            "flex items-center gap-3 px-5 py-3.5 rounded-2xl border transition-all duration-300 min-w-[200px] flex-shrink-0 group relative overflow-hidden",
                            isActive
                                ? `${ch.accentBorder} bg-white/[0.04] shadow-lg ${ch.accentGlow}`
                                : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10"
                        )}
                    >
                        {/* Active glow */}
                        {isActive && (
                            <div className="absolute inset-0 bg-gradient-to-r from-white/[0.03] via-transparent to-transparent pointer-events-none" />
                        )}

                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all relative z-10",
                            isActive ? ch.accentBg : "bg-white/5"
                        )}>
                            <Icon className={cn("w-5 h-5", isActive ? "text-black" : "text-gray-500")} />
                        </div>

                        <div className="text-left min-w-0 relative z-10">
                            <div className="flex items-center gap-2">
                                <span className={cn("text-[10px] font-mono", isActive ? ch.accentText : "text-gray-600")}>
                                    CH {ch.number}
                                </span>
                                {isActive && (
                                    <div className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                        <span className="text-[8px] text-red-400 font-bold uppercase">Live</span>
                                    </div>
                                )}
                            </div>
                            <h4 className={cn(
                                "text-sm font-bold truncate transition-colors",
                                isActive ? "text-white" : "text-gray-400 group-hover:text-gray-200"
                            )}>
                                {ch.name}
                            </h4>
                            <span className="text-[10px] text-gray-600">{ch.films.length} films</span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}

/* ════════════════════════════════════════════════════
   SOURCE BADGE
   ════════════════════════════════════════════════════ */

function SourceBadge({ source }: { source: string }) {
    const sources = source.split("•").map((s) => s.trim());
    return (
        <div className="flex items-center gap-2 flex-wrap">
            {sources.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                    <Library className="w-3 h-3" />
                    {s}
                </span>
            ))}
        </div>
    );
}

/* ════════════════════════════════════════════════════
   CHANNEL TUNE-IN OVERLAY
   Shows channel number + name when switching channels
   ════════════════════════════════════════════════════ */

function TuneInOverlay({ channel, visible }: { channel: Channel; visible: boolean }) {
    const Icon = channel.icon;
    return (
        <div className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md transition-all duration-700 pointer-events-none",
            visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}>
            <div className="text-center space-y-4">
                <div className={cn("w-24 h-24 rounded-3xl mx-auto flex items-center justify-center shadow-2xl", channel.accentBg, channel.accentGlow)}>
                    <Icon className="w-12 h-12 text-black" />
                </div>
                <div>
                    <div className={cn("text-sm font-mono font-bold", channel.accentText)}>CH {channel.number}</div>
                    <h2 className="text-4xl font-black text-white mt-1">{channel.name}</h2>
                    <p className="text-gray-400 text-sm mt-2">{channel.tagline}</p>
                </div>
                <div className="flex items-center justify-center gap-2 mt-4">
                    <Zap className={cn("w-4 h-4", channel.accentText)} />
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">FAST Channel • Auto-Playing</span>
                </div>
            </div>
        </div>
    );
}

/* ════════════════════════════════════════════════════
   UP NEXT TOAST — shows when a film is about to end
   ════════════════════════════════════════════════════ */

function UpNextToast({ nextFilm, accent, visible }: { nextFilm: VideoItem | null; accent: string; visible: boolean }) {
    if (!nextFilm) return null;
    const accentBorder = accent === "yellow" ? "border-yellow-600/40" : accent === "amber" ? "border-amber-600/40" : accent === "purple" ? "border-purple-500/40" : accent === "red" ? "border-red-500/40" : "border-emerald-500/40";
    const accentText = accent === "yellow" ? "text-yellow-500" : accent === "amber" ? "text-amber-500" : accent === "purple" ? "text-purple-400" : accent === "red" ? "text-red-400" : "text-emerald-400";
    return (
        <div className={cn(
            "fixed bottom-6 right-6 z-40 max-w-sm bg-black/90 backdrop-blur-xl rounded-2xl border p-4 shadow-2xl transition-all duration-500",
            accentBorder, visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        )}>
            <div className="flex items-center gap-1.5 mb-2">
                <SkipForward className={cn("w-3 h-3", accentText)} />
                <span className={cn("text-[10px] font-black uppercase tracking-widest", accentText)}>Up Next</span>
            </div>
            <h4 className="text-sm font-bold text-white">{nextFilm.title}</h4>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                <span>{nextFilm.year}</span><span>•</span><span>{nextFilm.duration}</span><span>•</span><span>{nextFilm.director}</span>
            </div>
        </div>
    );
}

/* ════════════════════════════════════════════════════
   MAIN GALLERY — MULTI-CHANNEL FAST
   ════════════════════════════════════════════════════ */

export function BlackCinemaGallery() {
    const [activeChannelId, setActiveChannelId] = useState(CHANNELS[0].id);
    const activeChannel = CHANNELS.find((c) => c.id === activeChannelId) ?? CHANNELS[0];
    const [activeVideo, setActiveVideo] = useState<VideoItem>(activeChannel.films[0]);
    const [fastMode, setFastMode] = useState(true);
    const [showTuneIn, setShowTuneIn] = useState(false);
    const [showUpNext, setShowUpNext] = useState(false);

    // FAST: get next film in queue
    const getNextFilm = useCallback(() => {
        const idx = activeChannel.films.findIndex((v) => v.id === activeVideo.id);
        if (activeChannel.films.length > 0) {
            return activeChannel.films[(idx + 1) % activeChannel.films.length];
        }
        return null;
    }, [activeChannel.films, activeVideo.id]);

    // When channel changes, show tune-in overlay and switch to first film
    useEffect(() => {
        if (activeChannel.films.length > 0) {
            setActiveVideo(activeChannel.films[0]);
        }
        // Show tune-in overlay
        setShowTuneIn(true);
        const timer = setTimeout(() => setShowTuneIn(false), 2200);
        return () => clearTimeout(timer);
    }, [activeChannelId, activeChannel.films]);

    // FAST: auto-advance when film ends
    const handleVideoEnded = useCallback(() => {
        if (!fastMode) return;
        const next = getNextFilm();
        if (next) {
            setShowUpNext(false);
            setActiveVideo(next);
        }
    }, [fastMode, getNextFilm]);

    const playNext = () => {
        const next = getNextFilm();
        if (next) setActiveVideo(next);
    };

    const Icon = activeChannel.icon;
    const totalFilms = CHANNELS.reduce((sum, ch) => sum + ch.films.length, 0);
    const nextFilm = getNextFilm();

    return (
        <div className="space-y-6">
            {/* ── Tune-In Overlay ── */}
            <TuneInOverlay channel={activeChannel} visible={showTuneIn} />

            {/* ── Up Next Toast ── */}
            <UpNextToast nextFilm={nextFilm} accent={activeChannel.accent} visible={showUpNext} />

            {/* ── Master Banner ── */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-gray-900/80 via-black to-gray-900/60 border border-white/5 p-5 sm:p-6">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_50%,rgba(255,255,255,0.02),transparent_60%)]" />
                <div className="relative z-10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                            <Tv className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-black tracking-tight text-white">JuneteenthTube Channels</h2>
                                <div className="flex items-center gap-1 bg-red-500/20 border border-red-500/30 rounded-md px-2 py-0.5">
                                    <Zap className="w-3 h-3 text-red-400" />
                                    <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">FAST</span>
                                </div>
                            </div>
                            <p className="text-gray-500 text-xs">{CHANNELS.length} channels • {totalFilms} films • Free Ad-Supported Streaming TV</p>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-3">
                        {/* FAST Mode Toggle */}
                        <button
                            onClick={() => setFastMode(!fastMode)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all",
                                fastMode
                                    ? "bg-red-500/20 border-red-500/30 text-red-400"
                                    : "bg-white/5 border-white/10 text-gray-500"
                            )}
                        >
                            <Radio className={cn("w-3.5 h-3.5", fastMode && "animate-pulse")} />
                            {fastMode ? "FAST ON" : "FAST OFF"}
                        </button>
                        <div className="flex items-center gap-2 text-[10px] text-gray-600 flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">Archive.org</span>
                            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">Prelinger</span>
                            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">National Archives</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Channel Guide Strip ── */}
            <ChannelGuide channels={CHANNELS} activeId={activeChannelId} onSelect={setActiveChannelId} />

            {/* ── Active Channel Header ── */}
            <div className={cn("relative rounded-xl overflow-hidden p-4 sm:p-5 border", activeChannel.accentBorder, "bg-white/[0.02]")}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", activeChannel.accentBg)}>
                            <Icon className="w-4 h-4 text-black" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className={cn("text-[10px] font-mono font-bold", activeChannel.accentText)}>CHANNEL {activeChannel.number}</span>
                                <ChevronRight className="w-3 h-3 text-gray-600" />
                                <span className="text-sm font-bold text-white">{activeChannel.name}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{activeChannel.tagline} • {activeChannel.films.length} films</p>
                        </div>
                    </div>
                    {fastMode && (
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Auto-Play</span>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Player + Playlist ── */}
            <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
                {/* MAIN PLAYER */}
                <div className="flex-grow lg:w-2/3 space-y-5">
                    <CinemaPlayer
                        key={activeVideo.id}
                        src={activeVideo.url}
                        accent={activeChannel.accent}
                        autoPlay={fastMode}
                        onEnded={handleVideoEnded}
                    />

                    <div className="space-y-3 px-1">
                        {/* Now Playing */}
                        <div className="flex items-start gap-3">
                            <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-md border flex-shrink-0 mt-1",
                                activeChannel.accentBorder, "bg-white/[0.03]")}>
                                <Sparkles className={cn("w-3 h-3", activeChannel.accentText)} />
                                <span className={cn("text-[9px] font-black uppercase tracking-widest", activeChannel.accentText)}>Now Playing</span>
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-2xl sm:text-3xl font-serif italic text-white leading-tight">
                                    {activeVideo.title}
                                    <span className={cn("text-sm not-italic px-2 py-0.5 rounded border ml-3 align-middle",
                                        activeChannel.accentBorder, activeChannel.accentText, "bg-white/[0.03]")}>
                                        {activeVideo.year}
                                    </span>
                                </h2>
                            </div>
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <User className={cn("w-4 h-4", activeChannel.accentText)} />
                                <span>{activeVideo.director}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <Clock className="w-4 h-4" />
                                <span>{activeVideo.duration}</span>
                            </div>
                            <button onClick={playNext} className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-sm ml-auto">
                                <SkipForward className="w-4 h-4" /> Next
                            </button>
                        </div>

                        <p className="text-gray-400 font-light leading-relaxed max-w-3xl text-sm">{activeVideo.description}</p>

                        {/* Up Next Preview Bar */}
                        {nextFilm && (
                            <div className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 mt-2">
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <SkipForward className="w-3.5 h-3.5 text-gray-500" />
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Up Next</span>
                                </div>
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className="text-sm text-white font-bold truncate">{nextFilm.title}</span>
                                    <span className="text-[11px] text-gray-500 flex-shrink-0">{nextFilm.year} • {nextFilm.duration}</span>
                                </div>
                                {fastMode && <span className="text-[9px] text-red-400 font-bold ml-auto flex-shrink-0">AUTO</span>}
                            </div>
                        )}

                        <div className="flex items-center gap-4 pt-3 border-t border-white/5">
                            <SourceBadge source={activeVideo.source} />
                            <div className="h-1 w-1 bg-green-500 rounded-full" />
                            <span className="text-xs uppercase tracking-widest text-green-500 font-bold">Public Domain</span>
                        </div>
                    </div>
                </div>

                {/* SIDEBAR PLAYLIST */}
                <div className={cn("lg:w-1/3 flex flex-col h-[700px] bg-[#0a0a0a] rounded-[2rem] border overflow-hidden sticky top-24", activeChannel.accentBorder)}>
                    <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                        <h3 className="text-base font-bold text-white uppercase tracking-widest flex items-center gap-3">
                            <List className={cn("w-5 h-5", activeChannel.accentText)} />
                            Program Guide
                        </h3>
                        <div className="flex items-center gap-2">
                            {fastMode && <Radio className="w-3 h-3 text-red-500 animate-pulse" />}
                            <span className="text-xs text-gray-500 font-mono">{activeChannel.films.length} FILMS</span>
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto p-3 space-y-2 scrollbar-hide">
                        {activeChannel.films.map((video, index) => (
                            <button
                                key={video.id}
                                onClick={() => setActiveVideo(video)}
                                className={cn(
                                    "w-full text-left p-3 rounded-xl transition-all duration-300 group relative overflow-hidden border border-transparent",
                                    activeVideo.id === video.id
                                        ? cn(activeChannel.accentBorder, "bg-white/[0.04] shadow-lg")
                                        : "hover:bg-white/5 hover:border-white/10"
                                )}
                            >
                                <div className="flex gap-3 relative z-10">
                                    <div className="flex-shrink-0 w-5 flex items-center justify-center">
                                        {activeVideo.id === video.id ? (
                                            <div className={cn("w-2 h-2 rounded-full animate-pulse", activeChannel.accentBg)} />
                                        ) : (
                                            <span className="text-[11px] text-gray-600 font-mono">{index + 1}</span>
                                        )}
                                    </div>
                                    <div className="relative w-16 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-gray-900 flex items-center justify-center">
                                        <Film className="w-4 h-4 text-gray-700" />
                                    </div>
                                    <div className="flex flex-col justify-center min-w-0 flex-1">
                                        <h4 className={cn("font-bold text-xs truncate pr-2 transition-colors leading-tight",
                                            activeVideo.id === video.id ? activeChannel.accentText : "text-gray-200 group-hover:text-white")}>
                                            {video.title}
                                        </h4>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[10px] text-gray-500 font-mono">{video.year}</span>
                                            <span className="text-[10px] text-gray-600">•</span>
                                            <span className="text-[10px] text-gray-500">{video.duration}</span>
                                        </div>
                                        <span className="text-[10px] text-gray-600 truncate mt-0.5">{video.director}</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                                {activeChannel.name}
                            </p>
                            <div className="flex items-center gap-1.5">
                                <Zap className="w-3 h-3 text-red-500" />
                                <span className="text-[9px] text-red-400 font-bold uppercase tracking-widest">FAST Channel</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
