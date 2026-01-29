import "server-only";

import { buildAssetUrl } from "@/lib/assets";

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

const LOGOS_DATA_URL = "/car-logos-dataset/logos/data.json";
const LOCAL_LOGOS_URL = "/car-logos-dataset/local-logos/metadata.json";

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

function getServerBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/g, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

function getServerOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/g, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

function getServerAssetUrl(path: string) {
  const assetUrl = buildAssetUrl(path);
  if (/^https?:\/\//i.test(assetUrl)) {
    return assetUrl;
  }
  const base = getServerBaseUrl();
  const normalized = assetUrl.startsWith("/") ? assetUrl : `/${assetUrl}`;
  return `${base}${normalized}`;
}

async function readJson<T>(urlPath: string): Promise<T> {
  const fallbackUrl = new URL(urlPath, getServerOrigin()).toString();
  const primaryUrl = getServerAssetUrl(urlPath);
  try {
    const response = await fetch(primaryUrl, {
      cache: "force-cache",
      next: { revalidate: 60 * 60 },
    });
    if (response.ok) {
      return (await response.json()) as T;
    }

    if (primaryUrl !== fallbackUrl) {
      const fallbackResponse = await fetch(fallbackUrl, {
        cache: "force-cache",
        next: { revalidate: 60 * 60 },
      });
      if (fallbackResponse.ok) {
        return (await fallbackResponse.json()) as T;
      }
      console.warn(
        `[WARN] No se pudo cargar JSON (${response.status}/${fallbackResponse.status}): ${urlPath}`
      );
      return [] as unknown as T;
    }
    console.warn(`[WARN] No se pudo cargar JSON (${response.status}): ${urlPath}`);
    return [] as unknown as T;
  } catch (error) {
    console.error(`[ERROR] Fallo leyendo ${urlPath}:`, error);
    return [] as unknown as T;
  }
}

// CORRECCIÓN: Generar URL absoluta (/car-logos-dataset/...)
function normalizeDatasetPath(value: string) {
  const cleaned = value.replace(/^[.\\/]+/, "").replace(/\\/g, "/");
  
  // Aquí agregamos la ruta base pública para que el navegador la encuentre
  const basePath = buildAssetUrl("/car-logos-dataset/logos");

  if (
    cleaned.startsWith("thumb/") ||
    cleaned.startsWith("optimized/") ||
    cleaned.startsWith("original/")
  ) {
    return `${basePath}/${cleaned}`;
  }
  return `${basePath}/${cleaned}`;
}

export async function getAllLogos(): Promise<Logo[]> {
  const [dataset, locals] = await Promise.all([
    readJson<DatasetLogo[]>(LOGOS_DATA_URL),
    readJson<LocalLogo[]>(LOCAL_LOGOS_URL),
  ]);

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
        thumb: buildAssetUrl(`/car-logos-dataset/local-logos/${logo.fileName}`),
        optimized: buildAssetUrl(`/car-logos-dataset/local-logos/${logo.fileName}`),
        original: buildAssetUrl(`/car-logos-dataset/local-logos/${logo.fileName}`),
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
