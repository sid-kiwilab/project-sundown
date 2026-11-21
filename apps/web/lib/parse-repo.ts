export type ParsedRepo = { owner: string; repo: string };

const GH_RE =
  /^(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)\/?/i;

export function parseGitHubRepoUrl(input: string): ParsedRepo | null {
  const trimmed = input.trim().replace(/\/$/, "");
  const m = trimmed.match(GH_RE);
  if (!m) return null;
  const owner = m[1]!;
  const repo = m[2]!.replace(/\.git$/i, "");
  if (!owner || !repo) return null;
  return { owner, repo };
}