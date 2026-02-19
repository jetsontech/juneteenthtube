"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Film, Play, Pause, Volume2, VolumeX, Maximize, SkipForward, Clock, Landmark, Scale, Megaphone, BookOpen, Users, Zap, ChevronRight, Radio } from "lucide-react";
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
    category: "March & Protest" | "Documentary" | "Military & Service" | "Legal & Legislative" | "Culture & Identity";
}

interface Section {
    id: string;
    name: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
    accentBg: string;
    accentText: string;
    accentBorder: string;
    description: string;
    films: VideoItem[];
}

/* ════════════════════════════════════════════════════
   CIVIL RIGHTS VIDEO DATA
   ════════════════════════════════════════════════════ */

const SECTIONS: Section[] = [
    /* ──── MARCHES & PROTESTS ──── */
    {
        id: "marches",
        name: "Marches & Protests",
        icon: Megaphone,
        accent: "red",
        accentBg: "bg-red-600",
        accentText: "text-red-400",
        accentBorder: "border-red-500/30",
        description: "Historic marches, sit-ins, and acts of courage",
        films: [
            {
                id: "march-on-washington",
                title: "The March on Washington",
                description: "Official NARA documentary of the historic 1963 March on Washington for Jobs and Freedom. Features the gathering of over 250,000 people on the National Mall, culminating in Dr. Martin Luther King Jr.'s 'I Have a Dream' speech.",
                source: "National Archives (NARA)",
                url: "https://archive.org/download/gov.archives.arc.49737/gov.archives.arc.49737_512kb.mp4",
                year: "1963",
                duration: "30m",
                director: "U.S. Information Agency",
                category: "March & Protest"
            },
            {
                id: "1619-up-from-slavery",
                title: "1619: Up from Slavery",
                description: "A sweeping documentary tracing the African American experience from the arrival of the first enslaved Africans in Jamestown in 1619 through centuries of struggle, resilience, and triumph toward freedom and equality.",
                source: "Archive.org",
                url: "https://archive.org/download/1619UpFromSlavery/1619%20Up%20From%20Slavery%2001.mp4",
                year: "2000",
                duration: "1h 30m",
                director: "PBS",
                category: "March & Protest"
            },
        ]
    },

    /* ──── DOCUMENTARIES ──── */
    {
        id: "documentaries",
        name: "Documentaries",
        icon: Film,
        accent: "blue",
        accentBg: "bg-blue-600",
        accentText: "text-blue-400",
        accentBorder: "border-blue-500/30",
        description: "In-depth films examining systemic racism and the fight for equality",
        films: [
            {
                id: "heritage-of-slavery",
                title: "The Heritage of Slavery",
                description: "CBS News' searing 1968 documentary examining the enduring impact of slavery on American society. Hosted by George Foster, it traces how slavery shaped race relations, economic disparity, and social structures that persist to this day.",
                source: "Archive.org • CBS News",
                url: "https://archive.org/download/TheHeritageOfSlavery/The%20Heritage%20Of%20Slavery.mp4",
                year: "1968",
                duration: "52m",
                director: "CBS News",
                category: "Documentary"
            },
            {
                id: "black-history-lost-stolen-pt1",
                title: "Black History: Lost, Stolen, or Strayed (Pt 1)",
                description: "Narrated by Bill Cosby, this Emmy Award-winning CBS documentary examines how Black contributions to American history were systematically erased, distorted, or ignored. Part 1 traces the experience from slavery through the early 20th century.",
                source: "Archive.org • CBS News",
                url: "https://archive.org/download/blackhistoryloststolenorstrayed/blackhistoryloststolenorstrayedreel1.mp4",
                year: "1968",
                duration: "27m",
                director: "Perry Wolff",
                category: "Documentary"
            },
            {
                id: "black-history-lost-stolen-pt2",
                title: "Black History: Lost, Stolen, or Strayed (Pt 2)",
                description: "The powerful conclusion examines the Civil Rights era, the fight for equality, and ongoing institutional racism. Won the Emmy for Outstanding News Documentary Program in 1969.",
                source: "Archive.org • CBS News",
                url: "https://archive.org/download/blackhistoryloststolenorstrayed/blackhistoryloststolenorstrayedreel2.mp4",
                year: "1968",
                duration: "27m",
                director: "Perry Wolff",
                category: "Documentary"
            },
        ]
    },

    /* ──── MILITARY & SERVICE ──── */
    {
        id: "military",
        name: "Military & Service",
        icon: Landmark,
        accent: "amber",
        accentBg: "bg-amber-600",
        accentText: "text-amber-400",
        accentBorder: "border-amber-600/30",
        description: "African American contributions to the armed forces",
        films: [
            {
                id: "negro-soldier",
                title: "The Negro Soldier",
                description: "Produced by Frank Capra for the U.S. Army, this groundbreaking WWII documentary chronicles African American contributions in every American conflict from the Revolutionary War to WWII. Inducted into the National Film Registry in 2011.",
                source: "Archive.org • National Archives",
                url: "https://archive.org/download/negrosoldier/negrosoldier.mp4",
                year: "1944",
                duration: "40m",
                director: "Stuart Heisler",
                category: "Military & Service"
            },
            {
                id: "wings-for-this-man",
                title: "Wings for This Man",
                description: "The story of the Tuskegee Airmen — the first African American military aviators in the U.S. Armed Forces. Narrated by Ronald Reagan, this film documents their training and heroic combat missions over Europe during WWII.",
                source: "Archive.org • U.S. Army",
                url: "https://archive.org/download/WingsForThisMan/WingsForThisMan_512kb.mp4",
                year: "1945",
                duration: "12m",
                director: "U.S. Army Air Forces",
                category: "Military & Service"
            },
        ]
    },

    /* ──── LEGAL & LEGISLATIVE ──── */
    {
        id: "legal",
        name: "Legal & Legislative",
        icon: Scale,
        accent: "purple",
        accentBg: "bg-purple-600",
        accentText: "text-purple-400",
        accentBorder: "border-purple-500/30",
        description: "The legal battles that changed America",
        films: [
            {
                id: "within-our-gates",
                title: "Within Our Gates",
                description: "Directed by Oscar Micheaux, this is the oldest surviving film by an African American director. A powerful response to D.W. Griffith's 'Birth of a Nation', the film exposes the horrors of lynching and systemic racial injustice in early 20th century America.",
                source: "Archive.org",
                url: "https://archive.org/download/WithinOurGates/WithinOurGates_512kb.mp4",
                year: "1920",
                duration: "1h 19m",
                director: "Oscar Micheaux",
                category: "Legal & Legislative"
            },
            {
                id: "murder-in-harlem",
                title: "Murder in Harlem",
                description: "Oscar Micheaux's gripping courtroom drama follows a Black night watchman falsely accused of murdering a young woman. An early examination of racial bias in the criminal justice system.",
                source: "Archive.org",
                url: "https://archive.org/download/Murder_in_Harlem/MurderInHarlem.mp4",
                year: "1935",
                duration: "1h 36m",
                director: "Oscar Micheaux",
                category: "Legal & Legislative"
            },
        ]
    },

    /* ──── CULTURE & IDENTITY ──── */
    {
        id: "culture",
        name: "Culture & Identity",
        icon: Users,
        accent: "emerald",
        accentBg: "bg-emerald-600",
        accentText: "text-emerald-400",
        accentBorder: "border-emerald-500/30",
        description: "African American culture, art, and community life",
        films: [
            {
                id: "study-negro-artists-cr",
                title: "A Study of Negro Artists",
                description: "Rare 1930s documentary capturing the vibrant Harlem Renaissance art scene. Features Black painters, sculptors, and cultural visionaries including Richmond Barthé and Aaron Douglas.",
                source: "Prelinger Archives",
                url: "https://archive.org/download/StudyOfNegroArtists/StudyOfNegroArtists_512kb.mp4",
                year: "1933",
                duration: "18m",
                director: "Unknown",
                category: "Culture & Identity"
            },
            {
                id: "1950s-detroit-home-cr",
                title: "African American Family Life (Detroit)",
                description: "Intimate home movies capturing mid-century African American family celebrations in Detroit — birthday parties, church picnics, neighborhood gatherings. Joy and community thriving despite systemic challenges.",
                source: "Archive.org • AAHMA",
                url: "https://archive.org/download/HM_African_American_Family_Detroit/HM_African_American_Family_Detroit.mp4",
                year: "1950s",
                duration: "15m",
                director: "Unknown",
                category: "Culture & Identity"
            },
            {
                id: "rock-n-roll-revue-cr",
                title: "Rock 'n' Roll Revue",
                description: "Live from Harlem's Apollo Theater — Duke Ellington, Nat King Cole, Dinah Washington, and more. A vibrant celebration of Black musical talent that helped break cultural barriers during the Civil Rights era.",
                source: "Archive.org",
                url: "https://archive.org/download/rock-n-roll-revue-1955/Rock%20%27n%27%20Roll%20Revue%20%281955%29.mp4",
                year: "1955",
                duration: "1h 10m",
                director: "Joseph Kohn",
                category: "Culture & Identity"
            },
        ]
    },
];

