import "server-only";

import fs from "node:fs";
import path from "node:path";

export type LogoSize = "thumb" | "optimized" | "original";

export type Logo = {
  name: string;
  slug: string;
  images: {
    thumb: string;
    optimized: string;
    original: string;
  };
  isLocal: boolean;
};

type DatasetLogo = {
  name: string;
  slug: string;
  image: {
    localThumb: string;
    localOptimized: string;
    localOriginal: string;
  };
};

type LocalLogo = {
  name: string;
  slug: string;
  fileName: string;
};

const DATASET_ROOT = path.join(
  process.cwd(),
  "public",
  "car-logos-dataset"
);
const LOGOS_DATA_PATH = path.join(DATASET_ROOT, "logos", "data.json");
const LOCAL_LOGOS_PATH = path.join(DATASET_ROOT, "local-logos", "metadata.json");

const EXCLUDED_SLUGS = new Set([
  "audi-sport",
  "bmw-m",
  "chevrolet-corvette",
  "ford-mustang",
  "mercedes-amg",
  "nissan-gt-r",
]);

const MODEL_SEGMENT_KEYWORDS = new Set([
  "amg",
  "m",
  "rs",
  "gt",
  "gtr",
  "gt-r",
  "type-r",
  "sti",
  "srt",
  "svt",
  "sport",
  "performance",
  "corvette",
  "mustang",
]);

function hasModelKeyword(slug: string, name: string) {
  const slugLower = slug.toLowerCase();
  const nameLower = name.toLowerCase();

  if (MODEL_SEGMENT_KEYWORDS.has(slugLower) || MODEL_SEGMENT_KEYWORDS.has(nameLower)) {
    return true;
  }

  if (slugLower.includes("gt-r") || nameLower.includes("gt-r")) {
    return true;
  }

  const slugTokens = slugLower.split("-").filter(Boolean);
  const nameTokens = nameLower.split(/\s|-/).filter(Boolean);

  return (
    slugTokens.some((token) => MODEL_SEGMENT_KEYWORDS.has(token)) ||
    nameTokens.some((token) => MODEL_SEGMENT_KEYWORDS.has(token))
  );
}

function isExcludedLogo(logo: { slug: string; name: string }) {
  const slug = logo.slug.toLowerCase();
  const name = logo.name.toLowerCase();

  if (EXCLUDED_SLUGS.has(slug)) {
    return true;
  }

  if (hasModelKeyword(slug, name)) {
    return true;
  }

  return false;
}

function readJson<T>(filePath: string): T {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

function normalizeDatasetPath(value: string) {
  const cleaned = value.replace(/^[.\\/]+/, "").replace(/\\/g, "/");
  if (
    cleaned.startsWith("thumb/") ||
    cleaned.startsWith("optimized/") ||
    cleaned.startsWith("original/")
  ) {
    return `logos/${cleaned}`;
  }
  return cleaned;
}

export function getAllLogos(): Logo[] {
  const dataset = readJson<DatasetLogo[]>(LOGOS_DATA_PATH);
  const locals = readJson<LocalLogo[]>(LOCAL_LOGOS_PATH);

  const datasetLogos: Logo[] = dataset
    .filter((logo) => !isExcludedLogo(logo))
    .map((logo) => ({
      name: logo.name,
      slug: logo.slug,
      images: {
        thumb: normalizeDatasetPath(logo.image.localThumb),
        optimized: normalizeDatasetPath(logo.image.localOptimized),
        original: normalizeDatasetPath(logo.image.localOriginal),
      },
      isLocal: false,
    }));

  const localLogos: Logo[] = locals
    .filter((logo) => !isExcludedLogo(logo))
    .map((logo) => ({
      name: logo.name,
      slug: logo.slug,
      images: {
        thumb: `local-logos/${logo.fileName}`,
        optimized: `local-logos/${logo.fileName}`,
        original: `local-logos/${logo.fileName}`,
      },
      isLocal: true,
    }));

  const merged = [...datasetLogos, ...localLogos];
  const uniqueBySlug = new Map<string, Logo>();

  for (const logo of merged) {
    const key = logo.slug.toLowerCase();
    if (!uniqueBySlug.has(key)) {
      uniqueBySlug.set(key, logo);
    }
  }

  return Array.from(uniqueBySlug.values());
}
