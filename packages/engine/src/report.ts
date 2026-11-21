import type { Finding, ScanReport } from "./types.js";
import { computeCoverage } from "./coverage.js";

const BORROWED_STATUSES = new Set([
  "deprecated",
  "price_change",
  "dead",
]);

export function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((a, b) => {
    const aDays = a.daysLeft ?? Number.POSITIVE_INFINITY;
    const bDays = b.daysLeft ?? Number.POSITIVE_INFINITY;
    if (aDays !== bDays) return aDays - bDays;
    const rank = (s: string) =>
      s === "dead"
        ? 0
        : s === "deprecated"
          ? 1
          : s === "price_change"
            ? 2
            : s === "no_notice_found"
              ? 4
              : 3;
    return rank(a.status) - rank(b.status);
  });
}

export function buildReport(root: string, findings: Finding[]): ScanReport {
  const sorted = sortFindings(findings);
  const borrowedCount = sorted.filter((f) =>
    BORROWED_STATUSES.has(f.status),
  ).length;
  const totalCount = sorted.length;
  const cov = computeCoverage(sorted);
  const coverageLine = `Checked ${cov.checked} of ${cov.total}. ${cov.unchecked} unchecked.`;
  const headline = `${borrowedCount} of ${totalCount} dependencies are on borrowed time.`;

  return {
    root,
    scannedAt: new Date().toISOString(),
    findings: sorted,
    headline,
    borrowedCount,
    totalCount,
    coverageLine,
  };
}

/** UI / CLI: deprecated on official page without endDate */
export function isDateNotVerified(f: Finding): boolean {
  return (
    f.status === "deprecated" &&
    f.confidence === "official-page" &&
    f.endDate === undefined &&
    Boolean(f.sourceQuote)
  );
}