import { quoteShowsModelDeprecated } from "./text-window.js";
import { quoteContainsDate as dateInQuote } from "./quote-gate.js";

export type TableDeprecation = {
  sourceQuote: string;
  shutdownDate?: string;
  replacement?: string;
};

const MONTHS: Record<string, string> = {
  jan: "01",
  january: "01",
  feb: "02",
  february: "02",
  mar: "03",
  march: "03",
  apr: "04",
  april: "04",
  may: "05",
  jun: "06",
  june: "06",
  jul: "07",
  july: "07",
  aug: "08",
  august: "08",
  sep: "09",
  sept: "09",
  september: "09",
  oct: "10",
  october: "10",
  nov: "11",
  november: "11",
  dec: "12",
  december: "12",
};

/** Parse US-style date in shutdown / notice column to ISO (best effort). */
export function parseDisplayDateToIso(raw: string): string | undefined {
  const m = raw.match(/([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (!m) return undefined;
  const mo = MONTHS[m[1]!.toLowerCase()];
  if (!mo) return undefined;
  const day = String(Number(m[2]));
  const iso = `${m[3]}-${mo}-${day.padStart(2, "0")}`;
  return iso;
}

/** OpenAI-style markdown tables: model in affected column, “Deprecated” in status column. */
export function parseMarkdownDeprecationRow(
  pageText: string,
  modelId: string,
): TableDeprecation | null {
  const ticked = `\`${modelId}\``;
  for (const line of pageText.split(/\r?\n/)) {
    if (!line.includes("|")) continue;
    if (!line.toLowerCase().includes("deprecated")) continue;
    if (!line.includes(ticked)) continue;
    if (!quoteShowsModelDeprecated(line, modelId)) continue;

    const quote = line.trim();
    let shutdownDate: string | undefined;
    const boldDate = line.match(/\*\*([^*]+)\*\*/);
    if (boldDate) {
      shutdownDate = parseDisplayDateToIso(boldDate[1]!);
    }

    const afterDeprecated = line.split(/deprecated/i)[1] ?? "";
    const replMatch = afterDeprecated.match(/`([^`]+)`/);
    const replacement = replMatch?.[1];

    if (shutdownDate && !dateInQuote(quote, shutdownDate)) {
      shutdownDate = undefined;
    }

    return { sourceQuote: quote, shutdownDate, replacement };
  }
  return null;
}

export function deprecationSnippetForModel(
  pageText: string,
  modelId: string,
): string | null {
  const row = parseMarkdownDeprecationRow(pageText, modelId);
  if (row) return row.sourceQuote;
  return null;
}