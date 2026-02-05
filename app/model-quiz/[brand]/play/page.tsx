import { notFound } from "next/navigation";
import { ModelQuizClient } from "@/components/model-quiz-client";
import { getServerLocale } from "@/lib/i18n-server";
import {
  getUltimateSpecsBrandByKey,
  getUltimateSpecsImageSrc,
} from "@/lib/ultimatespecs";

export default async function ModelQuizPlayPage({
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

  const models = brandData.models.map((model) => {
    const imageSrc = getUltimateSpecsImageSrc(model.representativeImage);
    const generationImages = model.generations
      .map((generation) => getUltimateSpecsImageSrc(generation.image))
      .filter((value): value is string => Boolean(value));
    if (imageSrc && !generationImages.includes(imageSrc)) {
      generationImages.unshift(imageSrc);
    }
    return {
      id: model.id,
      name: model.name,
      years: model.years,
      imageSrc,
      generationImages: Array.from(new Set(generationImages)),
    };
  });

  return (
    <ModelQuizClient
      brandName={brandData.name}
      brandKey={brandData.key}
      models={models}
      locale={locale}
      initialOpen={false}
      autoStart
    />
  );
}
