import { describe, it, expect } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scan } from "./scan.js";
import { createMockFetch } from "./test/mock-fetch.js";
import type { BatchLlmReader } from "./readers/llm.js";

const fixturesDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../fixtures",
);

const registryPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../registry",
);

describe("scan()", () => {
  it("fixture old-node resolves Node EOL", async () => {
    const report = await scan(path.join(fixturesDir, "old-node"), {
      registryPath,
      fetchImpl: createMockFetch(),
    });
    const node = report.findings.find(
      (f) => f.kind === "runtime" && f.name === "node",
    );
    expect(node).toBeDefined();
    expect(node!.confidence).toBe("official-data");
    expect(node!.sourceUrl).toBeTruthy();
    expect(node!.checked).toBe(true);
    expect(report.coverageLine).toMatch(/Checked \d+ of \d+/);
    expect(report.meta?.coverage).toBeDefined();
  });

  it("fixture deprecated-npm flags left-pad", async () => {
    const report = await scan(path.join(fixturesDir, "deprecated-npm"), {
      registryPath,
      fetchImpl: createMockFetch(),
    });
    const pkg = report.findings.find(
      (f) => f.kind === "package" && f.name === "left-pad",
    );
    expect(pkg).toBeDefined();
    expect(pkg!.status).toBe("deprecated");
    expect(pkg!.confidence).toBe("official-data");
    expect(pkg!.checked).toBe(true);
  });

  it("gpt-image-2 → 2027-02-10 from OpenAI deprecations table (LIVE Tier 2 demo)", async () => {
    const depPage = `| **Feb 10, 2027** | \`gpt-image-2\` | Deprecated | \`gpt-image-2.6-sunburst\` |`;
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);
      if (
        url.includes("platform.openai.com") &&
        url.includes("deprecations")
      ) {
        return new Response(depPage, { status: 200 });
      }
      if (url.includes("models")) {
        return new Response("Current: `gpt-image-2`, `gpt-4o-mini`.", {
          status: 200,
        });
      }
      return createMockFetch()(input, init);
    };
    const batchLlm: BatchLlmReader = async () => ({});

    const report = await scan(path.join(fixturesDir, "gpt-image-2"), {
      registryPath,
      fetchImpl,
      batchLlmReader: batchLlm,
    });

    const model = report.findings.find(
      (f) => f.kind === "model" && f.name === "gpt-image-2",
    );
    expect(model).toBeDefined();
    expect(model!.status).toBe("deprecated");
    expect(model!.endDate).toBe("2027-02-10");
    expect(model!.replacement).toBe("gpt-image-2.6-sunburst");
    expect(model!.sourceUrl).toContain("deprecations");
    expect(model!.checked).toBe(true);
  });
});