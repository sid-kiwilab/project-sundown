import type { Finding, ScanReport } from "@sundown/engine";
import {
  isDateNotVerified,
  partitionReportFindings,
} from "@sundown/engine";

function statusLabel(f: Finding): string {
  if (f.status === "healthy") return "healthy";
  if (f.status === "no_notice_found") return "no notice";
  if (isDateNotVerified(f)) return "deprecated (date n/v)";
  return f.status;
}

function pad(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n - 1) + "…" : s + " ".repeat(n - s.length);
}

function printRows(findings: Finding[], heading: string): void {
  if (findings.length === 0) return;
  const cols = { kind: 8, name: 24, status: 14, days: 6, conf: 14, chk: 6 };
  console.log(heading);
  console.log(
    pad("KIND", cols.kind) +
      pad("NAME", cols.name) +
      pad("STATUS", cols.status) +
      pad("DAYS", cols.days) +
      pad("CONF", cols.conf) +
      pad("CHK", cols.chk) +
      "WHY",
  );
  console.log("-".repeat(100));
  for (const f of findings) {
    const days =
      f.daysLeft !== undefined
        ? String(f.daysLeft)
        : f.status === "no_notice_found"
          ? "—"
          : "";
    const name = f.version ? `${f.name}@${f.version}` : f.name;
    const why = f.checked
      ? (f.checkSource ?? "")
      : (f.uncheckedReason ?? "");
    const line =
      pad(f.kind, cols.kind) +
      pad(name, cols.name) +
      pad(statusLabel(f), cols.status) +
      pad(days, cols.days) +
      pad(f.confidence, cols.conf) +
      pad(f.checked ? "yes" : "no", cols.chk) +
      why.slice(0, 48);
    console.log(line);
  }
  console.log("");
}

export function printTable(report: ScanReport): void {
  const { alarms, clear, noNotice, envHints, unchecked } =
    partitionReportFindings(report.findings);

  console.log("");
  console.log(report.coverageLine);
  if (report.meta?.tier2Errors?.length) {
    for (const err of report.meta.tier2Errors) {
      console.log(
        `ERROR: Couldn't read ${err.provider}'s page — ${err.message}`,
      );
    }
  }
  console.log("");
  console.log(report.headline);
  const withDate = report.findings.filter((f) => f.endDate);
  if (withDate.length > 0) {
    const soonest = withDate.sort(
      (a, b) => (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999),
    )[0];
    if (soonest?.daysLeft !== undefined && soonest.daysLeft >= 0) {
      console.log(`YOUR APP BREAKS IN ${soonest.daysLeft} DAYS.`);
    }
  }
  if (report.meta?.standBehindLine) {
    console.log(report.meta.standBehindLine);
  }
  console.log("");

  printRows(alarms, "=== ALARMS ===");
  printRows(
    [...clear, ...noNotice],
    "=== CLEAR / NO NOTICE (checked) ===",
  );
  printRows(envHints, "=== ENV HINTS ===");
  printRows(unchecked, "=== UNCHECKED ===");

  console.log("No notice found does not mean safe. npm healthy ≠ forever-safe.");
}