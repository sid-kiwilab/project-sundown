import type { Finding, ScanReport } from "@sundown/engine";
import { partitionReportFindings } from "@sundown/engine";

export const SUNDOWN_ISSUE_TITLE = "Sundown: dependency expiry alarm";

/** Stable upsert key — issues are found by this label, not title search. */
export const SUNDOWN_ISSUE_LABEL = "sundown";

function row(f: Finding): string {
  const name = f.version ? `${f.name}@${f.version}` : f.name;
  const days =
    f.daysLeft !== undefined
      ? String(f.daysLeft)
      : f.status === "no_notice_found"
        ? "—"
        : "";
  return `| ${f.kind} | ${name} | ${f.status} | ${days} | ${f.sourceUrl ?? ""} |`;
}

export function issueBody(report: ScanReport): string {
  const { alarms } = partitionReportFindings(report.findings);
  const lines = [
    "## Sundown weekly check",
    "",
    report.headline,
    "",
    report.coverageLine,
    "",
  ];

  if (alarms.length === 0) {
    lines.push("_No deprecation alarms this run._", "");
  } else {
    lines.push("### Alarms", "");
    lines.push(
      "| Kind | Name | Status | Days left | Source |",
      "|------|------|--------|-----------|--------|",
    );
    for (const f of alarms) {
      lines.push(row(f));
    }
    lines.push("");
  }

  lines.push("<details>", "<summary>Full findings</summary>", "");
  lines.push(
    "| Kind | Name | Status | Days left | Source |",
    "|------|------|--------|-----------|--------|",
  );
  for (const f of report.findings) {
    lines.push(row(f));
  }
  lines.push("", "</details>", "", "_No notice found does not mean safe._");
  return lines.join("\n");
}