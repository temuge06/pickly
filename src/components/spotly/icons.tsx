/** Small play triangle for the "Сонсох" pill (Figma 391:702). */
export function PlayTriangle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 8 8" width="8" height="8" fill="currentColor" className={className} aria-hidden>
      <path d="M1.5 0.5 L7 4 L1.5 7.5 Z" />
    </svg>
  );
}

/** Four-point sparkle on the Ask card (Figma 391:1137 / Frame 185). */
export function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 59" width="56" height="59" fill="none" className={className} aria-hidden>
      <path
        d="M28 0 C29 18 30 21 56 29.5 C30 38 29 41 28 59 C27 41 26 38 0 29.5 C26 21 27 18 28 0 Z"
        fill="white"
      />
    </svg>
  );
}
