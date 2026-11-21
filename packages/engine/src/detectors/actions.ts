import type { Detection } from "../types.js";
import type { WalkedFile } from "../walk.js";
import { allMatchesInFile } from "./utils.js";

const USES_RE = /uses:\s*['"]?([^'"\s]+)['"]?/gi;

export function detectActions(files: WalkedFile[]): Detection[] {
  const out: Detection[] = [];
  const seen = new Set<string>();

  for (const file of files) {
    if (!file.relativePath.includes(".github/workflows")) continue;
    for (const h of allMatchesInFile(file, USES_RE)) {
      const full = h.raw.match(/uses:\s*['"]?([^'"\s]+)['"]?/i);
      const action = full?.[1];
      if (!action) continue;
      const key = `${action}:${file.relativePath}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        kind: "action",
        name: action,
        file: file.relativePath,
        line: h.line,
        raw: h.raw,
      });
    }
  }

  return out;
}