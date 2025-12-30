"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

// Placeholder gallery images - can be replaced with Supabase storage later
const GALLERY_IMAGES = [
    {
        id: "1",
        src: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&auto=format&fit=crop",
        alt: "Juneteenth Celebration",
        caption: "Community Celebration 2024"
    },
    {
        id: "2",
        src: "https://images.unsplash.com/photo-1529543544606-e6a1f9e4a1c1?w=800&auto=format&fit=crop",
        alt: "Cultural Festival",
        caption: "Cultural Heritage Festival"
    },
    {
        id: "3",
        src: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop",
        alt: "Parade",
        caption: "Juneteenth Parade"
    },
    {
        id: "4",
        src: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&auto=format&fit=crop",
        alt: "Live Music",
        caption: "Live Music Performance"
    },
    {
        id: "5",
        src: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&auto=format&fit=crop",
        alt: "Community Gathering",
        caption: "Community Gathering"
    },
    {
        id: "6",
        src: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop",
        alt: "Festival Crowd",
        caption: "Festival Celebration"
    },
    {
        id: "7",
        src: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&auto=format&fit=crop",
        alt: "Concert",
        caption: "Evening Concert"
    },
    {
        id: "8",
        src: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&auto=format&fit=crop",
        alt: "Dance Performance",
        caption: "Traditional Dance"
    },
    {
        id: "9",
        src: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&auto=format&fit=crop",
        alt: "Music Festival",
        caption: "Music Festival Stage"
    }
];

export default function PhotosPage() {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const openLightbox = (index: number) => setSelectedIndex(index);
    const closeLightbox = () => setSelectedIndex(null);

    const goToPrevious = () => {
        if (selectedIndex !== null) {
            setSelectedIndex(selectedIndex === 0 ? GALLERY_IMAGES.length - 1 : selectedIndex - 1);
        }
    };

    const goToNext = () => {
        if (selectedIndex !== null) {
            setSelectedIndex(selectedIndex === GALLERY_IMAGES.length - 1 ? 0 : selectedIndex + 1);
        }
    };

    return (
        <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6">
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

            {/* Image Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {GALLERY_IMAGES.map((image, index) => (
                    <button
                        key={image.id}
                        onClick={() => openLightbox(index)}
                        className="group relative aspect-square overflow-hidden rounded-xl bg-white/5 border border-white/10 hover:border-j-gold/50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-j-gold/50"
                    >
                        <Image
                            src={image.src}
                            alt={image.alt}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                                <p className="text-white text-sm font-medium truncate">{image.caption}</p>
                            </div>
                        </div>
                        {/* Glow effect */}
                        <div className="absolute inset-0 rounded-xl ring-2 ring-j-gold/0 group-hover:ring-j-gold/30 transition-all duration-300" />
                    </button>
                ))}
            </div>

            {/* Lightbox Modal */}
            {selectedIndex !== null && (
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
                    <button
                        onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white z-10"
                        aria-label="Previous image"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>

                    {/* Image */}
                    <div
                        className="max-w-[90vw] max-h-[85vh] flex flex-col items-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Image
                            src={GALLERY_IMAGES[selectedIndex].src}
                            alt={GALLERY_IMAGES[selectedIndex].alt}
                            width={1200}
                            height={800}
                            className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
                        />
                        <p className="text-white text-lg mt-4 font-medium">
                            {GALLERY_IMAGES[selectedIndex].caption}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">
                            {selectedIndex + 1} / {GALLERY_IMAGES.length}
                        </p>
                    </div>

                    {/* Next button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); goToNext(); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white z-10"
                        aria-label="Next image"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
            )}
        </div>
    );
}
