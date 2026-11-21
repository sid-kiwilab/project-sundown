import { normalizeForQuoteMatch } from "./quote-gate.js";

/** Slice ~`radius` chars around the first case-insensitive match of `needle`. */
export function windowAround(
  pageText: string,
  needle: string,
  radius = 750,
): string | null {
  const n = needle.trim();
  if (!n) return null;

  let idx = pageText.toLowerCase().indexOf(n.toLowerCase());
  if (idx === -1) {
    const needleCore = n.replace(/[-_.]/g, "[-_.]?");
    const re = new RegExp(needleCore, "i");
    const m = pageText.match(re);
    if (!m || m.index === undefined) return null;
    idx = m.index;
  }

  const start = Math.max(0, idx - radius);
  const end = Math.min(pageText.length, idx + n.length + radius);
  return pageText.slice(start, end);
}

export function modelMentionedOnPage(pageText: string, modelId: string): boolean {
  const win = windowAround(pageText, modelId, 0);
  if (win) return true;
  return normalizeForQuoteMatch(pageText).includes(
    normalizeForQuoteMatch(modelId),
  );
}

export function modelInCatalogText(catalogText: string, modelId: string): boolean {
  const norm = normalizeForQuoteMatch(catalogText);
  const id = normalizeForQuoteMatch(modelId);
  if (norm.includes(id)) return true;
  return false;
}

/** Affected model column: id must appear before “Deprecated” in the quote (not as replacement). */
export function quoteShowsModelDeprecated(
  quote: string,
  modelId: string,
): boolean {
  if (!/deprecated|retire|shutdown|sunset|will be removed/i.test(quote)) {
    return false;
  }
  const esc = modelId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const ticked = `\`${modelId}\``;
  let idIdx = quote.indexOf(ticked);
  if (idIdx < 0) {
    const bare = new RegExp(`(?:^|[\\s|,\`])${esc}(?:[\`,\\s|]|$)`, "i");
    const m = quote.match(bare);
    if (!m || m.index === undefined) return false;
    idIdx = m.index;
  }
  const depIdx = quote.toLowerCase().indexOf("deprecated");
  if (depIdx < 0) {
    return /retire|shutdown|sunset|will be removed/i.test(quote);
  }
  return idIdx < depIdx;
}