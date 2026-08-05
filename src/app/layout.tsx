import type { Metadata, Viewport } from "next";
import {
  Golos_Text,
  Inter,
  JetBrains_Mono,
  Montserrat,
  Montserrat_Alternates,
  Nunito,
  Oswald,
  PT_Sans_Narrow,
  Unbounded,
} from "next/font/google";
import "./globals.css";

// lapis design language (Figma frame 694-12989). All Cyrillic-native Google
// fonts. The design's two custom faces map here: "After" (section titles) →
// Montserrat Alternates 800; "GIP" (pick notes) → Montserrat Alternates Light.
const inter = Inter({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});
const montserrat = Montserrat({
  subsets: ["cyrillic", "latin"],
  weight: ["300", "400", "500"],
  variable: "--font-montserrat",
  display: "swap",
});
const montserratAlternates = Montserrat_Alternates({
  subsets: ["cyrillic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-mont-alt",
  display: "swap",
});
// The Figma nav uses DM Sans, but Google's DM Sans has no Cyrillic subset and
// the labels are Cyrillic (Нүүр, Профайл) — Inter stands in (also neutral).

// spotly design language (Figma frame 391-680). Apple system typefaces in the
// design can't be web-served, so each maps to the closest Cyrillic-capable
// Google font (Mongolian text requires Cyrillic):
//   SF Pro Rounded  → Nunito        (rounded)     — headers, music/book text
//   SF Pro Condensed→ PT Sans Narrow (condensed)  — movie card overlays
//   SF Pro          → Golos Text    (neutral)     — ask card (already loaded)
//   American Captain→ Oswald        (varsity)     — watermark headings
const nunito = Nunito({
  subsets: ["cyrillic", "latin"],
  weight: ["300", "400", "600", "700", "900"],
  variable: "--font-nunito",
  display: "swap",
});

const ptSansNarrow = PT_Sans_Narrow({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "700"],
  variable: "--font-pt-narrow",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["cyrillic", "latin"],
  weight: ["600", "700"],
  variable: "--font-oswald",
  display: "swap",
});

const unbounded = Unbounded({
  subsets: ["cyrillic", "latin"],
  weight: ["600", "700", "800"],
  variable: "--font-unbounded",
  display: "swap",
});

const golosText = Golos_Text({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-golos",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["cyrillic", "latin"],
  weight: ["500", "600"],
  variable: "--font-jbmono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pickly",
  description: "What Mongolian creators actually use, listen to, watch and read.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="mn"
      className={`${unbounded.variable} ${golosText.variable} ${jetbrainsMono.variable} ${nunito.variable} ${ptSansNarrow.variable} ${oswald.variable} ${inter.variable} ${montserrat.variable} ${montserratAlternates.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
