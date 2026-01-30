const RAW_BASE_URL = (process.env.NEXT_PUBLIC_ASSET_BASE_URL ?? "").trim();
const ASSET_MODE = (process.env.NEXT_PUBLIC_ASSET_MODE ?? "local").trim().toLowerCase();

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/g, "");
}

export function getAssetBaseUrl() {
  if (ASSET_MODE !== "cdn") {
    return "";
  }
  return normalizeBaseUrl(RAW_BASE_URL);
}

export function buildAssetUrl(path: string) {
  const baseUrl = getAssetBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (!baseUrl) {
    return normalizedPath;
  }
  return `${baseUrl}${normalizedPath}`;
}
