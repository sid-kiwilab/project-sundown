import { describe, it, expect } from "vitest";
import type { Finding } from "../types.js";
import { resolveTier1 } from "./tier1.js";

const basePackage: Finding = {
  id: "p",
  kind: "package",
  name: "lodash",
  version: "4.17.21",
  locations: [{ file: "package.json", line: 1 }],
  status: "no_notice_found",
  confidence: "unverified",
  checked: false,
};

describe("resolveTier1 npm healthy", () => {
  it("marked healthy when version exists and not deprecated", async () => {
    const mockFetch: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes("registry.npmjs.org/lodash")) {
        return new Response(
          JSON.stringify({
            name: "lodash",
            versions: {
              "4.17.21": { version: "4.17.21" },
            },
          }),
          { status: 200 },
        );
      }
      if (url.includes("pypi.org")) {
        return new Response(JSON.stringify({ info: {}, releases: {} }), {
          status: 200,
        });
      }
      return new Response("", { status: 404 });
    };

    const out = await resolveTier1(basePackage, {
      fetchImpl: mockFetch,
      eol: { runtimes: {}, packages: {}, dockerImages: {} },
    });

    expect(out.status).toBe("healthy");
    expect(out.confidence).toBe("official-data");
    expect(out.checked).toBe(true);
    expect(out.checkSource).toContain("npm");
  });
});