import "server-only";

import fs from "node:fs";
import path from "node:path";
import { buildAssetUrl, getAssetBaseUrl } from "@/lib/assets";

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
  source: "model" | "generation";
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
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

let cachedIndex: UltimateSpecsBrand[] | null = null;
let cachedBrandMap: Map<string, UltimateSpecsBrand> | null = null;
let cachedBrandFolderMap: Map<string, string> | null = null;
let cachedBrandImages: Map<string, string[]> | null = null;

function normalizeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .trim();
}

function buildBrandFolderMap() {
  if (cachedBrandFolderMap) {
    return cachedBrandFolderMap;
  }
  const root = path.join(process.cwd(), "public", "ultimatespecs");
  const map = new Map<string, string>();
  try {
    const entries = fs.readdirSync(root, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }
      const dirName = entry.name;
      const normalized = normalizeKey(dirName.replace(/_/g, " "));
      map.set(normalized, dirName);
    }
  } catch (error) {
    console.warn("[WARN] No se pudo leer carpeta ultimatespecs:", error);
  }
  cachedBrandFolderMap = map;
  return map;
}

function getBrandFolder(brandName: string) {
  const map = buildBrandFolderMap();
  const normalized = normalizeKey(brandName);
  return map.get(normalized) ?? brandName.replace(/\s+/g, "_");
}

function getBrandImages(brandName: string) {
  if (!cachedBrandImages) {
    cachedBrandImages = new Map();
  }
  const brandFolder = getBrandFolder(brandName);
  const cached = cachedBrandImages.get(brandFolder);
  if (cached) {
    return cached;
  }
  const folderPath = path.join(process.cwd(), "public", "ultimatespecs", brandFolder);
  let files: string[] = [];
  try {
    files = fs.readdirSync(folderPath)
      .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()));
  } catch {
    files = [];
  }
  cachedBrandImages.set(brandFolder, files);
  return files;
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

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function buildGenerationId(modelId: string, record: RawRecord) {
  const base = normalizeKey(record.name);
  const source = record.url || record.local_image || `${record.name}-${record.years}`;
  return `${modelId}:${base}:${hashString(source)}`;
}

function addGeneration(model: UltimateSpecsModel, generation: UltimateSpecsGeneration) {
  const normalizedName = normalizeKey(generation.name);
  const existingIndex = model.generations.findIndex((item) => (
    normalizeKey(item.name) === normalizedName && item.years === generation.years
  ));
  if (existingIndex >= 0) {
    const existing = model.generations[existingIndex];
    if (!existing.image.local && (generation.image.local || generation.image.url)) {
      model.generations[existingIndex] = generation;
    }
    return;
  }
  model.generations.push(generation);
}

