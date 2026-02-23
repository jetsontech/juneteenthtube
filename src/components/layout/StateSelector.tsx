"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, MapPin, Globe, Search, X } from "lucide-react";
import { US_STATES, USState } from "@/lib/states";
import { cn } from "@/lib/utils";

interface StateSelectorProps {
    selectedState: USState;
    onStateChange: (state: USState) => void;
}

export function StateSelector({ selectedState, onStateChange }: StateSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setSearchQuery("");
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus search input when dropdown opens
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    // Filter states based on search query
    const filteredStates = US_STATES.filter(
        (state) =>
            state.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            state.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSelect = (state: USState) => {
        onStateChange(state);
        setIsOpen(false);
        setSearchQuery("");
    };

    const isGlobal = selectedState.code === "GLOBAL";

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-3 h-10 rounded-full transition-all duration-200",
                    "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20",
                    "text-sm font-medium text-white",
                    isOpen && "bg-white/10 border-j-gold/50"
                )}
                aria-label="Select state"
                aria-expanded={isOpen ? "true" : "false"}
            >
                {isGlobal ? (
                    <Globe className="w-4 h-4 text-j-gold" />
                ) : (
                    <MapPin className="w-4 h-4 text-j-red" />
                )}
                <span className="hidden sm:inline max-w-[150px] truncate">
                    {selectedState.name}
                </span>
                <span className="sm:hidden">
                    {isGlobal ? "🌍" : selectedState.code}
                </span>
                <ChevronDown
                    className={cn(
                        "w-4 h-4 text-gray-400 transition-transform duration-200",
                        isOpen && "rotate-180"
                    )}
                />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl z-[70] animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-2 border-b border-white/10">
                        <div className="relative flex items-center">
                            <Search className="absolute left-3 w-4 h-4 text-gray-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                placeholder="Search states..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-8 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-j-gold/50 transition-colors"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2 p-1 hover:bg-white/10 rounded-full transition-colors"
                                    aria-label="Clear search"
                                >
                                    <X className="w-3 h-3 text-gray-400" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* States List */}
                    <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                        {filteredStates.length === 0 ? (
                            <div className="px-4 py-6 text-center text-gray-500 text-sm">
                                No states found
                            </div>
                        ) : (
                            filteredStates.map((state) => {
                                const isSelected = state.code === selectedState.code;
                                const stateIsGlobal = state.code === "GLOBAL";

                                return (
                                    <button
                                        key={state.code}
                                        onClick={() => handleSelect(state)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                                            "hover:bg-white/10",
                                            isSelected && "bg-j-gold/10 text-j-gold",
                                            !isSelected && "text-gray-200"
                                        )}
                                    >
                                        {stateIsGlobal ? (
                                            <Globe className={cn("w-4 h-4", isSelected ? "text-j-gold" : "text-gray-400")} />
                                        ) : (
                                            <MapPin className={cn("w-4 h-4", isSelected ? "text-j-gold" : "text-gray-400")} />
                                        )}
                                        <span className="flex-1 text-sm font-medium">{state.name}</span>
                                        <span className={cn("text-xs", isSelected ? "text-j-gold/70" : "text-gray-500")}>
                                            {state.code}
                                        </span>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-3 py-2 border-t border-white/10 bg-black/20">
                        <p className="text-xs text-gray-500 text-center">
                            Filter Juneteenth content by state
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
