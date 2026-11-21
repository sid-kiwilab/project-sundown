import type { Finding } from "../types.js";
import type { SaasVendor, SourceEntry } from "../registry.js";
import { matchSaasVendor } from "../registry.js";
import type { FetchFn } from "./http.js";
import { getFetch } from "./http.js";
import { inferProvider } from "./provider-map.js";
import { htmlToPlainText } from "../readers/strip-html.js";
import {
  daysUntil,
  normalizeForQuoteMatch,
  quoteContainsDate,
} from "../readers/quote-gate.js";
import type { BatchLlmReader, ExtractionResult } from "../readers/llm.js";
import {
  modelInCatalogText,
  quoteShowsModelDeprecated,
  windowAround,
} from "../readers/text-window.js";
import {
  parseMarkdownDeprecationRow,
  deprecationSnippetForModel,
} from "../readers/deprecations-table.js";
import { getCachedPage, setCachedPage } from "./page-cache.js";
import type { Tier2Error } from "../types.js";

const MAX_PAGE_BYTES = 2 * 1024 * 1024;
const MIN_PAGE_TEXT = 20;
const DEFAULT_MAX_LOOKUPS = 40;

export type Tier2Context = {
  sources: SourceEntry[];
  saas?: SaasVendor[];
  fetchImpl?: FetchFn;
  batchLlmReader?: BatchLlmReader;
  maxLookups?: number;
};

export type Tier2Result = {
  findings: Finding[];
  errors: Tier2Error[];
};

function needsTier2(f: Finding): boolean {
  if (f.kind !== "model" && f.kind !== "saas") return false;
  if (f.confidence === "official-page") return false;
  if (f.status === "deprecated" || f.status === "dead") return false;
  return true;
}

async function fetchPageText(
  url: string,
  fetchImpl?: FetchFn,
  errors?: Tier2Error[],
  provider?: string,
): Promise<string | null> {
  const cached = getCachedPage(url);
  if (cached) return cached;

  const fetch = getFetch(fetchImpl);
  try {
    const res = await fetch(url, {
      headers: {
        Accept: "text/html,application/json,text/markdown",
        "User-Agent": "sundown-cli",
      },
    });
    if (!res.ok) {
      errors?.push({
        provider: provider ?? "unknown",
        url,
        message: `HTTP ${res.status} — couldn't read page.`,
      });
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_PAGE_BYTES) {
      errors?.push({
        provider: provider ?? "unknown",
        url,
        message: "Page exceeded size limit.",
      });
      return null;
    }
    const raw = buf.toString("utf8");
    const text = raw.trimStart().startsWith("<")
      ? htmlToPlainText(raw)
      : raw.slice(0, 120_000);
    setCachedPage(url, text);
    return text;
  } catch (e) {
    errors?.push({
      provider: provider ?? "unknown",
      url,
      message: e instanceof Error ? e.message : "Fetch failed.",
    });
    return null;
  }
}

function quoteInPage(pageText: string, quote: string): boolean {
  const q = quote.trim();
  if (!q) return false;
  if (pageText.includes(q)) return true;
  const collapsed = (s: string) => s.replace(/\s+/g, " ").trim();
  if (collapsed(pageText).includes(collapsed(q))) return true;
  return normalizeForQuoteMatch(pageText).includes(normalizeForQuoteMatch(q));
}

function applyExtraction(
  finding: Finding,
  pageUrl: string,
  pageText: string,
  ext: ExtractionResult,
  checkSource: string,
): Finding {
  const base = {
    ...finding,
    checked: true,
    checkSource,
    sourceUrl: pageUrl,
  };

  if (!ext.found || ext.status === "no_notice_found") {
    return {
      ...base,
      status: "no_notice_found",
      confidence: "unverified",
    };
  }

  const quote = ext.sourceQuote?.trim() ?? "";
  if (!quote || !quoteInPage(pageText, quote)) {
    return {
      ...base,
      status: "no_notice_found",
      confidence: "unverified",
      sourceQuote: quote
        ? "Proposed quote was not found on the fetched page — dropped."
        : "Tier 2 requires a verbatim source quote — none provided.",
    };
  }

  let endDate: string | undefined;
  let daysLeft: number | undefined;
  let sourceQuote = ext.sourceQuote ?? "";

  if (ext.shutdownDate) {
    if (quoteContainsDate(ext.sourceQuote ?? "", ext.shutdownDate)) {
      endDate = ext.shutdownDate.slice(0, 10);
      daysLeft = daysUntil(endDate);
    } else {
      sourceQuote = `${sourceQuote} (date not verified — not verbatim in quote.)`;
    }
  }

  if (finding.kind === "model" && (ext.status === "deprecated" || ext.status === "dead")) {
    if (!quoteShowsModelDeprecated(quote, finding.name)) {
      return {
        ...base,
        status: "no_notice_found",
        confidence: "unverified",
        sourceQuote:
          "Official page mentions this ID but not as the deprecated model in the quote.",
      };
    }
  }

  const status: Finding["status"] =
    ext.status === "healthy" || ext.status === "dead" || ext.status === "deprecated"
      ? ext.status
      : "deprecated";

  return {
    ...base,
    status,
    endDate,
    daysLeft,
    replacement: ext.replacement ?? undefined,
    sourceQuote,
    confidence: "official-page",
  };
}

