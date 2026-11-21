import { applyRootDotenv } from "./root-dotenv";

let loaded = false;

/** Load monorepo root `.env` for API routes (Next loadEnvConfig often skips keys here). */
export function ensureMonorepoEnv(): void {
  if (loaded) return;
  applyRootDotenv({ force: true });
  loaded = true;
}