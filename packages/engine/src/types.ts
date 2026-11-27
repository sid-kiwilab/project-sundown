import type { BatchLlmReader, LlmReader } from "./readers/llm.js";

export type FindingKind =
  | "model"
  | "api"
  | "package"
  | "runtime"
  | "saas"
  | "action";

export type FindingStatus =
  | "healthy"
  | "deprecated"
  | "price_change"
  | "dead"
  | "no_notice_found";

export type FindingConfidence =
  | "official-data"
  | "official-page"
  | "llm-read"
  | "unverified";

export type FindingLocation = {
  file: string;
  line: number;
};

export type Finding = {
  id: string;
  kind: FindingKind;
  name: string;
  version?: string;
  locations: FindingLocation[];
  status: FindingStatus;
  endDate?: string;
  daysLeft?: number;
  replacement?: string;
  sourceUrl?: string;
  sourceQuote?: string;
  confidence: FindingConfidence;
  /** A named source was queried for this finding. */
  checked: boolean;
  /** Human-readable source name, e.g. "npm registry", "openai deprecations". */
  checkSource?: string;
  /** Why this finding was not checked (when checked === false). */
  uncheckedReason?: string;
};

export type Detection = {
  kind: FindingKind;
  name: string;
  version?: string;
  file: string;
  line: number;
  raw: string;
};

export type CoverageSummary = {
  checked: number;
  total: number;
  unchecked: number;
};

export type Tier2Error = {
  provider: string;
  url: string;
  message: string;
};

export type ScanMeta = {
  tier2Enabled: boolean;
  tier2SkipReason?: string;
  coverage: CoverageSummary;
  tier2Errors: Tier2Error[];
  /** Registry-backed LLM/SaaS providers with official source URLs */
  registryProviderCount?: number;
  standBehindLine?: string;
};

export type ScanReport = {
  root: string;
  scannedAt: string;
  findings: Finding[];
  headline: string;
  borrowedCount: number;
  totalCount: number;
  coverageLine: string;
  meta?: ScanMeta;
};

export type ScanOptions = {
  /** Absolute path to registry/ directory (models, sources, packages JSON). */
  registryPath?: string;
  githubToken?: string;
  /** Inject fetch for tests. */
  fetchImpl?: typeof fetch;
  /** Run Tier 2 when llmReader or env keys present. Default true. */
  tier2Enabled?: boolean;
  /** Override default reader (tests). */
  llmReader?: LlmReader;
  batchLlmReader?: BatchLlmReader;
  maxTier2Lookups?: number;
};

export const ADD_SOURCE_ISSUE_BASE =
  "https://github.com/sid-venkatesh/project-sundown/issues/new";

export function addSourceIssueUrl(label: string): string {
  const title = encodeURIComponent(`Add source for ${label}`);
  return `${ADD_SOURCE_ISSUE_BASE}?title=${title}`;
}