function applyMissingFromCatalog(
  finding: Finding,
  catalogUrl: string,
  _catalogText: string,
): Finding {
  return {
    ...finding,
    checked: true,
    checkSource: "provider current models list",
    status: "deprecated",
    confidence: "official-page",
    sourceUrl: catalogUrl,
    sourceQuote:
      "Not listed in provider's current models documentation (catalog checked) — likely retired or a typo.",
  };
}

function applyTableDeprecation(
  finding: Finding,
  pageUrl: string,
  row: { sourceQuote: string; shutdownDate?: string; replacement?: string },
  checkSource: string,
): Finding {
  let endDate = row.shutdownDate;
  let daysLeft: number | undefined;
  if (endDate) {
    daysLeft = daysUntil(endDate);
  }
  return {
    ...finding,
    checked: true,
    checkSource,
    status: "deprecated",
    confidence: "official-page",
    sourceUrl: pageUrl,
    sourceQuote: row.sourceQuote,
    endDate,
    daysLeft,
    replacement: row.replacement,
  };
}

function applyCheckedNoNotice(
  finding: Finding,
  checkSource: string,
  sourceUrl?: string,
): Finding {
  return {
    ...finding,
    checked: true,
    checkSource,
    status: "no_notice_found",
    confidence: "unverified",
    sourceUrl,
  };
}

type ProviderBucket = {
  provider: string;
  indices: number[];
  urls: string[];
  modelsListUrls?: string[];
};

function bucketKey(f: Finding, saas: SaasVendor[]): string | null {
  if (f.kind === "saas") {
    const v = matchSaasVendor(f.name, f.kind, saas);
    return v ? `saas:${v.id}` : null;
  }
  const p = inferProvider(f);
  return p ? `llm:${p}` : null;
}

