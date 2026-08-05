import type { DomainAdapter } from "./types";

/**
 * mmarket.mn — WooCommerce. Its JSON-LD is a rank-math Organization graph with
 * no Product node, and OG carries no price, so the price must come from the
 * product markup: `p.price` holds the main product's amount (an `ins` child
 * when on sale — prefer it over the struck-through `del`). Currency symbol ₮
 * sits in `.woocommerce-Price-currencySymbol`, which parsePriceText reads from
 * the combined text.
 *
 * These selectors are WooCommerce defaults, so this adapter doubles as the
 * template for other Woo-based Mongolian shops — copy, change `hosts`.
 */
export const mmarketAdapter: DomainAdapter = {
  hosts: ["mmarket.mn"],
  extract({ $ }) {
    const title =
      $("h1.product_title").first().text().trim() ||
      $(".product .entry-title").first().text().trim() ||
      null;

    const priceRoot = $("p.price").first();
    const priceText =
      priceRoot.find("ins .woocommerce-Price-amount").first().text().trim() ||
      priceRoot.find(".woocommerce-Price-amount").first().text().trim() ||
      null;

    const imageUrl =
      $(".woocommerce-product-gallery__image img").first().attr("src") ??
      $(".woocommerce-product-gallery__image a").first().attr("href") ??
      null;

    return { title, priceText, imageUrl };
  },
};
