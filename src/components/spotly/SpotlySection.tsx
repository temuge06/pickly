import { SpotlySectionHead } from "./SpotlySectionHead";

/**
 * Section shell for the spotly page: a large faint watermark word behind the
 * top-right (Figma 391:681/692/743/809 — American Captain 96px, transparent
 * fill with a hairline outline, → Oswald), the section header over it, and the
 * content row below.
 */
export function SpotlySection({
  watermark,
  icon,
  title,
  children,
}: {
  watermark: string;
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-2 right-2 select-none font-watermark text-[96px] font-bold uppercase leading-[1.2] tracking-[-1.92px]"
        style={{ color: "transparent", WebkitTextStroke: "1px #e7e3f2" }}
      >
        {watermark}
      </span>
      <div className="relative pt-[34px]">
        <SpotlySectionHead icon={icon} title={title} seeAllHref="#" />
        <div className="mt-[12px]">{children}</div>
      </div>
    </section>
  );
}
