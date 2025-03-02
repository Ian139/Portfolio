import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // Remove trailing slash from basePath if present
  basePath: process.env.NODE_ENV === 'production' ? '/Portfolio' : '',
  // Match the basePath exactly
  assetPrefix: process.env.NODE_ENV === 'production' ? '/Portfolio' : '',
  images: {
    unoptimized: true,
  },
  // Add this to ensure client-side scripts load correctly
  trailingSlash: true,
};

export default nextConfig;
