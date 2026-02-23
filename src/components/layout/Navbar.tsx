"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Menu, Search, Video, Bell, User, X, UploadCloud } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useVideo } from "@/context/VideoContext";
import { useAuth } from "@/context/AuthContext";
import { useStateFilter } from "@/context/StateContext";
import { AuthModal } from "../auth/AuthModal";
import { StateSelector } from "./StateSelector";
import { US_STATES, DEFAULT_STATE, USState } from "@/lib/states";

interface NavbarProps {
    onMenuClick: () => void;
}

const CATEGORIES = ["All", "Parade", "Music", "Food", "History", "Speeches", "Live", "2024", "Photos"] as const;

export function Navbar({ onMenuClick }: NavbarProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [selectedUploadState, setSelectedUploadState] = useState<USState>(DEFAULT_STATE);
    const { uploadVideo, uploadPhoto, isUploading, uploadProgress, cancelUpload } = useVideo();
    const { user, signOut } = useAuth();
    const { selectedState, setSelectedState } = useStateFilter();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);

    // Multi-step Upload State
    const [uploadStep, setUploadStep] = useState<1 | 2>(1);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleOpenAuth = (mode: 'login' | 'signup') => {
        setAuthMode(mode);
        setIsAuthModalOpen(true);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        const file = input.files?.[0];
        if (!file) return;

        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (!isImage && !isVideo) {
            alert("Please select an image or video file.");
            input.value = "";
            return;
        }

        if (isVideo) {
            // For videos, go to step 2 to select metadata and thumbnail
            setSelectedFile(file);
            setUploadStep(2);
        } else if (isImage) {
            // Standard photo upload for direct image selection in Step 1
            try {
                await uploadPhoto(file, selectedCategory, selectedUploadState.code);
                setIsUploadOpen(false);
                setSelectedCategory("All");
                setSelectedUploadState(DEFAULT_STATE);
                input.value = "";
                if (confirm(`Upload Successful! Press OK to refresh and see your photo.`)) {
                    window.location.reload();
                }
            } catch (err) {
                console.error("Photo upload failed:", err);
                alert("Photo upload failed");
            }
        }
    };

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith("image/")) {
            setSelectedThumbnail(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setThumbnailPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleStartUpload = async () => {
        if (!selectedFile) return;

        try {
            await uploadVideo(selectedFile, selectedThumbnail, selectedCategory, selectedUploadState.code);
            setIsUploadOpen(false);
            setUploadStep(1);
            setSelectedFile(null);
            setSelectedThumbnail(null);
            setThumbnailPreview(null);
            setSelectedCategory("All");
            setSelectedUploadState(DEFAULT_STATE);

            if (confirm(`Upload Successful! Your video is being processed. Press OK to refresh.`)) {
                window.location.reload();
            }
        } catch (error: any) {
            console.error("Upload error:", error);
            if (error.message !== "Upload cancelled") {
                alert(`Upload Failed: ${error.message}`);
            }
        }
    };


    const handleClose = () => {
        if (isUploading) {
            if (confirm("Upload in progress. Are you sure you want to cancel?")) {
                cancelUpload();
                setIsUploadOpen(false);
                setUploadStep(1);
            }
        } else {
            setIsUploadOpen(false);
            setUploadStep(1);
            setSelectedFile(null);
            setSelectedThumbnail(null);
            setThumbnailPreview(null);
        }
    };


    return (
        <>
            <nav
                className="fixed top-0 left-0 right-0 z-50 flex flex-col glass-heavy transition-all duration-300 navbar-layout"
            >
                {/* Navbar Content - Exactly 3.5rem (h-14) */}
                <div className="h-14 w-full flex items-center justify-between pl-4 pr-4 sm:pl-6 sm:pr-8">
                    {/* Left Section */}
                    <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                        <button
                            onClick={onMenuClick}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white mt-1"
                            aria-label="Toggle menu"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <Link href="/" className="flex items-center gap-2 group">
                            {/* Desktop Logo */}
                            <div className="relative h-9 w-48 hidden sm:block">
                                <Image
                                    src="/logo.svg"
                                    alt="JuneteenthTube"
                                    fill
                                    className="object-contain object-left drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                                    priority
                                />
                            </div>
                            {/* Mobile Logo (Icon Only or Compact) */}
                            <div className="relative h-8 w-44 sm:hidden">
                                <Image
                                    src="/logo.svg"
                                    alt="JuneteenthTube"
                                    fill
                                    className="object-contain object-left"
                                    priority
                                />
                            </div>
                        </Link>
                        <div className="mt-1">
                            <StateSelector
                                selectedState={selectedState}
                                onStateChange={setSelectedState}
                            />
                        </div>
                    </div>

                    {/* Middle Section - Search */}
                    <div className="hidden md:flex flex-1 max-w-xl mx-4">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                            }}
                            className="flex w-full"
                        >
                            <div className="flex-1 flex items-center h-10 pl-4 glass rounded-l-full focus-within:border-j-gold/50 transition-colors">
                                <Search className="w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search JuneteenthTube..."
                                    className="w-full bg-transparent border-none outline-none px-4 py-2 text-white placeholder-gray-400"
                                    aria-label="Search"
                                    onChange={(e) => {
                                        const params = new URLSearchParams(window.location.search);
                                        if (e.target.value) {
                                            params.set('q', e.target.value);
                                        } else {
                                            params.delete('q');
                                        }
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
                                className="px-6 h-10 bg-white/10 border border-l-0 border-white/10 rounded-r-full hover:bg-white/20 transition-colors flex items-center justify-center"
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
                            onClick={() => {
                                if (!user) {
                                    handleOpenAuth('login');
                                } else {
                                    setIsUploadOpen(true);
                                }
                            }}
                        >
                            <Video className="w-6 h-6" />
                        </button>
                        {!user ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleOpenAuth('login')}
                                    className="px-4 h-10 flex items-center text-sm font-medium text-j-gold hover:bg-j-gold/10 rounded-full border border-j-gold/50 transition-colors"
                                >
                                    Sign In
                                </button>
                            </div>
                        ) : (
                            <>
                                <button
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
                                    aria-label="Notifications"
                                >
                                    <Bell className="w-6 h-6" />
                                </button>
                                <div className="relative" ref={userMenuRef}>
                                    <button
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        className="w-8 h-8 bg-j-green rounded-full flex items-center justify-center text-white font-bold overflow-hidden border border-white/20 hover:scale-105 transition-transform"
                                        aria-label="User menu"
                                    >
                                        {user.email?.charAt(0).toUpperCase()}
                                    </button>

                                    {isUserMenuOpen && (
                                        <div className="absolute right-0 top-full mt-2 w-64 glass-heavy rounded-xl shadow-2xl py-2 z-[70] animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="px-4 py-3 border-b border-white/10 flex items-center gap-3">
                                                <div className="w-10 h-10 bg-j-green rounded-full flex items-center justify-center text-white font-bold">
                                                    {user.email?.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-white truncate">{user.user_metadata?.full_name || 'User'}</p>
                                                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                                </div>
                                            </div>
                                            <div className="py-2">
                                                <Link href="/studio" className="flex items-center gap-3 px-4 py-2 hover:bg-white/10 transition-colors text-sm text-gray-200">
                                                    <Video className="w-4 h-4" /> Juneteenth Studio
                                                </Link>
                                                <Link href="/settings" className="flex items-center gap-3 px-4 py-2 hover:bg-white/10 transition-colors text-sm text-gray-200">
                                                    <User className="w-4 h-4" /> Settings
                                                </Link>
                                            </div>
                                            <div className="border-t border-white/10 pt-2">
                                                <button
                                                    onClick={() => {
                                                        signOut();
                                                        setIsUserMenuOpen(false);
                                                    }}
                                                    className="w-full text-left flex items-center gap-3 px-4 py-2 hover:bg-white/10 transition-colors text-sm text-red-400"
                                                >
                                                    Sign Out
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </nav>


            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                initialMode={authMode}
            />

            {/* Upload Modal */}
            {
                isUploadOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <div className="bg-[#1e1e1e] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200">
                            <div className="flex items-center justify-between p-4 border-b border-white/10">
                                <h2 className="text-xl font-bold text-white">Upload content</h2>
                                <button
                                    onClick={handleClose}
                                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                                    aria-label="Close upload modal"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-8 flex flex-col items-center justify-center text-center gap-6">
                                {uploadStep === 1 && !isUploading ? (
                                    <>
                                        <div className="w-32 h-32 bg-black/40 rounded-full flex items-center justify-center mb-4">
                                            <UploadCloud className="w-16 h-16 text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="text-lg text-white mb-2">Drag and drop files to upload</p>
                                            <p className="text-sm text-gray-400">Photos and videos will be private until you publish them.</p>
                                        </div>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="bg-j-red text-white font-bold px-6 py-2.5 rounded-sm transition-colors uppercase text-sm tracking-wide cursor-pointer hover:bg-red-700 mt-4"
                                        >
                                            Select Files
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*,video/*"
                                            className="absolute w-0 h-0 opacity-0 overflow-hidden"
                                            onChange={handleFileChange}
                                        />
                                    </>
                                ) : uploadStep === 2 && !isUploading ? (
                                    <div className="w-full space-y-6">
                                        <div className="flex items-center gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
                                            <div className="w-12 h-12 bg-j-red/20 rounded-lg flex items-center justify-center">
                                                <Video className="w-6 h-6 text-j-red" />
                                            </div>
                                            <div className="text-left flex-1 min-w-0">
                                                <p className="text-white font-bold truncate text-sm">{selectedFile?.name}</p>
                                                <p className="text-gray-500 text-xs uppercase tracking-widest mt-0.5">Ready to upload</p>
                                            </div>
                                            <button
                                                onClick={() => { setSelectedFile(null); setUploadStep(1); }}
                                                className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-widest"
                                            >
                                                Change
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                                            <div className="space-y-4">
                                                <label className="block text-sm font-black text-white/40 uppercase tracking-[0.2em]">Thumbnail Selection</label>
                                                <div
                                                    className="w-full aspect-video bg-black/40 rounded-2xl border-2 border-dashed border-white/10 hover:border-j-gold/50 cursor-pointer overflow-hidden relative group transition-all"
                                                    onClick={() => thumbnailInputRef.current?.click()}
                                                >
                                                    {thumbnailPreview ? (
                                                        <Image src={thumbnailPreview} alt="Preview" fill className="object-cover" />
                                                    ) : (
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                                            <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-j-gold/20 transition-colors">
                                                                <Image src="/logo.svg" alt="" width={20} height={20} className="opacity-20 group-hover:opacity-100 transition-opacity" />
                                                            </div>
                                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Add Custom Thumbnail</span>
                                                        </div>
                                                    )}
                                                    {thumbnailPreview && (
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]">
                                                            <span className="text-[10px] font-black text-white uppercase tracking-widest bg-j-gold/80 px-3 py-1.5 rounded-full shadow-lg">Change Image</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <input
                                                    ref={thumbnailInputRef}
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={handleThumbnailChange}
                                                />
                                            </div>

                                            <div className="space-y-6">
                                                {/* Category Selector */}
                                                <div>
                                                    <label className="block text-sm font-black text-white/40 uppercase tracking-[0.2em] mb-3">Content Category</label>
                                                    <select
                                                        value={selectedCategory}
                                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-j-gold/30 transition-all appearance-none cursor-pointer"
                                                        aria-label="Content Category"
                                                    >

                                                        {CATEGORIES.map((cat) => (
                                                            <option key={cat} value={cat} className="bg-[#1e1e1e] text-white">
                                                                {cat}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* State Selector */}
                                                <div>
                                                    <label className="block text-sm font-black text-white/40 uppercase tracking-[0.2em] mb-3">Regional Tag</label>
                                                    <select
                                                        value={selectedUploadState.code}
                                                        onChange={(e) => {
                                                            const state = US_STATES.find(s => s.code === e.target.value);
                                                            if (state) setSelectedUploadState(state);
                                                        }}
                                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-j-gold/30 transition-all appearance-none cursor-pointer"
                                                        aria-label="State or Region"
                                                    >

                                                        {US_STATES.map((state) => (
                                                            <option key={state.code} value={state.code} className="bg-[#1e1e1e] text-white">
                                                                {state.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <button
                                                onClick={handleStartUpload}
                                                className="w-full bg-gradient-to-r from-j-red to-red-700 text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-red-900/20 active:scale-95 uppercase tracking-widest text-sm"
                                            >
                                                Publish Video
                                            </button>
                                            <p className="mt-4 text-[10px] text-gray-500 font-medium">Final details can be changed later in Studio</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full max-w-sm space-y-4 py-8">
                                        <div className="flex justify-between text-sm text-white mb-1">
                                            <span className="font-bold uppercase tracking-widest text-xs">Uploading...</span>
                                            <span className="font-black text-j-gold">{uploadProgress}%</span>
                                        </div>
                                        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                            <div
                                                className="h-full bg-gradient-to-r from-j-red via-j-gold to-j-green transition-all duration-300 ease-out"
                                                style={{ width: `${uploadProgress}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-center gap-3 pt-4">
                                            <div className="w-2 h-2 bg-j-red animate-ping rounded-full" />
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                                                Securing packet {Math.floor(uploadProgress * 12.4)}...
                                            </p>
                                        </div>
                                        <button
                                            onClick={cancelUpload}
                                            className="mt-6 flex items-center gap-2 px-6 py-2 border border-red-500/20 text-red-500/50 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-all font-black text-[10px] uppercase tracking-widest mx-auto"
                                        >
                                            <X className="w-3 h-3" /> Terminate Session
                                        </button>
                                    </div>
                                )}
                            </div>


                            <div className="p-4 border-t border-white/10 bg-black/20 text-center text-xs text-gray-500 rounded-b-2xl">
                                By submitting your videos to Juneteenth Tube, you acknowledge that you agree to Net Post Media, llc&apos;s Terms of Service.
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
}
