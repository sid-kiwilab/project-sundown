import type { Detection } from "../types.js";
import type { RegistryData } from "../registry.js";
import type { WalkedFile } from "../walk.js";
import { allMatchesInFile } from "./utils.js";

const BUILTIN_PATTERNS = [
  /\bgpt-[\w.-]+/gi,
  /\bclaude-[\w.-]+/gi,
  /\bgemini-[\w.-]+/gi,
  /\bo[13]-[\w.-]+/gi,
  /\bllama-[\w.-]+/gi,
  /\bmistral-[\w.-]+/gi,
  /\btext-embedding-[\w.-]+/gi,
  /\bdall-e-[\w.-]+/gi,
  /\bgpt-image-[\w.-]+/gi,
];

const SCANNABLE_EXT =
  /\.(ts|tsx|js|jsx|mjs|cjs|py|rb|go|rs|java|kt|swift|json|yaml|yml|toml|env)$/i;

export function detectModels(
  files: WalkedFile[],
  registry: RegistryData,
): Detection[] {
  const patterns: RegExp[] = [...BUILTIN_PATTERNS];
  for (const p of registry.models) {
    for (const pat of p.patterns) {
      try {
        patterns.push(new RegExp(pat, "gi"));
      } catch {
        patterns.push(new RegExp(pat.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"));
      }
    }
  }

  const seen = new Set<string>();
  const out: Detection[] = [];

  for (const file of files) {
    if (!SCANNABLE_EXT.test(file.relativePath)) continue;
    for (const pattern of patterns) {
      const hits = allMatchesInFile(file, pattern);
      for (const h of hits) {
        const name = h.match.toLowerCase();
        if (name.length < 4 || /[-_.]$/.test(name)) continue;
        const key = `${name}:${file.relativePath}:${h.line}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          kind: "model",
          name,
          file: file.relativePath,
          line: h.line,
          raw: h.raw,
        });
      }
    }
  }

  return out;
}