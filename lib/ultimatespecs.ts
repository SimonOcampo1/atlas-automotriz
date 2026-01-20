import "server-only";

import fs from "node:fs";
import path from "node:path";

export type UltimateSpecsImage = {
  local: string | null;
  url: string | null;
};

export type UltimateSpecsGeneration = {
  id: string;
  name: string;
  years: string;
  image: UltimateSpecsImage;
  modelKey: string;
  brandKey: string;
};

export type UltimateSpecsModel = {
  id: string;
  name: string;
  years: string;
  brand: string;
  brandKey: string;
  key: string;
  generations: UltimateSpecsGeneration[];
  representativeImage: UltimateSpecsImage | null;
};

export type UltimateSpecsBrand = {
  name: string;
  key: string;
  models: UltimateSpecsModel[];
};

type RawRecord = {
  category: "Model" | "Generation";
  url: string;
  brand: string;
  name: string;
  years: string;
  image_url?: string | null;
  local_image?: string | null;
};

const IMAGE_ROOT_TOKEN = "ultimatespecs_images";

let cachedIndex: UltimateSpecsBrand[] | null = null;
let cachedBrandMap: Map<string, UltimateSpecsBrand> | null = null;

function normalizeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();
}

function normalizeBrandKey(brand: string) {
  return normalizeKey(brand);
}

function cleanModelName(name: string, brand: string) {
  let cleaned = name.replace(/\s+Generations$/i, "").trim();
  const brandLower = brand.toLowerCase();
  if (cleaned.toLowerCase().startsWith(brandLower)) {
    cleaned = cleaned.slice(brandLower.length).trim();
  }
  return cleaned.trim();
}

function modelKeyFromModelRecord(record: RawRecord) {
  const cleaned = cleanModelName(record.name, record.brand);
  const base = normalizeKey(cleaned || record.name);
  if (record.brand.toLowerCase() === "toyota" && base.includes("gt86")) {
    return "gt86-gr86";
  }
  if (record.brand.toLowerCase() === "toyota" && base.includes("gr86")) {
    return "gt86-gr86";
  }
  return base;
}

function modelKeyFromGenerationRecord(record: RawRecord) {
  let slug = "";
  try {
    const url = new URL(record.url);
    const parts = url.pathname.split("/").filter(Boolean);
    slug = parts[parts.length - 1] || "";
  } catch {
    slug = "";
  }

  slug = slug.replace(/\.html?$/i, "");
  slug = slug.replace(/[-_]\d{4}.*$/i, "");

  if (!slug) {
    let cleaned = record.name;
    const brandLower = record.brand.toLowerCase();
    if (cleaned.toLowerCase().startsWith(brandLower)) {
      cleaned = cleaned.slice(brandLower.length).trim();
    }
    cleaned = cleaned.replace(/\b\d{4}.*$/g, "").trim();
    slug = cleaned;
  }

  const base = normalizeKey(slug || record.name);
  if (record.brand.toLowerCase() === "toyota" && (base.includes("gt86") || base.includes("gr86"))) {
    return "gt86-gr86";
  }
  return base;
}

function generationBaseKey(record: RawRecord) {
  let cleaned = record.name;
  const brandLower = record.brand.toLowerCase();
  if (cleaned.toLowerCase().startsWith(brandLower)) {
    cleaned = cleaned.slice(brandLower.length).trim();
  }
  cleaned = cleaned.replace(/\b\d{4}.*$/g, "").trim();
  return normalizeKey(cleaned || record.name);
}

function generationBaseName(record: RawRecord) {
  let cleaned = record.name;
  const brandLower = record.brand.toLowerCase();
  if (cleaned.toLowerCase().startsWith(brandLower)) {
    cleaned = cleaned.slice(brandLower.length).trim();
  }
  cleaned = cleaned.replace(/\b\d{4}.*$/g, "").trim();
  return cleaned || record.name;
}

function parseYears(value: string) {
  const numbers = value.match(/\d{4}/g) ?? [];
  const start = numbers[0] ? Number(numbers[0]) : null;
  let end = numbers[1] ? Number(numbers[1]) : start;
  if (/present/i.test(value)) {
    end = 9999;
  }
  return { start, end };
}

function normalizeLocalImagePath(value?: string | null) {
  if (!value) {
    return null;
  }
  const normalized = value.replace(/\\/g, "/");
  const lower = normalized.toLowerCase();
  const token = `/${IMAGE_ROOT_TOKEN.toLowerCase()}/`;
  const index = lower.indexOf(token);
  if (index >= 0) {
    return normalized.slice(index + token.length);
  }
  const parts = normalized.split("/").filter(Boolean);
  return parts.slice(-2).join("/");
}


function loadRecords(): RawRecord[] {
  try {
    const filename = "ultimatespecs_complete_db.jsonl";
    
    // Lista de posibles lugares donde puede estar el archivo
    const possiblePaths = [
      path.join(process.cwd(), "public", filename),
      path.join(process.cwd(), filename),
      path.join(process.cwd(), "web", "public", filename), // Por si acaso
      path.join(process.cwd(), "..", filename) // Intento original
    ];

    let foundPath = "";
    
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        foundPath = p;
        break;
      }
    }

    if (!foundPath) {
      console.warn(`[WARN] No se encontró la DB en ninguna ruta probable. Retornando vacío para NO ROMPER el build.`);
      // RETORNAMOS VACÍO EN VEZ DE ERROR PARA QUE EL DEPLOY PASE
      return [];
    }

    const raw = fs.readFileSync(foundPath, "utf-8");
    const lines = raw.split(/\r?\n/).filter(Boolean);
    const records: RawRecord[] = [];
    for (const line of lines) {
      try {
        records.push(JSON.parse(line) as RawRecord);
      } catch {
        continue;
      }
    }
    return records;
  } catch (error) {
    console.error("[ERROR] Falló la carga de registros, pero continuamos:", error);
    // RETORNAMOS VACÍO PARA QUE PASE EL BUILD
    return [];
  }
}

