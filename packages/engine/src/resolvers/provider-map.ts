import type { Finding } from "../types.js";

export function inferProvider(finding: Finding): string | null {
  const n = finding.name.toLowerCase();

  if (finding.kind === "model") {
    if (/^gpt-|^o[13]-|^dall-e|^text-embedding|^gpt-image/.test(n)) {
      return "openai";
    }
    if (n.startsWith("claude")) return "anthropic";
    if (n.startsWith("gemini")) return "google";
    if (n.startsWith("mistral") || n.startsWith("codestral")) return "mistral";
    if (n.startsWith("llama")) return "meta";
  }

  if (finding.kind === "api") {
    if (n === "openai" || n.includes("openai")) return "openai";
    if (n.includes("anthropic")) return "anthropic";
    if (n.includes("google") || n.includes("generativelanguage")) {
      return "google";
    }
  }

  return null;
}