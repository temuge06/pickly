import { forwardRef } from "react";

/**
 * Spotly-light dashboard primitives. The dashboard shares the profile's design
 * language: white surface, Nunito (font-header), `#151515` ink, `#e94f7a`
 * accent, 15px radii. (The auth/onboarding screens still use the dark Canvas
 * primitives — these are dashboard-only.)
 */

// --- Spinner ---------------------------------------------------------------

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`animate-spin ${className}`}
      fill="none"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// --- Skeleton --------------------------------------------------------------

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

// --- Button ----------------------------------------------------------------

type Variant = "primary" | "soft" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-spotly-accent text-white shadow-[0_6px_16px_-8px_rgba(233,79,122,0.8)] active:brightness-95",
  soft: "bg-spotly-accent/10 text-[#c23361] active:bg-spotly-accent/15",
  ghost: "bg-black/[0.05] text-spotly-ink active:bg-black/[0.09]",
  danger: "bg-black/[0.05] text-[#c2334a] active:bg-black/[0.09]",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
};

export const DashButton = forwardRef<HTMLButtonElement, ButtonProps>(
  function DashButton(
    { variant = "primary", loading, className = "", children, disabled, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        {...rest}
        className={`inline-flex min-h-[46px] items-center justify-center gap-2 rounded-[14px] px-4 font-header text-[14px] font-bold transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${className}`}
      >
        {loading ? <Spinner className="h-4 w-4" /> : null}
        {children}
      </button>
    );
  },
);

// --- Inputs ----------------------------------------------------------------

export function DashLabel({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block font-header text-[12px] font-bold uppercase tracking-wide text-black/45"
    >
      {children}
    </label>
  );
}

const inputBase =
  "w-full rounded-[14px] bg-black/[0.04] px-4 py-3 font-header text-[16px] text-spotly-ink placeholder:text-black/30 outline-none ring-1 ring-inset ring-black/10 transition-shadow duration-150 focus:ring-2 focus:ring-spotly-accent min-h-[46px]";

export const DashInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function DashInput({ className = "", ...rest }, ref) {
  return <input ref={ref} {...rest} className={`${inputBase} ${className}`} />;
});

export function DashTextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  const { className = "", ...rest } = props;
  return (
    <textarea
      {...rest}
      className={`${inputBase} resize-none leading-relaxed ${className}`}
    />
  );
}

export function DashSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", children, ...rest } = props;
  return (
    <select
      {...rest}
      className={`${inputBase} appearance-none bg-[length:16px] bg-[right_14px_center] bg-no-repeat pr-10 ${className}`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
      }}
    >
      {children}
    </select>
  );
}

export function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 font-header text-[12.5px] text-black/45">{children}</p>
  );
}

// --- Card / row surfaces ---------------------------------------------------

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[16px] bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] ring-1 ring-black/[0.04] ${className}`}
    >
      {children}
    </div>
  );
}
