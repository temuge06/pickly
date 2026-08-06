import { forwardRef } from "react";

/**
 * Lapis-dark dashboard primitives — matches the public profile's design
 * language: #2a1617 surface, #fe7f42 orange accent, cream #feedd5 text,
 * Montserrat Alternates. Inputs are ≥16px to avoid iOS zoom-on-focus.
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
  return <div className={`skeleton-dark rounded-[10px] ${className}`} />;
}

type Variant = "primary" | "soft" | "ghost" | "danger";
const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-[#fe7f42] text-[#3a1310] font-bold shadow-[0_6px_16px_-8px_rgba(254,127,66,0.8)] active:brightness-95",
  soft: "bg-[#fe7f42]/15 text-[#fe7f42] font-bold active:bg-[#fe7f42]/25",
  ghost: "bg-white/[0.06] text-[#feedd5] active:bg-white/[0.1]",
  danger: "bg-white/[0.06] text-[#ff9a8a] active:bg-white/[0.1]",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
};

export const LButton = forwardRef<HTMLButtonElement, ButtonProps>(function LButton(
  { variant = "primary", loading, className = "", children, disabled, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      {...rest}
      className={`inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[14px] px-4 font-malt text-[14px] font-semibold transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${className}`}
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
      className="mb-1.5 block font-malt text-[12px] font-bold uppercase tracking-wide text-[#feedd5]/50"
    >
      {children}
    </label>
  );
}

const inputBase =
  "w-full rounded-[14px] bg-white/[0.06] px-4 py-3 font-malt text-[16px] text-[#feedd5] placeholder:text-[#feedd5]/30 outline-none ring-1 ring-inset ring-white/[0.1] transition-shadow duration-150 focus:ring-2 focus:ring-[#fe7f42] min-h-[46px]";

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
    <select
      {...rest}
      className={`${inputBase} appearance-none bg-[length:16px] bg-[right_14px_center] bg-no-repeat pr-10 ${className}`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23fe7f42' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
      }}
    >
      {children}
    </select>
  );
}

export function Hint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 font-malt text-[12.5px] text-[#feedd5]/40">{children}</p>;
}

/** Section shell: orange-accented title + content well, fades in. */
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
          <h2 className="font-malt text-[17px] font-extrabold uppercase tracking-[-0.2px] text-white">
            {title}
          </h2>
        </div>
        {action}
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </section>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-[14px] bg-white/[0.04] px-4 py-5 text-center font-malt text-[13.5px] leading-relaxed text-[#feedd5]/45">
      {children}
    </p>
  );
}
