import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        // Esto le dice a Vercel: "No gastes memoria RAM del servidor cargando estas fotos".
        // Las fotos SEGUIRÁN existiendo en la web y se verán bien.
        './public/ultimatespecs/**/*',
        './public/car-logos-dataset/**/*',
        './public/flags/**/*',
        '**/*.png',
        '**/*.jpg',
        '**/*.jpeg',
        '**/*.svg',
      ],
    },
  },
};

export default nextConfig;