const ALL_FILMS = SECTIONS.flatMap(s => s.films);
const CATEGORIES = ["All", "March & Protest", "Documentary", "Military & Service", "Legal & Legislative", "Culture & Identity"] as const;

/* ════════════════════════════════════════════════════
   CINEMA PLAYER (lightweight)
   ════════════════════════════════════════════════════ */

function CivilRightsPlayer({ src, accent }: { src: string; accent: string }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
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

    let hideTimer: ReturnType<typeof setTimeout>;
    const handleMouseMove = () => {
        setShowControls(true);
        clearTimeout(hideTimer);
        if (isPlaying) hideTimer = setTimeout(() => setShowControls(false), 3000);
    };

    return (
        <div ref={containerRef}
            className="relative rounded-2xl overflow-hidden shadow-2xl bg-black border border-white/10 group aspect-video cursor-pointer"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}
            onClick={togglePlay}
        >
            <video ref={videoRef} src={src} preload="metadata" playsInline className="w-full h-full object-contain bg-black" />

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

/* ════════════════════════════════════════════════════
   MAIN GALLERY COMPONENT
   ════════════════════════════════════════════════════ */

export function CivilRightsGallery() {
    const [activeVideo, setActiveVideo] = useState<VideoItem>(ALL_FILMS[0]);
    const [activeSection, setActiveSection] = useState<string>("all");
    const [activeCategory, setActiveCategory] = useState<string>("All");

    const currentSection = SECTIONS.find(s => s.id === activeSection);
    const displayedFilms = activeCategory === "All"
        ? ALL_FILMS
        : ALL_FILMS.filter(f => f.category === activeCategory);

    const currentAccent = activeSection === "all"
        ? "red"
        : currentSection?.accent ?? "red";

    const accentText = currentAccent === "red" ? "text-red-400" : currentAccent === "blue" ? "text-blue-400" : currentAccent === "amber" ? "text-amber-400" : currentAccent === "purple" ? "text-purple-400" : "text-emerald-400";
    const accentBg = currentAccent === "red" ? "bg-red-600" : currentAccent === "blue" ? "bg-blue-600" : currentAccent === "amber" ? "bg-amber-600" : currentAccent === "purple" ? "bg-purple-600" : "bg-emerald-600";

    return (
        <div className="space-y-6">
            {/* ── MASTER BANNER ── */}
            <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-red-950/40 via-[#111]/80 to-blue-950/30 border border-white/[0.06] p-6 sm:p-8">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(239,68,68,0.08),transparent_60%)]" />
                <div className="relative z-10">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                        <div className="flex items-center gap-2">
                            <Landmark className="w-5 h-5 text-red-400" />
                            <h2 className="text-xl sm:text-2xl font-black tracking-tight">Civil Rights Movement</h2>
                        </div>
                        <div className="flex items-center gap-1 bg-red-500/20 border border-red-500/30 rounded-md px-2 py-0.5">
                            <Scale className="w-3 h-3 text-red-400" />
                            <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Public Domain</span>
                        </div>
                    </div>
                    <p className="text-gray-400 text-sm max-w-2xl">
                        History that must be seen. From marches to courtrooms, from battlefields to living rooms — the struggle for justice
                        in America, told through {ALL_FILMS.length} films from the National Archives, Archive.org, and public collections.
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                            <Film className="w-3 h-3" />
                            <span className="font-bold">{ALL_FILMS.length} Films</span>
                        </div>
                        <span className="text-gray-700">•</span>
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                            <BookOpen className="w-3 h-3" />
                            <span className="font-bold">{SECTIONS.length} Collections</span>
                        </div>
                        <span className="text-gray-700">•</span>
                        {["National Archives", "Archive.org", "CBS News", "U.S. Army"].map(src => (
                            <span key={src} className="text-[9px] px-2 py-0.5 bg-white/[0.03] border border-white/[0.06] rounded text-gray-500">{src}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── SECTION STRIP ── */}
            <div className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
                <button
                    onClick={() => { setActiveSection("all"); setActiveCategory("All"); }}
                    className={cn(
                        "flex items-center gap-3 px-5 py-3.5 rounded-2xl border transition-all duration-300 min-w-[160px] flex-shrink-0",
                        activeSection === "all"
                            ? "border-red-500/30 bg-white/[0.04] shadow-lg shadow-red-500/10"
                            : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10"
                    )}
                >
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", activeSection === "all" ? "bg-red-600" : "bg-white/[0.06]")}>
                        <Landmark className={cn("w-4 h-4", activeSection === "all" ? "text-white" : "text-gray-500")} />
                    </div>
                    <div className="text-left">
                        <div className={cn("text-xs font-bold", activeSection === "all" ? "text-white" : "text-gray-400")}>All</div>
                        <div className="text-[10px] text-gray-600">{ALL_FILMS.length} films</div>
                    </div>
                </button>
                {SECTIONS.map(sec => {
                    const Icon = sec.icon;
                    const isActive = activeSection === sec.id;
                    return (
                        <button
                            key={sec.id}
                            onClick={() => { setActiveSection(sec.id); setActiveCategory("All"); }}
                            className={cn(
                                "flex items-center gap-3 px-5 py-3.5 rounded-2xl border transition-all duration-300 min-w-[200px] flex-shrink-0",
                                isActive
                                    ? `${sec.accentBorder} bg-white/[0.04] shadow-lg`
                                    : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10"
                            )}
                        >
                            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", isActive ? sec.accentBg : "bg-white/[0.06]")}>
                                <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-gray-500")} />
                            </div>
                            <div className="text-left">
                                <div className={cn("text-xs font-bold", isActive ? "text-white" : "text-gray-400")}>{sec.name}</div>
                                <div className="text-[10px] text-gray-600">{sec.films.length} films</div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* ── CATEGORY FILTER ── */}
            {activeSection === "all" && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                                activeCategory === cat
                                    ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                                    : "bg-white/[0.04] text-gray-500 hover:bg-white/[0.06] border border-white/[0.06]"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {/* ── ACTIVE SECTION HEADER ── */}
            {currentSection && activeSection !== "all" && (
                <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", currentSection.accentBg)}>
                        {React.createElement(currentSection.icon, { className: "w-5 h-5 text-white" })}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">{currentSection.name}</h3>
                        <p className="text-xs text-gray-500">{currentSection.description}</p>
                    </div>
                </div>
            )}

            {/* ── PLAYER + PLAYLIST ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Player */}
                <div className="lg:col-span-2 space-y-4">
                    <CivilRightsPlayer
                        key={activeVideo.id}
                        src={activeVideo.url}
                        accent={currentAccent}
                    />
                    {/* Now Playing Info */}
                    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded", accentBg, "text-white")}>{activeVideo.category}</span>
                            <span className="text-[10px] text-gray-600">•</span>
                            <span className="text-[10px] text-gray-500">{activeVideo.year}</span>
                            <span className="text-[10px] text-gray-600">•</span>
                            <span className="text-[10px] text-gray-500">{activeVideo.duration}</span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{activeVideo.title}</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">{activeVideo.description}</p>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.06]">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-600">Dir: {activeVideo.director}</span>
                            </div>
                            <span className="text-[9px] px-2 py-0.5 bg-white/[0.03] border border-white/[0.06] rounded text-gray-500">{activeVideo.source}</span>
                        </div>
                    </div>
                </div>

                {/* Sidebar playlist */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Radio className={cn("w-3.5 h-3.5", accentText)} />
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                {activeSection === "all" ? "All Films" : currentSection?.name}
                            </span>
                        </div>
                        <span className="text-[10px] text-gray-600">{activeSection === "all" ? displayedFilms.length : currentSection?.films.length} films</span>
                    </div>
                    <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1 scrollbar-hide">
                        {(activeSection === "all" ? displayedFilms : currentSection?.films ?? []).map((film, idx) => {
                            const isActive = film.id === activeVideo.id;
                            return (
                                <button
                                    key={film.id}
                                    onClick={() => setActiveVideo(film)}
                                    className={cn(
                                        "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left group",
                                        isActive
                                            ? `border-red-500/30 bg-red-500/[0.06]`
                                            : "border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04]"
                                    )}
                                >
                                    <div className={cn(
                                        "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-[10px] font-bold",
                                        isActive ? "bg-red-600 text-white" : "bg-white/[0.06] text-gray-600"
                                    )}>
                                        {isActive ? <Play className="w-3 h-3 fill-white" /> : idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={cn("text-xs font-bold truncate", isActive ? "text-white" : "text-gray-300 group-hover:text-white")}>{film.title}</div>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[10px] text-gray-600">{film.year}</span>
                                            <span className="text-gray-700">•</span>
                                            <span className="text-[10px] text-gray-600">{film.duration}</span>
                                        </div>
                                    </div>
                                    {isActive && <ChevronRight className="w-3 h-3 text-red-400 flex-shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