export async function resolveAllTier2(
  findings: Finding[],
  ctx: Tier2Context,
): Promise<Tier2Result> {
  const errors: Tier2Error[] = [];
  const out = [...findings];
  if (!ctx.batchLlmReader) {
    return { findings: out, errors };
  }

  const saas = ctx.saas ?? [];
  const urlByProvider = new Map<string, SourceEntry>();
  for (const s of ctx.sources) {
    urlByProvider.set(s.provider, s);
  }

  const saasById = new Map(saas.map((v) => [v.id, v]));

  const buckets = new Map<string, ProviderBucket>();

  for (let i = 0; i < out.length; i++) {
    const f = out[i]!;
    if (!needsTier2(f)) continue;
    const key = bucketKey(f, saas);
    if (!key) continue;

    let bucket = buckets.get(key);
    if (!bucket) {
      if (key.startsWith("saas:")) {
        const id = key.slice(5);
        const vendor = saasById.get(id);
        if (!vendor?.urls?.length) continue;
        bucket = {
          provider: vendor.name,
          indices: [],
          urls: vendor.urls,
        };
      } else {
        const provider = key.slice(4);
        const src = urlByProvider.get(provider);
        if (!src?.urls?.length) continue;
        bucket = {
          provider,
          indices: [],
          urls: src.urls,
          modelsListUrls: src.modelsListUrls,
        };
      }
      buckets.set(key, bucket);
    }
    bucket.indices.push(i);
  }

  const pageCache = new Map<string, string>();
  let batchCalls = 0;
  const max = ctx.maxLookups ?? DEFAULT_MAX_LOOKUPS;

  for (const bucket of buckets.values()) {
    if (batchCalls >= max) break;

    let depPageText: string | null = null;
    let depPageUrl = bucket.urls[0]!;

    for (const url of bucket.urls) {
      if (pageCache.has(url)) {
        depPageText = pageCache.get(url)!;
        depPageUrl = url;
        break;
      }
      const text = await fetchPageText(
        url,
        ctx.fetchImpl,
        errors,
        bucket.provider,
      );
      if (text && text.length > MIN_PAGE_TEXT) {
        pageCache.set(url, text);
        depPageText = text;
        depPageUrl = url;
        break;
      }
    }

    if (!depPageText) {
      for (const idx of bucket.indices) {
        out[idx] = {
          ...out[idx]!,
          checked: false,
          uncheckedReason: `Couldn't read ${bucket.provider}'s page.`,
        };
      }
      continue;
    }

    const checkSource = `${bucket.provider} deprecations`;
    const items: {
      idx: number;
      dependencyName: string;
      dependencyKind: string;
      pageText: string;
    }[] = [];

    const tableResolved = new Set<number>();

    for (const idx of bucket.indices) {
      const f = out[idx]!;
      if (f.kind === "model") {
        const row = parseMarkdownDeprecationRow(depPageText, f.name);
        if (row) {
          out[idx] = applyTableDeprecation(f, depPageUrl, row, checkSource);
          tableResolved.add(idx);
          continue;
        }
      }
    }

    for (const idx of bucket.indices) {
      if (tableResolved.has(idx)) continue;
      const f = out[idx]!;
      const searchName =
        f.kind === "saas"
          ? (matchSaasVendor(f.name, f.kind, saas)?.name ?? f.name)
          : f.name;
      const rowSnippet =
        f.kind === "model"
          ? deprecationSnippetForModel(depPageText, f.name)
          : null;
      const win =
        rowSnippet ??
        windowAround(depPageText, searchName) ??
        windowAround(depPageText, f.name);
      if (win) {
        items.push({
          idx,
          dependencyName: f.name,
          dependencyKind: f.kind,
          pageText: win,
        });
      }
    }

    let extractions: Record<string, ExtractionResult> = {};
    if (items.length > 0) {
      try {
        batchCalls += 1;
        extractions = await ctx.batchLlmReader({
          pageUrl: depPageUrl,
          items: items.map((it) => ({
            dependencyName: it.dependencyName,
            dependencyKind: it.dependencyKind,
            pageText: it.pageText,
          })),
        });
      } catch (e) {
        errors.push({
          provider: bucket.provider,
          url: depPageUrl,
          message:
            e instanceof Error ? e.message : "LLM batch extraction failed.",
        });
      }
    }

    for (const it of items) {
      const ext = extractions[it.dependencyName];
      if (!ext) continue;
      const snippet = it.pageText;
      out[it.idx] = applyExtraction(
        out[it.idx]!,
        depPageUrl,
        snippet,
        ext,
        checkSource,
      );
    }

    let catalogText: string | null = null;
    let catalogUrl: string | undefined;
    if (bucket.modelsListUrls?.length) {
      for (const url of bucket.modelsListUrls) {
        catalogUrl = url;
        if (pageCache.has(url)) {
          catalogText = pageCache.get(url)!;
          break;
        }
        const text = await fetchPageText(
          url,
          ctx.fetchImpl,
          errors,
          bucket.provider,
        );
        if (text && text.length > MIN_PAGE_TEXT) {
          pageCache.set(url, text);
          catalogText = text;
          break;
        }
      }
    }

    for (const idx of bucket.indices) {
      const f = out[idx]!;
      if (f.checked) continue;

      const onDepPage = Boolean(
        windowAround(depPageText, f.name) ?? windowAround(depPageText, f.name, 400),
      );

      if (!onDepPage && catalogText && catalogUrl) {
        if (!modelInCatalogText(catalogText, f.name)) {
          out[idx] = applyMissingFromCatalog(f, catalogUrl, catalogText);
          continue;
        }
        out[idx] = applyCheckedNoNotice(
          f,
          "provider current models list + deprecations",
          catalogUrl,
        );
        continue;
      }

      out[idx] = applyCheckedNoNotice(f, checkSource, depPageUrl);
    }
  }

  return { findings: out, errors };
}