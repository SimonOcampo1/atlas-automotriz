import "server-only";

import fs from "node:fs";
import path from "node:path";
import { buildAssetUrl } from "@/lib/assets";

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

const IMAGE_ROOT_TOKENS = ["ultimatespecs_images", "ultimatespecs"];

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

function tokenize(value: string) {
  return normalizeKey(value)
    .split("-")
    .map((token) => token.trim())
    .filter(Boolean);
}

const MODEL_ALIAS_MAP: Record<string, Record<string, string[]>> = {
  "alfa-romeo": {
    "145-146": ["145", "146"],
    "concepts": ["visconti", "kamal", "centauri", "dardo", "nuvola", "scarabeo", "canguro"],
  },
  alpina: {
    "x3": ["x3"],
    "x4": ["x4"],
    "x7": ["x7"],
  },
  audi: {
    "concept-cars": ["concept"],
    "80": ["80"],
    "90": ["90"],
    "200": ["200"],
  },
  bmw: {
    "z3": ["e36/8", "e36-8", "z3 coupe", "z3 roadster"],
    "concept-cars": ["i3 concept", "i8 concept", "z9 concept", "nazca", "turbo prototype"],
  },
  buick: {
    "le-sabre": ["lesabre", "le sabre"],
  },
  chrysler: {
    "300": ["300c"],
  },
  dodge: {
    "caravan-grand-caravan": ["caravan", "grand caravan"],
  },
  ds: {
    "ds-3": ["ds3", "ds 3"],
  },
  ford: {
    "escort-europe": ["escort i", "escort ii", "escort iii", "escort iv", "escort v", "escort vi"],
    "orion": ["orion i", "orion ii", "orion iii"],
    "falcon-australia": ["falcon", "fg", "au", "bf", "el", "xa", "xb", "xr", "xk", "xl"],
    "focus-europe": ["focus", "focus 1", "focus 2", "focus 3", "focus 4"],
  },
  jeep: {
    "avenger": ["avenger"],
  },
  "land-rover": {
    "evoque": ["evoque", "range rover evoque"],
  },
  maserati: {
    "400": ["4.24v", "422", "425"],
  },
  "mercedes-benz": {
    "1930s": ["w07", "w22", "w18", "w29", "w143", "w24", "w138", "w28", "w142", "w129"],
    "1940s-50s": ["w157", "w136", "w186", "w188", "w189", "w187", "w121", "w120", "w180", "w105", "w128"],
    "cl-class": ["c216", "c215"],
    "cle-class": ["c236", "a236"],
    "glc-coupe": ["c254", "c253"],
    "glk-class": ["x204"],
    "m-class": ["w166", "w164", "w163"],
    "sl-class": ["r232", "r231", "r230", "r129", "r107", "w113", "w198", "w121", "z232"],
  },
  mercury: {
    "cougar": ["cougar"],
  },
  mg: {
    "zs": ["zs", "zs sedan"],
  },
  nissan: {
    "200sx": ["s15", "s14", "s13", "s12", "silvia"],
    "z-series": ["370z", "350 z", "300 zx", "300zx", "z34", "z33", "z32", "z31"],
  },
  opel: {
    "agila": ["agila a", "agila b"],
  },
  peugeot: {
    "407": ["407 coupe", "407"],
    "504": ["504", "504 coupe", "504 cabriolet", "504 break"],
  },
  seat: {
    "exeo": ["exeo"],
  },
  suzuki: {
    "sj-samurai": ["samurai", "santana"],
  },
  volvo: {
    "120-amazon": ["120", "122", "123", "130", "220", "amazon"],
    "140-164": ["140", "142", "144", "164"],
    "200-series": ["240", "242", "244", "245", "260", "264", "265"],
    "300-series": ["340", "360"],
    "400-series": ["440", "460", "480"],
    "900-series": ["940", "960"],
    "s40": ["s40", "s40 i", "s40 ii"],
    "v70": ["v70", "v70 xc"],
    "xc70": ["xc70", "xc70 ii"],
  },
};

