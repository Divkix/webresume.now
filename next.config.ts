import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  // Disable Next.js Image optimization (not compatible with Cloudflare Workers)
  images: {
    unoptimized: true,
  },

  // Configure for Cloudflare deployment
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
