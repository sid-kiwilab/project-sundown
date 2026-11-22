import type { NextConfig } from "next";
import path from "node:path";
import { loadEnvConfig } from "@next/env";

const monorepoRoot = path.join(__dirname, "../..");
loadEnvConfig(monorepoRoot);

const onVercel = process.env.VERCEL === "1";

const nextConfig: NextConfig = {
  transpilePackages: ["@sundown/engine"],
  // outputFileTracingRoot breaks Vercel packaging (export-detail.json ENOENT).
  // Vercel build copies registry → apps/web/sundown-registry before next build.
  ...(!onVercel
    ? {
        outputFileTracingRoot: monorepoRoot,
        outputFileTracingIncludes: {
          "/api/scan": ["../../registry/**/*.json"],
        },
      }
    : {}),
};

export default nextConfig;