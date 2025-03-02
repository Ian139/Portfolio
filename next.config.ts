import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // GitHub Pages configuration
  basePath: '',
  assetPrefix: '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
