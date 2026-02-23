"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { X, Upload, Video, Check, Loader2 } from "lucide-react";
import { VideoProps, useVideo } from "@/context/VideoContext";
import { cn } from "@/lib/utils";

interface EditVideoModalProps {
    video: VideoProps;
    isOpen: boolean;
    onClose: () => void;
}

export function EditVideoModal({ video, isOpen, onClose }: EditVideoModalProps) {
    const { updateVideoTitle, updateVideoThumbnail } = useVideo();
    const [title, setTitle] = useState(video.title);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(video.thumbnail);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith("image/")) {
            setThumbnailFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setThumbnailPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus('saving');
        try {
            // Update Title if changed
            if (title !== video.title) {
                await updateVideoTitle(video.id, title);
            }

            // Update Thumbnail if changed
            if (thumbnailFile) {
                await updateVideoThumbnail(video.id, thumbnailFile);
            }

            setSaveStatus('success');
            setTimeout(() => {
                onClose();
                setSaveStatus('idle');
            }, 1500);
        } catch (error) {
            console.error("Failed to update video:", error);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-[#1a1a1a] border border-white/10 rounded-[32px] w-full max-w-2xl overflow-hidden shadow-2xl shadow-black/50">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-j-red/20 flex items-center justify-center">
                            <Video className="w-5 h-5 text-j-red" />
                        </div>
                        <h2 className="text-xl font-black text-white uppercase tracking-tighter">Edit Video Details</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                        title="Close"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Thumbnail Side */}
                        <div className="space-y-4">
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Video Thumbnail</label>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="group relative aspect-video rounded-2xl bg-black/40 border-2 border-dashed border-white/10 hover:border-j-gold/50 cursor-pointer overflow-hidden transition-all shadow-xl"
                            >
                                {thumbnailPreview ? (
                                    <Image src={thumbnailPreview} alt="Preview" fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                                        <Upload className="w-8 h-8 mb-2 opacity-20" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Select Image</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all backdrop-blur-[2px]">
                                    <Upload className="w-6 h-6 text-j-gold mb-2" />
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest bg-j-gold/80 px-4 py-2 rounded-full">Upload New</span>
                                </div>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleThumbnailChange}
                                title="Upload Select"
                            />
                            <p className="text-[10px] text-gray-500 font-medium leading-relaxed italic">
                                * Recommended: 1280x720 (16:9 ratio). High quality thumbnails increase click-through rates.
                            </p>
                        </div>

                        {/* Details Side */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Video Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-j-red/50 transition-all font-medium"
                                    placeholder="Enter video title"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">Platform Category</label>
                                <div className="px-4 py-3 bg-white/[0.03] border border-white/5 rounded-xl text-sm text-gray-400 font-medium">
                                    {video.category || "General"}
                                </div>
                                <p className="mt-2 text-[10px] text-gray-600 italic">Category cannot be changed after upload.</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-10 flex items-center justify-end gap-3 pt-6 border-t border-white/5">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 text-sm font-black text-gray-400 hover:text-white transition-all uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || (title === video.title && !thumbnailFile)}
                            className={cn(
                                "relative px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all min-w-[140px]",
                                saveStatus === 'success' ? "bg-green-500 text-white" :
                                    saveStatus === 'error' ? "bg-red-500 text-white" :
                                        "bg-j-red text-white hover:scale-105 active:scale-95 shadow-xl shadow-j-red/20 disabled:opacity-50 disabled:scale-100"
                            )}
                        >
                            <span className={cn("flex items-center justify-center gap-2", isSaving && "opacity-0")}>
                                {saveStatus === 'success' ? <><Check className="w-4 h-4" /> Updated</> : 'Save Changes'}
                            </span>
                            {isSaving && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                </div>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
