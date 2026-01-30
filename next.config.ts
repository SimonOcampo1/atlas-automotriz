import type { NextConfig } from "next";

const assetMode = (process.env.NEXT_PUBLIC_ASSET_MODE ?? "local").trim().toLowerCase();
const assetBaseUrl = assetMode === "cdn"
  ? (process.env.NEXT_PUBLIC_ASSET_BASE_URL ?? "").trim().replace(/\/+$/g, "")
  : "";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  outputFileTracingExcludes: {
    '*': [
      // 2. Banderas: Solo tiene fotos, se puede excluir entero.
      './public/flags/**/*',

      // 3. LOGOS: ¡CUIDADO AQUÍ! 
      // NO excluimos la carpeta entera porque borraríamos el data.json.
      // Excluimos SOLO los archivos de imagen por extensión.
      './public/car-logos-dataset/**/*.svg',
      './public/car-logos-dataset/**/*.png',
      './public/car-logos-dataset/**/*.jpg',
      './public/car-logos-dataset/**/*.jpeg',
      
      // Exclusiones generales de seguridad para otras imágenes pesadas
      '**/*.map',
    ],
  },
  async rewrites() {
    if (!assetBaseUrl) {
      return [];
    }
    return [
      {
        source: "/flags/:path*",
        destination: `${assetBaseUrl}/flags/:path*`,
      },
      {
        source: "/car-logos-dataset/logos/:path*",
        destination: `${assetBaseUrl}/car-logos-dataset/logos/:path*`,
      },
      {
        source: "/car-logos-dataset/local-logos/:path*",
        destination: `${assetBaseUrl}/car-logos-dataset/local-logos/:path*`,
      },
      {
        source: "/ultimatespecs/:path*",
        destination: `${assetBaseUrl}/ultimatespecs/:path*`,
      },
      {
        source: "/ultimatespecs_complete_db.jsonl",
        destination: `${assetBaseUrl}/ultimatespecs_complete_db.jsonl`,
      },
    ];
  },
};

export default nextConfig;
