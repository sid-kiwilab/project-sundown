import type { Finding, ScanReport } from "@sundown/engine";
import { isDateNotVerified } from "@sundown/engine";

function statusLabel(f: Finding): string {
  if (f.status === "no_notice_found") return "no notice";
  if (isDateNotVerified(f)) return "deprecated (date n/v)";
  return f.status;
}

function pad(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n - 1) + "…" : s + " ".repeat(n - s.length);
}

export function printTable(report: ScanReport): void {
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

  const cols = { kind: 8, name: 24, status: 14, days: 6, conf: 14, chk: 6 };
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

  for (const f of report.findings) {
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
  console.log("No notice found does not mean safe. Unchecked = not verified.");
}