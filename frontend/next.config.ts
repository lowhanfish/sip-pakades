import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const backendOrigin = process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000";

export default function nextConfig(phase: string): NextConfig {
  return {
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
    images: {
      unoptimized: true,
    },
    async rewrites() {
      return [
        {
          source: "/api/v1/:path*",
          destination: `${backendOrigin}/api/v1/:path*`,
        },
        {
          source: "/media/:path*",
          destination: `${backendOrigin}/media/:path*`,
        },
      ];
    },
  };
}
