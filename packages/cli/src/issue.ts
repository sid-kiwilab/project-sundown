import type { ScanReport } from "@sundown/engine";

export function issueBody(report: ScanReport): string {
  const lines = [
    "## Sundown report",
    "",
    report.headline,
    "",
    "| Kind | Name | Status | Days left | Source |",
    "|------|------|--------|-----------|--------|",
  ];
  for (const f of report.findings) {
    const name = f.version ? `${f.name}@${f.version}` : f.name;
    const days =
      f.daysLeft !== undefined ? String(f.daysLeft) : f.status === "no_notice_found" ? "—" : "";
    lines.push(
      `| ${f.kind} | ${name} | ${f.status} | ${days} | ${f.sourceUrl ?? ""} |`,
    );
  }
  lines.push("", "_No notice found does not mean safe._");
  return lines.join("\n");
}