import { notFound } from "next/navigation";
import { QuizClient } from "@/components/quiz-client";
import { getAllLogos } from "@/lib/logos";
import {
  getTierMeta,
  groupLogosByTier,
  LOGO_TIERS,
  type LogoTierId,
} from "@/lib/logo-tiers";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ tier: string }>;
}) {
  const { tier } = await params;
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
    />
  );
}
