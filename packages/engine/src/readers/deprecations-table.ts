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

function parseOpenAiDeprecationLine(
  line: string,
  modelId: string,
): TableDeprecation | null {
  if (!line.toLowerCase().includes("deprecated")) return null;
  const ticked = `\`${modelId}\``;
  if (!line.includes(ticked)) return null;
  if (!quoteShowsModelDeprecated(line, modelId)) return null;

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

/** Anthropic history table: `| retirement date | `model` | `replacement` |` */
function parseAnthropicRetirementLine(
  line: string,
  modelId: string,
): TableDeprecation | null {
  const m = line.match(
    /^\|\s*([^|]+?)\s*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|/,
  );
  if (!m) return null;
  if (m[2] !== modelId) return null;

  const quote = line.trim();
  const shutdownDate = parseDisplayDateToIso(m[1]!.trim());
  const replacement = m[3];

  if (shutdownDate && !dateInQuote(quote, shutdownDate)) {
    return { sourceQuote: quote, replacement, shutdownDate: undefined };
  }
  return { sourceQuote: quote, shutdownDate, replacement };
}

/** Anthropic status table: model | Deprecated/Retired | … | tentative retirement date */
function parseAnthropicStatusLine(
  line: string,
  modelId: string,
): TableDeprecation | null {
  const cells = line
    .split("|")
    .map((c) => c.trim())
    .filter(Boolean);
  if (cells.length < 3) return null;

  const modelCell = cells[0]!.replace(/`/g, "");
  if (modelCell !== modelId) return null;

  const state = cells[1]!.toLowerCase();
  if (!/^deprecated$|^retired$/.test(state)) return null;

  const quote = line.trim();
  const last = cells[cells.length - 1]!;
  let shutdownDate = parseDisplayDateToIso(last.replace(/\*\*/g, ""));
  if (!shutdownDate) {
    for (const cell of cells.slice(2)) {
      shutdownDate = parseDisplayDateToIso(cell.replace(/\*\*/g, ""));
      if (shutdownDate) break;
    }
  }

  if (shutdownDate && !dateInQuote(quote, shutdownDate)) {
    return { sourceQuote: quote, shutdownDate: undefined };
  }
  return { sourceQuote: quote, shutdownDate };
}

/** Pipe-table rows (OpenAI deprecations, Anthropic model status / retirement history). */
export function parseMarkdownDeprecationRow(
  pageText: string,
  modelId: string,
): TableDeprecation | null {
  for (const line of pageText.split(/\r?\n/)) {
    if (!line.includes("|")) continue;

    const openAi = parseOpenAiDeprecationLine(line, modelId);
    if (openAi) return openAi;

    const anthropicRet = parseAnthropicRetirementLine(line, modelId);
    if (anthropicRet) return anthropicRet;

    const anthropicStatus = parseAnthropicStatusLine(line, modelId);
    if (anthropicStatus) return anthropicStatus;
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