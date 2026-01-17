"use client";

import * as React from "react";
import Link from "next/link";
import type { Logo } from "@/lib/logos";
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
};

type Mode = "brand" | "model" | null;

function getImageSrc(logo: Logo | undefined) {
  if (!logo) {
    return null;
  }
  return `/api/logo/${logo.images.thumb}`;
}

export function LearnQuizSelector({ logos, modelBrands, logoByBrandKey }: Props) {
  const [mode, setMode] = React.useState<Mode>(null);

  return (
    <section className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode("brand")}
          className="rounded-2xl border border-border/60 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg dark:bg-black/30"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Quiz clásico
              </p>
              <h3 className="text-xl font-semibold">Quiz de logos</h3>
              <p className="text-sm text-muted-foreground">
                8 niveles con dificultad progresiva.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/30">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setMode("model")}
          className="rounded-2xl border border-border/60 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg dark:bg-black/30"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Nuevo
              </p>
              <h3 className="text-xl font-semibold">Quiz de modelos</h3>
              <p className="text-sm text-muted-foreground">
                Selecciona una marca y responde por modelos.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/30">
              <CarFront className="h-6 w-6" />
            </div>
          </div>
        </button>
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ${
          mode === "brand"
            ? "max-h-none opacity-100 translate-y-0"
            : "max-h-0 opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        <LogoTiers logos={logos} />
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ${
          mode === "model"
            ? "max-h-none opacity-100 translate-y-0"
            : "max-h-0 opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Marcas con modelos</h2>
            <Badge variant="secondary">{modelBrands.length} marcas</Badge>
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
                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white">
                          {imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={`Logo de ${brand.name}`}
                              className="max-h-6 w-auto object-contain"
                              loading="lazy"
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">Logo</span>
                          )}
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-foreground">{brand.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {brand.modelCount} modelos
                          </p>
                        </div>
                      </div>
                      <div className="mt-auto flex items-center justify-end">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-9 w-9 rounded-full border-border/60 bg-background/80 hover:bg-foreground/10"
                          aria-label="Ver marca"
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
    </section>
  );
}
