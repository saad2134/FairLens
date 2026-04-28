import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output static HTML files
  output: "export",
  // Add trailing slashes for proper routing
  trailingSlash: true,
  // Disable image optimization for static export
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