"use client";

import { useEffect, useState } from "react";
import { Award, Lock } from "lucide-react";

interface Achievement {
  achievement: string;
  label: string;
  icon: string;
  created_at: string;
}

const ALL_ACHIEVEMENTS = [
  { id: "first_puzzle",  label: "First Puzzle!",       icon: "🧩", desc: "Complete your first puzzle" },
  { id: "speed_solver",  label: "Speed Demon",          icon: "⚡", desc: "Finish a puzzle in under 30 seconds" },
  { id: "perfect_solve", label: "Perfect Solve",        icon: "🎯", desc: "Complete a puzzle in under 20 moves" },
  { id: "century",       label: "100 Points Club",      icon: "💯", desc: "Earn 100+ points in one puzzle" },
  { id: "trivia_streak", label: "Trivia Streak",        icon: "🔥", desc: "Get 5 correct trivia answers in a row" },
  { id: "history_buff",  label: "History Buff",         icon: "📚", desc: "Answer 10 history questions correctly" },
  { id: "level_5",       label: "Level 5 Achieved",     icon: "👑", desc: "Reach CQ Level 5" },
  { id: "cookout_king",  label: "Cookout King/Queen",   icon: "🍗", desc: "Complete all trivia categories" },
];

export default function AchievementsPage() {
  const [earned, setEarned] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  const userId =
    typeof window !== "undefined"
      ? localStorage.getItem("cq_user_id") ?? "anon"
      : "anon";

  useEffect(() => {
    fetch(`/api/cq/achievements?user_id=${userId}`)
      .then((r) => r.json())
      .then((d) => setEarned(d.achievements ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  const earnedIds = new Set(earned.map((a) => a.achievement));

  return (
    <main className="min-h-screen pb-24 px-4 sm:px-6 pt-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <p className="uppercase tracking-[0.3em] text-amber-500/80 font-bold text-[10px] mb-2">
          CultureQuest · Progress
        </p>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-white">
          Achievements
        </h1>
        <p className="text-zinc-400 text-sm mt-2">
          {loading ? "Loading…" : `${earnedIds.size} of ${ALL_ACHIEVEMENTS.length} unlocked`}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ALL_ACHIEVEMENTS.map((a) => {
          const isEarned = earnedIds.has(a.id);
          const earnedEntry = earned.find((e) => e.achievement === a.id);

          return (
            <div
              key={a.id}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                isEarned
                  ? "border-amber-500/30 bg-amber-500/5"
                  : "border-white/5 bg-white/[0.02] opacity-50"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                  isEarned ? "bg-amber-500/20" : "bg-white/5"
                }`}
              >
                {isEarned ? (
                  a.icon
                ) : (
                  <Lock className="w-5 h-5 text-zinc-600" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={`font-bold text-sm ${
                    isEarned ? "text-white" : "text-zinc-600"
                  }`}
                >
                  {a.label}
                </p>
                <p className="text-xs text-zinc-600 mt-0.5 truncate">{a.desc}</p>
                {isEarned && earnedEntry && (
                  <p className="text-[10px] text-amber-500/60 mt-1 font-mono">
                    Earned{" "}
                    {new Date(earnedEntry.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>

              {isEarned && (
                <Award className="w-4 h-4 text-amber-400 shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
