import { forwardRef } from "react";

/**
 * Lapis dashboard primitives. Every colour here is a `--t-*` token from the
 * creator's chosen theme (see ThemeShell), NOT a literal — the editor has to
 * stay legible on On Fire's near-black and on Dalai #2's white paper alike,
 * and a hardcoded `text-[#feedd5]` or `bg-white/[0.04]` reads as invisible on
 * one of the two. Inputs are ≥16px to avoid iOS zoom-on-focus.
 */

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`animate-spin ${className}`} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton-theme rounded-[10px] ${className}`} />;
}

type Variant = "primary" | "soft" | "ghost" | "danger";

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "font-bold active:brightness-95",
  soft: "font-bold",
  ghost: "",
  danger: "",
};

const VARIANT_STYLE: Record<Variant, React.CSSProperties> = {
  primary: { background: "var(--t-accent)", color: "var(--t-on-accent)" },
  soft: {
    background: "color-mix(in srgb, var(--t-accent) 15%, transparent)",
    color: "var(--t-accent)",
  },
  ghost: { background: "var(--t-field)", color: "var(--t-text)" },
  danger: { background: "var(--t-field)", color: "var(--t-danger)" },
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
};

export const LButton = forwardRef<HTMLButtonElement, ButtonProps>(function LButton(
  { variant = "primary", loading, className = "", children, disabled, style, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      {...rest}
      style={{ ...VARIANT_STYLE[variant], ...style }}
      className={`inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[14px] px-4 font-malt text-[14px] font-semibold transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 ${VARIANT_CLASS[variant]} ${className}`}
    >
      {loading ? <Spinner className="h-4 w-4" /> : null}
      {children}
    </button>
  );
});

export function LLabel({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block font-malt text-[12px] font-bold uppercase tracking-wide text-[var(--t-muted)]"
    >
      {children}
    </label>
  );
}

const inputBase =
  "w-full rounded-[14px] bg-[var(--t-field)] px-4 py-3 font-malt text-[16px] text-[var(--t-text)] placeholder:text-[var(--t-muted)] placeholder:opacity-60 outline-none ring-1 ring-inset ring-[var(--t-ring)] transition-shadow duration-150 focus:ring-2 focus:ring-[var(--t-accent)] min-h-[46px]";

export const LInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function LInput({ className = "", ...rest }, ref) {
  return <input ref={ref} {...rest} className={`${inputBase} ${className}`} />;
});

export function LTextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return <textarea {...rest} className={`${inputBase} resize-none leading-relaxed ${className}`} />;
}

export function LSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", children, ...rest } = props;
  return (
    <div className="relative">
      <select
        {...rest}
        className={`${inputBase} appearance-none pr-10 ${className}`}
      >
        {children}
      </select>
      {/* Drawn as an element rather than a background-image data URI: the
          chevron has to follow --t-accent, and a CSS url() cannot read a
          custom property. */}
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--t-accent)]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}

export function Hint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 font-malt text-[12.5px] text-[var(--t-muted)]">{children}</p>;
}

/** Section shell: accent-titled heading + content well, fades in. */
export function LSection({
  icon,
  title,
  action,
  children,
}: {
  icon?: string;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="animate-fade-up px-4">
      <div className="mb-3 flex items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-2">
          {icon ? (
            <span className="text-[16px] leading-none" aria-hidden>
              {icon}
            </span>
          ) : null}
          <h2 className="font-malt text-[17px] font-extrabold uppercase tracking-[-0.2px] text-[var(--t-accent)]">
            {title}
          </h2>
        </div>
        {action}
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </section>
  );
}

/** The panel a group of fields sits in. */
export function Well({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-[16px] bg-[var(--t-well)] ${className}`}>{children}</div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-[14px] bg-[var(--t-well)] px-4 py-5 text-center font-malt text-[13.5px] leading-relaxed text-[var(--t-muted)]">
      {children}
    </p>
  );
}
