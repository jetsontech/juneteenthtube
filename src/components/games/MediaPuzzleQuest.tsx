"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Image as ImageIcon, Loader2, RefreshCw, Video, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PuzzleRewards } from "./PuzzleRewards";
import { MediaPuzzleSource, TileRestorationPuzzle } from "./TileRestorationPuzzle";

type Difficulty = "easy" | "medium" | "hard";
type SourceMode = "mixed" | "photo" | "video";
type Stage = "restore" | "quiz" | "rewards";

interface MediaPuzzleQuestProps {
    userId: string;
    difficulty: Difficulty;
    sourceMode: SourceMode;
}

interface PuzzleResult {
    score: number;
    moves: number;
    timeMs: number;
}

export function MediaPuzzleQuest({ userId, difficulty, sourceMode }: MediaPuzzleQuestProps) {
    const [source, setSource] = useState<MediaPuzzleSource | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stage, setStage] = useState<Stage>("restore");
    const [result, setResult] = useState<PuzzleResult | null>(null);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [seed, setSeed] = useState(() => Date.now().toString(36));

    const correctCount = useMemo(() => {
        if (!source) return 0;
        return source.questions.reduce((total, question, index) => {
            return total + (answers[index] === question.answerIndex ? 1 : 0);
        }, 0);
    }, [answers, source]);

    const allAnswered = !!source && source.questions.every((_, index) => answers[index] !== undefined);

    useEffect(() => {
        const controller = new AbortController();
        const params = new URLSearchParams({ source: sourceMode, difficulty, seed });

        fetch(`/api/cq/generate-puzzle?${params.toString()}`, {
            cache: "no-store",
            signal: controller.signal,
        })
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok || !data.puzzle) {
                    throw new Error(data.error || "Could not generate a CultureQuest puzzle.");
                }
                return data.puzzle as MediaPuzzleSource;
            })
            .then((nextSource) => {
                setSource(nextSource);
                setError(null);
                setStage("restore");
                setResult(null);
                setAnswers({});
            })
            .catch((err: unknown) => {
                if (controller.signal.aborted) return;
                setError(err instanceof Error ? err.message : "Could not generate a CultureQuest puzzle.");
                setSource(null);
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [difficulty, seed, sourceMode]);

    function handleRestored(score: number, moves: number, timeMs: number) {
        setResult({ score, moves, timeMs });
        setStage("quiz");
    }

    function finishQuiz() {
        if (!result) return;
        setResult({
            ...result,
            score: result.score + correctCount * 75,
        });
        setStage("rewards");
    }

    function replayWithNewSeed() {
        setLoading(true);
        setSeed(Date.now().toString(36));
    }

    if (loading) {
        return (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-8">
                <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
                <p className="text-sm text-zinc-400">Generating CultureQuest puzzle...</p>
            </div>
        );
    }

    if (error || !source) {
        return (
            <div className="rounded-2xl border border-red-500/20 bg-red-950/20 p-6">
                <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
                    <div>
                        <h3 className="font-black text-white">Puzzle source unavailable</h3>
                        <p className="mt-1 text-sm text-red-100/70">{error}</p>
                        <button
                            type="button"
                            onClick={replayWithNewSeed}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/10"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Try another source
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (stage === "restore") {
        return (
            <TileRestorationPuzzle
                source={source}
                difficulty={difficulty}
                onComplete={handleRestored}
            />
        );
    }

    if (stage === "rewards" && result) {
        return (
            <PuzzleRewards
                userId={userId}
                puzzleId={`${source.id}-${difficulty}`}
                score={result.score}
                moves={result.moves}
                timeMs={result.timeMs}
                onDone={replayWithNewSeed}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950">
                <div className="relative aspect-video">
                    <img src={source.imageUrl} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-amber-300 backdrop-blur">
                            {source.type === "video" ? <Video className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
                            Unlock Questions
                        </div>
                        <h3 className="text-2xl font-black tracking-tight text-white">{source.title}</h3>
                        <p className="mt-1 text-sm text-zinc-300">{source.caption}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {source.questions.map((question, questionIndex) => {
                    const answered = answers[questionIndex] !== undefined;
                    const correct = answers[questionIndex] === question.answerIndex;

                    return (
                        <section
                            key={question.question}
                            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                        >
                            <div className="flex gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-sm font-black text-amber-300">
                                    {questionIndex + 1}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-black text-white">{question.question}</h4>
                                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                        {question.options.map((option, optionIndex) => {
                                            const selected = answers[questionIndex] === optionIndex;
                                            const isCorrect = question.answerIndex === optionIndex;

                                            return (
                                                <button
                                                    key={option}
                                                    type="button"
                                                    disabled={answered}
                                                    onClick={() =>
                                                        setAnswers((prev) => ({
                                                            ...prev,
                                                            [questionIndex]: optionIndex,
                                                        }))
                                                    }
                                                    className={cn(
                                                        "flex min-h-12 items-center justify-between rounded-xl border px-3 py-2 text-left text-sm font-bold transition-all",
                                                        !answered && "border-white/10 bg-black/20 text-zinc-300 hover:border-amber-400/40 hover:bg-amber-500/10 hover:text-white",
                                                        answered && isCorrect && "border-emerald-400/50 bg-emerald-500/10 text-emerald-100",
                                                        answered && selected && !isCorrect && "border-red-400/50 bg-red-500/10 text-red-100",
                                                        answered && !selected && !isCorrect && "border-white/5 bg-black/20 text-zinc-600"
                                                    )}
                                                >
                                                    <span>{option}</span>
                                                    {answered && isCorrect && <CheckCircle2 className="h-4 w-4 text-emerald-300" />}
                                                    {answered && selected && !isCorrect && <XCircle className="h-4 w-4 text-red-300" />}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {answered && (
                                        <p className={cn("mt-3 text-sm", correct ? "text-emerald-200/80" : "text-zinc-400")}>
                                            {question.explanation}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </section>
                    );
                })}
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-black text-white">
                        Bonus: {correctCount}/{source.questions.length} correct
                    </p>
                    <p className="text-xs text-zinc-500">Each correct answer adds 75 CQ Points.</p>
                </div>
                <button
                    type="button"
                    disabled={!allAnswered}
                    onClick={finishQuiz}
                    className={cn(
                        "rounded-xl px-5 py-3 text-sm font-black transition-all",
                        allAnswered
                            ? "bg-gradient-to-r from-amber-500 to-red-600 text-white hover:scale-[1.02]"
                            : "cursor-not-allowed bg-white/5 text-zinc-600"
                    )}
                >
                    Claim CQ Points
                </button>
            </div>
        </div>
    );
}
