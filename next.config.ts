import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ["react-icons"],
  },
};

export default nextConfig;
