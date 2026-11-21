import type { Detection } from "../types.js";
import type { RegistryData } from "../registry.js";
import type { WalkedFile } from "../walk.js";
import { detectModels } from "./models.js";
import { detectApis } from "./apis.js";
import { detectPackages } from "./packages.js";
import { detectRuntimes } from "./runtimes.js";
import { detectActions } from "./actions.js";
import { detectEnvHints } from "./env.js";

export function runDetectors(
  files: WalkedFile[],
  registry: RegistryData,
): Detection[] {
  const all: Detection[] = [];
  all.push(...detectModels(files, registry));
  all.push(...detectApis(files));
  all.push(...detectPackages(files));
  all.push(...detectRuntimes(files));
  all.push(...detectActions(files));
  all.push(...detectEnvHints(files, registry.saas));
  return all;
}