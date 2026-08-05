import Image from "next/image";

export function MediaCard({
  title,
  subtitle,
  imageUrl,
  href,
  aspect = "square",
  meta,
  width = 132,
}: {
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  href?: string | null;
  aspect?: "square" | "portrait";
  meta?: React.ReactNode;
  width?: number;
}) {
  const Wrapper = href ? "a" : "div";
  const wrapperProps = href
    ? { href, target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="group shrink-0 snap-start"
      style={{ width }}
    >
      <div
        className={`relative overflow-hidden rounded-xl ${
          aspect === "portrait" ? "aspect-[2/3]" : "aspect-square"
        }`}
        style={{ boxShadow: "0 10px 14px -9px rgba(35,27,34,0.5)" }}
      >
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes={`${width}px`}
            className="object-cover transition-transform duration-300 group-active:scale-[1.03]"
          />
        ) : null}
      </div>
      <p className="mt-2 truncate font-body text-[13px] font-medium leading-snug text-ink">
        {title}
      </p>
      {subtitle ? (
        <p className="truncate font-mono text-[10.5px] text-ink/55">
          {subtitle}
        </p>
      ) : null}
      {meta}
    </Wrapper>
  );
}
