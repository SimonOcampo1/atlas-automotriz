import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { ModelCatalog } from "@/components/model-catalog";
import {
  getUltimateSpecsBrandByKey,
  getUltimateSpecsImageSrc,
} from "@/lib/ultimatespecs";
import { ArrowLeft } from "lucide-react";

export default async function BrandModelsPage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const { brand } = await params;
  const brandData = await getUltimateSpecsBrandByKey(brand);

  if (!brandData) {
    notFound();
  }

  const modelKeys = new Set(
    brandData.models
      .filter((model) => model.source === "model")
      .map((model) => model.key)
  );
  const visibleModels = brandData.models.filter((model) => (
    model.source === "model" || !modelKeys.has(model.key)
  ));
  const items = visibleModels.map((model) => {
    const hasGenerations = model.generations.length > 0;
    return {
      id: model.id,
      title: model.name,
      years: model.years,
      imageSrc: getUltimateSpecsImageSrc(model.representativeImage),
      actionLabel: hasGenerations ? "Ver Generaciones" : undefined,
      actionHref: hasGenerations ? `/brands/${brandData.key}/models/${model.key}` : undefined,
    };
  });

  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background to-muted/30">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6">
          <Button
            variant="outline"
            asChild
            className="w-fit rounded-full border-border/60 bg-background/80 hover:bg-foreground/10"
          >
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver al atlas
            </Link>
          </Button>
          <div className="relative flex flex-col items-center gap-3 text-center sm:items-start sm:text-left">
            <div className="absolute right-0 top-0">
              <ThemeToggle />
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Modelos por marca
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">
                {brandData.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Selecciona un modelo para ver sus generaciones.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{visibleModels.length} modelos</Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
        <Separator />
        <ModelCatalog
          items={items}
          emptyLabel="Esta marca no tiene modelos disponibles."
        />
      </main>
    </div>
  );
}
