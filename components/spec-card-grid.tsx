"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type SpecCardItem = {
  id: string;
  title: string;
  years: string;
  imageSrc: string | null;
  actionLabel?: string;
  actionHref?: string;
};

type Props = {
  items: SpecCardItem[];
  emptyLabel?: string;
};

export function SpecCardGrid({ items, emptyLabel }: Props) {
  const [selected, setSelected] = React.useState<SpecCardItem | null>(null);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-10 text-center text-sm text-muted-foreground">
        {emptyLabel ?? "No hay elementos para mostrar."}
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card
            key={item.id}
            className="border-none bg-transparent shadow-none"
          >
            <CardContent className="flex h-full flex-col p-0">
              <button
                type="button"
                onClick={() => item.imageSrc && setSelected(item)}
                className="flex h-52 w-full items-center justify-center overflow-hidden rounded-2xl bg-transparent p-0 transition"
              >
                {item.imageSrc ? (
                  <img
                    src={item.imageSrc}
                    alt={item.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Imagen no disponible
                  </span>
                )}
              </button>
              <div className="flex flex-1 flex-col gap-2 border-b border-border/60 px-3 py-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <Badge variant="secondary">{item.years}</Badge>
                </div>
                {item.actionLabel && item.actionHref ? (
                  <Button
                    asChild
                    variant="outline"
                    className="mt-auto w-full border-border/60 text-foreground hover:bg-foreground/10 hover:text-foreground"
                  >
                    <Link href={item.actionHref}>{item.actionLabel}</Link>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selected?.title ?? "Imagen"}</DialogTitle>
          </DialogHeader>
          {selected?.imageSrc ? (
            <div className="flex flex-col items-center gap-4">
              <div className="flex w-full items-center justify-center rounded-2xl bg-white p-6">
                <img
                  src={selected.imageSrc}
                  alt={selected.title}
                  className="max-h-[70vh] w-auto object-contain"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Vista ampliada de la imagen seleccionada.
              </p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
