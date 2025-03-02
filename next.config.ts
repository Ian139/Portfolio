import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // For GitHub Pages, you need to set the basePath if your repo isn't at the root domain
  // If your site is at username.github.io/repo-name, use:
  basePath: process.env.NODE_ENV === 'production' ? '/asd' : '',
  // This helps with asset loading
  assetPrefix: process.env.NODE_ENV === 'production' ? '/asd' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
