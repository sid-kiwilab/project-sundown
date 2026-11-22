import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { resolveSundownRegistryPath } from "./dotenv.js";

describe("resolveSundownRegistryPath", () => {
  const origRegistry = process.env.REGISTRY_PATH;
  const origRoot = process.env.SUNDOWN_MONOREPO_ROOT;

  beforeEach(() => {
    delete process.env.REGISTRY_PATH;
    delete process.env.SUNDOWN_MONOREPO_ROOT;
  });

  afterEach(() => {
    if (origRegistry === undefined) delete process.env.REGISTRY_PATH;
    else process.env.REGISTRY_PATH = origRegistry;
    if (origRoot === undefined) delete process.env.SUNDOWN_MONOREPO_ROOT;
    else process.env.SUNDOWN_MONOREPO_ROOT = origRoot;
  });

  it("resolves registry next to a walked root", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sundown-reg-"));
    fs.mkdirSync(path.join(tmp, "registry"), { recursive: true });
    fs.writeFileSync(
      path.join(tmp, "registry", "sources.json"),
      '{"sources":[]}',
    );
    const reg = resolveSundownRegistryPath({ searchFrom: [tmp] });
    expect(reg).toBe(path.join(tmp, "registry"));
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  it("throws when registry cannot be found", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "sundown-none-"));
    expect(() =>
      resolveSundownRegistryPath({ searchFrom: [tmp] }),
    ).toThrow(/Could not find Sundown registry/);
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});