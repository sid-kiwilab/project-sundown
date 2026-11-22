/**
 * Production build for @sundown/web (local + Vercel Root Directory apps/web).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const webDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(webDir, "../..");

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run("npm", ["run", "build", "-w", "@sundown/engine"], repoRoot);
run("node", [path.join(repoRoot, "scripts/stage-registry-for-web.mjs")], repoRoot);
run("npx", ["next", "build"], webDir);

// Vercel post-build sometimes lstat's export-detail.json even for SSR apps (ENOENT).
// Do not use success:false — that triggers NEXT_EXPORT_FAILED.
if (process.env.VERCEL === "1") {
  const detail = path.join(webDir, ".next", "export-detail.json");
  if (!fs.existsSync(detail)) {
    fs.writeFileSync(
      detail,
      JSON.stringify({ version: 1, success: true }),
      "utf8",
    );
  }
}