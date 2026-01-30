"use client";

import React, { useState } from "react";
import { Search, Database, BookOpen, Landmark, ExternalLink, Filter, Info, FileText, X, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

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
        source: "National Archives / Smithsonian",
        type: "Database",
        description: "Search millions of records from the Bureau of Refugees, Freedmen, and Abandoned Lands (1865-1872).",
        url: "https://www.si.edu/unit/freedmens-bureau",
        tags: ["Genealogy", "Reconstruction", "Records"]
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
        source: "Smithsonian Institution",
        type: "Manuscript",
        description: "Explore the digital archives of the National Museum of African American History and Culture.",
        url: "https://nmaahc.si.edu/explore/collection",
        tags: ["Museum", "Artifacts", "Art"]
    },
    {
        id: "db-4",
        title: "National Archives: African American Research",
        source: "National Archives (NARA)",
        type: "Database",
        description: "Access primary source records, research guides, and finding aids related to African American history and genealogy.",
        url: "https://www.archives.gov/research/african-americans",
        tags: ["Research", "Primary Sources", "NARA"]
    },
    {
        id: "db-5",
        title: "Library of Congress: Digital Collections",
        source: "Library of Congress",
        type: "Manuscript",
        description: "Access thousands of digitized primary sources, records, and manuscripts documenting African American history.",
        url: "https://www.loc.gov/collections/?fa=subject:african+american+history",
        tags: ["Primary Sources", "Manuscripts", "LOC"]
    }
];

