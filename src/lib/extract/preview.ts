/**
 * The shape returned by a paste-a-URL extraction attempt.
 *
 * Lives here rather than beside a server action because the extraction
 * pipeline is now driven only from /admin — this keeps the type importable by
 * both the admin UI and the admin action without either depending on a
 * creator-facing module that no longer exists.
 *
 * `confident: false` is not a failure: the URL is always preserved so the form
 * can be completed by hand. Extraction never blocks adding a product.
 */
export type PickPreview = {
  title: string | null;
  brand: string | null;
  imageUrl: string | null;
  price: number | null;
  currency: string | null;
  sourceUrl: string;
  confident: boolean;
  failureReason: "js_rendered" | "blocked" | "fetch_failed" | null;
};
