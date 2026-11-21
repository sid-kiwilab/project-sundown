import type { Detection } from "../types.js";
import type { WalkedFile } from "../walk.js";
import { linesWithMatches } from "./utils.js";

export function detectRuntimes(files: WalkedFile[]): Detection[] {
  const out: Detection[] = [];

  for (const file of files) {
    const base = file.relativePath.split("/").pop() ?? "";

    if (base === ".nvmrc") {
      const v = file.content.trim().split("\n")[0]?.trim();
      if (v) {
        out.push({
          kind: "runtime",
          name: "node",
          version: v.replace(/^v/, ""),
          file: file.relativePath,
          line: 1,
          raw: v,
        });
      }
    }

    if (base === ".python-version" || base === "runtime.txt") {
      const v = file.content.trim().split("\n")[0]?.trim();
      if (v) {
        out.push({
          kind: "runtime",
          name: "python",
          version: v,
          file: file.relativePath,
          line: 1,
          raw: v,
        });
      }
    }

    if (base === "package.json") {
      try {
        const pkg = JSON.parse(file.content) as { engines?: { node?: string } };
        if (pkg.engines?.node) {
          out.push({
            kind: "runtime",
            name: "node",
            version: pkg.engines.node,
            file: file.relativePath,
            line: 1,
            raw: `"engines.node": "${pkg.engines.node}"`,
          });
        }
      } catch {
        /* skip */
      }
    }

    if (base === "Dockerfile" || file.relativePath.endsWith("/Dockerfile")) {
      for (const hit of linesWithMatches(file, /^FROM\s+(.+)/i)) {
        const raw = hit.raw;
        const img = raw.replace(/^FROM\s+/i, "").split(/\s+/)[0]!;
        out.push({
          kind: "runtime",
          name: `docker:${img}`,
          file: file.relativePath,
          line: hit.line,
          raw,
        });
        const nodeMatch = img.match(/node:([\d.]+)/i);
        if (nodeMatch) {
          out.push({
            kind: "runtime",
            name: "node",
            version: nodeMatch[1],
            file: file.relativePath,
            line: hit.line,
            raw,
          });
        }
      }
    }

    if (base === "vercel.json") {
      for (const hit of linesWithMatches(file, /"nodeVersion"\s*:\s*"([^"]+)"/)) {
        out.push({
          kind: "runtime",
          name: "node",
          version: hit.raw.match(/"nodeVersion"\s*:\s*"([^"]+)"/)?.[1],
          file: file.relativePath,
          line: hit.line,
          raw: hit.raw,
        });
      }
    }

    if (file.relativePath.includes(".github/workflows")) {
      for (const hit of linesWithMatches(file, /runs-on:\s*(.+)/)) {
        out.push({
          kind: "runtime",
          name: "github-runner",
          version: hit.raw.replace(/runs-on:\s*/i, "").trim(),
          file: file.relativePath,
          line: hit.line,
          raw: hit.raw,
        });
      }
    }
  }

  return out;
}