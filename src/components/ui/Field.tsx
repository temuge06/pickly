/**
 * Form primitives shared across dashboard + auth. Inputs are locked to 16px
 * font-size — anything smaller triggers iOS zoom-on-focus, which the brief
 * forbids. Tap targets stay ≥44px.
 */

export function Label({
  children,
  htmlFor,
}: {
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block font-mono text-[11px] uppercase tracking-wide text-paper/55"
    >
      {children}
    </label>
  );
}

const inputBase =
  "w-full rounded-2xl bg-paper/[0.07] px-4 py-3 text-[16px] text-paper placeholder:text-paper/35 outline-none ring-1 ring-inset ring-paper/10 focus:ring-2 focus:ring-marigold min-h-[48px]";

export function TextInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  const { className = "", ...rest } = props;
  return <input {...rest} className={`${inputBase} ${className}`} />;
}

export function TextArea(
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

export function Hint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1.5 font-body text-[12.5px] text-paper/45">{children}</p>;
}
