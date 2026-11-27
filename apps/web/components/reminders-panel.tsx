"use client";

import { useState } from "react";
import { CONSUMER_SUNDOWN_WORKFLOW } from "@/lib/consumer-sundown-workflow";

const README_REMINDERS =
  "https://github.com/sid-venkatesh/project-sundown#reminders-github-action";

export function RemindersPanel({
  showTitle = true,
  className = "mt-16",
}: {
  showTitle?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(CONSUMER_SUNDOWN_WORKFLOW);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section
      className={`${className} rounded-xl border border-line bg-panel p-5 shadow-sm md:p-6`}
      aria-labelledby={showTitle ? "reminders-heading" : undefined}
    >
      {showTitle ? (
        <h2 id="reminders-heading" className="text-lg font-medium text-ink">
          Weekly reminders (your GitHub repo)
        </h2>
      ) : null}
      <p className={`${showTitle ? "mt-2" : ""} text-sm leading-relaxed text-muted`}>
        This page does not schedule anything. Add one workflow file per repo you
        want watched. Each week GitHub opens or updates a single issue labeled{" "}
        <code className="text-ink/80">sundown</code>. There is no Sundown
        account and no “turn on all my repos” switch.
      </p>
      <p className="mt-2 text-sm text-muted">
        For private code and full control, the{" "}
        <strong className="font-medium text-ink/90">CLI on your machine</strong>{" "}
        is the real tool. A chat agent can help you paste the YAML below; it
        does not replace the same sourced checks every week.
      </p>
      <p className="mt-1 text-xs text-stone-400">
        Optional{" "}
        <code className="text-muted">OPENROUTER_API_KEY</code> in GitHub
        secrets adds model sunset dates (uses credits). Without it, npm/PyPI and
        runtime EOL alarms still run.
      </p>
      <div className="relative mt-4">
        <pre className="max-h-64 overflow-auto rounded-lg border border-line bg-surface p-3 text-xs leading-relaxed text-ink/90">
          {CONSUMER_SUNDOWN_WORKFLOW}
        </pre>
        <button
          type="button"
          onClick={onCopy}
          className="mt-3 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-panel"
        >
          {copied ? "Copied" : "Copy workflow"}
        </button>
      </div>
      <p className="mt-3 text-sm text-muted">
        Commit the file in the repo you want scanned. Details:{" "}
        <a
          href={README_REMINDERS}
          className="text-ink underline decoration-line underline-offset-2 hover:text-ink/80"
        >
          README Reminders
        </a>
        .
      </p>
    </section>
  );
}