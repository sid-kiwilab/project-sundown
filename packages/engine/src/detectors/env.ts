import type { Detection } from "../types.js";
import type { SaasVendor } from "../registry.js";
import type { WalkedFile } from "../walk.js";
import { linesWithMatches } from "./utils.js";

const FALLBACK_ENV = [
  /OPENAI_API_KEY/,
  /ANTHROPIC_API_KEY/,
  /STRIPE_[A-Z_]+/,
  /TWILIO_[A-Z_]+/,
  /GOOGLE_[A-Z_]+/,
];

export function detectEnvHints(
  files: WalkedFile[],
  saasVendors: SaasVendor[] = [],
): Detection[] {
  const out: Detection[] = [];
  const seen = new Set<string>();

  const patterns: RegExp[] = [...FALLBACK_ENV];
  for (const v of saasVendors) {
    for (const p of v.envPrefixes ?? []) {
      patterns.push(new RegExp(`${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[A-Z0-9_]*`));
    }
    for (const k of v.envKeys ?? []) {
      patterns.push(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    }
  }

  for (const file of files) {
    if (!file.relativePath.endsWith(".env.example")) continue;
    for (const pattern of patterns) {
      for (const hit of linesWithMatches(file, pattern)) {
        const name = hit.raw.match(/([A-Z][A-Z0-9_]+)/)?.[1];
        if (!name) continue;
        const key = `saas:${name}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          kind: "saas",
          name: `env:${name}`,
          file: file.relativePath,
          line: hit.line,
          raw: hit.raw,
        });
      }
    }
  }

  return out;
}