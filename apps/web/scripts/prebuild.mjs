/**
 * Before `next build`: compile engine + copy registry for Vercel (Root Directory apps/web).
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const webDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(webDir, "../..");

function run(cmd, args, cwd) {
  const r = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
    shell: true,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

run("npm", ["run", "build", "-w", "@sundown/engine"], repoRoot);
run("node", [path.join(repoRoot, "scripts/stage-registry-for-web.mjs")], repoRoot);