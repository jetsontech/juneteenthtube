"use client";

import { useState, useEffect, useRef } from "react";
import { X, ChevronLeft, ChevronRight, Image as ImageIcon, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useVideo } from "@/context/VideoContext";

interface Photo {
    id: string;
    photo_url: string;
    title: string;
    caption?: string;
    created_at: string;
}

export default function PhotosPage() {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [showManageMenu, setShowManageMenu] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentPhotoId, setCurrentPhotoId] = useState<string | null>(null);

    const { deletePhoto, updatePhotoImage, isUploading, uploadProgress } = useVideo();

    // Fetch photos from API
    const fetchPhotos = async () => {
        try {
            const res = await fetch('/api/photos');
            if (res.ok) {
                const { photos: fetchedPhotos } = await res.json();
                setPhotos(fetchedPhotos || []);
            }
        } catch (error) {
            console.error('Error fetching photos:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPhotos();
    }, []);

    const openLightbox = (index: number) => setSelectedIndex(index);
    const closeLightbox = () => setSelectedIndex(null);

    const goToPrevious = () => {
        if (selectedIndex !== null) {
            setSelectedIndex(selectedIndex === 0 ? photos.length - 1 : selectedIndex - 1);
        }
    };

    const goToNext = () => {
        if (selectedIndex !== null) {
            setSelectedIndex(selectedIndex === photos.length - 1 ? 0 : selectedIndex + 1);
        }
    };

    const handleDeletePhoto = async (id: string) => {
        if (!confirm("Are you sure you want to delete this photo?")) return;

        try {
            await deletePhoto(id);
            setPhotos(prev => prev.filter(p => p.id !== id));
            setShowManageMenu(null);
            if (selectedIndex !== null) {
                closeLightbox();
            }
        } catch (error) {
            alert("Failed to delete photo. Please try again.");
            console.error(error);
        }
    };

    const handleChangeImage = (id: string) => {
        setCurrentPhotoId(id);
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentPhotoId) return;

        if (!file.type.startsWith('image/')) {
            alert("Please select an image file.");
            return;
        }

        try {
            await updatePhotoImage(currentPhotoId, file);
            await fetchPhotos(); // Refresh photos
            setShowManageMenu(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
            alert("Failed to update photo. Please try again.");
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6">
            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />

            {/* Header */}
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-j-gold/20 rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-j-gold" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Photos</h1>
                </div>
                <div className="h-1 w-20 bg-j-red rounded-full"></div>
                <p className="text-gray-400 mt-3">Community moments captured in time</p>
            </header>

            {/* Loading State */}
            {isLoading && (
                <div className="text-center py-12">
                    <p className="text-gray-400">Loading photos...</p>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && photos.length === 0 && (
                <div className="text-center py-12">
                    <ImageIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No photos uploaded yet.</p>
                    <p className="text-gray-500 text-sm mt-2">Upload your first photo to get started!</p>
                </div>
            )}

            {/* Image Grid */}
            {!isLoading && photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {photos.map((photo, index) => (
                        <div key={photo.id} className="relative group">
                            <button
                                onClick={() => openLightbox(index)}
                                className="group relative aspect-square overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-j-gold/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-j-gold/50 w-full"
                            >
                                {photo.photo_url && photo.photo_url.includes('pub-efcc4aa0b3b24e3d97760577b0ec20bd.r2.dev') ? (
                                    <Image
                                        src={photo.photo_url}
                                        alt={photo.title}
                                        fill
                                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                                        <span className="text-gray-500 text-xs">No Image</span>
                                    </div>
                                )}
                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div className="absolute bottom-0 left-0 right-0 p-3">
                                        <p className="text-white text-sm font-medium truncate">{photo.caption || photo.title}</p>
                                    </div>
                                </div>
                                {/* Glow effect */}
                                <div className="absolute inset-0 rounded-xl ring-2 ring-j-gold/0 group-hover:ring-j-gold/30 transition-all duration-300" />
                            </button>

                            {/* Management buttons */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                <button
                                    onClick={() => handleChangeImage(photo.id)}
                                    className="p-2 bg-blue-600/90 hover:bg-blue-600 rounded-full text-white transition-colors"
                                    title="Change image"
                                    disabled={isUploading}
                                >
                                    <Upload className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDeletePhoto(photo.id)}
                                    className="p-2 bg-red-600/90 hover:bg-red-600 rounded-full text-white transition-colors"
                                    title="Delete photo"
                                    disabled={isUploading}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox Modal */}
            {selectedIndex !== null && photos[selectedIndex] && (
                <div
                    className="fixed inset-0 z-[80] bg-black/95 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-200"
                    onClick={closeLightbox}
                >
                    {/* Close button */}
                    <button
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white z-10"
                        aria-label="Close lightbox"
                    >
                        <X className="w-6 h-6" />
                    </button>

                    {/* Previous button */}
                    {photos.length > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white z-10"
                            aria-label="Previous image"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                    )}

                    {/* Image */}
                    <div
                        className="max-w-[90vw] max-h-[85vh] flex flex-col items-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {photos[selectedIndex].photo_url && photos[selectedIndex].photo_url.includes('pub-efcc4aa0b3b24e3d97760577b0ec20bd.r2.dev') ? (
                            <Image
                                src={photos[selectedIndex].photo_url}
                                alt={photos[selectedIndex].title}
                                width={1200}
                                height={800}
                                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center rounded-lg">
                                <span className="text-gray-500">Image not available</span>
                            </div>
                        )}
                        <p className="text-white text-lg mt-4 font-medium">
                            {photos[selectedIndex].caption || photos[selectedIndex].title}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                            {selectedIndex + 1} / {photos.length}
                        </p>
                    </div>

                    {/* Next button */}
                    {photos.length > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); goToNext(); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white z-10"
                            aria-label="Next image"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
