"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { translate, type Locale } from "@/lib/i18n";
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
  locale: Locale;
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

export function TierQuiz({ tierId, tierLabel, locale }: TierQuizProps) {
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
      return translate(locale, "quiz.noRecords");
    }
    return `${best.accuracy}% · ${best.completed}/${best.total} · ${formatTime(best.timeMs)}`;
  };

  return (
    <>
      <Button
        className="bg-white text-black hover:bg-white/90"
        onClick={() => setOpen(true)}
      >
        {translate(locale, "quiz.start")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] px-6 sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {translate(locale, "quiz.brandQuizTitle", { label: tierLabel })}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background/80 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {translate(locale, "quiz.multipleChoice")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {translate(locale, "quiz.optionsPerLogo")}
                  </p>
                </div>
                <Badge variant="outline">{bestLabel("multiple")}</Badge>
              </div>
              <Button onClick={() => router.push(`/tiers/${tierId}/quiz?mode=multiple`)}>
                {translate(locale, "quiz.startShort")}
              </Button>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background/80 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{translate(locale, "quiz.typed")}</p>
                  <p className="text-xs text-muted-foreground">
                    {translate(locale, "quiz.typeCorrectBrand")}
                  </p>
                </div>
                <Badge variant="outline">{bestLabel("typed")}</Badge>
              </div>
              <Button onClick={() => router.push(`/tiers/${tierId}/quiz?mode=typed`)}>
                {translate(locale, "quiz.startShort")}
              </Button>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background/80 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {translate(locale, "quiz.countryOrigin")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {translate(locale, "quiz.optionsWithFlag")}
                  </p>
                </div>
                <Badge variant="outline">{bestLabel("country")}</Badge>
              </div>
              <Button onClick={() => router.push(`/tiers/${tierId}/quiz?mode=country`)}>
                {translate(locale, "quiz.startShort")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
