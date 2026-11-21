import fs from "node:fs";
import path from "node:path";

const LLM_ENV_KEYS = [
  "OPENROUTER_API_KEY",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "GITHUB_TOKEN",
] as const;

/** Monorepo root: walk up until `registry/sources.json` exists. */
export function findMonorepoRoot(start = process.cwd()): string {
  if (process.env.SUNDOWN_MONOREPO_ROOT) {
    return path.resolve(process.env.SUNDOWN_MONOREPO_ROOT);
  }
  let dir = path.resolve(start);
  for (let i = 0; i < 8; i++) {
    const marker = path.join(dir, "registry", "sources.json");
    if (fs.existsSync(marker)) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(start, "../..");
}

/** Parse repo-root `.env` into process.env (Next may not expose these to bundled server code). */
export function applyRootDotenv(options?: { force?: boolean }): string {
  const root = findMonorepoRoot();
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) return root;

  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (options?.force || !process.env[key]) {
      process.env[key] = value;
    }
  }
  return root;
}

export function hasLlmEnvKey(): boolean {
  return LLM_ENV_KEYS.slice(0, 3).some((k) => Boolean(process.env[k]));
}