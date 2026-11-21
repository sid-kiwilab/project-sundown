const RETRIES = 3;
const BACKOFF_MS = [0, 800, 2000];

export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  let lastError: unknown;
  for (let i = 0; i < RETRIES; i++) {
    if (i > 0) {
      await new Promise((r) => setTimeout(r, BACKOFF_MS[i] ?? 2000));
    }
    try {
      const res = await fetch(url, init);
      if (res.status === 429 || res.status >= 500) {
        lastError = new Error(`HTTP ${res.status} from ${url}`);
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
    }
  }
  if (lastError instanceof Error && lastError.message.includes("HTTP")) {
    throw lastError;
  }
  const hint =
    "GitHub download failed (network or rate limit). Set GITHUB_TOKEN in .env for higher limits, then restart the dev server.";
  if (lastError instanceof TypeError) {
    throw new Error(hint);
  }
  throw new Error(
    lastError instanceof Error ? `${lastError.message}. ${hint}` : hint,
  );
}