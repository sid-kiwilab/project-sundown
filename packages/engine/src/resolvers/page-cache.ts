const TTL_MS = 24 * 60 * 60 * 1000;

type Entry = { text: string; at: number };

const cache = new Map<string, Entry>();

export function getCachedPage(url: string): string | undefined {
  const hit = cache.get(url);
  if (!hit) return undefined;
  if (Date.now() - hit.at > TTL_MS) {
    cache.delete(url);
    return undefined;
  }
  return hit.text;
}

export function setCachedPage(url: string, text: string): void {
  cache.set(url, { text, at: Date.now() });
}

export function clearPageCache(): void {
  cache.clear();
}