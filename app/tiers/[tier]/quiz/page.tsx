import { notFound } from "next/navigation";
import { QuizClient } from "@/components/quiz-client";
import { getServerLocale } from "@/lib/i18n-server";
import { getAllLogos } from "@/lib/logos";
import {
  getTierMeta,
  groupLogosByTier,
  LOGO_TIERS,
  type LogoTierId,
} from "@/lib/logo-tiers";

export default async function QuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ tier: string }>;
  searchParams?: Promise<{ mode?: string }>;
}) {
  const locale = await getServerLocale();
  const { tier } = await params;
  const { mode } = (await searchParams) ?? {};
  const tierIds = LOGO_TIERS.map((item) => item.id);

  if (!tierIds.includes(tier as LogoTierId)) {
    notFound();
  }

  const logos = await getAllLogos();
  const tiers = groupLogosByTier(logos);
  const tierId = tier as LogoTierId;
  const meta = getTierMeta(tierId);
  const tierLogos = tiers[tierId];

  return (
    <QuizClient
      tier={tier}
      tierId={tierId}
      meta={meta}
      logos={tierLogos}
      locale={locale}
      initialMode={mode === "multiple" || mode === "typed" || mode === "country" ? mode : null}
    />
  );
}
