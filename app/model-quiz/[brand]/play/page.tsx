import { notFound } from "next/navigation";
import { ModelQuizClient } from "@/components/model-quiz-client";
import {
  getUltimateSpecsBrandByKey,
  getUltimateSpecsImageSrc,
} from "@/lib/ultimatespecs";

export default async function ModelQuizPlayPage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const { brand } = await params;
  const brandData = getUltimateSpecsBrandByKey(brand);

  if (!brandData) {
    notFound();
  }

  const models = brandData.models.map((model) => ({
    id: model.id,
    name: model.name,
    years: model.years,
    imageSrc: getUltimateSpecsImageSrc(model.representativeImage),
  }));

  return (
    <ModelQuizClient
      brandName={brandData.name}
      brandKey={brandData.key}
      models={models}
      initialOpen={false}
      autoStart
    />
  );
}
