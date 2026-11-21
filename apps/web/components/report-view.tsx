import type { ScanReport } from "@sundown/engine/types";
import { isDateNotVerified } from "@sundown/engine/report";

function statusLabel(f: ScanReport["findings"][0]): string {
  if (f.status === "no_notice_found") return "no notice";
  if (isDateNotVerified(f)) return "deprecated (date n/v)";
  if (f.status === "deprecated" && !f.endDate) return "deprecated (date n/v)";
  return f.status;
}

export function ReportView({
  report,
  repo,
}: {
  report: ScanReport;
  repo?: string;
}) {
  const meta = report.meta;
  const errors = meta?.tier2Errors ?? [];

  return (
    <section className="mt-10 space-y-6">
      {repo ? (
        <p className="text-sm text-zinc-500">
          {repo} ·{" "}
          <time dateTime={report.scannedAt} suppressHydrationWarning>
            {new Date(report.scannedAt).toLocaleString()}
          </time>
        </p>
      ) : null}

      <p className="text-lg font-medium text-zinc-200">{report.coverageLine}</p>

      {errors.length > 0 ? (
        <ul className="rounded-lg border border-orange-900/50 bg-orange-950/30 px-4 py-3 text-sm text-orange-200">
          {errors.map((err, i) => (
            <li key={`${err.url}-${i}`} className="break-words">
              Couldn&apos;t read {err.provider}&apos;s page: {err.message}
            </li>
          ))}
        </ul>
      ) : null}

      <h2 className="text-2xl font-semibold text-white md:text-3xl">
        {report.headline}
      </h2>

      <ul className="divide-y divide-zinc-800 overflow-hidden rounded-lg border border-zinc-800 bg-panel">
        {report.findings.map((f) => {
          const name = f.version ? `${f.name}@${f.version}` : f.name;
          const status = statusLabel(f);
          const statusClass =
            f.status === "dead" ||
            (f.daysLeft !== undefined && f.daysLeft <= 7)
              ? "text-alarm"
              : f.status === "deprecated"
                ? "text-orange-400"
                : "text-zinc-400";
          const checkedTitle = f.checked
            ? f.checkSource
            : f.uncheckedReason;

          return (
            <li
              key={f.id}
              className="px-4 py-3 text-sm"
              title={checkedTitle ?? undefined}
            >
              <p className="font-mono text-xs leading-snug text-zinc-100 break-all sm:text-sm">
                {name}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                <span className="rounded bg-zinc-800/80 px-1.5 py-0.5 text-zinc-400">
                  {f.kind}
                </span>
                <span className={`capitalize ${statusClass}`}>{status}</span>
                {f.daysLeft !== undefined ? (
                  <span>
                    <span className="text-zinc-600">days </span>
                    {f.daysLeft}
                  </span>
                ) : (
                  <span className="text-zinc-600">days —</span>
                )}
                <span className="text-zinc-600">{f.confidence}</span>
                <span
                  className={
                    f.checked ? "text-emerald-600/90" : "text-orange-400/90"
                  }
                >
                  {f.checked ? "checked" : "unchecked"}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-sm leading-relaxed text-zinc-500">
        {meta?.standBehindLine ??
          "Checked = queried a named source for that row (no notice still counts). API hosts and unknown vendors stay unchecked."}
      </p>
      <p className="text-sm leading-relaxed text-zinc-500">
        No notice found does not mean safe. Hover a row for which source was
        queried (or why it was unchecked).
      </p>
    </section>
  );
}