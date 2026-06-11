"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, Database, BookOpen, Landmark, ExternalLink, Info, FileText, X, ArrowLeft, ShieldCheck, Globe, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function SadPaperIcon({ className = "w-6 h-6" }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn("transition-all duration-300", className)}
        >
            {/* Paper Outline */}
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            
            {/* Sad downturned curves for eyes */}
            <path d="M8 13 Q9 12.2 10 13" />
            <path d="M12 13 Q13 12.2 14 13" />
            
            {/* Sad downturned mouth curve */}
            <path d="M8.5 17.5 Q11 14.8 13.5 17.5" />
        </svg>
    );
}

interface ArchiveRecord {
    id: string;
    title: string;
    source: string;
    type: "Database" | "Census" | "Map" | "Manuscript";
    description: string;
    url: string;
    tags: string[];
}

const ARCHIVE_DATA: ArchiveRecord[] = [
    {
        id: "db-1",
        title: "The Freedmen's Bureau Search",
        source: "Smithsonian (SOVA)",
        type: "Database",
        description: "Search millions of records from the Bureau of Refugees, Freedmen, and Abandoned Lands (1865-1872).",
        url: "https://sova.si.edu/record/nmaahc.fb",
        tags: ["Genealogy", "Reconstruction", "Records"]
    },
    {
        id: "db-smith-oa",
        title: "Smithsonian Open Access",
        source: "Smithsonian Institution",
        type: "Manuscript",
        description: "Explore millions of 2D and 3D images and metadata from the Smithsonian's digital repository.",
        url: "https://www.si.edu/openaccess",
        tags: ["Open Access", "CC0", "Collections"]
    },
    {
        id: "db-2",
        title: "Slave Voyages Database",
        source: "Emory University / Harvard",
        type: "Database",
        description: "The definitive digital archive of the Trans-Atlantic and Intra-American slave trades.",
        url: "https://www.slavevoyages.org/",
        tags: ["Historical", "Global", "Data"]
    },
    {
        id: "db-3",
        title: "NMAAHC Digital Collection",
        source: "National Museum (NMAAHC)",
        type: "Manuscript",
        description: "Explore the digital archives of the National Museum of African American History and Culture.",
        url: "https://nmaahc.si.edu/explore/collection",
        tags: ["Museum", "Artifacts", "Art"]
    },
    {
        id: "db-4",
        title: "National Archives: African American History",
        source: "National Archives (NARA)",
        type: "Database",
        description: "Access primary source records, research guides, and finding aids related to African American history.",
        url: "https://www.archives.gov/research/african-americans",
        tags: ["Research", "Primary Sources", "NARA"]
    },
    {
        id: "db-5",
        title: "Library of Congress: Digital Collections",
        source: "Library of Congress",
        type: "Manuscript",
        description: "Explore the Library of Congress digital image archive — photographs, prints, and visual records documenting African American history and culture.",
        url: "https://www.loc.gov/pictures/",
        tags: ["Primary Sources", "Photographs", "LOC"]
    }
];

type LoadStrategy = "proxy" | "fallback";
type ConnectionStatus = "connecting" | "connected" | "fallback";

