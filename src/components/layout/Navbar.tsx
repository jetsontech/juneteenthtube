"use client";

import { useState } from "react";
import { Menu, Search, Video, Bell, User, X, UploadCloud } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useVideo } from "@/context/VideoContext";

interface NavbarProps {
    onMenuClick: () => void;
}

const CATEGORIES = ["All", "Parade", "Music", "Food", "History", "Speeches", "Live", "2024"] as const;

export function Navbar({ onMenuClick }: NavbarProps) {
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const { uploadVideo } = useVideo();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const file = e.target.files?.[0];
            if (!file) return;

            // File selected, starting upload logic...
            // Note: S3/R2 supports large files via presigned URLs - no size limit needed

            setIsUploading(true);

            // Simulate delay to show UI state (Keep this for visual feedback even if fast)
            // await new Promise(resolve => setTimeout(resolve, 1000));

            // CRITICAL: Await the upload so errors are caught here!
            await uploadVideo(file, selectedCategory);

            setIsUploadOpen(false);
            setIsUploading(false);
            setSelectedCategory("All"); // Reset category after upload

            if (confirm("Upload Successful! Press OK to refresh and see your video.")) {
                window.location.reload();
            }

            // Explicit success feedback for mobile users who might miss the UI update
            // alert("Upload Success! Scroll to the top of the feed to see your video.");

        } catch (error: any) {
            console.error("Upload error:", error);

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

                                    // Trigger a custom event or relying on Next.js router might be better for Server Components, 
                                    // but for this Client Component setup, we need to communicate with the page.
                                    // stronger approach: Use Next.js router.push with scroll:false
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

                            <label
                                className={cn(
                                    "bg-j-red text-white font-bold px-6 py-2.5 rounded-sm transition-colors uppercase text-sm tracking-wide cursor-pointer inline-block",
                                    isUploading ? "opacity-50 cursor-wait" : "hover:bg-red-700"
                                )}
                            >
                                {isUploading ? "Uploading..." : "Select Files"}
                                <input
                                    type="file"
                                    accept="video/*"
                                    className="absolute opacity-0 w-1 h-1 overflow-hidden" // Mobile fix: hidden sometimes blocks events
                                    onChange={handleFileChange}
                                    disabled={isUploading}
                                    aria-label="Upload video file"
                                />
                            </label>

                            {isUploading && (
                                <div className="mt-4 text-center">
                                    <p className="text-j-gold animate-pulse text-sm font-semibold mb-1">
                                        Uploading to Cloud...
                                    </p>
                                    <p className="text-xs text-gray-400 max-w-[200px] mx-auto">
                                        Please keep this tab open.<br />Large videos may take several minutes.
                                    </p>
                                </div>
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
