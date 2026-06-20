"use client";

import { useState } from "react";
import { MemoryPuzzle } from "./MemoryPuzzle";
import { PuzzleRewards } from "./PuzzleRewards";
import { Puzzle } from "lucide-react";

interface DailyPuzzleProps {
  userId?: string;
  difficulty?: "easy" | "medium" | "hard";
}

type Phase = "playing" | "rewards";

// Deterministic daily puzzle ID
function getDailyId(): string {
  const d = new Date();
  return `daily-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

const DIFFICULTY_PAIRS: Record<string, 4 | 6 | 8 | 12> = {
  easy: 4,
  medium: 6,
  hard: 8,
};

export function DailyPuzzle({ userId = "anon", difficulty = "medium" }: DailyPuzzleProps) {
  const [phase, setPhase] = useState<Phase>("playing");
  const [result, setResult] = useState<{ score: number; moves: number; timeMs: number } | null>(
    null
  );

  const puzzleId = getDailyId();
  const pairs = DIFFICULTY_PAIRS[difficulty] ?? 6;

  function handleComplete(score: number, moves: number, timeMs: number) {
    setResult({ score, moves, timeMs });
    setPhase("rewards");
  }

  function handleReset() {
    setResult(null);
    setPhase("playing");
  }

  return (
    <div className="w-full">
      {phase === "playing" && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Puzzle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-black text-white text-lg">Daily Memory Puzzle</h3>
              <p className="text-xs text-zinc-500">
                {puzzleId} · {difficulty} · {pairs} pairs
              </p>
            </div>
          </div>
          <MemoryPuzzle onComplete={handleComplete} gridSize={pairs} />
        </div>
      )}

      {phase === "rewards" && result && (
        <PuzzleRewards
          userId={userId}
          puzzleId={puzzleId}
          score={result.score}
          moves={result.moves}
          timeMs={result.timeMs}
          onDone={handleReset}
        />
      )}
    </div>
  );
}
