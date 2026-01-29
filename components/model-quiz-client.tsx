"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, Trophy } from "lucide-react";

export type ModelQuizItem = {
  id: string;
  name: string;
  imageSrc: string | null;
  years: string;
  generationImages?: string[];
};

type Option = {
  value: string;
  label: string;
};

type BestRun = {
  accuracy: number;
  timeMs: number;
  completedAt: number;
  completed: number;
  total: number;
};

type Props = {
  brandName: string;
  brandKey: string;
  models: ModelQuizItem[];
  initialOpen?: boolean;
  autoStart?: boolean;
};

function formatTime(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function shuffle<T>(items: T[]) {
  const clone = [...items];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

function storageKey(brandKey: string) {
  return `model-quiz-best-${brandKey}`;
}

export function ModelQuizClient({
  brandName,
  brandKey,
  models,
  initialOpen = true,
  autoStart = false,
}: Props) {
  const eligible = React.useMemo(
    () => models.filter((model) => model.imageSrc),
    [models]
  );

  const [selectDialogOpen, setSelectDialogOpen] = React.useState(initialOpen);
  const [resultDialogOpen, setResultDialogOpen] = React.useState(false);
  const [questions, setQuestions] = React.useState<ModelQuizItem[]>([]);
  const [index, setIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<number, boolean>>({});
  const [answerStatus, setAnswerStatus] = React.useState<"idle" | "correct" | "incorrect">("idle");
  const [options, setOptions] = React.useState<Option[]>([]);
  const [selectedOption, setSelectedOption] = React.useState<string | null>(null);
  const [startedAt, setStartedAt] = React.useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = React.useState(0);
  const [bestRun, setBestRun] = React.useState<BestRun | null>(null);
  const [carouselIndex, setCarouselIndex] = React.useState(0);

  const current = questions[index];
  const total = questions.length;
  const correctCount = Object.values(answers).filter(Boolean).length;
  const completionRate = total > 0 ? Math.round((Object.keys(answers).length / total) * 100) : 0;

  React.useEffect(() => {
    const raw = window.localStorage.getItem(storageKey(brandKey));
    if (!raw) {
      return;
    }
    try {
      setBestRun(JSON.parse(raw) as BestRun);
    } catch {
      setBestRun(null);
    }
  }, [brandKey]);

  React.useEffect(() => {
    if (!startedAt || questions.length === 0) {
      return;
    }
    const id = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 250);
    return () => window.clearInterval(id);
  }, [startedAt, questions.length]);

  React.useEffect(() => {
    if (!current) {
      return;
    }
    const pool = eligible.filter((model) => model.id !== current.id);
    const shuffled = shuffle(pool).slice(0, 3).map((model) => model.name);
    const choices = shuffle([current.name, ...shuffled]).map((name) => ({
      value: name,
      label: name,
    }));
    setOptions(choices);
    setSelectedOption(null);
  }, [current, eligible]);

  React.useEffect(() => {
    setCarouselIndex(0);
  }, [current?.id]);

  React.useEffect(() => {
    if (!autoStart || eligible.length < 4) {
      return;
    }
    if (!selectDialogOpen && questions.length > 0) {
      return;
    }
    setSelectDialogOpen(false);
    setAnswers({});
    setIndex(0);
    setElapsedMs(0);
    setStartedAt(Date.now());
    setQuestions(shuffle(eligible));
    setAnswerStatus("idle");
  }, [autoStart, eligible, selectDialogOpen, questions.length]);

  const startQuiz = () => {
    setSelectDialogOpen(false);
    setAnswers({});
    setIndex(0);
    setElapsedMs(0);
    setStartedAt(Date.now());
    setQuestions(shuffle(eligible));
    setAnswerStatus("idle");
  };

  const finalizeQuiz = () => {
    const answeredCount = Object.keys(answers).length;
    const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
    const run: BestRun = {
      accuracy,
      timeMs: elapsedMs,
      completedAt: Date.now(),
      completed: answeredCount,
      total,
    };

    const shouldReplace =
      !bestRun ||
      run.completed > bestRun.completed ||
      (run.completed === bestRun.completed && accuracy > bestRun.accuracy) ||
      (run.completed === bestRun.completed && accuracy === bestRun.accuracy && run.timeMs < bestRun.timeMs);

    if (shouldReplace) {
      window.localStorage.setItem(storageKey(brandKey), JSON.stringify(run));
      setBestRun(run);
    }

    setResultDialogOpen(true);
  };

  const handleAnswer = (option: Option) => {
    if (!current) {
      return;
    }
    const isCorrect = option.value === current.name;
    setSelectedOption(option.value);
    setAnswerStatus(isCorrect ? "correct" : "incorrect");
    setAnswers((prev) => ({ ...prev, [index]: isCorrect }));
  };

  const handlePrev = () => {
    if (index > 0) {
      setIndex(index - 1);
      setAnswerStatus("idle");
      setSelectedOption(null);
    }
  };

  const handleNext = () => {
    if (index < total - 1) {
      setIndex(index + 1);
      setAnswerStatus("idle");
      setSelectedOption(null);
    }
  };

  const galleryImages = React.useMemo(() => {
    if (!current) {
      return [] as string[];
    }
    const sources = (current.generationImages ?? []).filter(Boolean);
    if (current.imageSrc) {
      sources.unshift(current.imageSrc);
    }
    return Array.from(new Set(sources));
  }, [current]);

  const activeImage = galleryImages[carouselIndex] ?? current?.imageSrc ?? null;
  const canNavigateGallery = galleryImages.length > 1;
  const handlePrevImage = () => {
    if (!canNavigateGallery) {
      return;
    }
    setCarouselIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const handleNextImage = () => {
    if (!canNavigateGallery) {
      return;
    }
    setCarouselIndex((prev) => (prev + 1) % galleryImages.length);
  };

  if (eligible.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-10 text-center text-sm text-muted-foreground">
        No hay modelos con imagen disponible para este quiz.
      </div>
    );
  }

  if (eligible.length < 4) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-10 text-center text-sm text-muted-foreground">
        Se necesitan al menos 4 modelos con imagen para iniciar el quiz.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-muted/30">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              asChild
              className="w-fit rounded-full border-border/60 bg-background/80 hover:bg-foreground/10"
            >
              <Link href={`/model-quiz/${brandKey}`} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver a modelos
              </Link>
            </Button>
            <ThemeToggle />
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Quiz · {brandName}
            </h1>
            {questions.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
                <span>Pregunta {index + 1} de {total}</span>
                <div className="flex items-center gap-4 rounded-full border border-border/60 bg-background/70 px-4 py-2 text-base font-semibold text-foreground sm:text-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>{formatTime(elapsedMs)}</span>
                  </div>
                  <div className="h-4 w-px bg-border/60" />
                  <div className="flex items-center gap-2">
                    <span>{completionRate}%</span>
                    <span className="text-xs font-medium text-muted-foreground sm:text-sm">
                      completado
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {questions.length > 0 && current && (
        <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
          <div className="flex flex-col items-center gap-4">
            <div className="flex w-full items-center justify-center overflow-hidden rounded-2xl bg-transparent">
              {activeImage ? (
                <img
                  src={activeImage}
                  alt={current.name}
                  className="max-h-[40vh] w-full rounded-2xl object-cover"
                />
              ) : (
                <span className="text-xs text-muted-foreground">Imagen no disponible</span>
              )}
            </div>

            {galleryImages.length > 0 && (
              <div className="flex w-full items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handlePrevImage}
                  disabled={!canNavigateGallery}
                  className="border-border/60 bg-background/80"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-xs text-muted-foreground">
                  Imagen {Math.min(carouselIndex + 1, galleryImages.length)} de {galleryImages.length}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleNextImage}
                  disabled={!canNavigateGallery}
                  className="border-border/60 bg-background/80"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="grid w-full gap-3 sm:grid-cols-2">
              {options.map((option) => {
                const isSelected = selectedOption === option.value;
                const isCorrect = option.value === current.name;
                const showFeedback = answers[index] !== undefined && isSelected;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={answers[index] !== undefined}
                    onClick={() => handleAnswer(option)}
                    className={`rounded-lg border border-border/60 px-4 py-3 text-left text-sm transition ${
                      showFeedback && isCorrect
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600"
                        : showFeedback && !isCorrect
                        ? "border-rose-500/50 bg-rose-500/10 text-rose-600"
                        : "bg-background/80 hover:bg-foreground/5"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={index === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>

            <Button
              variant="default"
              onClick={finalizeQuiz}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <Trophy className="h-4 w-4" />
              Finalizar
            </Button>

            <Button
              variant="outline"
              onClick={handleNext}
              disabled={index === total - 1}
              className="flex items-center gap-2"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </main>
      )}

      <Dialog open={selectDialogOpen} onOpenChange={setSelectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quiz de modelos · {brandName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Solo opción múltiple con 4 respuestas por pregunta.
            </p>
            <Button onClick={startQuiz} className="w-full bg-white text-black hover:bg-white/90">
              Empezar quiz
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Resultado del quiz</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Trophy className="h-4 w-4" />
                Rendimiento
              </div>
              <p className="text-2xl font-semibold text-foreground">
                {correctCount}/{total}
              </p>
              <p className="text-sm text-muted-foreground">
                Precisión: {total > 0 ? Math.round((correctCount / total) * 100) : 0}%
              </p>
            </div>
            {bestRun ? (
              <div className="rounded-xl border border-border/60 bg-white p-4 text-sm text-muted-foreground dark:bg-black/30">
                Mejor registro: {bestRun.accuracy}% · {bestRun.completed}/{bestRun.total} · {formatTime(bestRun.timeMs)}
              </div>
            ) : null}
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => setResultDialogOpen(false)}
                className="border-border/60 bg-white/60 text-foreground hover:bg-muted/40"
                variant="outline"
              >
                Volver a resultados
              </Button>
              <Button variant="outline" asChild className="border-border/60 bg-white/60 text-foreground hover:bg-muted/40">
                <Link href="/learn">Volver a aprendizaje</Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
