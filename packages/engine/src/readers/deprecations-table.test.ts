import { describe, it, expect } from "vitest";
import { parseMarkdownDeprecationRow } from "./deprecations-table.js";

describe("parseMarkdownDeprecationRow", () => {
  const row =
    "| **Feb 10, 2027** | `gpt-image-2`, `gpt-image-2-2026-04-21` | Deprecated | `gpt-image-2.6-sunburst` |";

  it("extracts gpt-image-2 shutdown from table row", () => {
    const parsed = parseMarkdownDeprecationRow(row, "gpt-image-2");
    expect(parsed).not.toBeNull();
    expect(parsed!.shutdownDate).toBe("2027-02-10");
    expect(parsed!.sourceQuote).toContain("gpt-image-2");
  });

  it("ignores replacement-only mention", () => {
    const repl =
      "| **Dec 1, 2026** | `gpt-image-1-mini` | Deprecated | `gpt-image-2.5-sunburst` |";
    expect(parseMarkdownDeprecationRow(repl, "gpt-image-2.5-sunburst")).toBeNull();
  });

  it("parses Anthropic retirement history row", () => {
    const row =
      "| November 30, 2026 | `claude-sonnet-4-5-20250929` | `claude-sonnet-5-5` |";
    const parsed = parseMarkdownDeprecationRow(row, "claude-sonnet-4-5-20250929");
    expect(parsed?.shutdownDate).toBe("2026-11-30");
    expect(parsed?.replacement).toBe("claude-sonnet-5-5");
  });

  it("parses Anthropic status table row", () => {
    const row =
      "| claude-sonnet-4-5-20250929 | Deprecated | September 30, 2026 | November 30, 2026 |";
    const parsed = parseMarkdownDeprecationRow(row, "claude-sonnet-4-5-20250929");
    expect(parsed?.shutdownDate).toBe("2026-11-30");
  });
});