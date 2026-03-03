"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Menu, Search, Video, Bell, User, X, UploadCloud } from "lucide-react";
import Link from "next/link";
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
        } catch (error: unknown) {
            console.error("Upload error:", error);
            const message = error instanceof Error ? error.message : "Unknown error";
            if (message !== "Upload cancelled") {
                alert(`Upload Failed: ${message}`);
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
            <nav className="navbar">
                <div className="navbar-left">
                    <button
                        onClick={onMenuClick}
                        className="menu-btn"
                        aria-label="Toggle menu"
                    >
                        <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
                            <rect width="20" height="2" rx="1" fill="currentColor" />
                            <rect y="6" width="14" height="2" rx="1" fill="currentColor" />
                            <rect y="12" width="20" height="2" rx="1" fill="currentColor" />
                        </svg>
                    </button>
                    <Link href="/" className="logo-text" style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                        JuneteenthTube
                        <span className="logo-badge">BETA</span>
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <select
                            title="State Selector"
                            value={selectedState.code}
                            onChange={(e) => {
                                const state = US_STATES.find(s => s.code === e.target.value);
                                if (state) setSelectedState(state);
                            }}
                            className="bg-transparent border border-white/10 rounded-full px-3 py-1 text-gray-400 text-xs font-sans cursor-pointer outline-none ml-2"
                        >
                            <option value="GLOBAL" className="bg-[#111]">🌍 All States</option>
                            {US_STATES.filter(s => s.code !== "GLOBAL").map(s => (
                                <option key={s.code} value={s.code} className="bg-[#111]">{s.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Middle Section - Search */}
                <div className="navbar-mid">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                        }}
                        className="search-wrap"
                    >
                        <input
                            type="text"
                            placeholder="Search JuneteenthTube..."
                            className="search-input"
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
                        <button
                            type="submit"
                            className="search-btn"
                            aria-label="Search button"
                        >
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                                <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.8" />
                                <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                        </button>
                    </form>
                </div>

                {/* Right Section */}
                <div className="navbar-right">
                    <button
                        className="icon-btn"
                        aria-label="Upload video"
                        onClick={() => {
                            if (!user) {
                                handleOpenAuth('login');
                            } else {
                                setIsUploadOpen(true);
                            }
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M15 10l-3-3-3 3M12 7v10M4 17v1a2 2 0 002 2h12a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    {!user ? (
                        <button
                            onClick={() => handleOpenAuth('login')}
                            className="signin-btn"
                        >
                            Sign In
                        </button>
                    ) : (
                        <>
                            <button className="icon-btn" title="Notifications">
                                🔔<span className="notif-dot" />
                            </button>
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="avatar-btn"
                                    aria-label="User menu"
                                >
                                    {user.email?.charAt(0).toUpperCase()}
                                </button>

                                <div className={`user-menu ${isUserMenuOpen ? 'open' : ''}`}>
                                    <div className="user-menu-header">
                                        <div className="user-menu-avatar">
                                            {user.email?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="user-menu-name truncate">{user.user_metadata?.full_name || 'User'}</div>
                                            <div className="user-menu-email truncate">{user.email}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setIsUserMenuOpen(false); window.location.href = '/studio'; }}
                                        className="user-menu-item"
                                    >
                                        <span>🎬</span> Juneteenth Studio
                                    </button>
                                    <button
                                        onClick={() => { setIsUserMenuOpen(false); window.location.href = '/settings'; }}
                                        className="user-menu-item"
                                    >
                                        <span>⚙️</span> Settings
                                    </button>
                                    <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                                    <button
                                        onClick={() => {
                                            signOut();
                                            setIsUserMenuOpen(false);
                                        }}
                                        className="user-menu-item danger"
                                    >
                                        <span>🚪</span> Sign Out
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </nav>


            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                initialMode={authMode}
            />

            {/* Upload Modal */}
            <div className={`modal-backdrop ${isUploadOpen ? 'open' : ''}`}>
                <div className="modal">
                    <div className="modal-header">
                        <div className="modal-title">
                            {uploadStep === 1 ? '📤 Upload Content' : uploadStep === 2 ? '🎬 Video Details' : '⚡ Uploading...'}
                        </div>
                        <button className="close-btn" onClick={handleClose}>✕</button>
                    </div>

                    {uploadStep === 1 && !isUploading && (
                        <div className="modal-body">
                            <div
                                className="dropzone"
                                onDragOver={e => { e.preventDefault(); }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const file = e.dataTransfer.files[0];
                                    if (file) {
                                        const mockEvent = { target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>;
                                        handleFileChange(mockEvent);
                                    }
                                }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="dropzone-icon">☁️</div>
                                <div className="dropzone-title">Drag & drop your file here</div>
                                <div className="dropzone-sub">Photos and videos • Stays private until you publish</div>
                                <button className="upload-btn" onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                                    Select Files
                                </button>
                                <input ref={fileInputRef} type="file" accept="image/*,video/*" hidden onChange={handleFileChange} />
                            </div>
                        </div>
                    )}

                    {uploadStep === 2 && !isUploading && selectedFile && (
                        <div className="modal-body">
                            <div className="upload-file-row">
                                <div className="file-icon">🎥</div>
                                <div>
                                    <div className="file-name">{selectedFile.name}</div>
                                    <div className="file-size">Ready to upload</div>
                                </div>
                                <button className="change-link" onClick={() => { setSelectedFile(null); setUploadStep(1); }}>Change</button>
                            </div>

                            <div className="form-grid">
                                <div>
                                    <div className="form-label">Thumbnail</div>
                                    <div className="thumb-area" onClick={() => thumbnailInputRef.current?.click()}>
                                        {thumbnailPreview
                                            ? <Image src={thumbnailPreview} alt="thumb" fill className="object-cover" />
                                            : <>
                                                <div style={{ fontSize: 28 }}>🖼</div>
                                                <div className="thumb-hint">Add Thumbnail</div>
                                            </>
                                        }
                                        <input ref={thumbnailInputRef} type="file" accept="image/*" hidden onChange={handleThumbnailChange} />
                                    </div>
                                </div>

                                <div className="form-side">
                                    <div>
                                        <label className="form-label">Content Category</label>
                                        <select
                                            title="Content Category"
                                            className="form-select"
                                            value={selectedCategory}
                                            onChange={(e) => setSelectedCategory(e.target.value)}
                                        >
                                            {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#111' }}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label">Regional Tag</label>
                                        <select
                                            title="Regional Tag"
                                            className="form-select"
                                            value={selectedUploadState.code}
                                            onChange={(e) => {
                                                const state = US_STATES.find(s => s.code === e.target.value);
                                                if (state) setSelectedUploadState(state);
                                            }}
                                        >
                                            <option value="GLOBAL" style={{ background: '#111' }}>🌍 All States</option>
                                            {US_STATES.filter(s => s.code !== "GLOBAL").map(s => (
                                                <option key={s.code} value={s.code} style={{ background: '#111' }}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="form-label">Visibility</label>
                                        <select title="Visibility" className="form-select" defaultValue="public">
                                            {['Public', 'Unlisted', 'Private'].map(v => <option key={v} value={v.toLowerCase()} style={{ background: '#111' }}>{v}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <button className="publish-btn" onClick={handleStartUpload}>🚀 Publish Video</button>
                            <div style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginTop: 8 }}>Details can be changed later in Studio</div>
                        </div>
                    )}

                    {isUploading && (
                        <div className="progress-wrap">
                            <div style={{ fontSize: 48, margin: '12px 0' }}>⚡</div>
                            <div className="progress-label">
                                <span>Uploading</span>
                                <span className="progress-pct">{Math.min(100, Math.floor(uploadProgress))}%</span>
                            </div>
                            <div className="progress-track">
                                <div className="progress-fill" style={{ width: `${Math.min(100, uploadProgress)}%` }} />
                            </div>
                            <div className="progress-pulse">
                                <div className="pulse-dot" />
                                Securing packet {Math.floor(uploadProgress * 12.4)}...
                            </div>
                            <button className="cancel-link" onClick={() => { if (confirm("Upload in progress. Are you sure you want to cancel?")) { cancelUpload(); setIsUploadOpen(false); setUploadStep(1); } }}>
                                ✕ Cancel Upload
                            </button>
                        </div>
                    )}

                    <div className="modal-footer">
                        By uploading, you agree to Net Post Media, LLC's Terms of Service
                    </div>
                </div>
            </div>
        </>
    );
}
