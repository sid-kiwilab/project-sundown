import type { Detection } from "../types.js";
import type { WalkedFile } from "../walk.js";

function parsePackageJson(content: string, file: WalkedFile): Detection[] {
  let data: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  };
  try {
    data = JSON.parse(content);
  } catch {
    return [];
  }
  const out: Detection[] = [];
  const sections = [
    data.dependencies,
    data.devDependencies,
    data.peerDependencies,
  ];
  for (const deps of sections) {
    if (!deps) continue;
    for (const [name, version] of Object.entries(deps)) {
      const ver = version.replace(/^[\^~>=<]/, "").split(" ")[0];
      out.push({
        kind: "package",
        name,
        version: ver || version,
        file: file.relativePath,
        line: 1,
        raw: `"${name}": "${version}"`,
      });
    }
  }
  return out;
}

function parseRequirements(content: string, file: WalkedFile): Detection[] {
  const out: Detection[] = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line || line.startsWith("#")) continue;
    const m = line.match(/^([a-zA-Z0-9_.-]+)([=<>!~]+.*)?$/);
    if (m) {
      out.push({
        kind: "package",
        name: m[1]!.toLowerCase(),
        version: m[2]?.replace(/^[=<>!~]+/, "") || undefined,
        file: file.relativePath,
        line: i + 1,
        raw: line,
      });
    }
  }
  return out;
}

function parseGoMod(content: string, file: WalkedFile): Detection[] {
  const out: Detection[] = [];
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i]!.match(/^\s*([\w.\-/]+)\s+v[\w.+-]+/);
    if (m) {
      out.push({
        kind: "package",
        name: m[1]!,
        file: file.relativePath,
        line: i + 1,
        raw: lines[i]!.trim(),
      });
    }
  }
  return out;
}

const PY_DEP_SECTIONS = [
  "project.dependencies",
  "tool.poetry.dependencies",
  "dependencies",
] as const;

function parsePyproject(content: string, file: WalkedFile): Detection[] {
  const out: Detection[] = [];
  const lines = content.split("\n");

  let depSection: string | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();
    if (trimmed.startsWith("[")) {
      const match = PY_DEP_SECTIONS.find((s) => trimmed === `[${s}]`);
      depSection = match ?? null;
      continue;
    }
    if (!depSection) continue;
    const kv = line.match(/^\s*([a-zA-Z0-9_.-]+)\s*=/);
    if (kv && kv[1] !== "python") {
      out.push({
        kind: "package",
        name: kv[1]!.toLowerCase(),
        file: file.relativePath,
        line: i + 1,
        raw: trimmed,
      });
    }
  }

  for (const m of content.matchAll(
    /dependencies\s*=\s*\[([\s\S]*?)\]/g,
  )) {
    for (const part of m[1]!.split(",")) {
      const pkg = part.match(/["']([a-zA-Z0-9_.-]+)["']/);
      if (pkg) {
        out.push({
          kind: "package",
          name: pkg[1]!.toLowerCase(),
          file: file.relativePath,
          line: 1,
          raw: pkg[0],
        });
      }
    }
  }

  return out;
}

function parseCargoToml(content: string, file: WalkedFile): Detection[] {
  const out: Detection[] = [];
  const block = content.match(/^\[dependencies\]\s*([\s\S]*?)(?=^\[)/m);
  const body = block?.[1] ?? content.match(/^\[dependencies\]\s*([\s\S]*)$/m)?.[1];
  if (!body) return out;
  const lines = body.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const kv = line.match(/^([a-zA-Z0-9_-]+)\s*=\s*/);
    if (kv) {
      out.push({
        kind: "package",
        name: kv[1]!,
        file: file.relativePath,
        line: i + 1,
        raw: trimmed,
      });
    }
  }
  return out;
}

export function detectPackages(files: WalkedFile[]): Detection[] {
  const out: Detection[] = [];
  for (const file of files) {
    const base = file.relativePath.split("/").pop() ?? "";
    if (base === "package.json" && !file.relativePath.includes("node_modules")) {
      out.push(...parsePackageJson(file.content, file));
    } else if (base === "requirements.txt") {
      out.push(...parseRequirements(file.content, file));
    } else if (base === "pyproject.toml") {
      out.push(...parsePyproject(file.content, file));
    } else if (base === "go.mod") {
      out.push(...parseGoMod(file.content, file));
    } else if (base === "Cargo.toml") {
      out.push(...parseCargoToml(file.content, file));
    } else if (base === "Gemfile") {
      for (const m of file.content.matchAll(/gem\s+['"]([^'"]+)['"]/g)) {
        out.push({
          kind: "package",
          name: m[1]!,
          file: file.relativePath,
          line: 1,
          raw: m[0],
        });
      }
    }
  }
  return out;
}