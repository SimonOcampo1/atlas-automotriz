"use client";

import * as React from "react";
import Link from "next/link";
import type { Logo } from "@/lib/logos";
import { translate, type Locale } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogoTiers } from "@/components/logo-tiers";
import { CarFront, ShieldCheck, ArrowRight } from "lucide-react";

type ModelBrand = {
  key: string;
  name: string;
  modelCount: number;
};

type Props = {
  logos: Logo[];
  modelBrands: ModelBrand[];
  logoByBrandKey: Record<string, Logo | undefined>;
  locale: Locale;
};

type Mode = "brand" | "model" | null;

// CORRECCIÓN 1: Eliminamos "/api/logo/" para usar la ruta directa pública
function getImageSrc(logo: Logo | undefined) {
  if (!logo) {
    return null;
  }
  return logo.images.thumb;
}

export function LearnQuizSelector({ logos, modelBrands, logoByBrandKey, locale }: Props) {
  const [mode, setMode] = React.useState<Mode>(null);
  
  // CORRECCIÓN 2: Referencia para el scroll automático
  const contentRef = React.useRef<HTMLDivElement>(null);

  const handleModeSelect = (newMode: Mode) => {
    setMode(newMode);
    // Esperamos un momento para que el navegador renderice la apertura y luego scrolleamos
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  return (
    <section className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => handleModeSelect("brand")}
          className={`rounded-2xl border p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:bg-black/30 ${
            mode === "brand" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border/60 bg-white"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {translate(locale, "learn.classicQuiz")}
              </p>
              <h3 className="text-xl font-semibold">{translate(locale, "learn.logoQuiz")}</h3>
              <p className="text-sm text-muted-foreground">
                {translate(locale, "learn.logoQuizDesc")}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/30">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleModeSelect("model")}
          className={`rounded-2xl border p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:bg-black/30 ${
            mode === "model" ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border/60 bg-white"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {translate(locale, "learn.new")}
              </p>
              <h3 className="text-xl font-semibold">{translate(locale, "learn.modelQuiz")}</h3>
              <p className="text-sm text-muted-foreground">
                {translate(locale, "learn.modelQuizDesc")}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/30">
              <CarFront className="h-6 w-6" />
            </div>
          </div>
        </button>
      </div>

      {/* Ancla para el scroll automático */}
      <div ref={contentRef} className="scroll-mt-24">
        {/* Sección de Logos (Brand) */}
        <div
          className={`overflow-hidden transition-all duration-300 ${
            mode === "brand"
              ? "max-h-[5000px] opacity-100 translate-y-0"
              : "max-h-0 opacity-0 translate-y-2 pointer-events-none"
          }`}
        >
          <LogoTiers logos={logos} locale={locale} />
        </div>

        {/* Sección de Modelos */}
        <div
          className={`overflow-hidden transition-all duration-300 ${
            mode === "model"
              ? "max-h-[5000px] opacity-100 translate-y-0"
              : "max-h-0 opacity-0 translate-y-2 pointer-events-none"
          }`}
        >
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">
                {translate(locale, "learn.brandsWithModels")}
              </h2>
              <Badge variant="secondary">
                {translate(locale, "counts.brands", { count: modelBrands.length })}
              </Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {modelBrands.map((brand) => {
                const logo = logoByBrandKey[brand.key];
                const imageSrc = getImageSrc(logo);
                return (
                  <Link key={brand.key} href={`/model-quiz/${brand.key}`} className="group">
                    <Card className="relative flex flex-col border-border/60 bg-white transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-xl dark:bg-black/30">
                      <CardContent className="flex h-full flex-col gap-4 p-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white p-1">
                            {imageSrc ? (
                              <img
                                src={imageSrc}
                                alt={translate(locale, "dialog.logoOf", { name: brand.name })}
                                className="max-h-full w-auto object-contain"
                                loading="lazy"
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {translate(locale, "placeholder.logo")}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-foreground">{brand.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {translate(locale, "counts.models", {
                                count: brand.modelCount,
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="mt-auto flex items-center justify-end">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-9 w-9 rounded-full border-border/60 bg-background/80 hover:bg-foreground/10"
                            aria-label={translate(locale, "button.viewBrand")}
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
