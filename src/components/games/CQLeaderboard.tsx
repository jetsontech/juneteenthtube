"use client";

import { useEffect, useState } from "react";
import { Trophy, Crown, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

interface BoardEntry {
  user_id: string;
  points: number;
  level: number;
}

export function CQLeaderboard({ className }: { className?: string }) {
  const [board, setBoard] = useState<BoardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cq/leaderboard")
      .then((r) => r.json())
      .then((d) => setBoard(d.board ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const RankIcon = ({ rank }: { rank: number }) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-zinc-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return (
      <span className="w-5 h-5 flex items-center justify-center text-xs font-black text-zinc-500">
        {rank}
      </span>
    );
  };

  if (loading) {
    return (
      <div className={cn("space-y-3", className)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-white/[0.04] animate-pulse" />
        ))}
      </div>
    );
  }

  if (!board.length) {
    return (
      <div className={cn("text-center py-12 text-zinc-500", className)}>
        <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No scores yet — be the first!</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {board.map((entry, i) => {
        const rank = i + 1;
        const initials = entry.user_id.slice(0, 2).toUpperCase();
        const displayName = `Player ${entry.user_id.slice(-4)}`;

        return (
          <div
            key={entry.user_id}
            className={cn(
              "flex items-center gap-4 px-4 py-3 rounded-xl border transition-all",
              rank === 1
                ? "border-yellow-500/30 bg-yellow-500/5"
                : rank <= 3
                ? "border-white/10 bg-white/5"
                : "border-white/5 bg-white/[0.02]"
            )}
          >
            <RankIcon rank={rank} />

            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/40 to-red-600/40 text-white text-[10px] font-black shrink-0">
              {initials}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{displayName}</p>
              <p className="text-[10px] text-zinc-500 font-mono">Level {entry.level}</p>
            </div>

            <div className="text-right shrink-0">
              <p className="text-sm font-black text-amber-400">
                {entry.points.toLocaleString()}
              </p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">pts</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
