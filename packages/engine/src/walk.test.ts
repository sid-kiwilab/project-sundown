import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { walkRepo, shouldIncludeTestsInWalk } from "./walk.js";

describe("walkRepo", () => {
  const orig = process.env.SUNDOWN_INCLUDE_TESTS;

  beforeEach(() => {
    delete process.env.SUNDOWN_INCLUDE_TESTS;
  });

  afterEach(() => {
    if (orig === undefined) delete process.env.SUNDOWN_INCLUDE_TESTS;
    else process.env.SUNDOWN_INCLUDE_TESTS = orig;
  });

  it("skips *.test.ts and nested fixtures by default", async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sundown-walk-"));
    try {
      fs.mkdirSync(path.join(tmp, "fixtures", "nested"), { recursive: true });
      fs.writeFileSync(path.join(tmp, "app.ts"), "const x = 1;");
      fs.writeFileSync(path.join(tmp, "app.test.ts"), "const model = 'gpt-ghost-99';");
      fs.writeFileSync(
        path.join(tmp, "fixtures", "nested", "package.json"),
        '{"name":"fixture"}',
      );
      const files = await walkRepo(tmp);
      const rels = files.map((f) => f.relativePath);
      expect(rels).toContain("app.ts");
      expect(rels).not.toContain("app.test.ts");
      expect(rels.some((r) => r.includes("fixtures/"))).toBe(false);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it("includes tests and fixtures when SUNDOWN_INCLUDE_TESTS=1", async () => {
    process.env.SUNDOWN_INCLUDE_TESTS = "1";
    expect(shouldIncludeTestsInWalk()).toBe(true);
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sundown-walk-inc-"));
    try {
      fs.mkdirSync(path.join(tmp, "fixtures"), { recursive: true });
      fs.writeFileSync(path.join(tmp, "unit.test.ts"), "test");
      fs.writeFileSync(path.join(tmp, "fixtures", "data.json"), "{}");
      const files = await walkRepo(tmp);
      const rels = files.map((f) => f.relativePath);
      expect(rels).toContain("unit.test.ts");
      expect(rels).toContain("fixtures/data.json");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});