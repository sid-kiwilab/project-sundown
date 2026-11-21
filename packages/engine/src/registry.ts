import fs from "node:fs/promises";
import path from "node:path";

export type ModelPattern = {
  provider: string;
  patterns: string[];
};

export type SourceEntry = {
  provider: string;
  urls: string[];
  modelsListUrls?: string[];
};

export type PackageOverride = {
  name: string;
  kind?: string;
  note?: string;
};

export type SaasVendor = {
  id: string;
  name: string;
  envPrefixes?: string[];
  envKeys?: string[];
  hosts?: string[];
  sdks?: string[];
  urls?: string[];
};

export type EolMap = {
  runtimes: Record<string, string>;
  packages: Record<string, string>;
  dockerImages: Record<string, string>;
};

export type RegistryData = {
  models: ModelPattern[];
  sources: SourceEntry[];
  overrides: PackageOverride[];
  saas: SaasVendor[];
  eol: EolMap;
};

const defaultEol: EolMap = {
  runtimes: {
    node: "nodejs",
    python: "python",
    "github-runner": "",
  },
  packages: {},
  dockerImages: {},
};

export async function loadRegistry(registryPath: string): Promise<RegistryData> {
  const modelsPath = path.join(registryPath, "models.json");
  const sourcesPath = path.join(registryPath, "sources.json");
  const packagesPath = path.join(registryPath, "packages.json");
  const saasPath = path.join(registryPath, "saas.json");
  const eolPath = path.join(registryPath, "eol.json");

  const [modelsRaw, sourcesRaw, packagesRaw] = await Promise.all([
    fs.readFile(modelsPath, "utf8"),
    fs.readFile(sourcesPath, "utf8"),
    fs.readFile(packagesPath, "utf8"),
  ]);

  let saas: SaasVendor[] = [];
  let eol: EolMap = defaultEol;

  try {
    const saasRaw = await fs.readFile(saasPath, "utf8");
    const saasJson = JSON.parse(saasRaw) as { vendors?: SaasVendor[] };
    saas = saasJson.vendors ?? [];
  } catch {
    /* optional file */
  }

  try {
    const eolRaw = await fs.readFile(eolPath, "utf8");
    const parsed = JSON.parse(eolRaw) as Partial<EolMap>;
    eol = {
      runtimes: { ...defaultEol.runtimes, ...parsed.runtimes },
      packages: { ...defaultEol.packages, ...parsed.packages },
      dockerImages: { ...defaultEol.dockerImages, ...parsed.dockerImages },
    };
  } catch {
    /* optional file */
  }

  const modelsJson = JSON.parse(modelsRaw) as { providers: ModelPattern[] };
  const sourcesJson = JSON.parse(sourcesRaw) as { sources: SourceEntry[] };
  const packagesJson = JSON.parse(packagesRaw) as {
    overrides: PackageOverride[];
  };

  return {
    models: modelsJson.providers ?? [],
    sources: sourcesJson.sources ?? [],
    overrides: packagesJson.overrides ?? [],
    saas,
    eol,
  };
}

export function defaultRegistryPath(fromDir: string): string {
  let dir = path.resolve(fromDir);
  for (let i = 0; i < 8; i++) {
    const candidate = path.join(dir, "registry");
    try {
      return candidate;
    } catch {
      /* continue */
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.join(path.resolve(fromDir), "registry");
}

export async function resolveRegistryPath(
  scanRoot: string,
  explicit?: string,
): Promise<string> {
  if (explicit) return path.resolve(explicit);
  let dir = path.resolve(scanRoot);
  for (let i = 0; i < 10; i++) {
    const candidate = path.join(dir, "registry", "models.json");
    try {
      await fs.access(candidate);
      return path.join(dir, "registry");
    } catch {
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
  throw new Error(
    "Could not find registry/ (models.json). Pass registryPath in ScanOptions.",
  );
}

export function matchSaasVendor(
  findingName: string,
  kind: string,
  vendors: SaasVendor[],
): SaasVendor | undefined {
  for (const v of vendors) {
    if (kind === "saas" && findingName.startsWith("env:")) {
      const key = findingName.slice(4);
      if (v.envKeys?.some((k) => k === key)) return v;
      if (v.envPrefixes?.some((p) => key.startsWith(p))) return v;
    }
    if (kind === "api") {
      if (v.hosts?.some((h) => findingName.includes(h))) return v;
      if (v.sdks?.some((s) => findingName.includes(s))) return v;
    }
  }
  return undefined;
}

export function countRegistryProviders(sources: SourceEntry[]): number {
  return new Set(sources.map((s) => s.provider)).size;
}