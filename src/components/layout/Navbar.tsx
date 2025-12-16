"use client";

import { useState, useRef } from "react";
import { Menu, Search, Video, Bell, User, X, UploadCloud, AlertCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useVideo } from "@/context/VideoContext";

interface NavbarProps {
    onMenuClick: () => void;
}

const CATEGORIES = ["All", "Parade", "Music", "Food", "History", "Speeches", "Live", "2024"] as const;

export function Navbar({ onMenuClick }: NavbarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const { uploadVideo, isUploading, uploadProgress, cancelUpload } = useVideo();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        // Clear input value to allow re-selection, but keep reference to file
        const input = e.target;
        const file = input.files?.[0];
        // Reset immediately so the user can select the same file again if they want
        // (Wait a tick might be safer, but this usually works if we grabbed the file ref)
        // input.value = ""; // Doing this at the end or validation might be better

        if (!file) {
            alert("Caught input change, but NO file found in target.files"); // Debug
            return;
        }

        alert(`Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)\nStarting Upload...`);

        try {
            // CRITICAL: Await the upload so errors are caught here!
            await uploadVideo(file, selectedCategory);

            setIsUploadOpen(false);
            setSelectedCategory("All"); // Reset category after upload
            input.value = "";
            if (confirm("Upload Successful! Press OK to refresh and see your video.")) {
                window.location.reload();
            }

        } catch (error: any) {
            input.value = "";
            console.error("Upload error:", error);
            // Don't alert if it was just cancelled
            if (error?.message === "Upload cancelled") return;

            let errorMessage = "Unknown error occurred";
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (typeof error === "object") {
                errorMessage = JSON.stringify(error);
            }

            // Detailed error for user debugging
            alert(`Upload Failed: ${errorMessage}\n\nCheck the Console (F12) for more details.`);
        }
    };

    const handleClose = () => {
        if (isUploading) {
            if (confirm("Upload in progress. Are you sure you want to cancel?")) {
                cancelUpload();
                setIsUploadOpen(false);
            }
        } else {
            setIsUploadOpen(false);
        }
    };

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 h-14 bg-[#0f0f0f]/90 backdrop-blur-sm z-50 flex items-center px-4 justify-between">
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
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            // Optional: strict form submission if needed, but handled by Enter key usually
                        }}
                        className="flex w-full"
                    >
                        <div className="flex-1 flex items-center pl-4 bg-white/5 border border-white/10 rounded-l-full focus-within:border-j-gold/50 transition-colors">
                            <Search className="w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search Juneteenth Atlanta..."
                                className="w-full bg-transparent border-none outline-none px-4 py-2 text-white placeholder-gray-400"
                                aria-label="Search"
                                onChange={(e) => {
                                    // Simple debounce could go here, but direct update for now
                                    const params = new URLSearchParams(window.location.search);
                                    if (e.target.value) {
                                        params.set('q', e.target.value);
                                    } else {
                                        params.delete('q');
                                    }
                                    // Use window.history to update URL without full reload
                                    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        const val = (e.target as HTMLInputElement).value;
                                        window.location.href = `/?q=${encodeURIComponent(val)}`;
                                    }
                                }}
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-6 bg-white/10 border border-l-0 border-white/10 rounded-r-full hover:bg-white/20 transition-colors"
                            aria-label="Search button"
                        >
                            <Search className="w-5 h-5 text-white" />
                        </button>
                    </form>
                </div>

                {/* Right Section */}
                <div className="flex items-center gap-2 sm:gap-4">
                    <button
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
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
                    <Link
                        href="/settings"
                        className="w-8 h-8 bg-j-green rounded-full flex items-center justify-center text-white font-bold overflow-hidden border border-white/20 hover:scale-105 transition-transform"
                        aria-label="User settings"
                    >
                        <User className="w-5 h-5" />
                    </Link>
                </div>
            </nav>

            {/* Upload Modal */}
            {isUploadOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <h2 className="text-xl font-bold text-white">Upload videos</h2>
                            <button
                                onClick={handleClose}
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

                            {!isUploading ? (
                                <div>
                                    <p className="text-lg text-white mb-2">Drag and drop video files to upload</p>
                                    <p className="text-sm text-gray-400">Your videos will be private until you publish them.</p>
                                </div>
                            ) : (
                                <div className="w-full max-w-sm space-y-4">
                                    <div className="flex justify-between text-sm text-white mb-1">
                                        <span>Uploading...</span>
                                        <span className="font-mono">{uploadProgress}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-j-red transition-all duration-300 ease-out"
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400">
                                        Please keep this tab open. Large videos may take time.
                                    </p>
                                </div>
                            )}

                            {/* Category Selector */}
                            <div className="w-full max-w-xs">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Category
                                </label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-j-gold/50 focus:border-j-gold/50 transition-all"
                                    disabled={isUploading}
                                    aria-label="Select video category"
                                >
                                    {CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat} className="bg-gray-900 text-white">
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {!isUploading ? (
                                <>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="bg-j-red text-white font-bold px-6 py-2.5 rounded-sm transition-colors uppercase text-sm tracking-wide cursor-pointer hover:bg-red-700"
                                    >
                                        Select Files
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="video/*"
                                        className="absolute w-0 h-0 opacity-0 overflow-hidden"
                                        onChange={handleFileChange}
                                        aria-label="Upload video file"
                                    />
                                </>
                            ) : (
                                <button
                                    onClick={cancelUpload}
                                    className="flex items-center gap-2 px-6 py-2.5 border border-red-500/50 text-red-500 rounded-lg hover:bg-red-500/10 transition-colors font-medium text-sm"
                                >
                                    <X className="w-4 h-4" /> Cancel Upload
                                </button>
                            )}
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
