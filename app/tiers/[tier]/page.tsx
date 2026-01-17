import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TierGallery } from "@/components/tier-gallery";
import { ThemeToggle } from "@/components/theme-toggle";
import { TierQuiz } from "@/components/tier-quiz";
import { getAllLogos } from "@/lib/logos";
import {
  getTierMeta,
  groupLogosByTier,
  LOGO_TIERS,
  type LogoTierId,
} from "@/lib/logo-tiers";
import { ArrowLeft } from "lucide-react";

export default async function TierPage({
  params,
}: {
  params: Promise<{ tier: string }>;
}) {
  const { tier } = await params;
  const tierIds = LOGO_TIERS.map((item) => item.id);

  if (!tierIds.includes(tier as LogoTierId)) {
    notFound();
  }

  const logos = getAllLogos();
  const tiers = groupLogosByTier(logos);
  const tierId = tier as LogoTierId;
  const meta = getTierMeta(tierId);
  const tierLogos = tiers[tierId];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6">
          <Button
            variant="outline"
            asChild
            className="w-fit rounded-full border-border/60 bg-background/80 hover:bg-foreground/10"
          >
            <Link href="/learn" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver a niveles
            </Link>
          </Button>
          <div className="relative flex flex-col items-center gap-3 text-center sm:items-start sm:text-left">
            <div className="absolute right-0 top-0">
              <ThemeToggle />
            </div>
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-muted/40 text-sm font-semibold text-foreground sm:mx-0">
              {meta.level}
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Nivel
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">
                {meta.label}
              </h1>
              <p className="text-sm text-muted-foreground">
                {meta.description} {meta.hint}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={meta.tone}>{meta.difficulty}</Badge>
              <Badge variant="outline">{tierLogos.length} logos</Badge>
            </div>
            <TierQuiz tierId={tierId} tierLabel={meta.label} />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
        <Separator />
        <TierGallery logos={tierLogos} />
      </main>
    </div>
  );
}
