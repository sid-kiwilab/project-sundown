import crypto from "node:crypto";
import type { Detection, Finding, FindingKind } from "./types.js";

function stableId(kind: FindingKind, name: string, version?: string): string {
  const payload = `${kind}:${name}:${version ?? ""}`;
  return crypto.createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

export function detectionsToFindings(detections: Detection[]): Finding[] {
  const map = new Map<string, Finding>();

  for (const d of detections) {
    const id = stableId(d.kind, d.name, d.version);
    const existing = map.get(id);
    if (existing) {
      const loc = { file: d.file, line: d.line };
      if (
        !existing.locations.some(
          (l) => l.file === loc.file && l.line === loc.line,
        )
      ) {
        existing.locations.push(loc);
      }
      continue;
    }
    map.set(id, {
      id,
      kind: d.kind,
      name: d.name,
      version: d.version,
      locations: [{ file: d.file, line: d.line }],
      status: "no_notice_found",
      confidence: "unverified",
      checked: false,
    });
  }

  return [...map.values()];
}