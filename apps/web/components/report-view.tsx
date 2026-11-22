"use client";

import type { ReactNode } from "react";
import type { Finding, ScanReport } from "@sundown/engine/types";
import {
  isDateNotVerified,
  partitionReportFindings,
} from "@sundown/engine/report";

function statusLabel(f: Finding): string {
  if (f.status === "healthy") return "healthy";
  if (f.status === "no_notice_found") return "no notice";
  if (isDateNotVerified(f)) return "deprecated (date n/v)";
  if (f.status === "deprecated" && !f.endDate) return "deprecated (date n/v)";
  return f.status;
}

function FindingRow({
  f,
  compact = false,
}: {
  f: Finding;
  compact?: boolean;
}) {
  const name = f.version ? `${f.name}@${f.version}` : f.name;
  const status = statusLabel(f);
  const urgent =
    f.status === "dead" || (f.daysLeft !== undefined && f.daysLeft <= 7);
  const statusClass = urgent
    ? "text-urgent"
    : f.status === "deprecated" || f.status === "price_change"
      ? "text-amber-700"
      : f.status === "healthy"
        ? "text-stone-500"
        : "text-muted";
  const checkedTitle = f.checked ? f.checkSource : f.uncheckedReason;

  return (
    <li
      className={
        compact
          ? "border-b border-line px-4 py-2.5 last:border-0"
          : "border-b border-line px-4 py-3.5 last:border-0"
      }
      title={checkedTitle ?? undefined}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p
          className={
            compact
              ? "font-mono text-xs text-muted break-all"
              : "font-mono text-sm text-ink break-all"
          }
        >
          {name}
        </p>
        {f.daysLeft !== undefined ? (
          <span
            className={
              urgent
                ? "text-lg font-medium tabular-nums text-urgent"
                : "text-base tabular-nums text-muted"
            }
          >
            {f.daysLeft}
            <span className="ml-1 text-xs font-normal text-stone-400">days</span>
          </span>
        ) : null}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        {!compact ? <span>{f.kind}</span> : null}
        <span className={`capitalize ${statusClass}`}>{status}</span>
        {!compact ? (
          <>
            <span className="text-stone-300">·</span>
            <span>{f.confidence}</span>
          </>
        ) : null}
      </div>
    </li>
  );
}

function CollapsibleBlock({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  if (count === 0) return null;
  return (
    <details className="mt-5 rounded-xl border border-line bg-panel shadow-sm">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm text-muted hover:text-ink">
        {title} <span className="text-stone-400">({count})</span>
      </summary>
      <ul className="border-t border-line">{children}</ul>
    </details>
  );
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
  const { alarms, clear, noNotice, envHints, unchecked } =
    partitionReportFindings(report.findings);

  return (
    <section className="mt-10 space-y-5">
      {repo ? (
        <p className="text-sm text-muted">
          {repo} ·{" "}
          <time dateTime={report.scannedAt} suppressHydrationWarning>
            {new Date(report.scannedAt).toLocaleString()}
          </time>
        </p>
      ) : null}

      <p className="text-sm text-muted">{report.coverageLine}</p>

      {errors.length > 0 ? (
        <ul className="rounded-xl border border-line bg-panel px-4 py-3 text-sm text-muted shadow-sm">
          {errors.map((err, i) => (
            <li key={`${err.url}-${i}`} className="break-words">
              Couldn&apos;t read {err.provider}&apos;s page: {err.message}
            </li>
          ))}
        </ul>
      ) : null}

      <div>
        <h2 className="text-2xl font-medium tracking-tight text-ink md:text-3xl">
          {report.headline}
        </h2>
        {alarms.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            Nothing flagged as on borrowed time in this pass.
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted">Soonest deadlines first.</p>
        )}
      </div>

      {alarms.length > 0 ? (
        <ul className="overflow-hidden rounded-xl border border-line bg-panel shadow-sm">
          {alarms.map((f) => (
            <FindingRow key={f.id} f={f} />
          ))}
        </ul>
      ) : null}

      <CollapsibleBlock title="Clear: registry OK" count={clear.length}>
        {clear.map((f) => (
          <FindingRow key={f.id} f={f} compact />
        ))}
      </CollapsibleBlock>

      <CollapsibleBlock
        title="Checked, no notice on provider page"
        count={noNotice.length}
      >
        {noNotice.map((f) => (
          <FindingRow key={f.id} f={f} compact />
        ))}
      </CollapsibleBlock>

      <CollapsibleBlock title="env: hints" count={envHints.length}>
        {envHints.map((f) => (
          <FindingRow key={f.id} f={f} compact />
        ))}
      </CollapsibleBlock>

      {unchecked.length > 0 ? (
        <CollapsibleBlock title="Unchecked" count={unchecked.length}>
          {unchecked.map((f) => (
            <FindingRow key={f.id} f={f} compact />
          ))}
        </CollapsibleBlock>
      ) : null}

      <p className="pt-2 text-sm leading-relaxed text-muted">
        {meta?.standBehindLine ??
          "Checked = queried a named source (no notice still counts). npm healthy = not marked deprecated today, not forever-safe."}
      </p>
    </section>
  );
}