import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pins the workspace root to this project — a stray lockfile in a parent
  // directory otherwise makes Next.js guess (and warn) about the wrong root.
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    serverActions: {
      // Avatar and campaign-banner uploads post the raw file to a Server
      // Action. Next.js caps Server Action bodies at 1 MB by default, which is
      // below what the actions themselves accept (8 MB, enforced in
      // src/lib/actions/avatar.ts), so every ordinary phone photo was rejected
      // with a 413 before the action body ran — the upload appeared to hang
      // rather than fail, because the framework rejected the request rather
      // than the code returning an error.
      //
      // 10mb, not 8mb: multipart FormData adds encoding overhead on top of the
      // file itself, so a limit set exactly at the file cap still rejects a
      // file that is legally at the cap.
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.mzstatic.com" }, // iTunes / Apple Music artwork
      // Album art on songs added before the iTunes switch. The rows survived
      // the migration, so their covers still have to load.
      { protocol: "https", hostname: "i.scdn.co" },
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
