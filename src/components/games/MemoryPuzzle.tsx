"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RotateCcw, Clock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

// Juneteenth-themed cards: icon + label pairs
const CARD_PAIRS = [
  { id: "flag",        emoji: "🏳️",  label: "Juneteenth Flag"   },
  { id: "fist",        emoji: "✊🏾",  label: "Freedom Fist"      },
  { id: "star",        emoji: "⭐",  label: "North Star"        },
  { id: "drum",        emoji: "🥁",  label: "African Drum"      },
  { id: "fire",        emoji: "🔥",  label: "Freedom Fire"      },
  { id: "book",        emoji: "📚",  label: "Knowledge"         },
  { id: "crown",       emoji: "👑",  label: "Black Excellence"  },
  { id: "music",       emoji: "🎵",  label: "Culture & Music"   },
  { id: "earth",       emoji: "🌍",  label: "Pan-African"       },
  { id: "handshake",   emoji: "🤝🏾",  label: "Community"        },
  { id: "dove",        emoji: "🕊️",  label: "Peace"             },
  { id: "chain",       emoji: "⛓️",  label: "Broken Chains"     },
];

interface Card {
  uid: string;
  id: string;
  emoji: string;
  label: string;
  flipped: boolean;
  matched: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeCards(count: number): Card[] {
  const pairs = shuffle(CARD_PAIRS).slice(0, count);
  const doubled = [...pairs, ...pairs];
  return shuffle(doubled).map((p, i) => ({
    uid: `${p.id}-${i}`,
    id: p.id,
    emoji: p.emoji,
    label: p.label,
    flipped: false,
    matched: false,
  }));
}

interface MemoryPuzzleProps {
  onComplete?: (score: number, moves: number, timeMs: number) => void;
  gridSize?: 4 | 6 | 8 | 12;  // number of pairs
}

export function MemoryPuzzle({ onComplete, gridSize = 6 }: MemoryPuzzleProps) {
  const [cards, setCards] = useState<Card[]>(() => makeCards(gridSize));
  const [flipped, setFlipped] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [locked, setLocked] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [started, setStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const totalPairs = gridSize;

  const startTimer = useCallback(() => {
    if (started) return;
    setStarted(true);
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }, [started]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  const handleFlip = useCallback(
    (uid: string) => {
      if (locked) return;
      if (flipped.length === 2) return;
      if (flipped.includes(uid)) return;

      startTimer();

      setCards((prev) =>
        prev.map((c) => (c.uid === uid ? { ...c, flipped: true } : c))
      );

      const newFlipped = [...flipped, uid];
      setFlipped(newFlipped);

      if (newFlipped.length === 2) {
        setMoves((m) => m + 1);
        setLocked(true);

        const [a, b] = newFlipped.map((id) =>
          cards.find((c) => c.uid === id)
        ) as [Card, Card];

        if (a.id === b.id) {
          // Match!
          setCards((prev) =>
            prev.map((c) =>
              c.uid === a.uid || c.uid === b.uid
                ? { ...c, matched: true }
                : c
            )
          );
          setMatches((m) => {
            const next = m + 1;
            if (next === totalPairs) {
              stopTimer();
              const timeMs = Date.now() - startTimeRef.current;
              const score = Math.max(
                10,
                Math.floor(1000 - moves * 10 - timeMs / 1000)
              );
              setTimeout(() => onComplete?.(score, moves + 1, timeMs), 600);
            }
            return next;
          });
          setFlipped([]);
          setLocked(false);
        } else {
          // No match - flip back after delay
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                c.uid === a.uid || c.uid === b.uid
                  ? { ...c, flipped: false }
                  : c
              )
            );
            setFlipped([]);
            setLocked(false);
          }, 900);
        }
      }
    },
    [cards, flipped, locked, moves, onComplete, startTimer, stopTimer, totalPairs]
  );

  const reset = useCallback(() => {
    stopTimer();
    setCards(makeCards(gridSize));
    setFlipped([]);
    setMoves(0);
    setMatches(0);
    setLocked(false);
    setElapsed(0);
    setStarted(false);
  }, [gridSize, stopTimer]);

  const cols = gridSize <= 4 ? 4 : gridSize <= 6 ? 4 : 6;

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      {/* Stats bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="font-black text-white">{moves}</span>
            <span>moves</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="font-mono font-black text-white">{elapsed}s</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 font-mono">
            {matches}/{totalPairs} matched
          </span>
          <button
            onClick={reset}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-all"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${(matches / totalPairs) * 100}%` }}
        />
      </div>

      {/* Grid */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {cards.map((card) => (
          <button
            key={card.uid}
            onClick={() => !card.matched && handleFlip(card.uid)}
            disabled={card.matched || locked}
            className={cn(
              "aspect-square rounded-xl border text-2xl flex items-center justify-center transition-all duration-300 select-none",
              card.matched
                ? "border-emerald-500/40 bg-emerald-500/10 cursor-default scale-95 opacity-60"
                : card.flipped
                ? "border-amber-500/50 bg-amber-500/10 scale-105"
                : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 cursor-pointer"
            )}
          >
            <span
              className={cn(
                "transition-all duration-300",
                card.flipped || card.matched ? "opacity-100 scale-100" : "opacity-0 scale-50"
              )}
              title={card.label}
            >
              {card.emoji}
            </span>
          </button>
        ))}
      </div>

      {!started && (
        <p className="text-center text-xs text-zinc-600 font-mono animate-pulse">
          Tap a card to start
        </p>
      )}
    </div>
  );
}
