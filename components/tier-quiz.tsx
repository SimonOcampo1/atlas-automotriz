"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Mode = "multiple" | "typed" | "country";

type TierQuizProps = {
  tierId: string;
  tierLabel: string;
};
type BestRun = {
  accuracy: number;
  timeMs: number;
  completedAt: number;
  completed: number;
  total: number;
};

function storageKey(tierId: string, mode: Mode) {
  return `quiz-best-${tierId}-${mode}`;
}

function formatTime(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function TierQuiz({ tierId, tierLabel }: TierQuizProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [bestRuns, setBestRuns] = React.useState<Record<Mode, BestRun | null>>({
    multiple: null,
    typed: null,
    country: null,
  });

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

  const bestLabel = (modeKey: Mode) => {
    const best = bestRuns[modeKey];
    if (!best) {
      return "Sin registros";
    }
    return `${best.accuracy}% · ${best.completed}/${best.total} · ${formatTime(best.timeMs)}`;
  };

  return (
    <>
      <Button
        className="bg-white text-black hover:bg-white/90"
        onClick={() => setOpen(true)}
      >
        Empezar quiz
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] px-6 sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Quiz · {tierLabel}</DialogTitle>
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
              <Button onClick={() => router.push(`/tiers/${tierId}/quiz?mode=multiple`)}>
                Empezar
              </Button>
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
              <Button onClick={() => router.push(`/tiers/${tierId}/quiz?mode=typed`)}>
                Empezar
              </Button>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background/80 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">País de origen</p>
                  <p className="text-xs text-muted-foreground">
                    Adivina el país con 4 opciones
                  </p>
                </div>
                <Badge variant="outline">{bestLabel("country")}</Badge>
              </div>
              <Button onClick={() => router.push(`/tiers/${tierId}/quiz?mode=country`)}>
                Empezar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
