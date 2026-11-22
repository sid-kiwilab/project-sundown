#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyRootDotenv,
  scan,
  type Finding,
  type ScanReport,
} from "@sundown/engine";
import { printTable } from "./table.js";
import {
  issueBody,
  SUNDOWN_ISSUE_LABEL,
  SUNDOWN_ISSUE_TITLE,
} from "./issue.js";

function parseArgs(argv: string[]) {
  let target = ".";
  let json = false;
  let issue = false;
  let failOnDays: number | undefined;

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--json") json = true;
    else if (a === "--issue") issue = true;
    else if (a.startsWith("--fail-on-days=")) {
      failOnDays = Number(a.split("=")[1]);
    } else if (a === "--fail-on-days") {
      failOnDays = Number(argv[++i]);
    } else if (!a.startsWith("-")) {
      target = a;
    }
  }

  return { target, json, issue, failOnDays };
}

function resolveRegistryFromCli(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "../../../registry");
}

function shouldFail(finding: Finding, failOnDays: number): boolean {
  if (finding.daysLeft === undefined) return false;
  if (finding.status === "no_notice_found" || finding.status === "healthy") {
    return false;
  }
  return finding.daysLeft <= failOnDays;
}

async function maybeCreateIssue(report: ScanReport): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  const body = issueBody(report);
  if (!token) {
    console.error(
      "Set GITHUB_TOKEN to open or update a GitHub issue, or pipe this body:\n",
    );
    console.error(body);
    return;
  }
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execFileAsync = promisify(execFile);
  const ghEnv = { ...process.env, GITHUB_TOKEN: token, GH_PAGER: "" };

  const runGh = async (args: string[]) => {
    const { stdout } = await execFileAsync("gh", args, { env: ghEnv });
    return stdout.trim();
  };

  try {
    const listedRaw = await runGh([
      "issue",
      "list",
      "--label",
      SUNDOWN_ISSUE_LABEL,
      "--state",
      "all",
      "--limit",
      "30",
      "--json",
      "number,state",
    ]);
    const listed = (
      listedRaw ? JSON.parse(listedRaw) : []
    ) as { number: number; state: string }[];

    const existing =
      listed.find((i) => i.state === "OPEN") ?? listed[0];
    if (existing) {
      if (existing.state === "CLOSED") {
        await runGh(["issue", "reopen", String(existing.number)]);
      }
      await runGh([
        "issue",
        "edit",
        String(existing.number),
        "--body",
        body,
        "--add-label",
        SUNDOWN_ISSUE_LABEL,
      ]);
      console.error(`Updated GitHub issue #${existing.number}.`);
      return;
    }

    await runGh([
      "issue",
      "create",
      "--title",
      SUNDOWN_ISSUE_TITLE,
      "--body",
      body,
      "--label",
      SUNDOWN_ISSUE_LABEL,
    ]);
    console.error("Created GitHub issue via gh CLI.");
  } catch {
    console.error(
      "gh CLI failed. Install GitHub CLI and grant issues: write. Body:\n",
      body,
    );
  }
}

async function main(): Promise<number> {
  const registryPath = resolveRegistryFromCli();
  applyRootDotenv({ root: path.dirname(registryPath) });

  const { target, json, issue, failOnDays } = parseArgs(process.argv);
  const absTarget = path.resolve(process.cwd(), target);

  const report = await scan(absTarget, { registryPath });

  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printTable(report);
  }

  const critical = report.findings.some(
    (f) => f.daysLeft !== undefined && f.daysLeft <= 1,
  );
  if (critical && !json) {
    process.stdout.write("\u0007");
  }

  if (issue) {
    await maybeCreateIssue(report);
  }

  if (failOnDays !== undefined && !Number.isNaN(failOnDays)) {
    const hit = report.findings.some((f) => shouldFail(f, failOnDays));
    if (hit) return 1;
  }

  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(2);
  });