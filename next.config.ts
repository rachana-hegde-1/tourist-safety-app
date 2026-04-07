import type { NextConfig } from "next";

const supabaseHost = (() => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return undefined;
  try {
    return new URL(url).hostname;
  } catch {
    return undefined;
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost }]
      : [],
  },
  // PWA Configuration
  experimental: {},
  async rewrites() {
    return [
      {
        source: '/manifest.webmanifest',
        destination: '/api/manifest',
      },
    ];
  },
};

export default nextConfig;
