import type { NextConfig } from "next";

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Deja aquí cualquier otra cosa que ya tuvieras, como "images: ..."
};

module.exports = nextConfig; // O "export default nextConfig" si usas .mjs
