import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output - use default (not export) for dynamic rendering
  // Add trailing slashes
  trailingSlash: true,
  // Images work better with default config
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;