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

// Rutas del sistema de archivos (para leer el JSON)
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

// CORRECCIÓN: Try/Catch para evitar errores de Build si falta el archivo
function readJson<T>(filePath: string): T {
  try {
    // Intentamos buscar el archivo en varias rutas por si Vercel lo movió
    let targetPath = filePath;
    if (!fs.existsSync(targetPath)) {
      // Intento alternativo subiendo un nivel (común en Vercel)
      const altPath = path.join(process.cwd(), "..", "public", "car-logos-dataset", path.basename(path.dirname(filePath)), path.basename(filePath));
      if (fs.existsSync(altPath)) {
        targetPath = altPath;
      } else {
        // Si no existe, retornamos array vacío para no romper el build
        console.warn(`[WARN] No se encontró JSON en: ${filePath}`);
        return [] as unknown as T;
      }
    }
    const raw = fs.readFileSync(targetPath, "utf-8");
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`[ERROR] Fallo leyendo ${filePath}:`, error);
    return [] as unknown as T;
  }
}

// CORRECCIÓN: Generar URL absoluta (/car-logos-dataset/...)
function normalizeDatasetPath(value: string) {
  const cleaned = value.replace(/^[.\\/]+/, "").replace(/\\/g, "/");
  
  // Aquí agregamos la ruta base pública para que el navegador la encuentre
  const basePath = "/car-logos-dataset/logos";

  if (
    cleaned.startsWith("thumb/") ||
    cleaned.startsWith("optimized/") ||
    cleaned.startsWith("original/")
  ) {
    return `${basePath}/${cleaned}`;
  }
  return `${basePath}/${cleaned}`;
}

export function getAllLogos(): Logo[] {
  const dataset = readJson<DatasetLogo[]>(LOGOS_DATA_PATH);
  const locals = readJson<LocalLogo[]>(LOCAL_LOGOS_PATH);

  // Verificación de seguridad por si readJson devolvió algo que no es array
  const safeDataset = Array.isArray(dataset) ? dataset : [];
  const safeLocals = Array.isArray(locals) ? locals : [];

  const datasetLogos: Logo[] = safeDataset
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

  const localLogos: Logo[] = safeLocals
    .filter((logo) => !isExcludedLogo(logo))
    .map((logo) => ({
      name: logo.name,
      slug: logo.slug,
      images: {
        // CORRECCIÓN: Rutas absolutas para logos locales también
        thumb: `/car-logos-dataset/local-logos/${logo.fileName}`,
        optimized: `/car-logos-dataset/local-logos/${logo.fileName}`,
        original: `/car-logos-dataset/local-logos/${logo.fileName}`,
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
