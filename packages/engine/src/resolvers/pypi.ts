import type { Finding } from "../types.js";
import { getFetch, type FetchFn } from "./http.js";

type PyPiJson = {
  info: { yanked?: boolean; yanked_reason?: string };
  releases: Record<string, { yanked?: boolean }[]>;
};

export async function resolvePyPiPackage(
  finding: Finding,
  fetchImpl?: FetchFn,
): Promise<Partial<Finding>> {
  const fetch = getFetch(fetchImpl);
  const name = finding.name.toLowerCase();
  const url = `https://pypi.org/pypi/${encodeURIComponent(name)}/json`;

  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) return {};

  const data = (await res.json()) as PyPiJson;
  if (data.info.yanked) {
    return {
      status: "deprecated",
      confidence: "official-data",
      sourceUrl: url,
      sourceQuote: data.info.yanked_reason ?? "Package yanked on PyPI",
    };
  }

  const ver = finding.version;
  if (ver && data.releases[ver]?.some((r) => r.yanked)) {
    return {
      status: "deprecated",
      confidence: "official-data",
      sourceUrl: url,
      sourceQuote: `Version ${ver} yanked on PyPI`,
    };
  }

  if (ver && data.releases[ver]?.length) {
    return {
      status: "healthy",
      confidence: "official-data",
      sourceUrl: url,
      sourceQuote: `PyPI: ${name}@${ver} is not yanked`,
    };
  }

  return {};
}