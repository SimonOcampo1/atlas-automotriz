import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  outputFileTracingExcludes: {
    '*': [
      // 1. Ultimatespecs: Solo tiene carpetas de fotos, se puede excluir entero.
      './public/ultimatespecs/**/*',
      
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
};

export default nextConfig;
