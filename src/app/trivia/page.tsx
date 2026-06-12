"use client";

import { TriviaGame } from "@/components/interactive/TriviaGame";

export default function TriviaPage() {
    return (
        <div className="bg-transparent relative overflow-hidden h-[calc(100dvh-var(--navbar-full-height))] sm:h-auto sm:pb-12">
            {/* Ambient Background glow overrides matching the premium gloss design system */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] aspect-square rounded-full bg-amber-500/5 blur-[120px]" />
                <div className="absolute top-[40%] right-[-10%] w-[45%] aspect-square rounded-full bg-emerald-500/5 blur-[120px]" />
                <div className="absolute -bottom-[10%] left-[20%] w-[40%] aspect-square rounded-full bg-red-500/5 blur-[120px]" />
            </div>
            
            <div className="relative z-10 h-full flex flex-col">
                <TriviaGame />
            </div>
        </div>
    );
}
