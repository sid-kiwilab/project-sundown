import path from "node:path";
import fs from "node:fs/promises";
import fg from "fast-glob";

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
  ".turbo",
]);

const MAX_FILE_BYTES = 512 * 1024;

const LOCKFILE_SKIP_IF_OVER = 2 * 1024 * 1024;

/** When unset/false, skip test files and fixture trees (not the scan root itself). */
export function shouldIncludeTestsInWalk(): boolean {
  const v = process.env.SUNDOWN_INCLUDE_TESTS?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

const TEST_FIXTURE_GLOB_IGNORE = [
  "**/*.test.ts",
  "**/*.test.tsx",
  "**/*.spec.ts",
  "**/*.spec.tsx",
  "**/fixtures/**",
];

export type WalkedFile = {
  absolutePath: string;
  relativePath: string;
  content: string;
};

export async function walkRepo(root: string): Promise<WalkedFile[]> {
  const normalized = path.resolve(root);
  const ignore = [
    "**/node_modules/**",
    "**/.git/**",
    "**/dist/**",
    "**/build/**",
    "**/.next/**",
    "**/registry/**",
    "**/harness/**",
  ];
  if (!shouldIncludeTestsInWalk()) {
    ignore.push(...TEST_FIXTURE_GLOB_IGNORE);
  }

  const entries = await fg("**/*", {
    cwd: normalized,
    absolute: true,
    dot: true,
    onlyFiles: true,
    ignore,
  });

  const out: WalkedFile[] = [];

  for (const absolutePath of entries) {
    const rel = path.relative(normalized, absolutePath);
    const parts = rel.split(path.sep);
    if (parts.some((p) => SKIP_DIRS.has(p))) continue;

    const base = path.basename(absolutePath);
    if (
      base === "package-lock.json" ||
      base === "yarn.lock" ||
      base === "pnpm-lock.yaml"
    ) {
      const stat = await fs.stat(absolutePath);
      if (stat.size > LOCKFILE_SKIP_IF_OVER) continue;
    }

    const stat = await fs.stat(absolutePath);
    if (stat.size > MAX_FILE_BYTES) continue;

    let content: string;
    try {
      content = await fs.readFile(absolutePath, "utf8");
    } catch {
      continue;
    }
    if (content.includes("\0")) continue;

    out.push({
      absolutePath,
      relativePath: rel.replace(/\\/g, "/"),
      content,
    });
  }

  return out;
}