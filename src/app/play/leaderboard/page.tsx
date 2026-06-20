"use client";

import { CQLeaderboard } from "@/components/games/CQLeaderboard";
import Link from "next/link";
import { Puzzle, Zap } from "lucide-react";

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen pb-24 px-4 sm:px-6 pt-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <p className="uppercase tracking-[0.3em] text-amber-500/80 font-bold text-[10px] mb-2">
          CultureQuest · Rankings
        </p>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-white">
          CQ Leaderboard
        </h1>
        <p className="text-zinc-400 text-sm mt-2">
          Top CQ Points earners. Updated in real time.
        </p>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
        <CQLeaderboard />
      </div>

      {/* CTAs to earn points */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Link
          href="/play/puzzles"
          className="flex items-center gap-2 justify-center px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold text-sm hover:bg-amber-500/20 transition-colors"
        >
          <Puzzle className="w-4 h-4" />
          Play Puzzle
        </Link>
        <Link
          href="/trivia"
          className="flex items-center gap-2 justify-center px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm hover:bg-red-500/20 transition-colors"
        >
          <Zap className="w-4 h-4" />
          Play Trivia
        </Link>
      </div>
    </main>
  );
}
