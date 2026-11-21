import { describe, it, expect } from "vitest";
import { quoteContainsDate } from "./quote-gate.js";

describe("quoteContainsDate", () => {
  it("accepts ISO date in quote", () => {
    expect(
      quoteContainsDate(
        "Model X will be removed on 2027-02-10 per policy.",
        "2027-02-10",
      ),
    ).toBe(true);
  });

  it("rejects date not in quote", () => {
    expect(
      quoteContainsDate("No shutdown mentioned.", "2027-02-10"),
    ).toBe(false);
  });

  it("accepts US month name in quote", () => {
    expect(
      quoteContainsDate(
        "| **Feb 10, 2027** | `gpt-image-2` | Deprecated |",
        "2027-02-10",
      ),
    ).toBe(true);
  });
});