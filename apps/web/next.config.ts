import type { NextConfig } from "next";
import path from "node:path";
import { loadEnvConfig } from "@next/env";

const monorepoRoot = path.join(__dirname, "../..");
loadEnvConfig(monorepoRoot);

const nextConfig: NextConfig = {
  transpilePackages: ["@sundown/engine"],
  // Local: trace monorepo registry/. Vercel: stage-registry copies sundown-registry/ before build.
  outputFileTracingRoot: monorepoRoot,
  outputFileTracingIncludes: {
    "/api/scan": ["../../registry/**/*.json", "./sundown-registry/**/*.json"],
  },
};

export default nextConfig;