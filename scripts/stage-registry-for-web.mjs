import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "registry");
const dest = path.join(root, "apps/web/sundown-registry");

if (!fs.existsSync(path.join(src, "sources.json"))) {
  console.error("Missing monorepo registry/ at", src);
  process.exit(1);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
console.log("Staged registry for Vercel at", dest);