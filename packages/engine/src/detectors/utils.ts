import type { WalkedFile } from "../walk.js";

export function linesWithMatches(
  file: WalkedFile,
  pattern: RegExp,
): { line: number; raw: string }[] {
  const lines = file.content.split("\n");
  const hits: { line: number; raw: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]!;
    if (pattern.test(raw)) {
      hits.push({ line: i + 1, raw: raw.trim().slice(0, 200) });
    }
    pattern.lastIndex = 0;
  }
  return hits;
}

export function allMatchesInFile(
  file: WalkedFile,
  pattern: RegExp,
): { line: number; match: string; raw: string }[] {
  const lines = file.content.split("\n");
  const hits: { line: number; match: string; raw: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]!;
    const re = new RegExp(pattern.source, pattern.flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(raw)) !== null) {
      hits.push({
        line: i + 1,
        match: m[0],
        raw: raw.trim().slice(0, 200),
      });
      if (!pattern.global) break;
    }
  }
  return hits;
}