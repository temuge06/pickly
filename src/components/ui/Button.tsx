import { forwardRef } from "react";

type Variant = "primary" | "ghost" | "danger" | "quiet";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-marigold text-ink font-semibold active:brightness-95",
  ghost:
    "bg-paper/[0.07] text-paper ring-1 ring-inset ring-paper/12 active:bg-paper/[0.12]",
  danger: "bg-berry/90 text-paper font-medium active:brightness-95",
  quiet: "bg-transparent text-paper/70 active:text-paper",
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant = "primary", className = "", ...rest }, ref) {
    return (
      <button
        ref={ref}
        {...rest}
        className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl px-5 font-body text-[15px] transition disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${className}`}
      />
    );
  },
);
