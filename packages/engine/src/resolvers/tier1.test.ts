import { describe, it, expect, beforeEach } from "vitest";
import type { Finding } from "../types.js";
import { resolveTier1 } from "./tier1.js";
import { clearEolCacheForTests } from "./endoflife.js";

const mockPythonEol = [
  { cycle: "3.8", eol: "2024-10-07", latest: "3.8.20" },
  { cycle: "3.12", eol: false, latest: "3.12.7" },
];

beforeEach(() => clearEolCacheForTests());

describe("resolveTier1 EOL", () => {
  it("resolves Python runtime via endoflife.date", async () => {
    const mockFetch: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes("endoflife.date/api/python.json")) {
        return new Response(JSON.stringify(mockPythonEol), { status: 200 });
      }
      return new Response("", { status: 404 });
    };

    const finding: Finding = {
      id: "p",
      kind: "runtime",
      name: "python",
      version: "3.8",
      locations: [{ file: ".python-version", line: 1 }],
      status: "no_notice_found",
      confidence: "unverified",
      checked: false,
    };

    const out = await resolveTier1(finding, {
      fetchImpl: mockFetch,
      eol: {
        runtimes: { python: "python", node: "nodejs" },
        packages: { django: "django" },
        dockerImages: {},
      },
    });

    expect(out.checked).toBe(true);
    expect(out.checkSource).toContain("python");
    expect(out.status).toBe("dead");
    expect(out.confidence).toBe("official-data");
  });

  it("resolves django package via endoflife.date map", async () => {
    const mockDjangoEol = [{ cycle: "4.1", eol: "2023-12-01" }];
    const mockFetch: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes("endoflife.date/api/django.json")) {
        return new Response(JSON.stringify(mockDjangoEol), { status: 200 });
      }
      if (url.includes("registry.npmjs.org")) {
        return new Response(JSON.stringify({ name: "django", versions: {} }), {
          status: 200,
        });
      }
      if (url.includes("pypi.org")) {
        return new Response(
          JSON.stringify({ info: {}, releases: {} }),
          { status: 200 },
        );
      }
      return new Response("", { status: 404 });
    };

    const finding: Finding = {
      id: "d",
      kind: "package",
      name: "django",
      version: "4.1",
      locations: [{ file: "requirements.txt", line: 1 }],
      status: "no_notice_found",
      confidence: "unverified",
      checked: false,
    };

    const out = await resolveTier1(finding, {
      fetchImpl: mockFetch,
      eol: {
        runtimes: { node: "nodejs" },
        packages: { django: "django" },
        dockerImages: {},
      },
    });

    expect(out.checked).toBe(true);
    expect(out.endDate).toBe("2023-12-01");
    expect(out.status).toBe("dead");
  });
});