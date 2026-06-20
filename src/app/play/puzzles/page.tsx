"use client";

import type { ComponentType } from "react";
import { useState } from "react";
import { DailyPuzzle } from "@/components/games/DailyPuzzle";
import { MediaPuzzleQuest } from "@/components/games/MediaPuzzleQuest";
import { ChevronDown, Images, LayoutGrid, Sparkles, Video } from "lucide-react";

type Difficulty = "easy" | "medium" | "hard";
type PuzzleMode = "daily" | "photo" | "video" | "mixed";

const DIFFICULTIES: { value: Difficulty; label: string; desc: string }[] = [
  { value: "easy",   label: "Easy",   desc: "4 pairs · perfect for kids" },
  { value: "medium", label: "Medium", desc: "6 pairs · the sweet spot" },
  { value: "hard",   label: "Hard",   desc: "8 pairs · real challenge" },
];

const MODES: {
  value: PuzzleMode;
  label: string;
  desc: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { value: "daily", label: "Daily Memory", desc: "Classic Juneteenth icon match", icon: LayoutGrid },
  { value: "photo", label: "Gallery Restore", desc: "Rebuild uploaded photo moments", icon: Images },
  { value: "video", label: "Video Quest", desc: "Puzzle from uploaded thumbnails", icon: Video },
  { value: "mixed", label: "Discovery", desc: "Rotates photos and videos", icon: Sparkles },
];

export default function PuzzlesPage() {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [mode, setMode] = useState<PuzzleMode>("mixed");
  const [key, setKey] = useState(0);         // bump to reset DailyPuzzle

  // Anonymous launch user; swap for the real auth user id when this is connected to accounts.
  const userId = "anon-culturequest";

  return (
    <main className="min-h-screen pb-24 px-4 sm:px-6 pt-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="uppercase tracking-[0.3em] text-amber-500/80 font-bold text-[10px] mb-2">
          CultureQuest · Puzzles
        </p>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-white">
          Puzzle Lab
        </h1>
        <p className="text-zinc-400 text-sm mt-2">
          Match icons, restore gallery photos, or rebuild frames from uploaded videos to earn CQ Points.
        </p>
      </div>

      {/* Puzzle mode selector */}
      <div className="mb-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {MODES.map((item) => {
          const Icon = item.icon;
          const active = mode === item.value;

          return (
            <button
              key={item.value}
              type="button"
              onClick={() => { setMode(item.value); setKey((k) => k + 1); }}
              className={`rounded-2xl border p-4 text-left transition-all ${
                active
                  ? "border-amber-500/50 bg-amber-500/10 text-white"
                  : "border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              <Icon className={active ? "mb-3 h-5 w-5 text-amber-300" : "mb-3 h-5 w-5 text-zinc-500"} />
              <div className="text-sm font-black">{item.label}</div>
              <div className="mt-1 text-xs text-zinc-500">{item.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Difficulty selector */}
      <div className="mb-8 flex flex-wrap gap-2">
        {DIFFICULTIES.map((d) => (
          <button
            key={d.value}
            onClick={() => { setDifficulty(d.value); setKey((k) => k + 1); }}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
              difficulty === d.value
                ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-white"
            }`}
          >
            {d.label}
            <span className="ml-2 text-[10px] opacity-60 hidden sm:inline">{d.desc}</span>
          </button>
        ))}
      </div>

      {/* Puzzle */}
      <div
        key={key}
        className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 sm:p-8"
      >
        {mode === "daily" ? (
          <DailyPuzzle userId={userId} difficulty={difficulty} />
        ) : (
          <MediaPuzzleQuest
            userId={userId}
            difficulty={difficulty}
            sourceMode={mode}
          />
        )}
      </div>

      {/* How scoring works */}
      <details className="mt-6 group">
        <summary className="flex items-center gap-2 cursor-pointer text-zinc-500 text-sm hover:text-zinc-300 transition-colors list-none">
          <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
          How is the score calculated?
        </summary>
        <div className="mt-3 pl-6 text-zinc-500 text-sm space-y-1">
          <p>Score = <code className="text-zinc-300">max(10, 1000 − moves×10 − seconds)</code></p>
          <p>Media restore puzzles add a difficulty bonus and bonus trivia points.</p>
          <p>Finish in 20 moves in 30 seconds → ~700 pts</p>
          <p>Finish in 10 moves in 15 seconds → ~885 pts</p>
        </div>
      </details>
    </main>
  );
}
