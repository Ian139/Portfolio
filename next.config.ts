import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  // GitHub Pages configuration
  // Replace 'your-repo-name' with your actual repository name
  basePath: process.env.NODE_ENV === 'production' ? '/asd' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/asd/' : '',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
