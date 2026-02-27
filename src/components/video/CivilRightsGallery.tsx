"use client";

import React, { useState, useRef, useEffect } from "react";
import { Film, Play, Pause, Volume2, VolumeX, Maximize, Landmark, Scale, Megaphone, BookOpen, Users, ChevronRight, Radio } from "lucide-react";
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

export function CivilRightsGallery() {
    const [activeSection, setActiveSection] = useState<Section>(SECTIONS[0]);
    const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[number]>("All");

    const filteredFilms = selectedCategory === "All"
        ? activeSection.films
        : activeSection.films.filter(f => f.category === selectedCategory);

    return (
        <div className="flex flex-col space-y-12">
            {/* Header / Intro */}
            <div className="max-w-3xl">
                <h1 className="text-4xl sm:text-6xl font-black mb-4 tracking-tight">
                    Civil Rights <span className={cn("text-transparent bg-clip-text bg-gradient-to-r", activeSection.accentText.replace('text-', 'from-') + " to-white")}>Archive</span>
                </h1>
                <p className="text-lg text-gray-400 leading-relaxed">
                    A curated collection of historical documents, documentaries, and personal stories capturing the struggle and triumph of the Civil Rights movement.
                </p>
            </div>

            {/* Section Switcher */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {SECTIONS.map((section) => {
                    const Icon = section.icon;
                    const isActive = activeSection.id === section.id;
                    return (
                        <button
                            key={section.id}
                            onClick={() => {
                                setActiveSection(section);
                                setSelectedCategory("All");
                            }}
                            className={cn(
                                "relative flex flex-col items-start p-4 rounded-2xl border transition-all duration-500 overflow-hidden group",
                                isActive
                                    ? cn("bg-white/5 border-white/20 shadow-2xl", section.accentBorder.replace('/30', '/60'))
                                    : "bg-black/40 border-white/5 hover:border-white/10"
                            )}
                        >
                            {isActive && (
                                <div className={cn("absolute top-0 right-0 w-24 h-24 blur-3xl opacity-20", section.accentBg)} />
                            )}
                            <Icon className={cn("w-6 h-6 mb-3 transition-transform group-hover:scale-110", isActive ? section.accentText : "text-gray-500")} />
                            <span className={cn("text-xs font-black uppercase tracking-widest", isActive ? "text-white" : "text-gray-500")}>
                                {section.name}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                {/* Left: Active Section Info & Filter */}
                <div className="xl:col-span-4 space-y-8">
                    <div className={cn("inline-flex items-center space-x-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-tighter", activeSection.accentBorder, activeSection.accentText)}>
                        <activeSection.icon className="w-3 h-3" />
                        <span>Active Collection</span>
                    </div>

                    <div>
                        <h2 className="text-3xl font-black mb-4">{activeSection.name}</h2>
                        <p className="text-gray-400 leading-relaxed">
                            {activeSection.description}
                        </p>
                    </div>

                    {/* Local Filters */}
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                                    selectedCategory === cat
                                        ? cn(activeSection.accentBg, "text-white shadow-lg")
                                        : "bg-white/5 text-gray-400 hover:text-white"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Stats Card */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 uppercase font-bold tracking-widest">Total Films</span>
                            <span className="text-xl font-black">{activeSection.films.length}</span>
                        </div>
                        <div className="h-px bg-white/5" />
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 uppercase font-bold tracking-widest">Digital Restoration</span>
                            <span className="text-xs text-emerald-400 font-bold uppercase">100% Complete</span>
                        </div>
                    </div>
                </div>

                {/* Right: Video Grid */}
                <div className="xl:col-span-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredFilms.map((film) => (
                            <div key={film.id} className="group space-y-4">
                                <CivilRightsPlayer src={film.url} accent={activeSection.accent} />
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={cn("text-[10px] font-black uppercase tracking-widest", activeSection.accentText)}>
                                            {film.year} • {film.duration}
                                        </span>
                                        <span className="text-[10px] text-gray-500 font-mono uppercase">Reference: {film.id.slice(0, 8)}</span>
                                    </div>
                                    <h3 className="text-xl font-bold group-hover:text-white transition-colors leading-tight">
                                        {film.title}
                                    </h3>
                                    <p className="text-sm text-gray-400 line-clamp-2 mt-2 leading-relaxed">
                                        {film.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

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
                    <div className={cn("h-full rounded-full transition-all progress-fill", accentBar)} ref={(el) => { if (el) el.style.setProperty('--progress-percent', `${progress}%`); }} />
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="text-white hover:text-gray-300 transition" title={isPlaying ? "Pause" : "Play"} aria-label={isPlaying ? "Pause" : "Play"}>
                            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </button>
                        <button onClick={toggleMute} className="text-white hover:text-gray-300 transition" title={isMuted ? "Unmute" : "Mute"} aria-label={isMuted ? "Unmute" : "Mute"}>
                            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                        <span className="text-xs text-gray-400 font-mono">{currentTime} / {totalDuration}</span>
                    </div>
                    <button onClick={toggleFullscreen} className="text-white hover:text-gray-300 transition" title="Fullscreen" aria-label="Fullscreen">
                        <Maximize className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
