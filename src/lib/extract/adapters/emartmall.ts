import { REALISTIC_UA } from "../canonicalize";
import type { DomainAdapter } from "./types";

/**
 * emartmall.mn — a React SPA (Spree/Cody backend) with no static product data
 * and no Facebook prerender, but a clean unauthenticated REST API. Product
 * URLs are `/productdetail/{barcode}`; the details endpoint returns
 * `data.products` with title / currentprice (MNT) / img / brandnm. Images live
 * on cdn.emartmall.mn. Port :10443 is part of the API host.
 */
const API = "https://restapi.emartmall.mn:10443/mn/api/product/details";
const IMG_BASE = "https://cdn.emartmall.mn/";

type EmartResponse = {
  success?: boolean;
  data?: {
    products?: {
      title?: string;
      title_en?: string;
      brandnm?: string;
      brandnm_en?: string;
      img?: string;
      currentprice?: number;
      price?: number;
    };
  };
};

export const emartmallAdapter: DomainAdapter = {
  hosts: ["emartmall.mn"],
  async extract({ finalUrl }) {
    let sku: string | null = null;
    try {
      const m = new URL(finalUrl).pathname.match(/\/productdetail\/([^/?#]+)/i);
      sku = m?.[1] ?? null;
    } catch {
      return {};
    }
    if (!sku) return {};

    try {
      const res = await fetch(`${API}/${encodeURIComponent(sku)}`, {
        headers: { "User-Agent": REALISTIC_UA, Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return {};
      const json = (await res.json()) as EmartResponse;
      const p = json?.data?.products;
      if (!p) return {};

      const title = (p.title || p.title_en || "").trim() || null;
      const price =
        typeof p.currentprice === "number"
          ? p.currentprice
          : typeof p.price === "number"
            ? p.price
            : null;

      return {
        title,
        brand: (p.brandnm || p.brandnm_en || "").trim() || null,
        imageUrl: p.img ? `${IMG_BASE}${String(p.img).replace(/^\/+/, "")}` : null,
        priceAmount: price,
        priceCurrency: "MNT",
      };
    } catch {
      return {};
    }
  },
};
