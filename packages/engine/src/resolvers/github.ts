import type { Finding } from "../types.js";
import { getFetch, type FetchFn } from "./http.js";

/** Resolves GitHub Action `owner/repo` archived status when token is set. */
export async function resolveGithubAction(
  finding: Finding,
  token?: string,
  fetchImpl?: FetchFn,
): Promise<Partial<Finding>> {
  if (!token) return {};
  const name = finding.name;
  if (!name.includes("/") || name.startsWith("./")) return {};

  const [owner, repo] = name.split("@")[0]!.split("/");
  if (!owner || !repo) return {};

  const fetch = getFetch(fetchImpl);
  const url = `https://api.github.com/repos/${owner}/${repo}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "sundown-cli",
    },
  });
  if (!res.ok) return {};

  const data = (await res.json()) as { archived?: boolean; html_url?: string };
  if (!data.archived) {
    return {
      status: "healthy",
      confidence: "official-data",
      sourceUrl: data.html_url,
    };
  }

  return {
    status: "dead",
    confidence: "official-data",
    sourceUrl: data.html_url,
    sourceQuote: "Repository is archived on GitHub",
  };
}