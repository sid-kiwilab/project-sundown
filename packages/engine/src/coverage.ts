import type { CoverageSummary, Finding, ScanMeta, Tier2Error } from "./types.js";
import { addSourceIssueUrl } from "./types.js";

export function computeCoverage(findings: Finding[]): CoverageSummary {
  const total = findings.length;
  const checked = findings.filter((f) => f.checked).length;
  return { checked, total, unchecked: total - checked };
}

export function finalizeUncheckedFindings(
  findings: Finding[],
  ctx: {
    tier2Enabled: boolean;
    tier2SkipReason?: string;
    hasSaasRegistry: boolean;
  },
): Finding[] {
  return findings.map((f) => {
    if (f.checked) return f;

    let reason = f.uncheckedReason;
    if (!reason) {
      if (
        (f.kind === "model" || f.kind === "api") &&
        !ctx.tier2Enabled
      ) {
        reason =
          ctx.tier2SkipReason ??
          "Tier 2 not run — no LLM key for official notice pages.";
      } else if (f.kind === "saas" && !f.checkSource) {
        reason = ctx.hasSaasRegistry
          ? "no source in registry"
          : "SaaS registry not loaded";
      } else if (f.kind === "package" || f.kind === "runtime" || f.kind === "action") {
        reason = "Tier 1 did not reach a registry source (network or unmappable).";
      } else if (f.kind === "model" || f.kind === "api") {
        reason = "no registry provider or official page fetch did not run.";
      } else {
        reason = "not checked against a named source.";
      }
    }

  const issueLink =
      f.kind === "saas" && reason?.includes("no source in registry")
        ? addSourceIssueUrl(f.name)
        : undefined;

    const quote =
      issueLink && !f.sourceQuote
        ? `Add a changelog URL: ${issueLink}`
        : f.sourceQuote;

    return {
      ...f,
      uncheckedReason: reason,
      sourceQuote: quote ?? f.sourceQuote,
    };
  });
}

export function buildStandBehindLine(registryProviderCount: number): string {
  const n = registryProviderCount > 0 ? String(registryProviderCount) : "listed";
  return `“Checked” means we queried a named source for that row (no notice on that page still counts). Covers ${n} provider doc URLs plus npm, PyPI, and runtime EOL. API hostnames and unknown vendors stay unchecked until we add a source.`;
}

export function buildMeta(
  findings: Finding[],
  partial: {
    tier2Enabled: boolean;
    tier2SkipReason?: string;
    tier2Errors: Tier2Error[];
    registryProviderCount: number;
  },
): ScanMeta {
  const coverage = computeCoverage(findings);
  return {
    tier2Enabled: partial.tier2Enabled,
    tier2SkipReason: partial.tier2SkipReason,
    coverage,
    tier2Errors: partial.tier2Errors,
    registryProviderCount: partial.registryProviderCount,
    standBehindLine: buildStandBehindLine(partial.registryProviderCount),
  };
}