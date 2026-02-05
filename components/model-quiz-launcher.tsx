"use client";

import * as React from "react";
import Link from "next/link";
import { translate, type Locale } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  brandKey: string;
  brandName: string;
  locale: Locale;
};

type BestRun = {
  accuracy: number;
  timeMs: number;
  completedAt: number;
  completed: number;
  total: number;
};

function formatTime(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function storageKey(brandKey: string) {
  return `model-quiz-best-${brandKey}`;
}

export function ModelQuizLauncher({ brandKey, brandName, locale }: Props) {
  const [open, setOpen] = React.useState(false);
  const [bestRun, setBestRun] = React.useState<BestRun | null>(null);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    const raw = window.localStorage.getItem(storageKey(brandKey));
    if (!raw) {
      setBestRun(null);
      return;
    }
    try {
      setBestRun(JSON.parse(raw) as BestRun);
    } catch {
      setBestRun(null);
    }
  }, [open, brandKey]);

  return (
    <>
      <Button
        className="bg-white text-black hover:bg-white/90"
        onClick={() => setOpen(true)}
      >
        {translate(locale, "quiz.start")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] px-6 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {translate(locale, "quiz.modelQuizTitle", { brand: brandName })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {translate(locale, "quiz.onlyMultiple")}
            </p>
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/80 p-3 text-sm">
              <span className="text-muted-foreground">
                {translate(locale, "quiz.bestRun")}
              </span>
              <Badge variant="outline">
                {bestRun
                  ? `${bestRun.accuracy}% · ${bestRun.completed}/${bestRun.total} · ${formatTime(bestRun.timeMs)}`
                  : translate(locale, "quiz.noRecords")}
              </Badge>
            </div>
            <Button asChild className="bg-white text-black hover:bg-white/90">
              <Link href={`/model-quiz/${brandKey}/play`}>
                {translate(locale, "quiz.start")}
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
