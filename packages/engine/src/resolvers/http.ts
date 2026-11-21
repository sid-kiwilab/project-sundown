export type FetchFn = typeof fetch;

export function getFetch(impl?: FetchFn): FetchFn {
  return impl ?? globalThis.fetch;
}