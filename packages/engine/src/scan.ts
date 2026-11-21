import path from "node:path";
import type { ScanOptions, ScanReport } from "./types.js";
import { walkRepo } from "./walk.js";
import { loadRegistry, resolveRegistryPath, countRegistryProviders } from "./registry.js";
import { runDetectors } from "./detectors/index.js";
import { detectionsToFindings } from "./dedupe.js";
import { resolveAllTier1 } from "./resolvers/tier1.js";
import { resolveAllTier2 } from "./resolvers/tier2.js";
import {
  createDefaultBatchLlmReader,
  hasAnyLlmKey,
} from "./readers/llm.js";
import { buildReport } from "./report.js";
import { buildMeta, finalizeUncheckedFindings } from "./coverage.js";
import { matchSaasVendor } from "./registry.js";

export async function scan(
  targetPath: string,
  options: ScanOptions = {},
): Promise<ScanReport> {
  const root = path.resolve(targetPath);
  const registryPath = await resolveRegistryPath(
    root,
    options.registryPath,
  );
  const registry = await loadRegistry(registryPath);
  const files = await walkRepo(root);
  const detections = runDetectors(files, registry);
  const findings = detectionsToFindings(detections);
  const tier1 = await resolveAllTier1(findings, {
    fetchImpl: options.fetchImpl,
    githubToken: options.githubToken ?? process.env.GITHUB_TOKEN,
    packageOverrides: registry.overrides,
    eol: registry.eol,
  });

  const tier2Enabled = options.tier2Enabled !== false;
  const batchLlmReader =
    options.batchLlmReader ??
    (tier2Enabled ? createDefaultBatchLlmReader() : undefined);
  const tier2SkipReason =
    tier2Enabled && !batchLlmReader && !hasAnyLlmKey()
      ? "Add OPENROUTER_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY for model/API notice pages."
      : undefined;

  let resolved = tier1;
  let tier2Errors: import("./types.js").Tier2Error[] = [];

  if (batchLlmReader) {
    const tier2 = await resolveAllTier2(tier1, {
      sources: registry.sources,
      saas: registry.saas,
      fetchImpl: options.fetchImpl,
      batchLlmReader,
      maxLookups: options.maxTier2Lookups,
    });
    resolved = tier2.findings;
    tier2Errors = tier2.errors;
  }

  resolved = finalizeUncheckedFindings(resolved, {
    tier2Enabled: Boolean(batchLlmReader),
    tier2SkipReason,
    hasSaasRegistry: registry.saas.length > 0,
  });

  for (let i = 0; i < resolved.length; i++) {
    const f = resolved[i]!;
    if (f.kind === "saas" && !f.checked) {
      const vendor = matchSaasVendor(f.name, f.kind, registry.saas);
      if (!vendor) {
        resolved[i] = {
          ...f,
          uncheckedReason: "no source in registry",
        };
      }
    }
  }

  const report = buildReport(root, resolved);
  const providerCount = countRegistryProviders(registry.sources);

  return {
    ...report,
    meta: buildMeta(resolved, {
      tier2Enabled: Boolean(batchLlmReader),
      tier2SkipReason,
      tier2Errors,
      registryProviderCount: providerCount,
    }),
  };
}