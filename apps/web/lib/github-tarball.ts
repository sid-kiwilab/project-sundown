import { createWriteStream } from "node:fs";
import { mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import * as tar from "tar";
import type { ParsedRepo } from "./parse-repo";
import { fetchWithRetry } from "./fetch-retry";

const MAX_BYTES = 50 * 1024 * 1024;

function githubHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "sundown-web",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function defaultBranch(
  owner: string,
  repo: string,
  token?: string,
): Promise<string> {
  const res = await fetchWithRetry(
    `https://api.github.com/repos/${owner}/${repo}`,
    { headers: githubHeaders(token) },
  );
  if (res.status === 404) {
    throw new Error("Repository not found or not public.");
  }
  if (!res.ok) {
    throw new Error(
      `GitHub API error (${res.status}). Try again or set GITHUB_TOKEN in .env.`,
    );
  }
  const data = (await res.json()) as { default_branch?: string };
  return data.default_branch ?? "main";
}

export async function downloadPublicRepo(
  parsed: ParsedRepo,
): Promise<{ repoRoot: string; cleanup: () => Promise<void> }> {
  const token = process.env.GITHUB_TOKEN;
  const ref = await defaultBranch(parsed.owner, parsed.repo, token);
  const url = `https://codeload.github.com/${parsed.owner}/${parsed.repo}/tar.gz/${ref}`;

  const res = await fetchWithRetry(url, {
    headers: {
      "User-Agent": "sundown-web",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(
      `Could not download repo tarball (HTTP ${res.status}). Repo may be empty or blocked.`,
    );
  }

  const len = res.headers.get("content-length");
  if (len && Number(len) > MAX_BYTES) {
    throw new Error("Repository tarball exceeds 50MB limit.");
  }

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_BYTES) {
    throw new Error("Repository tarball exceeds 50MB limit.");
  }

  const workDir = await mkdtemp(path.join(os.tmpdir(), "sundown-"));
  const archivePath = path.join(workDir, "repo.tar.gz");
  await pipeline(Readable.from(buf), createWriteStream(archivePath));
  const extractDir = path.join(workDir, "extract");
  await mkdir(extractDir, { recursive: true });
  await tar.x({ file: archivePath, cwd: extractDir });

  const top = await readdir(extractDir);
  if (top.length === 0) {
    await rm(workDir, { recursive: true, force: true });
    throw new Error("Empty repository archive.");
  }
  const repoRoot = path.join(extractDir, top[0]!);

  const cleanup = async () => {
    await rm(workDir, { recursive: true, force: true });
  };

  return { repoRoot, cleanup };
}