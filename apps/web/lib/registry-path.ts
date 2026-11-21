import path from "node:path";
import { fileURLToPath } from "node:url";

/** Monorepo `registry/` — stable regardless of process cwd (dev, start.bat, Vercel). */
export function monorepoRegistryPath(): string {
  if (process.env.REGISTRY_PATH) {
    return path.resolve(process.env.REGISTRY_PATH);
  }
  const webRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
  );
  return path.resolve(webRoot, "../../registry");
}