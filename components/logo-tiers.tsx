import Link from "next/link";
import type { Logo } from "@/lib/logos";
import { groupLogosByTier, LOGO_TIERS } from "@/lib/logo-tiers";
import { getTierTranslation, translate, type Locale } from "@/lib/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

// CORRECCIÓN: Ruta directa
function getImageSrc(logo: Logo) {
  return logo.images.thumb;
}

type Props = {
  logos: Logo[];
  locale: Locale;
};

export function LogoTiers({ logos, locale }: Props) {
  const tiers = groupLogosByTier(logos);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        {LOGO_TIERS.map((tier) => {
          const tierLogos = tiers[tier.id];
          const tierStrings = getTierTranslation(locale, tier.id);
          return (
            <Link key={tier.id} href={`/tiers/${tier.id}`} className="group">
              <Card className="relative flex flex-col border-border/60 bg-white dark:bg-black/30 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-xl">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">
                        {translate(locale, "tier.levelBadge", { level: tier.level })}
                      </Badge>
                      <Badge className={tier.tone}>{tierStrings.difficulty}</Badge>
                      <Badge variant="outline">
                        {translate(locale, "counts.logos", { count: tierLogos.length })}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{tierStrings.label}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {tierStrings.description} {tierStrings.hint}
                    </p>
                  </div>
                  <CardAction className="absolute right-4 top-4">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-9 w-9 rounded-full border-border/60 bg-background/80 hover:bg-foreground/10"
                      aria-label={translate(locale, "tier.viewLevel")}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardAction>
                </CardHeader>
                
                <CardContent className="flex flex-col gap-3">
                  <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                    {tierLogos.slice(0, 6).map((logo, index) => (
                      <div
                        key={`${tier.id}-${logo.slug}-${logo.isLocal ? "local" : "dataset"}-${index}`}
                        className="flex items-center gap-2 rounded-lg border border-border/60 bg-white p-2 shadow-sm dark:bg-black/30"
                      >
                        {/* RESTAURADO: Fondo blanco para los mini logos */}
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white">
                          <img
                            src={getImageSrc(logo)}
                            alt={translate(locale, "dialog.logoOf", { name: logo.name })}
                            className="max-h-6 w-auto object-contain"
                            loading="lazy"
                          />
                        </div>
                        <span className="text-xs font-medium text-foreground">
                          {logo.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
