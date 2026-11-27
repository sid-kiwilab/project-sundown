import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "registry");
const dest = path.join(root, "packages", "engine", "registry");

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });
for (const name of fs.readdirSync(src)) {
  if (!name.endsWith(".json")) continue;
  fs.copyFileSync(path.join(src, name), path.join(dest, name));
}
