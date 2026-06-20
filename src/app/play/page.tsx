"use client";

import Link from "next/link";
import { Puzzle, Trophy, Award, Zap, ArrowRight } from "lucide-react";

const SECTIONS = [
  {
    href: "/play/puzzles",
    icon: <Puzzle className="w-7 h-7" />,
    label: "Daily Puzzle",
    sub: "Match Juneteenth icons & earn CQ Points",
    color: "amber",
    gradient: "from-amber-500/20 to-yellow-500/5",
    border: "border-amber-500/20",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
  },
  {
    href: "/trivia",
    icon: <Zap className="w-7 h-7" />,
    label: "Trivia Showdown",
    sub: "65+ questions on Black history & culture",
    color: "red",
    gradient: "from-red-500/20 to-orange-500/5",
    border: "border-red-500/20",
    iconBg: "bg-red-500/10",
    iconColor: "text-red-400",
  },
  {
    href: "/play/leaderboard",
    icon: <Trophy className="w-7 h-7" />,
    label: "Leaderboard",
    sub: "Top CQ Points earners",
    color: "yellow",
    gradient: "from-yellow-500/20 to-amber-500/5",
    border: "border-yellow-500/20",
    iconBg: "bg-yellow-500/10",
    iconColor: "text-yellow-400",
  },
  {
    href: "/play/achievements",
    icon: <Award className="w-7 h-7" />,
    label: "Achievements",
    sub: "Your earned badges & milestones",
    color: "emerald",
    gradient: "from-emerald-500/20 to-green-500/5",
    border: "border-emerald-500/20",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
  },
];

export default function PlayPage() {
  return (
    <main className="min-h-screen pb-24 px-4 sm:px-6 lg:px-10 pt-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <p className="uppercase tracking-[0.3em] text-amber-500/80 font-bold text-[10px] mb-3">
          CultureQuest · Interactive
        </p>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-white leading-none">
          Play &amp;{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-red-400 to-emerald-400">
            Earn
          </span>
        </h1>
        <p className="text-zinc-400 mt-3 max-w-md">
          Test your Juneteenth knowledge, solve puzzles, earn CQ Points, and climb the leaderboard.
        </p>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className={`group relative overflow-hidden rounded-2xl border ${s.border} bg-gradient-to-br ${s.gradient} p-6 flex flex-col gap-4 hover:scale-[1.02] transition-all duration-200`}
          >
            <div className={`w-12 h-12 rounded-xl ${s.iconBg} flex items-center justify-center ${s.iconColor}`}>
              {s.icon}
            </div>
            <div className="flex-1">
              <h2 className="font-black text-white text-lg">{s.label}</h2>
              <p className="text-zinc-400 text-sm mt-1">{s.sub}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all self-end" />
          </Link>
        ))}
      </div>

      {/* CQ Points explanation */}
      <div className="mt-10 rounded-2xl border border-white/5 bg-white/[0.02] p-6">
        <h3 className="font-black text-white mb-2">How CQ Points Work</h3>
        <ul className="text-zinc-400 text-sm space-y-1.5">
          <li>🧩 Complete a puzzle → up to <span className="text-amber-400 font-bold">1,000 pts</span> based on speed + moves</li>
          <li>⚡ Answer trivia correctly → points awarded per correct answer</li>
          <li>🏅 Earn achievements for speed, streaks, and milestones</li>
          <li>👑 Level up every <span className="text-amber-400 font-bold">500 pts</span></li>
        </ul>
      </div>
    </main>
  );
}