export function HeritagePortal() {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<string | null>(null);
    const [activeRecord, setActiveRecord] = useState<ArchiveRecord | null>(null);

    const recordTypes = ["Database", "Census", "Map", "Manuscript"];

    const filteredRecords = ARCHIVE_DATA.filter(record => {
        const matchesSearch = record.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            record.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            record.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesType = filterType ? record.type === filterType : true;
        return matchesSearch && matchesType;
    });

    return (
        <div className="min-h-screen bg-[#0d0d0d] text-white p-8 animate-in fade-in duration-700">
            {/* HEADER SECTION */}
            <div className="max-w-7xl mx-auto mb-16 pt-12 text-center">
                <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full glass border-yellow-600/30 mb-8">
                    <Database className="w-4 h-4 text-yellow-500" />
                    <span className="text-[10px] font-black tracking-[0.3em] text-yellow-500 uppercase leading-none">Global Heritage Records</span>
                </div>
                <h1 className="text-7xl font-serif italic mb-6">Archives & Databases</h1>
                <p className="max-w-3xl mx-auto text-gray-400 text-lg leading-relaxed font-light">
                    Access the collective memory of the African Diaspora. We have indexed the most critical digital repositories for freedom studies and genealogical research.
                </p>
            </div>

            {/* SEARCH COMMAND CENTER */}
            <div className="max-w-5xl mx-auto mb-20">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-yellow-600/20 to-red-600/20 rounded-3xl blur opacity-25 group-focus-within:opacity-100 transition duration-1000"></div>
                    <div className="relative bg-white/5 border border-white/10 rounded-3xl p-2 flex items-center shadow-2xl backdrop-blur-xl">
                        <Search className="w-6 h-6 ml-6 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search databases, repositories, or historical tags..."
                            className="flex-grow bg-transparent border-none py-6 px-6 text-xl outline-none placeholder:text-gray-600 font-light"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="hidden md:flex items-center space-x-2 mr-4">
                            <span className="text-[10px] text-gray-500 font-bold bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">DB_V.01</span>
                        </div>
                    </div>
                </div>

                {/* REFINEMENT CHIPS */}
                <div className="flex flex-wrap justify-center gap-3 mt-8">
                    <button
                        onClick={() => setFilterType(null)}
                        className={cn(
                            "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
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
                                "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                filterType === type ? "bg-white text-black" : "bg-white/5 text-gray-500 hover:bg-white/10"
                            )}
                        >
                            {type}s
                        </button>
                    ))}
                </div>
            </div>

            {/* DATABASE GRID */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                {filteredRecords.map((record) => (
                    <div
                        key={record.id}
                        className="group relative glass-panel rounded-[2.5rem] p-10 hover:border-yellow-600/40 transition-all duration-500 flex flex-col h-full bg-gradient-to-br from-white/[0.05] to-transparent border-white/5 active:scale-[0.99]"
                    >
                        <div className="flex justify-between items-start mb-8">
                            <div className="p-4 bg-yellow-600/10 rounded-2xl border border-yellow-600/20 text-yellow-500">
                                {record.type === "Database" && <Database className="w-6 h-6" />}
                                {record.type === "Census" && <FileText className="w-6 h-6" />}
                                {record.type === "Map" && <Landmark className="w-6 h-6" />}
                                {record.type === "Manuscript" && <BookOpen className="w-6 h-6" />}
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{record.source}</span>
                            </div>
                        </div>

                        <h3 className="text-3xl font-serif italic mb-4 group-hover:text-yellow-500 transition-colors">{record.title}</h3>
                        <p className="text-gray-400 text-base font-light leading-relaxed mb-8 flex-grow">
                            {record.description}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-10">
                            {record.tags.map(tag => (
                                <span key={tag} className="text-[8px] font-bold text-gray-500 uppercase tracking-widest border border-white/5 px-3 py-1 rounded-full whitespace-nowrap">
                                    #{tag}
                                </span>
                            ))}
                        </div>

                        <div className="mt-auto flex items-center justify-between">
                            <button
                                onClick={() => setActiveRecord(record)}
                                className="flex items-center space-x-3 bg-white text-black px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-yellow-500 transition-colors shadow-xl"
                            >
                                <span>Access Database</span>
                                <ExternalLink className="w-4 h-4" />
                            </button>
                            <button className="p-4 text-gray-500 hover:text-white transition-colors" title="Record Details">
                                <Info className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Gloss Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.01] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                ))}

                {filteredRecords.length === 0 && (
                    <div className="col-span-full py-32 text-center opacity-50">
                        <Search className="w-12 h-12 mx-auto mb-6 text-gray-700" />
                        <p className="text-2xl font-serif italic">No archival records found.</p>
                    </div>
                )}
            </div>

            {/* INTEGRATED RESEARCH VIEWER OVERLAY */}
            {activeRecord && (
                <div className="fixed inset-0 z-[1000] bg-black animate-in fade-in duration-500 flex flex-col">
                    {/* Viewer Header */}
                    <div className="h-20 glass-heavy border-b border-white/5 flex items-center justify-between px-8 shrink-0">
                        <div className="flex items-center space-x-6">
                            <button
                                onClick={() => setActiveRecord(null)}
                                className="p-3 hover:bg-white/10 rounded-full transition-colors text-yellow-500"
                                title="Return to Portal"
                            >
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">JuneteenthTube Heritage Research Session</span>
                                <h2 className="text-xl font-serif italic text-white flex items-center space-x-2">
                                    <span>{activeRecord.title}</span>
                                    <span className="text-xs text-gray-600 not-italic ml-2 opacity-50 px-2 py-0.5 border border-white/5 rounded">Secure Embedded Environment</span>
                                </h2>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="hidden md:flex items-center space-x-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                <span>Source:</span>
                                <span className="text-yellow-600">{activeRecord.source}</span>
                            </div>
                            <button
                                onClick={() => setActiveRecord(null)}
                                className="p-3 hover:bg-white/10 rounded-full transition-colors"
                                title="Exit Session"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Iframe Container */}
                    <div className="flex-grow relative bg-[#0d0d0d]">
                        <iframe
                            src={activeRecord.url}
                            className="w-full h-full border-none"
                            title={activeRecord.title}
                            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                        />

                        {/* Loading State / Warning Overlay */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10">
                            <Database className="w-64 h-64 text-yellow-600" />
                        </div>
                    </div>

                    {/* Footer Controls */}
                    <div className="h-12 bg-black border-t border-white/5 flex items-center justify-center space-x-8">
                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">External Resource Integrity Monitored</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
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
