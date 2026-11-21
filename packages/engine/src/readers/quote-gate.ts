const MONTHS =
  "jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec";

/** Normalize text for forgiving quote-in-page checks (OpenAI docs use `backticks`, tables, etc.). */
export function normalizeForQuoteMatch(text: string): string {
  return text
    .replace(/[`'"]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Drop endDate unless the quote actually contains that date (LIVE rule). */
export function quoteContainsDate(quote: string, endDate: string): boolean {
  const iso = endDate.slice(0, 10);
  if (quote.includes(iso)) return true;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const [, y, mo, d] = m;
  const day = String(Number(d));
  const monthIdx = Number(mo) - 1;
  const monthNames = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];
  const monthLong = monthNames[monthIdx] ?? "";
  const monthShort = monthLong.slice(0, 3);
  const q = quote.toLowerCase();
  const variants = [
    `${mo}/${d}/${y}`,
    `${d}/${mo}/${y}`,
    `${y}/${mo}/${d}`,
    `${mo}-${d}-${y}`,
    `${monthLong} ${day}, ${y}`,
    `${monthShort} ${day}, ${y}`,
    `**${monthShort} ${day}, ${y}**`,
  ];
  if (variants.some((v) => q.includes(v.toLowerCase()))) return true;
  const monthDayYear = new RegExp(
    `(?:\\*\\*)?(${MONTHS}[a-z]*)\\.?\\s+0?${day},?\\s+${y}(?:\\*\\*)?`,
    "i",
  );
  return monthDayYear.test(quote);
}

export function daysUntil(isoDate: string): number {
  const end = new Date(isoDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return Math.ceil((end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}