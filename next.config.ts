import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

// `__dirname` isn't available when this file is loaded as ESM; derive it
// from `import.meta.url` so the path is correct regardless of how Next's
// config loader executes the module.
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Pin the Turbopack workspace root to this directory. Without this, Next 16
  // walks up the tree and, when it sees two package.json files in sibling
  // directories (this project + ~/Documents/Personal/photography), promotes
  // the parent dir to "workspace root" - causing CSS @import resolution to
  // start there and fail to find tailwindcss in this project's node_modules.
  turbopack: {
    root: projectRoot,
  },
  experimental: {
    optimizePackageImports: ["react-icons"],
  },
};

export default nextConfig;
