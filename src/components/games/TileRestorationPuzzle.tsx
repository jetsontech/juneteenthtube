"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Clock, Image as ImageIcon, RotateCcw, Sparkles, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MediaPuzzleSource {
    id: string;
    sourceId: string;
    type: "photo" | "video";
    title: string;
    caption: string;
    category: string;
    state: string;
    imageUrl: string;
    prompt: string;
    questions: {
        question: string;
        options: string[];
        answerIndex: number;
        explanation: string;
    }[];
}

interface Tile {
    correctIndex: number;
    currentIndex: number;
}

interface TileRestorationPuzzleProps {
    source: MediaPuzzleSource;
    difficulty: "easy" | "medium" | "hard";
    onComplete: (score: number, moves: number, timeMs: number) => void;
}

function gridForDifficulty(difficulty: TileRestorationPuzzleProps["difficulty"]) {
    if (difficulty === "easy") return 3;
    if (difficulty === "hard") return 4;
    return 3;
}

function shuffleTiles(size: number, seed: string): Tile[] {
    const count = size * size;
    const order = Array.from({ length: count }, (_, index) => index);
    let hash = 0;

    for (let i = 0; i < seed.length; i += 1) {
        hash = (hash * 33 + seed.charCodeAt(i)) >>> 0;
    }

    for (let i = order.length - 1; i > 0; i -= 1) {
        hash = (hash * 1664525 + 1013904223) >>> 0;
        const j = hash % (i + 1);
        [order[i], order[j]] = [order[j], order[i]];
    }

    if (order.every((value, index) => value === index)) {
        [order[0], order[1]] = [order[1], order[0]];
    }

    return order.map((currentIndex, correctIndex) => ({ currentIndex, correctIndex }));
}

function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function TileRestorationPuzzle({ source, difficulty, onComplete }: TileRestorationPuzzleProps) {
    const size = gridForDifficulty(difficulty);
    const [tiles, setTiles] = useState<Tile[]>(() => shuffleTiles(size, source.id));
    const [selected, setSelected] = useState<number | null>(null);
    const [moves, setMoves] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [started, setStarted] = useState(false);
    const [complete, setComplete] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const startRef = useRef(0);

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const startTimer = useCallback(() => {
        if (started) return;
        setStarted(true);
        startRef.current = Date.now();
        timerRef.current = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
        }, 1000);
    }, [started]);

    const reset = useCallback(() => {
        stopTimer();
        setTiles(shuffleTiles(size, `${source.id}-${Date.now()}`));
        setSelected(null);
        setMoves(0);
        setElapsed(0);
        setStarted(false);
        setComplete(false);
    }, [size, source.id, stopTimer]);

    useEffect(() => () => stopTimer(), [stopTimer]);

    function handleTileClick(index: number) {
        if (complete) return;
        startTimer();

        if (selected === null) {
            setSelected(index);
            return;
        }

        if (selected === index) {
            setSelected(null);
            return;
        }

        const nextMoveCount = moves + 1;
        const nextTiles = [...tiles];
        const first = nextTiles[selected];
        const second = nextTiles[index];

        nextTiles[selected] = { ...first, currentIndex: second.currentIndex };
        nextTiles[index] = { ...second, currentIndex: first.currentIndex };

        const solvedAfterSwap = nextTiles.every((tile) => tile.correctIndex === tile.currentIndex);

        setTiles(nextTiles);
        setMoves(nextMoveCount);
        setSelected(null);

        if (solvedAfterSwap) {
            stopTimer();
            const timeMs = Math.max(1000, elapsed * 1000);
            const difficultyBonus = difficulty === "hard" ? 350 : difficulty === "medium" ? 220 : 120;
            const score = Math.max(50, Math.floor(900 + difficultyBonus - nextMoveCount * 18 - timeMs / 120));
            window.setTimeout(() => {
                setComplete(true);
                window.setTimeout(() => onComplete(score, nextMoveCount, timeMs), 1200);
            }, 0);
        }
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-amber-400">
                        {source.type === "video" ? <Zap className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
                        {source.type === "video" ? "Video Quest" : "Gallery Restore"}
                    </div>
                    <h3 className="mt-1 text-xl font-black tracking-tight text-white">{source.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{source.prompt}</p>
                </div>

                <div className="flex shrink-0 items-center gap-3 text-sm">
                    <div className="flex items-center gap-1.5 text-zinc-400">
                        <Clock className="h-4 w-4 text-emerald-400" />
                        <span className="font-mono font-black text-white">{formatTime(elapsed)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-400">
                        <Sparkles className="h-4 w-4 text-amber-400" />
                        <span className="font-black text-white">{moves}</span>
                        <span>moves</span>
                    </div>
                    <button
                        type="button"
                        onClick={reset}
                        className="rounded-lg border border-white/10 bg-white/5 p-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                        title="Reset puzzle"
                    >
                        <RotateCcw className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="relative mx-auto aspect-square w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
                <img
                    src={source.imageUrl}
                    alt=""
                    className={cn(
                        "absolute inset-0 h-full w-full object-cover transition-all duration-1000",
                        complete ? "scale-100 blur-0 grayscale-0 opacity-100" : "scale-105 blur-sm grayscale opacity-25"
                    )}
                />

                <div
                    className={cn(
                        "relative grid h-full w-full gap-1 p-1 transition-opacity duration-700",
                        complete && "opacity-0"
                    )}
                    style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
                >
                    {tiles.map((tile, index) => {
                        const x = tile.currentIndex % size;
                        const y = Math.floor(tile.currentIndex / size);
                        const isSelected = selected === index;

                        return (
                            <button
                                key={tile.correctIndex}
                                type="button"
                                onClick={() => handleTileClick(index)}
                                className={cn(
                                    "relative overflow-hidden rounded-lg border transition-all duration-300",
                                    isSelected
                                        ? "z-10 scale-95 border-amber-400 shadow-[0_0_0_2px_rgba(251,191,36,0.35)]"
                                        : "border-black/40 hover:border-white/40",
                                    started && "animate-in fade-in zoom-in-95"
                                )}
                                style={{ animationDelay: `${index * 28}ms` }}
                                aria-label={`Tile ${index + 1}`}
                            >
                                <span
                                    className="absolute inset-0 bg-cover bg-no-repeat"
                                    style={{
                                        backgroundImage: `url("${source.imageUrl}")`,
                                        backgroundSize: `${size * 100}% ${size * 100}%`,
                                        backgroundPosition: `${(x / (size - 1)) * 100}% ${(y / (size - 1)) * 100}%`,
                                    }}
                                />
                                <span className="absolute inset-0 bg-black/10 transition-colors hover:bg-white/5" />
                            </button>
                        );
                    })}
                </div>

                {complete && (
                    <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/85 via-black/10 to-transparent p-5">
                        <div className="max-w-lg animate-in slide-in-from-bottom-4 fade-in duration-700">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">
                                Restored
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-zinc-200">
                                {source.caption || "Archive image restored. Answer the unlock questions next."}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {!started && (
                <p className="text-center text-xs font-mono text-zinc-600">
                    Select two tiles to swap them and restore the image.
                </p>
            )}
        </div>
    );
}