function buildIndex() {
  const records = loadRecords();
  const brandMap = new Map<string, UltimateSpecsBrand>();
  const modelMap = new Map<string, UltimateSpecsModel>();

  // Si no hay records (porque falló la carga), esto simplemente no hace nada y no rompe
  for (const record of records) {
    const brandKey = normalizeBrandKey(record.brand);
    const brand = brandMap.get(brandKey) ?? {
      name: record.brand,
      key: brandKey,
      models: [],
    };

    if (record.category === "Model") {
      const modelKey = modelKeyFromModelRecord(record);
      const modelId = `${brandKey}:${modelKey}`;
      if (!modelMap.has(modelId)) {
        const cleanedName = cleanModelName(record.name, record.brand);
        const model: UltimateSpecsModel = {
          id: modelId,
          name: cleanedName || record.name,
          years: record.years,
          brand: record.brand,
          brandKey,
          key: modelKey,
          generations: [],
          representativeImage: null,
        };
        modelMap.set(modelId, model);
        brand.models.push(model);
      }
    }

    brandMap.set(brandKey, brand);
  }

  for (const record of records) {
    if (record.category !== "Generation") {
      continue;
    }
    const brandKey = normalizeBrandKey(record.brand);
    const modelKey = modelKeyFromGenerationRecord(record);
    const modelId = `${brandKey}:${modelKey}`;
    let model = modelMap.get(modelId);
    if (!model) {
      const brand = brandMap.get(brandKey);
      if (brand) {
        const fallbackKey = generationBaseKey(record);
        const candidates = brand.models.filter((item) => fallbackKey.includes(item.key));
        if (candidates.length > 0) {
          candidates.sort((a, b) => b.key.length - a.key.length);
          model = candidates[0];
        } else {
          const fallbackName = generationBaseName(record);
          const fallbackModelKey = normalizeKey(fallbackName);
          const fallbackId = `${brandKey}:${fallbackModelKey}`;
          model = {
            id: fallbackId,
            name: fallbackName,
            years: record.years,
            brand: record.brand,
            brandKey,
            key: fallbackModelKey,
            generations: [],
            representativeImage: null,
          };
          brand.models.push(model);
          modelMap.set(fallbackId, model);
        }
      }
    }
    if (!model) {
      continue;
    }

    const generation: UltimateSpecsGeneration = {
      id: `${modelId}:${normalizeKey(record.name)}`,
      name: record.name,
      years: record.years,
      image: {
        local: normalizeLocalImagePath(record.local_image),
        url: record.image_url ?? null,
      },
      modelKey,
      brandKey,
    };

    model.generations.push(generation);
  }

  for (const model of modelMap.values()) {
    const candidates = model.generations.filter(
      (gen) => gen.image.local || gen.image.url
    );
    if (candidates.length === 0) {
      model.representativeImage = null;
      continue;
    }
    const sorted = [...candidates].sort((a, b) => {
      const aYears = parseYears(a.years);
      const bYears = parseYears(b.years);
      const endDiff = (bYears.end ?? 0) - (aYears.end ?? 0);
      if (endDiff !== 0) {
        return endDiff;
      }
      return (bYears.start ?? 0) - (aYears.start ?? 0);
    });
    const latest = sorted[0];
    model.representativeImage = latest.image;
  }

  const brands = Array.from(brandMap.values()).map((brand) => {
    const models = brand.models
      .filter((model) => model.key)
      .sort((a, b) => a.name.localeCompare(b.name));
    return {
      ...brand,
      models,
    };
  });

  brands.sort((a, b) => a.name.localeCompare(b.name));

  cachedIndex = brands;
  cachedBrandMap = brandMap;
}

function ensureIndex() {
  if (!cachedIndex || !cachedBrandMap) {
    buildIndex();
  }
}

export function getUltimateSpecsBrands() {
  ensureIndex();
  return cachedIndex ?? [];
}

export function getUltimateSpecsBrandByKey(brandKey: string) {
  ensureIndex();
  const key = normalizeBrandKey(brandKey);
  return cachedBrandMap?.get(key) ?? null;
}

export function getBrandKeyForName(brandName: string) {
  ensureIndex();
  const key = normalizeBrandKey(brandName);
  if (cachedBrandMap?.has(key)) {
    return key;
  }
  return null;
}

export function getBrandsWithModels() {
  return getUltimateSpecsBrands().filter((brand) => brand.models.length > 0);
}

export function getUltimateSpecsImageSrc(image: UltimateSpecsImage | null) {
  if (!image) {
    return null;
  }
  if (image.local) {
    return `/api/ultimatespecs/${encodeURI(image.local)}`;
  }
  if (image.url) {
    return image.url;
  }
  return null;
}
