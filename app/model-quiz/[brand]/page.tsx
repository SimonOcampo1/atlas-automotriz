import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { translate } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";
import { ModelQuizLauncher } from "@/components/model-quiz-launcher";
import { ModelCatalog } from "@/components/model-catalog";
import {
  getUltimateSpecsBrandByKey,
  getUltimateSpecsImageSrc,
} from "@/lib/ultimatespecs";
import { ArrowLeft } from "lucide-react";

export default async function ModelQuizPage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const locale = await getServerLocale();
  const { brand } = await params;
  const brandData = await getUltimateSpecsBrandByKey(brand);

  if (!brandData) {
    notFound();
  }

  const items = brandData.models.map((model) => ({
    id: model.id,
    title: model.name,
    years: model.years,
    imageSrc: getUltimateSpecsImageSrc(model.representativeImage),
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
            <Link href="/learn" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {translate(locale, "general.backToLearning")}
            </Link>
          </Button>
          <div className="relative flex flex-col items-center gap-3 text-center sm:items-start sm:text-left">
            <div className="absolute right-0 top-0">
              <div className="flex items-center gap-2">
                <LanguageToggle locale={locale} />
                <ThemeToggle />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {translate(locale, "learn.modelQuiz")}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">
                {brandData.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {translate(locale, "quiz.onlyMultiple")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {translate(locale, "counts.models", { count: brandData.models.length })}
              </Badge>
            </div>
            <ModelQuizLauncher
              brandKey={brandData.key}
              brandName={brandData.name}
              locale={locale}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
        <Separator />
        <ModelCatalog
          items={items}
          emptyLabel={translate(locale, "empty.noModelsToShow")}
          locale={locale}
        />
      </main>
    </div>
  );
}
