import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { SpecCardGrid } from "@/components/spec-card-grid";
import {
  getUltimateSpecsBrandByKey,
  getUltimateSpecsImageSrc,
} from "@/lib/ultimatespecs";
import { ArrowLeft } from "lucide-react";

export default async function ModelGenerationsPage({
  params,
}: {
  params: Promise<{ brand: string; model: string }>;
}) {
  const { brand, model } = await params;
  const brandData = getUltimateSpecsBrandByKey(brand);

  if (!brandData) {
    notFound();
  }

  const modelData = brandData.models.find((item) => item.key === model);
  if (!modelData) {
    notFound();
  }

  const items = modelData.generations.map((generation) => ({
    id: generation.id,
    title: generation.name,
    years: generation.years,
    imageSrc: getUltimateSpecsImageSrc(generation.image),
  }));

  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-muted/30">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6">
          <Button
            variant="outline"
            asChild
            className="w-fit rounded-full border-border/60 bg-background/80 hover:bg-foreground/10"
          >
            <Link href={`/brands/${brandData.key}`} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver a modelos
            </Link>
          </Button>
          <div className="relative flex flex-col items-center gap-3 text-center sm:items-start sm:text-left">
            <div className="absolute right-0 top-0">
              <ThemeToggle />
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Generaciones
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">
                {modelData.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {brandData.name} · {modelData.years}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{modelData.generations.length} generaciones</Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
        <Separator />
        <SpecCardGrid
          items={items}
          emptyLabel="No hay generaciones disponibles para este modelo."
        />
      </main>
    </div>
  );
}
