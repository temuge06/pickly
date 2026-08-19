/**
 * Staff-area primitives. Deliberately a cooler, flatter surface (#0f1115 /
 * slate) than the creator dashboard's warm #2a1617 — an admin is often looking
 * at someone else's data, and the chrome should never be mistakable for their
 * own profile. Accent stays Pickly orange.
 */

export function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[16px] border border-white/[0.08] bg-white/[0.02] p-5">
      <div className="mb-4">
        <h2 className="font-malt text-[15px] font-extrabold uppercase tracking-[-0.2px] text-white">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-1 font-inter text-[12.5px] leading-relaxed text-white/40">
            {subtitle}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function ALabel({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block font-malt text-[11.5px] font-bold uppercase tracking-wide text-white/40"
    >
      {children}
    </label>
  );
}

const field =
  "w-full min-h-[44px] rounded-[10px] border border-white/[0.1] bg-white/[0.04] px-3.5 py-2.5 font-inter text-[15px] text-[#e8eaed] outline-none transition-colors placeholder:text-white/25 focus:border-[#fe7f42]";

export function AInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input {...rest} className={`${field} ${className}`} />;
}

export function ATextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return <textarea {...rest} className={`${field} resize-none leading-relaxed ${className}`} />;
}

export function ASelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", children, ...rest } = props;
  return (
    <select
      {...rest}
      className={`${field} appearance-none bg-[length:15px] bg-[right_12px_center] bg-no-repeat pr-9 ${className}`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='%23fe7f42' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
      }}
    >
      {children}
    </select>
  );
}

type Variant = "primary" | "ghost";
const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-[#fe7f42] text-[#241009] font-bold hover:brightness-105 active:brightness-95",
  ghost: "bg-white/[0.06] text-[#e8eaed] hover:bg-white/[0.1]",
};

export function AButton({
  variant = "primary",
  loading,
  className = "",
  children,
  disabled,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  loading?: boolean;
}) {
  return (
    <button
      disabled={disabled || loading}
      {...rest}
      className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[10px] px-4 font-malt text-[13.5px] font-semibold transition-all duration-150 disabled:pointer-events-none disabled:opacity-45 ${VARIANTS[variant]} ${className}`}
    >
      {loading ? <ASpinner className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

export function ASpinner({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`animate-spin ${className}`} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function AHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 font-inter text-[12px] leading-relaxed text-white/35">{children}</p>
  );
}

export function AError({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-[10px] border border-[#ff8a75]/25 bg-[#ff8a75]/10 px-3 py-2.5 font-inter text-[12.5px] leading-relaxed text-[#ffb3a3]">
      {children}
    </p>
  );
}

/**
 * The visible half of useSaveState. Renders nothing when idle, so it only
 * takes space while it has something to say.
 */
export function SaveState({
  status,
  error,
  labels,
}: {
  status: "idle" | "saving" | "error" | "saved";
  error?: string | null;
  labels?: { saving?: string; saved?: string };
}) {
  if (status === "idle") return null;
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 font-inter text-[12.5px] text-white/50">
        <ASpinner className="h-3.5 w-3.5 text-[#fe7f42]" />
        {labels?.saving ?? "Хадгалж байна…"}
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 font-inter text-[12.5px] font-semibold text-[#9ee7b4]">
        ✓ {labels?.saved ?? "Хадгаллаа"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 font-inter text-[12.5px] font-semibold text-[#ffb3a3]">
      ✕ {error ?? "Алдаа гарлаа"}
    </span>
  );
}