const MODEL_ALIAS_MAP: Record<string, Record<string, string[]>> = {
  "alfa-romeo": {
    "145-146": ["145", "146"],
    "concepts": ["visconti", "kamal", "centauri", "dardo", "nuvola", "scarabeo", "canguro"],
    "junior": ["junior"],
  },
  alpina: {
    "x3": ["x3", "g01", "xd3", "f25", "xd3 lci"],
    "x4": ["x4", "g02", "xd4"],
    "x7": ["x7", "g07", "xb7", "xb7 lci", "g07 lci"],
  },
  audi: {
    "concept-cars": ["concept", "nuvolari", "avantissimo", "avus", "asso di picche"],
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

const MODEL_GENERATION_OVERRIDES: Record<string, Record<string, string[]>> = {
  "alfa-romeo": {
    "145-146": ["145", "146"],
    "concepts": ["visconti", "kamal", "centauri", "dardo", "nuvola", "scarabeo", "canguro"],
    "junior": ["junior"],
  },
  alpina: {
    "x3": ["x3"],
    "x4": ["x4"],
    "x7": ["x7"],
  },
  audi: {
    "concept-cars": ["concept", "nuvolari", "avantissimo", "avus", "asso di picche"],
    "80": ["80"],
    "90": ["90"],
    "200": ["200"],
  },
  bmw: {
    "z3": ["e36/8", "e36-8", "e36/7", "z3 coupe", "z3 roadster"],
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
    "escort-europe": ["escort"],
    "orion": ["orion"],
    "falcon-australia": ["falcon", "fg", "au", "bf", "el", "xa", "xb", "xr", "xk", "xl"],
    "focus-europe": ["focus"],
  },
  jeep: {
    "avenger": ["avenger"],
  },
  "land-rover": {
    "evoque": ["evoque", "range rover evoque"],
  },
  maserati: {
    "400": ["400 series", "4.24v", "422", "425"],
  },
  "mercedes-benz": {
    "1930s": ["w07", "w22", "w18", "w29", "w143", "w24", "w138", "w28", "w142", "w129"],
    "1940s-50s": ["w157", "w136", "w186", "w188", "w189", "w187", "w121", "w120", "w180", "w105", "w128"],
    "cl-class": ["c216", "c215", "cl"],
    "cle-class": ["c236", "a236", "cle"],
    "glc-coupe": ["c254", "c253", "glc coupe", "glc coupé"],
    "glk-class": ["x204", "glk"],
    "m-class": ["w166", "w164", "w163", "ml class"],
    "sl-class": ["r232", "r231", "r230", "r129", "r107", "w113", "w198", "w121", "z232", "sl"],
  },
  mercury: {
    "cougar": ["cougar"],
  },
  mg: {
    "zs": ["zs"],
  },
  nissan: {
    "200sx": ["200 sx", "200sx", "s15", "s14", "s13", "s12", "silvia"],
    "z-series": ["370z", "350 z", "300 zx", "300zx", "z34", "z33", "z32", "z31"],
  },
  opel: {
    "agila": ["agila"],
  },
  peugeot: {
    "407": ["407"],
    "504": ["504"],
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
    "200-series": ["240", "242", "244", "245", "260", "264", "265", "200 series"],
    "300-series": ["340", "360"],
    "400-series": ["440", "460", "480"],
    "900-series": ["940", "960"],
    "s40": ["s40"],
    "v70": ["v70", "v70 xc"],
    "xc70": ["xc70"],
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

function scoreImageForGeneration(model: UltimateSpecsModel, generation: UltimateSpecsGeneration, fileName: string) {
  const fileBase = fileName.replace(/\.[^/.]+$/, "");
  const fileTokens = new Set(tokenize(fileBase));
  const genTokens = new Set(tokenize(generation.name));
  const aliasTokens = (MODEL_ALIAS_MAP[model.brandKey]?.[model.key] ?? []).flatMap(tokenize);
  const modelTokens = new Set([...tokenize(model.name), ...tokenize(model.key), ...aliasTokens]);

  const modelOverlap = countOverlap(fileTokens, modelTokens);
  if (modelOverlap === 0) {
    return 0;
  }

  const overlap = countOverlap(fileTokens, genTokens);
  let score = overlap * 10 + modelOverlap * 20;

  const normalizedFile = normalizeKey(fileBase);
  if (normalizedFile.includes(model.key)) {
    score += 25;
  }

  const overridePatterns = MODEL_GENERATION_OVERRIDES[model.brandKey]?.[model.key] ?? [];
  if (overridePatterns.length > 0) {
    for (const pattern of overridePatterns) {
      const normalizedPattern = normalizeKey(pattern);
      if (normalizedFile.includes(normalizedPattern)) {
        score += 30;
        break;
      }
    }
  }

  return score;
}

function generationNameFromFile(fileName: string) {
  let base = fileName.replace(/\.[^/.]+$/, "");
  base = base.replace(/_/g, " ").replace(/\s+/g, " ").trim();
  base = base.replace(/\b[a-f0-9]{8,}\b$/i, "").trim();
  return base;
}

function applyLocalImageFallback(models: Iterable<UltimateSpecsModel>) {
  for (const model of models) {
    for (const generation of model.generations) {
      if (generation.image.local) {
        continue;
      }
      const files = getBrandImages(model.brand);
      if (files.length === 0) {
        continue;
      }
      let best: { file: string; score: number } | null = null;
      for (const file of files) {
        const score = scoreImageForGeneration(model, generation, file);
        if (score <= 0) {
          continue;
        }
        if (!best || score > best.score) {
          best = { file, score };
        }
      }
      if (best) {
        const brandFolder = getBrandFolder(model.brand);
        generation.image.local = `${brandFolder}/${best.file}`;
      }
    }
  }
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

function resolveLocalImagePath(brand: string, value?: string | null) {
  const normalized = normalizeLocalImagePath(value);
  if (!normalized) {
    return null;
  }
  if (getAssetBaseUrl()) {
    return normalized;
  }
  const brandFolder = getBrandFolder(brand);
  const absolutePath = path.join(process.cwd(), "public", "ultimatespecs", normalized);
  if (fs.existsSync(absolutePath)) {
    return normalized;
  }
  const fallbackPath = path.join(process.cwd(), "public", "ultimatespecs", brandFolder, path.basename(normalized));
  if (fs.existsSync(fallbackPath)) {
    return `${brandFolder}/${path.basename(normalized)}`;
  }
  return null;
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
  const generationMap = new Map<string, RawRecord[]>();

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
          source: "model",
        };
        modelMap.set(modelId, model);
        brand.models.push(model);
      }
    }

    if (record.category === "Generation") {
      const list = generationMap.get(brandKey) ?? [];
      list.push(record);
      generationMap.set(brandKey, list);
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
              source: "generation",
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
      id: buildGenerationId(modelId, record),
      name: record.name,
      years: record.years,
      image: {
        local: resolveLocalImagePath(record.brand, record.local_image),
        url: record.image_url ?? null,
      },
      modelKey,
      brandKey,
    };

    addGeneration(model, generation);
  }

  for (const model of modelMap.values()) {
    const overridePatterns = MODEL_GENERATION_OVERRIDES[model.brandKey]?.[model.key];
    if (!overridePatterns || overridePatterns.length === 0) {
      continue;
    }
    const generations = generationMap.get(model.brandKey) ?? [];
    if (generations.length === 0) {
      continue;
    }
    const normalizedPatterns = overridePatterns.map((pattern) => normalizeKey(pattern));
    const existing = new Set(model.generations.map((gen) => normalizeKey(gen.name)));
    const matches = generations.filter((record) => {
      const normalizedName = normalizeKey(record.name);
      if (existing.has(normalizedName)) {
        return false;
      }
      return normalizedPatterns.some((pattern) => normalizedName.includes(pattern));
    });

    for (const record of matches) {
      const modelKey = model.key;
      const generation: UltimateSpecsGeneration = {
        id: buildGenerationId(model.id, record),
        name: record.name,
        years: record.years,
        image: {
          local: resolveLocalImagePath(record.brand, record.local_image),
          url: record.image_url ?? null,
        },
        modelKey,
        brandKey: model.brandKey,
      };
      addGeneration(model, generation);
    }
  }

  for (const model of modelMap.values()) {
    if (model.generations.length > 0) {
      continue;
    }
    const files = getBrandImages(model.brand);
    if (files.length === 0) {
      continue;
    }
    const matchedFiles = files
      .map((file) => {
        const score = scoreImageForGeneration(
          model,
          {
            id: "seed",
            name: model.name,
            years: model.years,
            image: { local: null, url: null },
            modelKey: model.key,
            brandKey: model.brandKey,
          },
          file
        );
        return { file, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);

    if (matchedFiles.length === 0) {
      continue;
    }

    const brandFolder = getBrandFolder(model.brand);
    for (const match of matchedFiles) {
      const name = generationNameFromFile(match.file);
      const generation: UltimateSpecsGeneration = {
        id: `${model.id}:${normalizeKey(name)}:${hashString(match.file)}`,
        name,
        years: model.years,
        image: {
          local: `${brandFolder}/${match.file}`,
          url: null,
        },
        modelKey: model.key,
        brandKey: model.brandKey,
      };
      addGeneration(model, generation);
    }
  }

  applyLocalImageFallback(modelMap.values());

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
    
    const publicPath = `/ultimatespecs/${encodeURI(cleanPath)}`;
    const absolutePath = path.join(process.cwd(), "public", "ultimatespecs", cleanPath);
    const exists = fs.existsSync(absolutePath);
    if (!exists && image.url) {
      return image.url;
    }
    // Retornamos la ruta hacia la carpeta public/ultimatespecs
    if (getAssetBaseUrl() && process.env.NODE_ENV !== "production") {
      return publicPath;
    }
    return buildAssetUrl(publicPath);
  }
  if (image.url) {
    return image.url;
  }
  return null;
}
