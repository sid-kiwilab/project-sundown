import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Finding } from "../types.js";
import type { BatchLlmReader } from "../readers/llm.js";
import { resolveAllTier2 } from "./tier2.js";
import { clearPageCache } from "./page-cache.js";
import { windowAround } from "../readers/text-window.js";

const DEP_PAGE = `
OpenAI deprecations. Some header noise. ${"x".repeat(50000)}
| **Feb 10, 2027** | gpt-image-2, gpt-image-2-2026-04-21 | Deprecated | gpt-image-2.6-sunburst |
Also supports gpt-4o-mini in the same doc.
end of table.
`;

const CATALOG = `
Current models: gpt-4o, gpt-4o-mini, gpt-image-2 are listed here.
`;

beforeEach(() => clearPageCache());

describe("windowAround", () => {
  it("returns a small window not the full page", () => {
    const win = windowAround(DEP_PAGE, "gpt-image-2");
    expect(win).toBeTruthy();
    expect(win!.length).toBeLessThan(5000);
    expect(win).toContain("gpt-image-2");
  });
});

describe("resolveAllTier2", () => {
  it("drops LLM date when quote omits the date but keeps deprecated", async () => {
    const PAGE = `Anthropic deprecations. claude-sonnet-4.6 will retire on 2027-06-01.`;
    const mockFetch: typeof fetch = async () =>
      new Response(PAGE, { status: 200 });

    const batchLlm: BatchLlmReader = async ({ items }) => ({
      [items[0]!.dependencyName]: {
        found: true,
        status: "deprecated",
        shutdownDate: "2027-06-01",
        replacement: "claude-sonnet-4-5",
        sourceQuote: "claude-sonnet-4.6 will retire",
      },
    });

    const finding: Finding = {
      id: "t",
      kind: "model",
      name: "claude-sonnet-4.6",
      locations: [{ file: "a.ts", line: 1 }],
      status: "no_notice_found",
      confidence: "unverified",
      checked: false,
    };

    const { findings: out } = await resolveAllTier2([finding], {
      sources: [
        {
          provider: "anthropic",
          urls: ["https://example.com/deprecations"],
        },
      ],
      fetchImpl: mockFetch,
      batchLlmReader: batchLlm,
    });

    expect(out[0]!.endDate).toBeUndefined();
    expect(out[0]!.confidence).toBe("official-page");
    expect(out[0]!.status).toBe("deprecated");
    expect(out[0]!.checked).toBe(true);
    expect(out[0]!.sourceQuote).toContain("date not verified");
  });

  it("parses OpenAI markdown table for gpt-image-2 without LLM", async () => {
    const PAGE = `| **Feb 10, 2027** | \`gpt-image-2\`, \`gpt-image-2-2026-04-21\` | Deprecated | \`gpt-image-2.6-sunburst\` |`;
    const mockFetch: typeof fetch = async () =>
      new Response(PAGE, { status: 200 });

    const batchLlm: BatchLlmReader = async () => {
      throw new Error("LLM must not run when table row matches");
    };

    const finding: Finding = {
      id: "gi2",
      kind: "model",
      name: "gpt-image-2",
      locations: [{ file: "a.ts", line: 1 }],
      status: "no_notice_found",
      confidence: "unverified",
      checked: false,
    };

    const { findings: out, errors } = await resolveAllTier2([finding], {
      sources: [
        {
          provider: "openai",
          urls: ["https://example.com/deprecations.md"],
        },
      ],
      fetchImpl: mockFetch,
      batchLlmReader: batchLlm,
    });

    expect(errors).toHaveLength(0);
    expect(out[0]!.status).toBe("deprecated");
    expect(out[0]!.endDate).toBe("2027-02-10");
    expect(out[0]!.replacement).toBe("gpt-image-2.6-sunburst");
    expect(out[0]!.confidence).toBe("official-page");
  });

  it("uses one batch LLM call for two models on same provider", async () => {
    const calls = vi.fn(
      async ({ items }: Parameters<BatchLlmReader>[0]) => {
        const out: Record<string, import("../readers/llm.js").ExtractionResult> =
          {};
        for (const it of items) {
          out[it.dependencyName] = {
            found: true,
            status: "deprecated",
            shutdownDate: "2027-02-10",
            sourceQuote: `| Feb 10, 2027 | ${it.dependencyName} | Deprecated |`,
            replacement: null,
          };
        }
        return out;
      },
    );

    const mockFetch: typeof fetch = async () =>
      new Response(DEP_PAGE, { status: 200 });

    const findings: Finding[] = [
      {
        id: "a",
        kind: "model",
        name: "gpt-image-2",
        locations: [{ file: "a.ts", line: 1 }],
        status: "no_notice_found",
        confidence: "unverified",
        checked: false,
      },
      {
        id: "b",
        kind: "model",
        name: "gpt-4o-mini",
        locations: [{ file: "b.ts", line: 2 }],
        status: "no_notice_found",
        confidence: "unverified",
        checked: false,
      },
    ];

    await resolveAllTier2(findings, {
      sources: [
        {
          provider: "openai",
          urls: ["https://example.com/deprecations.md"],
        },
      ],
      fetchImpl: mockFetch,
      batchLlmReader: calls,
    });

    expect(calls).toHaveBeenCalledTimes(1);
    expect(calls.mock.calls[0]![0].items.length).toBe(2);
    const snippets = calls.mock.calls[0]![0].items.map((i) => i.pageText);
    for (const s of snippets) {
      expect(s.length).toBeLessThan(5000);
    }
  });

  it("flags model missing from catalog", async () => {
    const mockFetch: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes("deprecations")) {
        return new Response(
          "This official deprecations document has no entry for this model id.",
          { status: 200 },
        );
      }
      if (url.includes("catalog")) {
        return new Response(CATALOG, { status: 200 });
      }
      return new Response("", { status: 404 });
    };

    const batchLlm: BatchLlmReader = async () => ({});

    const finding: Finding = {
      id: "g",
      kind: "model",
      name: "gpt-ghost-99",
      locations: [{ file: "a.ts", line: 1 }],
      status: "no_notice_found",
      confidence: "unverified",
      checked: false,
    };

    const { findings: out } = await resolveAllTier2([finding], {
      sources: [
        {
          provider: "openai",
          urls: ["https://example.com/deprecations"],
          modelsListUrls: ["https://example.com/catalog"],
        },
      ],
      fetchImpl: mockFetch,
      batchLlmReader: batchLlm,
    });

    expect(out[0]!.checked).toBe(true);
    expect(out[0]!.status).toBe("deprecated");
    expect(out[0]!.endDate).toBeUndefined();
    expect(out[0]!.sourceQuote).toContain("Not listed");
  });

  it("does not deprecate model only mentioned as replacement", async () => {
    const PAGE = `| **Oct 23, 2026** | \`gpt-image-1\` | Deprecated | \`gpt-image-2.5-sunburst\` or \`gpt-image-2.5-flare\` |`;
    const mockFetch: typeof fetch = async () =>
      new Response(PAGE, { status: 200 });

    const batchLlm: BatchLlmReader = async ({ items }) => {
      const out: Record<string, import("../readers/llm.js").ExtractionResult> =
        {};
      for (const it of items) {
        out[it.dependencyName] = {
          found: true,
          status: "deprecated",
          shutdownDate: null,
          replacement: null,
          sourceQuote: PAGE,
        };
      }
      return out;
    };

    const finding: Finding = {
      id: "s",
      kind: "model",
      name: "gpt-image-2.5-sunburst",
      locations: [{ file: "a.ts", line: 1 }],
      status: "no_notice_found",
      confidence: "unverified",
      checked: false,
    };

    const { findings: out } = await resolveAllTier2([finding], {
      sources: [{ provider: "openai", urls: ["https://example.com/deprecations"] }],
      fetchImpl: mockFetch,
      batchLlmReader: batchLlm,
    });

    expect(out[0]!.status).toBe("no_notice_found");
    expect(out[0]!.confidence).toBe("unverified");
    expect(out[0]!.checked).toBe(true);
  });

  it("records fetch errors in tier2Errors", async () => {
    const mockFetch: typeof fetch = async () =>
      new Response("", { status: 503 });

    const batchLlm: BatchLlmReader = async () => ({});

    const finding: Finding = {
      id: "x",
      kind: "model",
      name: "gpt-image-2",
      locations: [{ file: "a.ts", line: 1 }],
      status: "no_notice_found",
      confidence: "unverified",
      checked: false,
    };

    const { errors, findings: out } = await resolveAllTier2([finding], {
      sources: [
        { provider: "openai", urls: ["https://example.com/deprecations.md"] },
      ],
      fetchImpl: mockFetch,
      batchLlmReader: batchLlm,
    });

    expect(errors.length).toBeGreaterThan(0);
    expect(out[0]!.checked).toBe(false);
    expect(out[0]!.uncheckedReason).toContain("Couldn't read");
  });
});