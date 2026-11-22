export type {
  Finding,
  FindingKind,
  FindingStatus,
  FindingConfidence,
  ScanReport,
  ScanMeta,
  ScanOptions,
  Detection,
  CoverageSummary,
  Tier2Error,
} from "./types.js";
export { scan } from "./scan.js";
export { walkRepo } from "./walk.js";
export { loadRegistry, resolveRegistryPath, countRegistryProviders } from "./registry.js";
export { buildReport, sortFindings, isDateNotVerified } from "./report.js";
export { computeCoverage, buildStandBehindLine } from "./coverage.js";
export { resolveAllTier1 } from "./resolvers/tier1.js";
export { resolveAllTier2 } from "./resolvers/tier2.js";
export type { Tier2Result } from "./resolvers/tier2.js";
export {
  createDefaultLlmReader,
  createDefaultBatchLlmReader,
  hasAnyLlmKey,
} from "./readers/llm.js";
export type {
  LlmReader,
  BatchLlmReader,
  ExtractionResult,
  BatchExtractionInput,
} from "./readers/llm.js";
export { quoteContainsDate, normalizeForQuoteMatch } from "./readers/quote-gate.js";
export {
  findMonorepoRoot,
  resolveSundownRegistryPath,
  applyRootDotenv,
  hasLlmEnvKey,
} from "./dotenv.js";
export type {
  ApplyRootDotenvOptions,
  ResolveSundownRegistryOptions,
} from "./dotenv.js";
export { windowAround, modelMentionedOnPage } from "./readers/text-window.js";
export { addSourceIssueUrl, ADD_SOURCE_ISSUE_BASE } from "./types.js";