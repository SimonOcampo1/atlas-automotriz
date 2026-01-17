import Link from "next/link";
import { BrandIcon } from "@/components/brand-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LearnQuizSelector } from "@/components/learn-quiz-selector";
import { ThemeToggle } from "@/components/theme-toggle";
import { getAllLogos } from "@/lib/logos";
import { getBrandKeyForName, getBrandsWithModels } from "@/lib/ultimatespecs";
import { ArrowLeft } from "lucide-react";

export default function LearnPage() {
  const logos = getAllLogos();
  const brandsWithModels = getBrandsWithModels();
  const brandMap = new Map(brandsWithModels.map((brand) => [brand.key, brand]));
  const modelBrands = logos
    .map((logo) => {
      const key = getBrandKeyForName(logo.name);
      if (!key) {
        return null;
      }
      const brand = brandMap.get(key);
      if (!brand) {
        return null;
      }
      return {
        key: brand.key,
        name: brand.name,
        modelCount: brand.models.length,
      };
    })
    .filter(Boolean) as Array<{ key: string; name: string; modelCount: number }>;
  const logoByBrandKey = Object.fromEntries(
    logos
      .map((logo) => {
        const key = getBrandKeyForName(logo.name);
        if (!key || !brandMap.has(key)) {
          return null;
        }
        return [key, logo] as const;
      })
      .filter(Boolean) as Array<readonly [string, typeof logos[number]]>
  );

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
            <div className="self-center sm:self-start">
              <BrandIcon />
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                Aprendizaje guiado
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">
                Rutas de aprendizaje por niveles
              </h1>
              <p className="text-sm text-muted-foreground">
                Niveles balanceados por reconocimiento y dificultad real.
              </p>
            </div>
            <Badge variant="secondary">{logos.length} marcas</Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
        <Separator />
        <LearnQuizSelector
          logos={logos}
          modelBrands={modelBrands}
          logoByBrandKey={logoByBrandKey}
        />
      </main>
    </div>
  );
}
