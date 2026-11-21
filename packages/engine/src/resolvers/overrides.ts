import type { Finding } from "../types.js";
import type { PackageOverride } from "../registry.js";

export function applyRegistryOverride(
  finding: Finding,
  overrides: PackageOverride[],
): Partial<Finding> | null {
  const entry = overrides.find(
    (o) => o.name === finding.name || o.name === `${finding.name}`,
  );
  if (!entry?.note?.trim()) return null;

  const status =
    entry.kind === "dead"
      ? "dead"
      : entry.kind === "deprecated"
        ? "deprecated"
        : "dead";

  return {
    status,
    confidence: "official-data",
    sourceQuote: entry.note.trim(),
    sourceUrl: "https://github.com/sid-kiwilab/project-sundown/tree/main/registry/packages.json",
  };
}