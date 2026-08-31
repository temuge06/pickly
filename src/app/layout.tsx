import type { Metadata, Viewport } from "next";
import "./globals.css";

/**
 * No webfonts.
 *
 * Type is SF Pro via the system stack in globals.css, so there is nothing to
 * download: the face is already on every Apple device, and other platforms use
 * their own UI font rather than waiting on a network request. This removed nine
 * next/font/google families (Unbounded, Golos Text, JetBrains Mono, Nunito, PT
 * Sans Narrow, Oswald, Inter, Montserrat, Montserrat Alternates) that were left
 * over from three earlier design languages — every one of them was still being
 * fetched on first paint after the tokens stopped pointing at them.
 */
export const metadata: Metadata = {
  title: "LinkSpot",
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
    <html lang="mn">
      <body>{children}</body>
    </html>
  );
}
