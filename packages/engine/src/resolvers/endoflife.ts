import type { Finding } from "../types.js";
import type { EolMap } from "../registry.js";
import { getFetch, type FetchFn } from "./http.js";

const EOL_API = "https://endoflife.date/api";

type EolCycle = {
  cycle: string;
  eol: string | boolean;
  latest?: string;
  lts?: boolean | string;
};

const cycleCache = new Map<string, EolCycle[]>();

function isLooseRange(version?: string): boolean {
  if (!version) return false;
  const v = version.trim();
  if (/^>=|^>|^<|^<=|\^|~|\*|x\.x|\s+-\s+|\|\|/i.test(v)) return true;
  return false;
}

function parseVersionConstraint(version?: string): string | null {
  if (!version) return null;
  const cleaned = version.trim().replace(/^v/, "");
  const range = cleaned.match(/^(?:>=|>|<=|<)?\s*v?(\d+)(?:\.(\d+))?/i);
  if (range) {
    const major = range[1];
    const minor = range[2];
    return minor ? `${major}.${minor}` : major!;
  }
  const m = cleaned.match(/(\d+)\.?(\d*)?/);
  if (!m) return null;
  const major = m[1];
  const minor = m[2] ? `.${m[2]}` : "";
  return `${major}${minor}`.replace(/\.$/, "");
}

function daysUntil(isoDate: string): number {
  const end = new Date(isoDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

async function fetchProductCycles(
  productSlug: string,
  fetchImpl?: FetchFn,
): Promise<EolCycle[] | null> {
  if (cycleCache.has(productSlug)) {
    return cycleCache.get(productSlug)!;
  }
  const fetch = getFetch(fetchImpl);
  const res = await fetch(`${EOL_API}/${productSlug}.json`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  const cycles = (await res.json()) as EolCycle[];
  cycleCache.set(productSlug, cycles);
  return cycles;
}

export function clearEolCacheForTests(): void {
  cycleCache.clear();
}

export async function resolveEolProduct(
  finding: Finding,
  productSlug: string,
  fetchImpl?: FetchFn,
): Promise<Partial<Finding>> {
  if (!productSlug || isLooseRange(finding.version)) {
    return {
      checked: true,
      checkSource: "endoflife.date (skipped: unpinned version)",
      uncheckedReason: "Version range is not pinned — cannot query endoflife.date safely.",
    };
  }

  const ver = parseVersionConstraint(finding.version);
  if (!ver) {
    return {
      checked: true,
      checkSource: `endoflife.date/${productSlug}`,
      uncheckedReason: "No parseable version for endoflife.date.",
    };
  }

  const cycles = await fetchProductCycles(productSlug, fetchImpl);
  if (!cycles) {
    return {
      checked: true,
      checkSource: `endoflife.date/${productSlug}`,
      uncheckedReason: "endoflife.date request failed.",
    };
  }

  const major = ver.split(".")[0];
  let match = cycles.find((r) => r.cycle === ver || r.cycle === major);
  if (!match && major) {
    match = cycles.find((r) => r.cycle === major);
  }
  if (!match) {
    return {
      status: "no_notice_found",
      confidence: "unverified",
      checked: true,
      checkSource: `endoflife.date/${productSlug}`,
      sourceUrl: `https://endoflife.date/${productSlug}`,
    };
  }

  if (match.eol === false) {
    return {
      status: "healthy",
      confidence: "official-data",
      checked: true,
      checkSource: `endoflife.date/${productSlug}`,
      sourceUrl: `https://endoflife.date/${productSlug}`,
    };
  }

  const eol = typeof match.eol === "string" ? match.eol : undefined;
  if (!eol) {
    return {
      status: "dead",
      confidence: "official-data",
      checked: true,
      checkSource: `endoflife.date/${productSlug}`,
      sourceUrl: `https://endoflife.date/${productSlug}`,
      sourceQuote: `${productSlug} ${match.cycle} is end-of-life`,
    };
  }

  const daysLeft = daysUntil(eol);
  const status = daysLeft < 0 ? "dead" : "deprecated";

  return {
    status,
    endDate: new Date(eol).toISOString().slice(0, 10),
    daysLeft,
    confidence: "official-data",
    checked: true,
    checkSource: `endoflife.date/${productSlug}`,
    sourceUrl: `https://endoflife.date/${productSlug}`,
    sourceQuote: `${productSlug} ${match.cycle} EOL: ${eol}`,
  };
}

export async function resolveNodeRuntime(
  finding: Finding,
  fetchImpl?: FetchFn,
): Promise<Partial<Finding>> {
  return resolveEolProduct(finding, "nodejs", fetchImpl);
}

export function eolSlugForFinding(
  finding: Finding,
  eol: EolMap,
): { slug: string; version?: string } | null {
  if (finding.kind === "runtime") {
    if (finding.name === "node" || finding.name === "python") {
      const slug = eol.runtimes[finding.name];
      if (slug) return { slug, version: finding.version };
    }
    if (finding.name.startsWith("docker:")) {
      const img = finding.name.slice("docker:".length);
      const colon = img.lastIndexOf(":");
      const base = (colon >= 0 ? img.slice(0, colon) : img)
        .split("/")
        .pop()!
        .toLowerCase();
      const tag = colon >= 0 ? img.slice(colon + 1) : finding.version;
      const slug = eol.dockerImages[base];
      if (slug) return { slug, version: tag ?? finding.version };
    }
    const slug = eol.runtimes[finding.name];
    if (slug) return { slug, version: finding.version };
  }
  if (finding.kind === "package") {
    const slug = eol.packages[finding.name];
    if (slug) return { slug, version: finding.version };
  }
  return null;
}