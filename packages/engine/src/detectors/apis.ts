import type { Detection } from "../types.js";
import type { WalkedFile } from "../walk.js";
import { linesWithMatches, allMatchesInFile } from "./utils.js";

const SDK_IMPORTS = [
  { name: "openai", re: /from\s+['"]openai['"]|require\(['"]openai['"]\)/ },
  { name: "@anthropic-ai/sdk", re: /from\s+['"]@anthropic-ai\/sdk['"]/ },
  { name: "stripe", re: /from\s+['"]stripe['"]|require\(['"]stripe['"]\)/ },
  { name: "twilio", re: /from\s+['"]twilio['"]/ },
  { name: "@google/generative-ai", re: /@google\/generative-ai/ },
];

const API_HOSTS = [
  { name: "api.openai.com", re: /api\.openai\.com/i },
  { name: "api.anthropic.com", re: /api\.anthropic\.com/i },
  { name: "generativelanguage.googleapis.com", re: /generativelanguage\.googleapis\.com/i },
];

const VERSION_HEADER = /\b20\d{2}-\d{2}-\d{2}\b/g;

const CODE_EXT =
  /\.(ts|tsx|js|jsx|mjs|cjs|json|yaml|yml|toml|env|py|go|rs)$/i;

export function detectApis(files: WalkedFile[]): Detection[] {
  const out: Detection[] = [];
  const seen = new Set<string>();

  for (const file of files) {
    if (!CODE_EXT.test(file.relativePath)) continue;
    for (const sdk of SDK_IMPORTS) {
      for (const hit of linesWithMatches(file, sdk.re)) {
        const key = `api:${sdk.name}:${file.relativePath}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          kind: "api",
          name: sdk.name,
          file: file.relativePath,
          line: hit.line,
          raw: hit.raw,
        });
      }
    }
    for (const host of API_HOSTS) {
      for (const hit of linesWithMatches(file, host.re)) {
        const key = `api:${host.name}:${file.relativePath}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          kind: "api",
          name: host.name,
          file: file.relativePath,
          line: hit.line,
          raw: hit.raw,
        });
      }
    }
    if (
      file.relativePath.includes("/test/") ||
      file.relativePath.includes("/fixtures/") ||
      file.relativePath.endsWith(".test.ts")
    ) {
      continue;
    }
    for (const h of allMatchesInFile(file, VERSION_HEADER)) {
      const key = `api:header:${h.match}:${file.relativePath}:${h.line}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        kind: "api",
        name: `api-version-header:${h.match}`,
        file: file.relativePath,
        line: h.line,
        raw: h.raw,
      });
    }
  }

  return out;
}