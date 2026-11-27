import { NextResponse } from "next/server";
import { createDefaultBatchLlmReader, scan } from "sundown-engine";
import { downloadPublicRepo } from "@/lib/github-tarball";
import { parseGitHubRepoUrl } from "@/lib/parse-repo";
import { monorepoRegistryPath } from "@/lib/registry-path";
import { ensureMonorepoEnv } from "@/lib/ensure-env";

ensureMonorepoEnv();

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: { repoUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const repoUrl = body.repoUrl?.trim();
  if (!repoUrl) {
    return NextResponse.json({ error: "repoUrl is required." }, { status: 400 });
  }

  const parsed = parseGitHubRepoUrl(repoUrl);
  if (!parsed) {
    return NextResponse.json(
      { error: "Only public github.com/owner/repo URLs are supported." },
      { status: 400 },
    );
  }

  let cleanup: (() => Promise<void>) | undefined;
  try {
    const { repoRoot, cleanup: c } = await downloadPublicRepo(parsed);
    cleanup = c;
    ensureMonorepoEnv();
    const report = await scan(repoRoot, {
      registryPath: monorepoRegistryPath(),
      batchLlmReader: createDefaultBatchLlmReader(),
    });
    return NextResponse.json({
      ...report,
      repo: `${parsed.owner}/${parsed.repo}`,
    });
  } catch (err) {
    console.error("[api/scan]", err);
    const message = err instanceof Error ? err.message : "Scan failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    if (cleanup) await cleanup().catch(() => undefined);
  }
}