"use client";

import { useEffect, useRef, useState } from "react";
import type { ScanReport } from "@sundown/engine/types";
import { ReportView } from "@/components/report-view";

type ScanResponse = ScanReport & { repo?: string; error?: string };

const STEPS = [
  "Downloading repo",
  "Running detectors",
  "Tier 1 resolution",
  "Building report",
] as const;

export default function HomePage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ScanResponse | null>(null);
  const scanGenRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function onScan(e: React.FormEvent) {
    e.preventDefault();
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const scanId = ++scanGenRef.current;

    setError(null);
    setReport(null);
    setLoading(true);
    setStep(0);

    const tick = window.setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }, 1200);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
        signal: controller.signal,
      });
      const data = (await res.json()) as ScanResponse;
      if (scanId !== scanGenRef.current) return;
      if (!res.ok) {
        setError(data.error ?? `Scan failed (${res.status}).`);
        return;
      }
      setReport(data);
    } catch (err) {
      if (controller.signal.aborted) return;
      if (scanId !== scanGenRef.current) return;
      setError("Network error. Is the dev server running?");
    } finally {
      window.clearInterval(tick);
      if (scanId === scanGenRef.current) {
        setLoading(false);
      }
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl overflow-x-clip px-6 py-16 md:py-24">
      <p className="text-sm font-medium uppercase tracking-widest text-alarm">
        Sundown
      </p>
      <h1 className="mt-3 text-4xl font-bold leading-tight text-white md:text-5xl">
        What in this repo is already dying?
      </h1>
      <p className="mt-4 text-lg text-zinc-400">
        Paste a <strong className="text-zinc-200">public</strong> GitHub
        repository. Every row is checked against a named source or listed as
        unchecked with a reason. Tier 2 uses repo{" "}
        <code className="text-zinc-500">.env</code> LLM keys — no account.
      </p>

      <form
        onSubmit={onScan}
        className="mt-10 flex flex-col gap-3 sm:flex-row"
        suppressHydrationWarning
      >
        <input
          type="url"
          required
          placeholder="https://github.com/owner/repo"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-700 bg-panel px-4 py-3 text-white placeholder:text-zinc-600 focus:border-alarm focus:outline-none focus:ring-1 focus:ring-alarm"
          disabled={loading}
          suppressHydrationWarning
        />
        <button
          type="submit"
          disabled={loading}
          suppressHydrationWarning
          className="rounded-lg bg-alarm px-6 py-3 font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
        >
          {loading ? "Scanning…" : "Scan"}
        </button>
      </form>

      {loading ? (
        <p className="mt-6 text-zinc-400" aria-live="polite">
          {STEPS[step]}…
        </p>
      ) : null}

      {error ? (
        <p className="mt-6 rounded-lg border border-alarm/40 bg-alarm/10 px-4 py-3 text-alarm">
          {error}
        </p>
      ) : null}

      {report?.meta?.tier2Enabled === false &&
      report?.meta?.tier2SkipReason ? (
        <p className="mt-6 rounded-lg border border-zinc-700 bg-panel px-4 py-3 text-sm text-zinc-400">
          {report.meta.tier2SkipReason} Restart the dev server after editing{" "}
          <code className="text-zinc-300">.env</code> at the repo root.
        </p>
      ) : null}

      {report?.findings ? (
        <ReportView report={report} repo={report.repo} />
      ) : null}

      <p className="mt-16 text-sm text-zinc-600">
        Private repos: run{" "}
        <code className="text-zinc-400">npm run sundown -- .</code> locally (
        <a
          href="https://github.com/sid-kiwilab/project-sundown"
          className="text-zinc-400 underline"
        >
          sundown-cli
        </a>
        ).
      </p>
      {process.env.NEXT_PUBLIC_CONTACT_URL ? (
        <p className="mt-4 text-sm text-zinc-500">
          Want ongoing monitoring and reminders — not just one scan?{" "}
          <a
            href={process.env.NEXT_PUBLIC_CONTACT_URL}
            className="text-alarm underline"
          >
            Get in touch
          </a>
          .
        </p>
      ) : null}
    </main>
  );
}