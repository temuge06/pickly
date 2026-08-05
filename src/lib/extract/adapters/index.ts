import type { DomainAdapter } from "./types";
import { emartmallAdapter } from "./emartmall";
import { mmarketAdapter } from "./mmarket";

/**
 * Domain adapter registry. To support a new shop: create one adapter file in
 * this directory (mmarket.ts = HTML-selector template, emartmall.ts = JSON-API
 * template) and add it to this array. The pipeline, form, and everything
 * downstream stay untouched.
 */
const ADAPTERS: DomainAdapter[] = [mmarketAdapter, emartmallAdapter];

export function adapterForHost(hostname: string): DomainAdapter | null {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return ADAPTERS.find((a) => a.hosts.includes(host)) ?? null;
}

export type { AdapterResult, DomainAdapter } from "./types";
