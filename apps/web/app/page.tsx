"use client";

import { useEffect, useRef, useState } from "react";
import type { ScanReport } from "@sundown/engine/types";
import Link from "next/link";
import { ReportView } from "@/components/report-view";

type ScanResponse = ScanReport & { repo?: string; error?: string };

const STEPS = [
  "Downloading the repository",
  "Finding dependencies",
  "Checking official sources",
  "Building your report",
] as const;

function normalizeRepoUrl(raw: string): string {
  const t = raw.trim();
  if (/^https?:\/\//i.test(t)) return t;
  if (/^github\.com\//i.test(t)) return `https://${t}`;
  return t;
}

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
        body: JSON.stringify({ repoUrl: normalizeRepoUrl(repoUrl) }),
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
    <main className="mx-auto min-h-screen max-w-3xl overflow-x-clip px-6 pb-16 pt-8 md:pb-24 md:pt-10">
      <h1 className="text-4xl font-semibold leading-tight text-ink md:text-5xl">
        What in this repo is already dying?
      </h1>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
        Paste a public GitHub link below. Sundown shows what is expiring or
        deprecated first, with links to where we looked. No account needed.
      </p>
      <p className="mt-2 text-sm text-stone-400">
        Private repos? Run the CLI on your machine (see footer).
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
          className="flex-1 rounded-xl border border-line bg-panel px-4 py-3.5 text-ink shadow-sm placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200"
          disabled={loading}
          suppressHydrationWarning
        />
        <button
          type="submit"
          disabled={loading}
          suppressHydrationWarning
          className="rounded-xl bg-ink px-6 py-3.5 font-medium text-white shadow-sm transition hover:bg-ink/90 disabled:opacity-50"
        >
          {loading ? "Scanning…" : "Scan"}
        </button>
      </form>

      {loading ? (
        <p className="mt-6 text-muted" aria-live="polite">
          {STEPS[step]}…
        </p>
      ) : null}

      {error ? (
        <p className="mt-6 rounded-xl border border-line bg-panel px-4 py-3 text-ink/90 shadow-sm">
          {error}
        </p>
      ) : null}

      {report?.meta?.tier2Enabled === false &&
      report?.meta?.tier2SkipReason ? (
        <p className="mt-6 rounded-xl border border-line bg-panel px-4 py-3 text-sm text-muted shadow-sm">
          {report.meta.tier2SkipReason}{" "}
          <span className="text-stone-500">
            Your host admin can add an AI API key in project settings if you want
            OpenAI-style model sunset dates in web scans.
          </span>
        </p>
      ) : null}

      {report?.findings ? (
        <ReportView report={report} repo={report.repo} />
      ) : null}

      <p className="mt-16 text-sm text-muted">
        Private repos: run{" "}
        <code className="text-ink/70">npm run sundown -- .</code> locally (
        <a
          href="https://github.com/sid-venkatesh/project-sundown"
          className="text-ink/70 underline decoration-line underline-offset-2 hover:text-ink"
        >
          sundown-cli
        </a>
        ).{" "}
        <Link
          href="/reminders"
          className="text-ink/70 underline decoration-line underline-offset-2 hover:text-ink"
        >
          Weekly GitHub reminders
        </Link>
        .
      </p>
      {process.env.NEXT_PUBLIC_CONTACT_URL ? (
        <p className="mt-4 text-sm text-muted">
          <a
            href={process.env.NEXT_PUBLIC_CONTACT_URL}
            className="text-ink underline decoration-line underline-offset-2 hover:text-ink/80"
          >
            Get in touch
          </a>
          .
        </p>
      ) : null}
    </main>
  );
}