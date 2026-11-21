import type { Finding } from "../types.js";
import { getFetch, type FetchFn } from "./http.js";

type NpmPackument = {
  name: string;
  versions: Record<
    string,
    { deprecated?: string; version: string }
  >;
  "dist-tags"?: { latest?: string };
};

function normalizeNpmVersion(version?: string): string | null {
  if (!version) return null;
  return version.replace(/^[\^~>=<]+/, "").split(" ")[0] ?? null;
}

export async function resolveNpmPackage(
  finding: Finding,
  fetchImpl?: FetchFn,
): Promise<Partial<Finding>> {
  const fetch = getFetch(fetchImpl);
  const name = finding.name;
  const ver = normalizeNpmVersion(finding.version);
  const encoded = encodeURIComponent(name).replace(/^%40/, "@");
  const url = `https://registry.npmjs.org/${encoded}`;

  const res = await fetch(url, {
    headers: { Accept: "application/vnd.npm.install-v1+json" },
  });
  if (!res.ok) return {};

  const data = (await res.json()) as NpmPackument;

  const tryVersion = (v: string | undefined | null) => {
    if (!v) return undefined;
    const entry = data.versions[v];
    return entry?.deprecated;
  };

  if (!ver) return {};

  const deprecated = tryVersion(ver);
  if (!deprecated) return {};

  return {
    status: "deprecated",
    confidence: "official-data",
    sourceUrl: url,
    sourceQuote: deprecated,
    replacement: undefined,
  };
}