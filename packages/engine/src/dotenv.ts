import fs from "node:fs";
import path from "node:path";

const SOURCES_MARKER = path.join("registry", "sources.json");

function hasRegistryAtRoot(root: string): boolean {
  return fs.existsSync(path.join(root, SOURCES_MARKER));
}

function findMonorepoRootFrom(start: string): string | undefined {
  let dir = path.resolve(start);
  for (let i = 0; i < 12; i++) {
    if (hasRegistryAtRoot(dir)) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
}

/** Sundown workspace root: walk up until `registry/sources.json` exists. */
export function findMonorepoRoot(start = process.cwd()): string {
  if (process.env.SUNDOWN_MONOREPO_ROOT) {
    return path.resolve(process.env.SUNDOWN_MONOREPO_ROOT);
  }
  const found = findMonorepoRootFrom(start);
  if (found) return found;
  return path.resolve(start);
}

export type ResolveSundownRegistryOptions = {
  searchFrom?: string[];
};

/** Path to bundled `registry/` next to Sundown workspace (not the scan target). */
export function resolveSundownRegistryPath(
  options?: string | ResolveSundownRegistryOptions,
): string {
  if (process.env.REGISTRY_PATH) {
    const resolved = path.resolve(process.env.REGISTRY_PATH);
    if (fs.existsSync(path.join(resolved, "sources.json"))) {
      return resolved;
    }
    throw new Error(
      `REGISTRY_PATH is set but sources.json is missing at ${resolved}.`,
    );
  }

  const explicitSearch =
    typeof options === "string" ||
    (typeof options === "object" && Boolean(options?.searchFrom?.length));

  const searchFrom: string[] =
    typeof options === "string"
      ? [options]
      : options?.searchFrom?.length
        ? options.searchFrom
        : [process.cwd()];

  const tried = new Set<string>();
  for (const start of searchFrom) {
    const s = path.resolve(start);
    if (tried.has(s)) continue;
    tried.add(s);
    const root = findMonorepoRootFrom(s);
    if (root) return path.join(root, "registry");
  }

  const registryDirs = new Set<string>();
  for (const start of searchFrom) {
    const s = path.resolve(start);
    registryDirs.add(path.join(s, "registry"));
    registryDirs.add(path.join(s, "..", "registry"));
    registryDirs.add(path.join(s, "../..", "registry"));
    registryDirs.add(path.join(s, "../../..", "registry"));
  }
  if (!explicitSearch) {
    registryDirs.add(path.join(process.cwd(), "registry"));
    registryDirs.add(path.join(process.cwd(), "..", "registry"));
    registryDirs.add(path.join(process.cwd(), "../..", "registry"));
  }

  for (const reg of registryDirs) {
    const resolved = path.resolve(reg);
    if (fs.existsSync(path.join(resolved, "sources.json"))) {
      return resolved;
    }
  }

  throw new Error(
    "Could not find Sundown registry/ (sources.json). Set REGISTRY_PATH to the registry folder, or SUNDOWN_MONOREPO_ROOT to the repo root (common on Vercel).",
  );
}

export type ApplyRootDotenvOptions = {
  /** Workspace root containing `registry/`; never the scanned repo path. */
  root?: string;
  /** When true, overwrite existing `process.env` keys from `.env`. */
  force?: boolean;
};

/** Load Sundown workspace `.env` into process.env (not the scan target's `.env`). */
export function applyRootDotenv(options?: ApplyRootDotenvOptions): string {
  const root = options?.root ? path.resolve(options.root) : findMonorepoRoot();
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
  return (
    process.env.OPENROUTER_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.ANTHROPIC_API_KEY
  )
    ? true
    : false;
}