export function HeritagePortal() {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<string | null>(null);
    const [activeRecord, setActiveRecord] = useState<ArchiveRecord | null>(null);
    const [strategy, setStrategy] = useState<LoadStrategy>("proxy");
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const recordTypes = ["Database", "Census", "Map", "Manuscript"];

    const filteredRecords = ARCHIVE_DATA.filter(record => {
        const matchesSearch = record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            record.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            record.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesType = filterType ? record.type === filterType : true;
        return matchesSearch && matchesType;
    });

    // Clean up watchdog timer on unmount or activeRecord change
    useEffect(() => {
        return () => {
            if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
        };
    }, [activeRecord]);

    const handleOpenRecord = (record: ArchiveRecord) => {
        setActiveRecord(record);
        setStrategy("proxy");
        setConnectionStatus("connecting");

        // Clear any existing watchdog timer
        if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);

        // Start a 5-second watchdog timer. If the proxy doesn't signal load completion, transition to fallback.
        connectionTimeoutRef.current = setTimeout(() => {
            console.log("[HeritagePortal] Gateway watchdog triggered, loading fallback");
            setStrategy("fallback");
            setConnectionStatus("fallback");
        }, 5000);
    };

    const handleClose = () => {
        setActiveRecord(null);
        setStrategy("proxy");
        setConnectionStatus("connecting");
        if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
    };

    // Called when the proxy iframe loads. Since proxy is same-origin,
    // we can inspect the iframe content to check if the proxy succeeded.
    const handleProxyLoad = useCallback(() => {
        if (!iframeRef.current) return;
        
        try {
            const doc = iframeRef.current.contentDocument;
            if (!doc) {
                // Null contentDocument indicates a cross-origin redirect or browser block
                console.log("[HeritagePortal] Null contentDocument (cross-origin or blocked), switching to fallback");
                setStrategy("fallback");
                setConnectionStatus("fallback");
                if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
                return;
            }

            // Check for our error marker
            const htmlEl = doc.documentElement;
            if (htmlEl && htmlEl.getAttribute("data-proxy-error") === "true") {
                // Proxy failed — switch to fallback
                console.log("[HeritagePortal] Proxy blocked, switching to fallback");
                setStrategy("fallback");
                setConnectionStatus("fallback");
                if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
                return;
            }
            // Check if the page has meaningful content
            const bodyText = doc.body?.textContent?.trim() || "";
            if (bodyText.length < 50) {
                // Too little content — might be a blank/error page
                console.log("[HeritagePortal] Proxy returned minimal content, showing fallback");
                setStrategy("fallback");
                setConnectionStatus("fallback");
                if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
                return;
            }
            // Proxy loaded successfully — clear the watchdog timer!
            if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
            setConnectionStatus("connected");
        } catch (e) {
            // Security error or cross-origin block detected, transition to fallback
            console.log("[HeritagePortal] Same-origin access blocked or redirected, switching to fallback:", e);
            setStrategy("fallback");
            setConnectionStatus("fallback");
            if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
        }
    }, []);

    const getRecordIcon = (type: string, size: string = "w-6 h-6") => {
        switch (type) {
            case "Database": return <Database className={size} />;
            case "Census": return <FileText className={size} />;
            case "Map": return <Landmark className={size} />;
            case "Manuscript": return <BookOpen className={size} />;
            default: return <Database className={size} />;
        }
    };

    const getStatusLabel = () => {
        switch (connectionStatus) {
            case "connecting": return "Connecting via Secure Gateway...";
            case "connected": return "Connected";
            case "fallback": return "Direct Access Required";
        }
    };

    const getStatusColor = () => {
        switch (connectionStatus) {
            case "connecting":
                return "text-yellow-500";
            case "connected":
                return "text-green-500";
            case "fallback":
                return "text-orange-500";
        }
    };

    return (
        <div className="min-h-screen bg-transparent text-white p-4 sm:p-8 animate-in fade-in duration-700">
            {/* HEADER SECTION */}
            <div className="max-w-7xl mx-auto mb-6 sm:mb-16 pt-4 sm:pt-12 text-center">
                <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full glass border-yellow-600/30 mb-4 sm:mb-8">
                    <Database className="w-4 h-4 text-yellow-500" />
                    <span className="text-[10px] font-black tracking-[0.3em] text-yellow-500 uppercase leading-none">Global Heritage Records</span>
                </div>
                <h1 className="text-3xl sm:text-7xl font-serif italic mb-4 sm:mb-6 leading-tight">Archives & Databases</h1>
                <p className="max-w-3xl mx-auto text-gray-400 text-sm sm:text-lg leading-relaxed font-light px-2 sm:px-0">
                    Access the collective memory of the African Diaspora. We have indexed the most critical digital repositories for freedom studies and genealogical research.
                </p>
                        {/* SEARCH COMMAND CENTER */}
            <div className="max-w-5xl mx-auto mb-10 sm:mb-20">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600/20 to-red-600/20 rounded-3xl blur opacity-25 group-focus-within:opacity-100 transition duration-1000"></div>
                    <div className="relative bg-white/5 border border-white/10 rounded-3xl p-1.5 sm:p-2 flex items-center shadow-2xl backdrop-blur-xl">
                        <Search className="w-5 h-5 sm:w-6 sm:h-6 ml-3 sm:ml-6 text-gray-500 shrink-0" />
                        <input
                            type="text"
                            placeholder="Search databases, tags..."
                            className="flex-grow bg-transparent border-none py-3 px-3 sm:py-6 sm:px-6 text-base sm:text-xl outline-none placeholder:text-gray-600 font-light min-w-0"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="hidden md:flex items-center space-x-2 mr-4">
                            <span className="text-[10px] text-gray-500 font-bold bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">DB_V.02</span>
                        </div>
                    </div>
                </div>
            </div>

                {/* REFINEMENT CHIPS */}
                <div className="flex flex-row overflow-x-auto whitespace-nowrap scrollbar-none pb-2 sm:pb-0 justify-start sm:justify-center gap-3 mt-8 px-4 sm:px-0 -mx-4 sm:mx-0">
                    <button
                        onClick={() => setFilterType(null)}
                        className={cn(
                            "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex-shrink-0",
                            !filterType ? "bg-yellow-600 text-black" : "bg-white/5 text-gray-500 hover:bg-white/10"
                        )}
                    >
                        All Repositories
                    </button>
                    {recordTypes.map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={cn(
                                "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer flex-shrink-0",
                                filterType === type ? "bg-white text-black" : "bg-white/5 text-gray-500 hover:bg-white/10"
                            )}
                        >
                            {type}s
                        </button>
                    ))}
                </div>
            </div>

            {/* DATABASE GRID */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {filteredRecords.map((record) => (
                    <div
                        key={record.id}
                        className="group relative glass-panel rounded-[1.5rem] sm:rounded-[2.5rem] p-5 sm:p-10 hover:border-yellow-600/40 transition-all duration-500 flex flex-col h-full bg-gradient-to-br from-white/[0.05] to-transparent border-white/5 active:scale-[0.99]"
                    >
                        <div className="flex justify-between items-start mb-5 sm:mb-8">
                            <div className="p-2.5 sm:p-4 bg-yellow-600/10 rounded-xl sm:rounded-2xl border border-yellow-600/20 text-yellow-500 flex items-center space-x-1.5 sm:space-x-3">
                                {getRecordIcon(record.type, "w-4 h-4 sm:w-6 sm:h-6")}
                                <div className="w-px h-3.5 bg-yellow-600/20" />
                                <SadPaperIcon className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500/60" />
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-[9px] sm:text-[10px] font-black text-gray-500 uppercase tracking-widest">{record.source}</span>
                            </div>
                        </div>

                        <h3 className="text-xl sm:text-3xl font-serif italic mb-2 sm:mb-4 group-hover:text-yellow-500 transition-colors leading-tight">{record.title}</h3>
                        <p className="text-gray-400 text-xs sm:text-base font-light leading-relaxed mb-5 sm:mb-8 flex-grow">
                            {record.description}
                        </p>

                        <div className="flex flex-wrap gap-1.5 mb-5 sm:mb-10">
                            {record.tags.map(tag => (
                                <span key={tag} className="text-[8px] font-bold text-gray-500 uppercase tracking-widest border border-white/5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full whitespace-nowrap bg-white/[0.02]">
                                    #{tag}
                                </span>
                            ))}
                        </div>

                        <div className="mt-auto flex items-center justify-between gap-3 sm:gap-4">
                            <button
                                onClick={() => handleOpenRecord(record)}
                                className="flex items-center space-x-1.5 sm:space-x-3 bg-white text-black px-4 py-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-yellow-500 transition-colors shadow-xl group/btn shrink-0 cursor-pointer"
                            >
                                <SadPaperIcon className="w-3 h-3 sm:w-4 sm:h-4 text-black/60 group-hover/btn:text-black transition-colors" />
                                <span>Access Database</span>
                                <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                            <button className="p-2.5 sm:p-4 text-gray-500 hover:text-white transition-colors cursor-pointer" title="Record Details">
                                <Info className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>

                        {/* Gloss Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.01] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]" />
                    </div>
                ))}

                {filteredRecords.length === 0 && (
                    <div className="col-span-full py-32 text-center opacity-50">
                        <Search className="w-12 h-12 mx-auto mb-6 text-gray-700" />
                        <p className="text-2xl font-serif italic">No archival records found.</p>
                    </div>
                )}
            </div>

            {/* ═══════════════════════════════════════════════════════ */}
            {/* FULL-SCREEN RESEARCH VIEWER                           */}
            {/* Strategy: proxy → direct iframe → in-app fallback     */}
            {/* ═══════════════════════════════════════════════════════ */}
            {activeRecord && (
                <div className="fixed inset-0 z-[1000] bg-black animate-in fade-in duration-500 flex flex-col">
                    {/* Viewer Header */}
                    <div className="h-16 md:h-20 bg-[#0a0a0a] border-b border-white/5 flex items-center justify-between px-4 md:px-8 shrink-0">
                        <div className="flex items-center space-x-2 md:space-x-6 min-w-0 flex-1">
                            <button
                                onClick={handleClose}
                                className="p-2 md:p-3 hover:bg-white/10 rounded-full transition-colors text-yellow-500 shrink-0 cursor-pointer"
                                title="Return to Portal"
                            >
                                <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                            <div className="flex flex-col min-w-0 flex-1">
                                <div className="flex items-center space-x-1.5 md:space-x-2 overflow-hidden w-full">
                                    <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-gray-500 truncate flex-shrink-0">Heritage Gateway</span>
                                    <span className={cn("text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-colors truncate flex-shrink-0", getStatusColor())}>
                                        • {getStatusLabel()}
                                    </span>
                                    {connectionStatus === "connecting" && (
                                        <Loader2 className="w-3 h-3 text-yellow-500 animate-spin shrink-0 flex-shrink-0" />
                                    )}
                                </div>
                                <h2 className="text-xs sm:text-sm md:text-xl font-serif italic text-white truncate w-full">
                                    {activeRecord.title}
                                </h2>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 md:space-x-4 shrink-0">
                            {strategy === "fallback" && (
                                <button
                                    onClick={() => {
                                        setStrategy("proxy");
                                        setConnectionStatus("connecting");
                                    }}
                                    className="hidden md:flex px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all items-center space-x-2 text-[10px] font-black uppercase tracking-widest"
                                >
                                    <span>Retry</span>
                                </button>
                            )}
                            <button
                                onClick={handleClose}
                                className="p-2 md:p-3 hover:bg-white/10 rounded-full transition-colors"
                                title="Exit"
                            >
                                <X className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        </div>
                    </div>

                    {/* CONTENT AREA */}
                    <div className={cn(
                        "flex-grow relative bg-[#0d0d0d]",
                        strategy === "fallback" ? "overflow-y-auto" : "overflow-hidden"
                    )}>
                        {/* Strategy 1: Proxy iframe (same-origin, can detect errors) */}
                        {strategy === "proxy" && (
                            <iframe
                                ref={iframeRef}
                                src={`/api/archive-proxy?url=${encodeURIComponent(activeRecord.url)}`}
                                className={cn(
                                    "w-full h-full border-none transition-opacity duration-700",
                                    connectionStatus === "connecting" ? "opacity-0" : "opacity-100"
                                )}
                                title={activeRecord.title}
                                onLoad={handleProxyLoad}
                            />
                        )}


                        {/* Strategy 3: In-app fallback (keeps user on platform) */}
                        {strategy === "fallback" && (
                            <div className="w-full min-h-full flex flex-col items-center justify-start md:justify-center text-center px-4 sm:px-8 py-8 md:py-0 animate-in fade-in duration-500">
                                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-yellow-600/5 via-transparent to-transparent opacity-50 pointer-events-none" />
                                <div className="relative z-10 max-w-xl w-full">
                                    <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-8 rounded-2xl sm:rounded-3xl bg-yellow-600/10 border border-yellow-600/20 flex items-center justify-center text-yellow-500 shadow-lg shadow-yellow-600/5 shrink-0">
                                        <SadPaperIcon className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.4)]" />
                                    </div>
                                    <h3 className="text-xl sm:text-3xl md:text-4xl font-serif italic text-white mb-2 sm:mb-4 px-2">{activeRecord.title}</h3>
                                    <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-4 px-4 sm:px-0">
                                        {activeRecord.description}
                                    </p>
                                    <p className="text-gray-500 text-sm leading-relaxed mb-8">
                                        <strong className="text-gray-300">{activeRecord.source}</strong> uses institutional security that prevents inline embedding. You can access this archive below while staying connected to CultureQuest.
                                    </p>

                                    {/* Tags */}
                                    <div className="flex flex-wrap justify-center gap-2 mb-10">
                                        {activeRecord.tags.map(tag => (
                                            <span key={tag} className="text-[9px] font-bold text-gray-400 uppercase tracking-widest border border-white/10 px-4 py-1.5 rounded-full bg-white/5">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Connection Info */}
                                    <div className="bg-white/5 border border-white/5 rounded-2xl p-5 mb-8 text-left">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <Globe className="w-4 h-4 text-gray-500" />
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Secure Endpoint</span>
                                        </div>
                                        <p className="text-xs text-gray-300 font-mono break-all">{activeRecord.url}</p>
                                    </div>

                                    {/* Action button - opens in popup window (stays on platform) */}
                                    <button
                                        onClick={() => {
                                            const w = Math.min(window.innerWidth * 0.9, 1200);
                                            const h = Math.min(window.innerHeight * 0.9, 800);
                                            const left = (window.innerWidth - w) / 2;
                                            const top = (window.innerHeight - h) / 2;
                                            window.open(
                                                activeRecord.url,
                                                'heritage_portal',
                                                `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no,location=yes,status=no`
                                            );
                                        }}
                                        className="inline-flex items-center justify-center space-x-2 sm:space-x-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-black px-4 py-4 sm:px-10 sm:py-5 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:from-yellow-500 hover:to-yellow-400 transition-all shadow-2xl shadow-yellow-600/20 w-full sm:w-auto max-w-sm cursor-pointer"
                                    >
                                        <span>Open in CultureQuest Window</span>
                                        <ExternalLink className="w-4 h-4" />
                                    </button>
                                    <p className="mt-4 text-[9px] sm:text-[10px] text-gray-600 uppercase tracking-widest px-4">
                                        Opens in a popup window • CultureQuest stays active
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* LOADING OVERLAY */}
                        {connectionStatus === "connecting" && strategy !== "fallback" && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0a0a] z-20">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-600/10 via-transparent to-transparent opacity-50 animate-pulse" />
                                <div className="relative">
                                    <div className="w-32 h-32 border-2 border-yellow-600/20 border-t-yellow-600 rounded-full animate-spin mb-12" />
                                    <Landmark className="w-12 h-12 text-yellow-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                </div>
                                <h3 className="text-2xl font-serif italic text-white animate-pulse tracking-widest">
                                    Connecting to Archive...
                                </h3>
                                <p className="mt-4 text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">
                                    Routing Through Heritage Gateway
                                </p>
                                <div className="mt-8 flex items-center space-x-2">
                                    <div className="w-2 h-2 rounded-full bg-yellow-600 animate-pulse" />
                                    <div className="w-2 h-2 rounded-full bg-yellow-600 animate-pulse" style={{ animationDelay: "0.2s" }} />
                                    <div className="w-2 h-2 rounded-full bg-yellow-600 animate-pulse" style={{ animationDelay: "0.4s" }} />
                                </div>
                            </div>
                        )}

                        {/* Decorative Background */}
                        <Database className="absolute -bottom-24 -right-24 w-96 h-96 text-white/[0.02] -rotate-12 pointer-events-none" />
                    </div>

                    {/* Footer Status Bar */}
                    <div className="h-10 md:h-12 bg-black border-t border-white/5 flex items-center justify-between px-4 md:px-8 shrink-0">
                        <div className="flex items-center space-x-3 md:space-x-4">
                            <span className="text-[8px] md:text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">
                                {activeRecord.source}
                            </span>
                            <div className={cn(
                                "w-1.5 h-1.5 rounded-full transition-colors",
                                connectionStatus === "connected"
                                    ? "bg-green-500/70 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                                    : connectionStatus === "fallback"
                                        ? "bg-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.3)]"
                                        : "bg-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.5)] animate-pulse"
                            )}></div>
                            <span className="text-[8px] md:text-[9px] text-gray-600 uppercase tracking-widest">
                                {strategy === "proxy" ? "Gateway" : "Popup"}
                            </span>
                        </div>
                        <div className="flex items-center space-x-2 text-[8px] md:text-[9px] font-bold text-gray-600 uppercase tracking-widest">
                            <ShieldCheck className="w-3 h-3 text-yellow-600" />
                            <span className="hidden md:inline">CultureQuest Heritage Gateway v.04</span>
                            <span className="md:hidden">Gateway v.04</span>
                        </div>
                    </div>
                </div>
            )}

            {/* FOOTER NOTICE */}
            <div className="max-w-5xl mx-auto mt-32 p-12 glass rounded-[3rem] border-white/5 text-center">
                <Landmark className="w-8 h-8 text-yellow-600/50 mx-auto mb-6" />
                <h4 className="text-xl font-serif italic mb-4">Institutional Partners</h4>
                <p className="text-gray-500 text-sm max-w-xl mx-auto leading-relaxed">
                    The Heritage Research Portal acts as a gateway to institutional databases. We are continuously indexing new records to support community scholarship and genealogy.
                </p>
            </div>
        </div>
    );
}
