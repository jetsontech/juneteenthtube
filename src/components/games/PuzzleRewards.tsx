"use client";

import { useEffect, useState } from "react";
import { Star, Zap, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface PuzzleRewardsProps {
  userId: string;
  puzzleId: string;
  score: number;
  moves: number;
  timeMs: number;
  onDone?: () => void;
}

const BADGES = [
  { id: "first_puzzle", label: "First Puzzle!", icon: "🧩", threshold: 1 },
  { id: "speed_solver", label: "Speed Demon", icon: "⚡", timeThreshold: 30000 },
  { id: "perfect_solve", label: "Perfect Solve", icon: "🎯", movesThreshold: 20 },
  { id: "century", label: "100 Points Club", icon: "💯", pointsThreshold: 100 },
];

export function PuzzleRewards({
  userId,
  puzzleId,
  score,
  moves,
  timeMs,
  onDone,
}: PuzzleRewardsProps) {
  const [saving, setSaving] = useState(true);
  const [totalPoints, setTotalPoints] = useState<number | null>(null);
  const [newBadges, setNewBadges] = useState<typeof BADGES>([]);

  useEffect(() => {
    async function save() {
      try {
        // 1. Award points
        const ptRes = await fetch("/api/cq/points", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, delta: score }),
        });
        const ptData = await ptRes.json();
        setTotalPoints(ptData.points ?? null);

        // 2. Check & award badges
        const earned: typeof BADGES = [];

        // Pull existing achievements to avoid re-awarding
        const achRes = await fetch(`/api/cq/achievements?user_id=${userId}`);
        const achData = await achRes.json();
        const existing: string[] = (achData.achievements ?? []).map(
          (a: { achievement: string }) => a.achievement
        );

        for (const badge of BADGES) {
          if (existing.includes(badge.id)) continue;
          let qualifies = false;
          if (badge.id === "first_puzzle") qualifies = true;
          if (badge.timeThreshold && timeMs < badge.timeThreshold) qualifies = true;
          if (badge.movesThreshold && moves < badge.movesThreshold) qualifies = true;
          if (badge.pointsThreshold && score >= badge.pointsThreshold) qualifies = true;

          if (qualifies) {
            earned.push(badge);
            await fetch("/api/cq/achievements", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_id: userId,
                achievement: badge.id,
                label: badge.label,
                icon: badge.icon,
              }),
            });
          }
        }

        setNewBadges(earned);
      } catch (e) {
        console.error("[PuzzleRewards]", e);
      } finally {
        setSaving(false);
      }
    }

    void save();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (saving) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="w-12 h-12 rounded-full border-2 border-amber-500/40 border-t-amber-500 animate-spin" />
        <p className="text-zinc-400 text-sm">Saving your score…</p>
      </div>
    );
  }

  return (
    <div className="text-center space-y-6 py-8 px-4">
      <div className="text-6xl">🎉</div>

      <div>
        <h3 className="text-3xl font-black text-white">Puzzle Complete!</h3>
        <p className="text-zinc-400 text-sm mt-1">
          {moves} moves · {(timeMs / 1000).toFixed(1)}s
        </p>
      </div>

      {/* Points earned */}
      <div className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30">
        <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
        <span className="text-2xl font-black text-amber-400">+{score}</span>
        <span className="text-zinc-400 text-sm">CQ Points</span>
      </div>

      {totalPoints !== null && (
        <p className="text-zinc-500 text-sm">
          Total: <span className="text-white font-bold">{totalPoints.toLocaleString()} pts</span>
        </p>
      )}

      {/* New badges */}
      {newBadges.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-zinc-500 font-bold">
            🏅 New Achievement{newBadges.length > 1 ? "s" : ""}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {newBadges.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-sm"
              >
                <span>{b.icon}</span>
                <span className="text-emerald-400 font-bold text-xs">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <button
          onClick={onDone}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 text-white font-black text-sm hover:scale-105 transition-transform"
        >
          Play Again
        </button>
        <a
          href="/play/leaderboard"
          className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-colors"
        >
          View Leaderboard
        </a>
        <a
          href="/trivia"
          className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-zinc-400 font-bold text-sm hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
        >
          <Zap className="w-4 h-4" />
          Play Trivia
        </a>
      </div>

      <p className="text-[10px] text-zinc-600 uppercase tracking-widest">
        Puzzle ID: {puzzleId}
      </p>
    </div>
  );
}
