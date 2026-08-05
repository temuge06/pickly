import Image from "next/image";

/**
 * Fills a `relative` parent with a product image. Pick images are normally
 * re-hosted to Supabase (WebP) — those go through next/image for optimization
 * and blur. But if re-hosting ever fails, the stored URL is an arbitrary shop
 * CDN that next/image can't serve (unconfigured host → runtime crash). Those
 * fall back to a plain <img>, so a pick image can never take the page down.
 *
 * Keep this hostname list in sync with next.config's remotePatterns.
 */
const OPTIMIZABLE_HOST =
  /(?:\.supabase\.co|image\.tmdb\.org|covers\.openlibrary\.org|i\.scdn\.co|a\.ltrbxd\.com|(?:fastly\.)?picsum\.photos)$/i;

export function ProductImage({
  src,
  alt,
  sizes,
}: {
  src: string;
  alt: string;
  sizes: string;
}) {
  let host = "";
  try {
    host = new URL(src).hostname;
  } catch {
    /* relative/invalid → treat as non-optimizable */
  }

  if (host && OPTIMIZABLE_HOST.test(host)) {
    return <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="absolute inset-0 h-full w-full object-cover"
    />
  );
}
