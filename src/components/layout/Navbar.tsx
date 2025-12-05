"use client";

import { useState, useRef } from "react";
import { Menu, Search, Video, Bell, User, X, UploadCloud } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useVideo } from "@/context/VideoContext";

interface NavbarProps {
    onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const { uploadVideo } = useVideo();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            uploadVideo(file);
            setIsUploadOpen(false);
            alert("Video uploaded successfully! It may take a moment to appear in your feed.");
        }
    };

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 h-16 bg-j-black/80 backdrop-blur-md border-b border-white/10 z-50 flex items-center px-4 justify-between">
                {/* Left Section */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onMenuClick}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                        aria-label="Toggle menu"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <Link href="/" className="flex items-center gap-1">
                        <div className="w-8 h-8 bg-j-red rounded-lg flex items-center justify-center text-white font-bold">J</div>
                        <span className="text-xl font-bold tracking-tight text-white hidden sm:block">
                            Juneteenth<span className="text-j-red">Tube</span>
                        </span>
                    </Link>
                </div>

                {/* Middle Section - Search */}
                <div className="hidden md:flex flex-1 max-w-2xl mx-4">
                    <div className="flex w-full">
                        <div className="flex-1 flex items-center pl-4 bg-white/5 border border-white/10 rounded-l-full focus-within:border-j-gold/50 transition-colors">
                            <Search className="w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search Juneteenth Atlanta..."
                                className="w-full bg-transparent border-none outline-none px-4 py-2 text-white placeholder-gray-400"
                                aria-label="Search"
                            />
                        </div>
                        <button
                            className="px-6 bg-white/10 border border-l-0 border-white/10 rounded-r-full hover:bg-white/20 transition-colors"
                            aria-label="Search button"
                        >
                            <Search className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <button
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white hidden sm:block"
                        aria-label="Upload video"
                        onClick={() => setIsUploadOpen(true)}
                    >
                        <Video className="w-6 h-6" />
                    </button>
                    <button
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                        aria-label="Notifications"
                    >
                        <Bell className="w-6 h-6" />
                    </button>
                    <button
                        className="w-8 h-8 bg-j-green rounded-full flex items-center justify-center text-white font-bold overflow-hidden border border-white/20"
                        aria-label="User profile"
                    >
                        <User className="w-5 h-5" />
                    </button>
                </div>
            </nav>

            {/* Upload Modal */}
            {isUploadOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h2 className="text-xl font-bold text-white">Upload videos</h2>
                            <button
                                onClick={() => setIsUploadOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                                aria-label="Close upload modal"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-12 flex flex-col items-center justify-center text-center gap-6">
                            <div className="w-32 h-32 bg-black/40 rounded-full flex items-center justify-center mb-4">
                                <UploadCloud className="w-16 h-16 text-gray-500" />
                            </div>
                            <div>
                                <p className="text-lg text-white mb-2">Drag and drop video files to upload</p>
                                <p className="text-sm text-gray-400">Your videos will be private until you publish them.</p>
                            </div>

                            <input
                                type="file"
                                accept="video/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                aria-label="Upload video file"
                            />

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-j-red text-white font-bold px-6 py-2.5 rounded-sm hover:bg-red-700 transition-colors uppercase text-sm tracking-wide"
                            >
                                Select Files
                            </button>
                        </div>

                        <div className="p-4 border-t border-white/10 bg-black/20 text-center text-xs text-gray-500 rounded-b-2xl">
                            By submitting your videos to Juneteenth Tube, you acknowledge that you agree to Juneteenth Atlanta's Terms of Service.
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
