"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getTheme, themeStyle, type ThemeKey } from "@/lib/themes";

/**
 * Paints the profile editor in the SAME palette the creator picked for their
 * public page, and lets the theme picker switch it live.
 *
 * Two things make this a client component rather than an inline style on the
 * server page:
 *
 *  1. Instant feedback. `setProfileTheme` revalidates and the server would
 *     eventually re-render with the new palette, but a round-trip's worth of
 *     "nothing happened" reads as a broken control. The picker writes to this
 *     context first, so every surface repaints on the tap.
 *  2. The overscroll bounce. html/body keep the global wall colour otherwise,
 *     which shows as a dark band under a light theme when a phone rubber-bands
 *     past the end of the page.
 *
 * Server-rendered children are passed straight through, so this adds a
 * provider around the tree without pulling the dashboard into the bundle.
 */

type Ctx = { theme: ThemeKey; setTheme: (t: ThemeKey) => void };

const ThemeCtx = createContext<Ctx | null>(null);

export function useDashboardTheme(): Ctx {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useDashboardTheme outside <ThemeShell>");
  return ctx;
}

export function ThemeShell({
  initialTheme,
  children,
}: {
  initialTheme: ThemeKey;
  children: ReactNode;
}) {
  const [theme, setTheme] = useState<ThemeKey>(initialTheme);
  const tokens = getTheme(theme).tokens;

  // A light theme on a dark `color-scheme: dark` root gives the browser the
  // wrong default for form controls, scrollbars and the overscroll gutter.
  const isLight = isLightBackground(tokens.bg);

  useEffect(() => {
    const root = document.documentElement;
    const prevScheme = root.style.colorScheme;
    root.style.backgroundColor = tokens.bg;
    root.style.overscrollBehaviorY = "none";
    root.style.colorScheme = isLight ? "light" : "dark";
    document.body.style.backgroundColor = tokens.bg;
    return () => {
      root.style.backgroundColor = "";
      root.style.overscrollBehaviorY = "";
      root.style.colorScheme = prevScheme;
      document.body.style.backgroundColor = "";
    };
  }, [tokens.bg, isLight]);

  return (
    <ThemeCtx.Provider value={{ theme, setTheme }}>
      <div
        className={`min-h-dvh bg-[var(--t-bg)] sm:py-8 ${
          isLight ? "sm:bg-neutral-300" : "sm:bg-neutral-900"
        }`}
        style={themeStyle(theme)}
      >
        {/* First paint comes from the server-rendered theme, so there is no
            flash of the default palette before the effect above runs. */}
        <style
          dangerouslySetInnerHTML={{
            __html: `html,body{background-color:${getTheme(initialTheme).tokens.bg};overscroll-behavior-y:none}`,
          }}
        />
        <div className="mx-auto min-h-dvh w-full overflow-x-clip bg-[var(--t-bg)] pb-16 sm:min-h-0 sm:max-w-[430px] sm:shadow-[0_0_80px_rgba(0,0,0,0.4)]">
          {children}
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}

/** Relative luminance of a #rrggbb background, thresholded at mid-grey. */
function isLightBackground(hex: string): boolean {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return false;
  const n = parseInt(m[1]!, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.55;
}
