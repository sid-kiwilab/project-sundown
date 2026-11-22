/**
 * Vercel's post-next-build step lstat's .next/export-detail.json even when
 * hasExportPathMap is false. App Router apps don't create it; this stub unblocks deploy.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextDir = path.join(root, "apps/web/.next");
const target = path.join(nextDir, "export-detail.json");

if (!fs.existsSync(nextDir)) {
  console.error("Expected apps/web/.next after next build");
  process.exit(1);
}

fs.writeFileSync(
  target,
  JSON.stringify({ version: 1, success: false }),
  "utf8",
);
console.log("Wrote", target);