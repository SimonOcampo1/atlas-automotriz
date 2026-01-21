"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Logo } from "@/lib/logos";
import type { TierMeta } from "@/lib/logo-tiers";
import { BRAND_COUNTRY_BY_SLUG } from "@/lib/brand-country-map";
import { COUNTRY_BY_CODE, UNKNOWN_COUNTRY } from "@/lib/country-data";
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, Trophy } from "lucide-react";

type Mode = "multiple" | "typed" | "country";
type Option = {
  value: string;
  label: string;
  code?: string;
};

type BestRun = {
  accuracy: number;
  timeMs: number;
  completedAt: number;
  completed: number;
  total: number;
};

type QuizClientProps = {
  tier: string;
  tierId: string;
  meta: TierMeta;
  logos: Logo[];
  initialMode?: Mode | null;
};

// CORRECCIÓN: Usamos ruta directa (sin /api/)
function getImageSrc(logo: Logo) {
  return logo.images.optimized;
}

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

function storageKey(tierId: string, mode: Mode) {
  return `quiz-best-${tierId}-${mode}`;
}

export function QuizClient({ tier, tierId, meta, logos, initialMode }: QuizClientProps) {
  const router = useRouter();
  const [selectDialogOpen, setSelectDialogOpen] = React.useState(!initialMode);
  const [resultDialogOpen, setResultDialogOpen] = React.useState(false);
  const [mode, setMode] = React.useState<Mode>("multiple");
  const [questions, setQuestions] = React.useState<Logo[]>([]);
  const [index, setIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<number, boolean>>({});
  const [answerStatus, setAnswerStatus] = React.useState<"idle" | "correct" | "incorrect">("idle");
  const [options, setOptions] = React.useState<Option[]>([]);
  const [selectedOption, setSelectedOption] = React.useState<string | null>(null);
  const [typedValue, setTypedValue] = React.useState("");
  const [startedAt, setStartedAt] = React.useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = React.useState(0);
  const [bestRuns, setBestRuns] = React.useState<Record<Mode, BestRun | null>>({
    multiple: null,
    typed: null,
    country: null,
  });
  const hasAutoStarted = React.useRef(false);

  const countryCodes = React.useMemo(() => {
    const set = new Set<string>();
    logos.forEach((logo) => {
      const code = BRAND_COUNTRY_BY_SLUG[logo.slug];
      if (code) {
        set.add(code);
      }
    });
    return Array.from(set);
  }, [logos]);

  React.useEffect(() => {
    const load = (modeKey: Mode) => {
      const raw = window.localStorage.getItem(storageKey(tierId, modeKey));
      if (!raw) {
        return null;
      }
      try {
        return JSON.parse(raw) as BestRun;
      } catch {
        return null;
      }
    };

    setBestRuns({
      multiple: load("multiple"),
      typed: load("typed"),
      country: load("country"),
    });
  }, [tierId]);

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
    if (questions.length === 0 || (mode !== "multiple" && mode !== "country")) {
      return;
    }
    const current = questions[index];
    if (!current) {
      return;
    }
    if (mode === "multiple") {
      const pool = logos.filter((logo) => logo.slug !== current.slug);
      const shuffled = shuffle(pool).slice(0, 3).map((logo) => logo.name);
      const choices = shuffle([current.name, ...shuffled]).map((name) => ({
        value: name,
        label: name,
      }));
      setOptions(choices);
      setSelectedOption(null);
      return;
    }
    const correctCode = BRAND_COUNTRY_BY_SLUG[current.slug] ?? UNKNOWN_COUNTRY.code;
    const poolSource = countryCodes.length > 3 ? countryCodes : Object.keys(COUNTRY_BY_CODE);
    const pool = poolSource.filter((code) => code !== correctCode);
    const shuffled = shuffle(pool).slice(0, 3);
    const choices = shuffle([correctCode, ...shuffled]).map((code) => {
      const country = COUNTRY_BY_CODE[code] ?? UNKNOWN_COUNTRY;
      return {
        value: code,
        label: country.name,
        code: country.code,
      };
    });
    setOptions(choices);
    setSelectedOption(null);
  }, [index, questions, logos, mode, countryCodes]);

  const current = questions[index];
  const total = questions.length;
  const lettersCount = current ? current.name.replace(/\s+/g, "").length : 0;
  const correctCount = Object.values(answers).filter(Boolean).length;
  const completionRate = total > 0 ? Math.round((Object.keys(answers).length / total) * 100) : 0;

  const startQuiz = (selectedMode: Mode) => {
    setMode(selectedMode);
    setSelectDialogOpen(false);
    setAnswers({});
    setIndex(0);
    setTypedValue("");
    setSelectedOption(null);
    setElapsedMs(0);
    setStartedAt(Date.now());
    setQuestions(shuffle(logos));
    setAnswerStatus("idle");
  };

  React.useEffect(() => {
    if (hasAutoStarted.current) {
      return;
    }
    if (initialMode === "multiple" || initialMode === "typed" || initialMode === "country") {
      hasAutoStarted.current = true;
      startQuiz(initialMode);
    }
  }, [initialMode]);

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
    const best = bestRuns[mode];
    const shouldReplace =
      !best ||
      run.completed > best.completed ||
      (run.completed === best.completed && accuracy > best.accuracy) ||
      (run.completed === best.completed && accuracy === best.accuracy && run.timeMs < best.timeMs);
    if (shouldReplace) {
      window.localStorage.setItem(storageKey(tierId, mode), JSON.stringify(run));
      setBestRuns((prev) => ({ ...prev, [mode]: run }));
    }

    setResultDialogOpen(true);
  };

  const handleAnswer = (isCorrect: boolean) => {
    setAnswerStatus(isCorrect ? "correct" : "incorrect");
    setAnswers((prev) => ({ ...prev, [index]: isCorrect }));
  };

  const handlePrev = () => {
    if (index > 0) {
      setIndex(index - 1);
      setAnswerStatus("idle");
      setTypedValue("");
      setSelectedOption(null);
    }
  };

  const handleNext = () => {
    if (index < total - 1) {
      setIndex(index + 1);
      setAnswerStatus("idle");
      setTypedValue("");
      setSelectedOption(null);
    }
  };

  const handleTypedSubmit = () => {
    if (!current) {
      return;
    }
    const normalized = typedValue.trim().toLowerCase();
    const isCorrect = normalized === current.name.trim().toLowerCase();
    handleAnswer(isCorrect);
  };

  const bestLabel = (modeKey: Mode) => {
    const best = bestRuns[modeKey];
    if (!best) {
      return "Sin registros";
    }
    return `${best.accuracy}% · ${best.completed}/${best.total} · ${formatTime(best.timeMs)}`;
  };

  const isRevealed = answers[index] !== undefined;
  const expectedValue = React.useMemo(() => {
    if (!current) {
      return "";
    }
    if (mode === "country") {
      return BRAND_COUNTRY_BY_SLUG[current.slug] ?? UNKNOWN_COUNTRY.code;
    }
    return current.name;
  }, [current, mode]);


  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              asChild
              className="w-fit rounded-full border-border/60 bg-background/80 hover:bg-foreground/10"
            >
              <Link href={`/tiers/${tier}`} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Volver al nivel
              </Link>
            </Button>
            <ThemeToggle />
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-muted/40 text-sm font-semibold text-foreground">
              {meta.level}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Quiz · {meta.label}
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
                    <span className="text-xs font-medium text-muted-foreground sm:text-sm">completado</span>
                  </div>
                </div>
                {mode === "typed" && <span>Letras: {lettersCount}</span>}
              </div>
            )}
          </div>
        </div>
      </header>

      {questions.length > 0 && current && (
        <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
          <div className="flex flex-col items-center gap-4">
            <div className="flex w-full items-center justify-center overflow-hidden rounded-2xl bg-white p-6">
              <img
                src={getImageSrc(current)}
                alt={`Logo de ${current.name}`}
                className={`max-h-[40vh] w-auto object-contain ${
                  mode === "country"
                    ? "blur-0"
                    : isRevealed
                    ? "blur-0 transition-[filter] duration-500"
                    : "blur-md"
                }`}
              />
            </div>

            {mode === "multiple" ? (
              <div className="grid w-full gap-3 sm:grid-cols-2">
                {options.map((option) => {
                  const isSelected = selectedOption === option.value;
                  const isCorrect = option.value === expectedValue;
                  const showFeedback = answers[index] !== undefined && isSelected;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={answers[index] !== undefined}
                      onClick={() => {
                        setSelectedOption(option.value);
                        handleAnswer(isCorrect);
                      }}
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
            ) : mode === "country" ? (
              <div className="grid w-full gap-3 sm:grid-cols-2">
                {options.map((option) => {
                  const isSelected = selectedOption === option.value;
                  const isCorrect = option.value === expectedValue;
                  const showFeedback = answers[index] !== undefined && isSelected;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={answers[index] !== undefined}
                      onClick={() => {
                        setSelectedOption(option.value);
                        handleAnswer(isCorrect);
                      }}
                      className={`flex items-center gap-3 rounded-lg border border-border/60 px-4 py-3 text-left text-sm transition ${
                        showFeedback && isCorrect
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600"
                          : showFeedback && !isCorrect
                          ? "border-rose-500/50 bg-rose-500/10 text-rose-600"
                          : "bg-background/80 hover:bg-foreground/5"
                      }`}
                    >
                      {option.code && option.code !== UNKNOWN_COUNTRY.code ? (
                        // CORRECCIÓN: Ruta directa a banderas SVG
                        <img
                          src={`/flags/SVG/${option.code}.svg`}
                          alt={`Bandera de ${option.label}`}
                          className="h-6 w-9 rounded-sm border border-border/60 object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-6 w-9 rounded-sm border border-border/60 bg-muted/60" />
                      )}
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex w-full flex-col gap-3">
                <Input
                  value={typedValue}
                  onChange={(event) => setTypedValue(event.target.value)}
                  placeholder="Escribe la marca"
                  disabled={answers[index] !== undefined}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && answers[index] === undefined) {
                      handleTypedSubmit();
                    }
                  }}
                />
                <Button onClick={handleTypedSubmit} disabled={answers[index] !== undefined}>
                  Confirmar
                </Button>
                {answers[index] === false && (
                  <p className="text-xs text-rose-500">
                    Incorrecto. La respuesta era {current.name}.
                  </p>
                )}
              </div>
            )}
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
        <DialogContent
          className="w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] px-6 sm:max-w-3xl"
          onInteractOutside={(e) => {
            e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Selecciona el modo de quiz</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background/80 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Multiple choice</p>
                  <p className="text-xs text-muted-foreground">
                    4 opciones por logo
                  </p>
                </div>
                <Badge variant="outline">{bestLabel("multiple")}</Badge>
              </div>
              <Button onClick={() => startQuiz("multiple")}>Empezar</Button>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background/80 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Tipeado</p>
                  <p className="text-xs text-muted-foreground">
                    Escribe la marca correcta
                  </p>
                </div>
                <Badge variant="outline">{bestLabel("typed")}</Badge>
              </div>
              <Button onClick={() => startQuiz("typed")}>Empezar</Button>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background/80 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">País de origen</p>
                  <p className="text-xs text-muted-foreground">
                    4 opciones con bandera
                  </p>
                </div>
                <Badge variant="outline">{bestLabel("country")}</Badge>
              </div>
              <Button onClick={() => startQuiz("country")}>Empezar</Button>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => router.push(`/tiers/${tier}`)}
            className="mt-2"
          >
            Cancelar
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={resultDialogOpen} onOpenChange={setResultDialogOpen}>
        <DialogContent className="mx-4 w-[calc(100%-2rem)] max-w-md px-6 sm:mx-0">
          <DialogHeader>
            <DialogTitle>Resultado del quiz</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              Aciertos: <strong>{correctCount}</strong> de {Object.keys(answers).length} respondidas
            </p>
            <p className="text-sm">
              Precisión: <strong>
                {Object.keys(answers).length > 0
                  ? Math.round((correctCount / Object.keys(answers).length) * 100)
                  : 0}%
              </strong>
            </p>
            <p className="text-sm">
              Completitud: <strong>{completionRate}%</strong>
            </p>
            <p className="text-sm">
              Tiempo: <strong>{formatTime(elapsedMs)}</strong>
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => {
                setResultDialogOpen(false);
                setSelectDialogOpen(true);
              }}>
                Reintentar
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/tiers/${tier}`}>
                  Volver al nivel
                </Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
