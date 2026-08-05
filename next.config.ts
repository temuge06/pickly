import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pins the workspace root to this project — a stray lockfile in a parent
  // directory otherwise makes Next.js guess (and warn) about the wrong root.
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.scdn.co" }, // Spotify album art
      { protocol: "https", hostname: "a.ltrbxd.com" }, // Letterboxd posters
      { protocol: "https", hostname: "image.tmdb.org" }, // TMDB posters
      { protocol: "https", hostname: "covers.openlibrary.org" }, // Open Library covers
      { protocol: "https", hostname: "**.supabase.co" }, // avatars / uploaded pick images
      { protocol: "https", hostname: "picsum.photos" }, // seed-fixture placeholder photography only
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
  },
};

export default nextConfig;
