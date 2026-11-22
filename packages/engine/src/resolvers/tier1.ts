import type { Finding } from "../types.js";
import type { EolMap, PackageOverride } from "../registry.js";
import type { FetchFn } from "./http.js";
import {
  eolSlugForFinding,
  resolveEolProduct,
  resolveNodeRuntime,
} from "./endoflife.js";
import { resolveNpmPackage } from "./npm.js";
import { resolvePyPiPackage } from "./pypi.js";
import { resolveGithubAction } from "./github.js";
import { applyRegistryOverride } from "./overrides.js";

export type Tier1Context = {
  fetchImpl?: FetchFn;
  githubToken?: string;
  packageOverrides?: PackageOverride[];
  eol?: EolMap;
};

const defaultUnresolved: Partial<Finding> = {
  status: "no_notice_found",
  confidence: "unverified",
};

function hasOfficialTier1Evidence(finding: Finding): boolean {
  return (
    finding.status !== "no_notice_found" &&
    (finding.sourceUrl !== undefined || finding.sourceQuote !== undefined)
  );
}

function mergeChecked(
  patch: Partial<Finding>,
  checkSource: string,
): Partial<Finding> {
  return { ...patch, checked: true, checkSource };
}

export async function resolveTier1(
  finding: Finding,
  ctx: Tier1Context,
): Promise<Finding> {
  const override =
    ctx.packageOverrides && ctx.packageOverrides.length > 0
      ? applyRegistryOverride(finding, ctx.packageOverrides)
      : null;
  if (override) {
    return {
      ...finding,
      ...override,
      checked: true,
      checkSource: "registry/packages.json override",
    };
  }

  let patch: Partial<Finding> = {};

  if (finding.kind === "runtime") {
    if (finding.name === "node" && !ctx.eol) {
      patch = await resolveNodeRuntime(finding, ctx.fetchImpl);
    } else if (ctx.eol) {
      const mapped = eolSlugForFinding(finding, ctx.eol);
      if (mapped) {
        patch = await resolveEolProduct(
          { ...finding, version: mapped.version ?? finding.version },
          mapped.slug,
          ctx.fetchImpl,
        );
      } else if (finding.name === "node") {
        patch = await resolveNodeRuntime(finding, ctx.fetchImpl);
      } else {
        patch = mergeChecked(defaultUnresolved, "endoflife.date (no product map)");
      }
    }
  } else if (finding.kind === "package") {
    const sources: string[] = [];
    let best: Partial<Finding> = { ...defaultUnresolved };

    if (ctx.eol) {
      const mapped = eolSlugForFinding(finding, ctx.eol);
      if (mapped) {
        const eolPatch = await resolveEolProduct(
          { ...finding, version: mapped.version ?? finding.version },
          mapped.slug,
          ctx.fetchImpl,
        );
        if (eolPatch.checkSource) sources.push(String(eolPatch.checkSource));
        if (eolPatch.endDate || eolPatch.status === "dead") {
          best = eolPatch;
        }
      }
    }

    const npm = await resolveNpmPackage(finding, ctx.fetchImpl);
    sources.push("npm registry");
    if (npm.status === "deprecated") {
      best = { ...npm, checked: true, checkSource: sources.join(" + ") };
    } else if (
      npm.status === "healthy" &&
      best.status !== "deprecated" &&
      best.status !== "dead"
    ) {
      best = { ...npm, checked: true, checkSource: "npm registry" };
    }

    const py = await resolvePyPiPackage(finding, ctx.fetchImpl);
    sources.push("PyPI");
    if (py.status === "deprecated" && best.status !== "deprecated") {
      best = { ...py, checked: true, checkSource: sources.join(" + ") };
    } else if (
      py.status === "healthy" &&
      best.status !== "deprecated" &&
      best.status !== "dead"
    ) {
      best = { ...py, checked: true, checkSource: "PyPI" };
    }

    patch = {
      ...best,
      checked: true,
      checkSource:
        best.checkSource ?? [...new Set(sources)].join(" + "),
    };
    if (!patch.status) {
      patch.status = "no_notice_found";
      patch.confidence = "unverified";
    }
  } else if (finding.kind === "action") {
    const gh = await resolveGithubAction(
      finding,
      ctx.githubToken,
      ctx.fetchImpl,
    );
    patch = gh.status
      ? { ...gh, checked: true, checkSource: "GitHub API" }
      : ctx.githubToken
        ? { checked: true, checkSource: "GitHub API", ...defaultUnresolved }
        : {
            checked: false,
            uncheckedReason: "GITHUB_TOKEN not set — action not checked",
            ...defaultUnresolved,
          };
  } else if (finding.kind === "api") {
    patch = {
      ...defaultUnresolved,
      checked: false,
      uncheckedReason:
        "API hostname — not checked against provider deprecation pages (see model rows).",
    };
  } else if (finding.kind === "model" || finding.kind === "saas") {
    patch = { ...defaultUnresolved, checked: false };
  }

  if (!patch.status) {
    patch = { ...patch, ...defaultUnresolved };
  }

  const merged = { ...finding, ...patch };
  if (
    merged.status === "no_notice_found" &&
    !merged.sourceUrl &&
    !merged.sourceQuote
  ) {
    merged.confidence = "unverified";
  } else if (
    merged.status === "healthy" &&
    merged.sourceUrl &&
    merged.confidence !== "official-page"
  ) {
    merged.confidence = "official-data";
  } else if (hasOfficialTier1Evidence(merged)) {
    merged.confidence = "official-data";
  }

  return merged;
}

export async function resolveAllTier1(
  findings: Finding[],
  ctx: Tier1Context,
): Promise<Finding[]> {
  const concurrency = 8;
  const out: Finding[] = [];
  for (let i = 0; i < findings.length; i += concurrency) {
    const chunk = findings.slice(i, i + concurrency);
    const resolved = await Promise.all(
      chunk.map((f) => resolveTier1(f, ctx)),
    );
    out.push(...resolved);
  }
  return out;
}