function getNumericTokens(tokens: string[]) {
  return tokens.filter((token) => /\d/.test(token));
}

function countOverlap(a: Set<string>, b: Set<string>) {
  let count = 0;
  for (const token of a) {
    if (b.has(token)) {
      count += 1;
    }
  }
  return count;
}

function isSubset(a: Set<string>, b: Set<string>) {
  if (a.size === 0) {
    return false;
  }
  for (const token of a) {
    if (!b.has(token)) {
      return false;
    }
  }
  return true;
}

function scoreModelForGeneration(model: UltimateSpecsModel, record: RawRecord) {
  const slugKey = modelKeyFromGenerationRecord(record);
  const nameKey = normalizeKey(record.name);
  const modelKey = model.key;
  const brandKey = model.brandKey;

  let score = 0;

  if (modelKey === slugKey) {
    score += 100;
  }
  if (modelKey === nameKey) {
    score += 90;
  }

  const genTokens = new Set([...tokenize(record.name), ...tokenize(slugKey)]);
  const modelTokens = new Set([...tokenize(model.name), ...tokenize(modelKey)]);
  const overlap = countOverlap(genTokens, modelTokens);
  score += overlap * 10;

  const genNumbers = new Set(getNumericTokens(Array.from(genTokens)));
  const modelNumbers = new Set(getNumericTokens(Array.from(modelTokens)));
  if (countOverlap(genNumbers, modelNumbers) > 0) {
    score += 20;
  }

  if (isSubset(genTokens, modelTokens) || isSubset(modelTokens, genTokens)) {
    score += 30;
  }

  if (modelKey.includes(slugKey) || slugKey.includes(modelKey)) {
    score += 15;
  }

  const lowerName = record.name.toLowerCase();
  const lowerModel = model.name.toLowerCase();
  if (lowerModel.includes(lowerName) || lowerName.includes(lowerModel)) {
    score += 10;
  }

  const aliases = MODEL_ALIAS_MAP[brandKey]?.[modelKey] ?? [];
  if (aliases.length > 0) {
    const normalizedName = normalizeKey(record.name);
    for (const alias of aliases) {
      const aliasKey = normalizeKey(alias);
      if (normalizedName.includes(aliasKey)) {
        score += 35;
        break;
      }
    }
  }

  return score;
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
  for (const tokenValue of IMAGE_ROOT_TOKENS) {
    const token = `/${tokenValue.toLowerCase()}/`;
    const index = lower.indexOf(token);
    if (index >= 0) {
      return normalized.slice(index + token.length);
    }
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
      path.join(process.cwd(), "web", "public", filename),
      path.join(process.cwd(), "..", filename)
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
    return [];
  }
}

function buildIndex() {
  const records = loadRecords();
  const brandMap = new Map<string, UltimateSpecsBrand>();
  const modelMap = new Map<string, UltimateSpecsModel>();

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
          const scored = brand.models
            .map((item) => ({ item, score: scoreModelForGeneration(item, record) }))
            .filter((entry) => entry.score > 0)
            .sort((a, b) => b.score - a.score);

          if (scored.length > 0 && scored[0].score >= 40) {
            model = scored[0].item;
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

// =====================================================================
// CORRECCIÓN: Apuntamos directo a la carpeta 'public/ultimatespecs'
// =====================================================================
export function getUltimateSpecsImageSrc(image: UltimateSpecsImage | null) {
  if (!image) {
    return null;
  }
  if (image.local) {
    // Aquí cambiamos la lógica:
    // En lugar de llamar a /api/ultimatespecs/..., apuntamos a la ruta estática.
    // image.local viene limpio de prefijos raros, ej: "BMW/modelo/foto.jpg"
    
    // Nos aseguramos de que no tenga barra inicial duplicada
    const cleanPath = image.local.startsWith('/') ? image.local.slice(1) : image.local;
    
    // Retornamos la ruta hacia la carpeta public/ultimatespecs
    return buildAssetUrl(`/ultimatespecs/${encodeURI(cleanPath)}`);
  }
  if (image.url) {
    return image.url;
  }
  return null;
}
