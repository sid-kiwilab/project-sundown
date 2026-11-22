import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveSundownRegistryPath } from "@sundown/engine";

/** Monorepo `registry/` for scans — stable on dev and Vercel. */
export function monorepoRegistryPath(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return resolveSundownRegistryPath({
    searchFrom: [
      process.cwd(),
      here,
      path.resolve(here, ".."),
      path.resolve(here, "../.."),
      path.resolve(here, "../../.."),
    ],
  });
}