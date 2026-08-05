# Pickly — make the features work

## Where we are

The public profile at `/[handle]` renders end to end against fixtures: shelf design, collections,
Listening / Watching / Reading / Links sections, status chips. Schema already exists (profile,
connection, activity_item, collection, pick, link).

Everything is currently static. This phase makes it real: a creator can sign in, build their page,
paste product links, connect Spotify, add films and books, and receive anonymous questions.

Same stack, same rules as the v1 prompt: Next.js 15 App Router, TypeScript, Tailwind v4, Supabase
(Postgres + Auth), Drizzle, Vercel. Mobile web only, ≤480px canvas. No component library.

**Every feature must degrade gracefully.** The app already runs with zero API keys against seed
data — keep it that way. A section with no provider configured hides itself; it never shows a
broken state to a viewer.

---

## Build in this order. Show me the schema changes and the auth flow before building UI.

1. Auth + dashboard shell
2. Add-a-pick with URL extraction
3. Spotify connect + sync
4. Letterboxd / films + books
5. Ask (anonymous questions) — new feature, spec below
6. Polish: loading, empty, error, revoked-connection states

---

## 1. Auth + dashboard shell

- Supabase Auth, email magic link. On first sign-in, if the user has no `profile`, route to a
  one-screen onboarding: handle (validate unique, citext, lowercase, `[a-z0-9_]` only),
  display name, avatar. Everything else editable later.
- `/dashboard` — authenticated, mobile-first, same 480px canvas discipline as the public page.
- Dashboard is section-based, mirroring the profile: Picks, Listening, Watching, Reading, Links,
  Ask. Each section is a manager for that content.
- Route protection via middleware. Unauthed hitting `/dashboard` → sign-in. Signed-in user only
  ever edits their own profile — enforce with Supabase RLS, not just UI guards.
- **RLS is mandatory on every table.** A creator can read/write only rows where
  `profile_id` maps to their `auth.uid()`. Public profile reads go through a
  restricted anon policy exposing only published, non-hidden rows. Do not ship with RLS off
  "to fix later" — retrofitting it is how data leaks.

---

## 2. Add-a-pick with URL extraction

The core creator action. Target: paste URL → live pick in under 10 seconds.

Flow:
1. Creator pastes any product URL into a single input.
2. Server-side extractor (never client — CORS and bot-blocking make client fetch useless) runs:
   a. Canonicalise: strip `utm_*`, `fbclid`, `gclid`, session params; follow redirects/shorteners.
   b. Fetch HTML with a realistic User-Agent and a timeout (~8s).
   c. Parse in priority order and stop at first confident hit:
      - Every `<script type="application/ld+json">` block → look for `schema.org` Product/Offer
        (name, image, offers.price, offers.priceCurrency, brand). Parse ALL blocks, not just the
        first — many pages put Product in the second or third.
      - Open Graph: `og:title`, `og:image`, `product:price:amount`, `product:price:currency`.
      - Twitter Card and bare `<title>` / first large `<img>` as last resort.
   d. Return whatever was found + a confidence flag.
3. Show the creator a pre-filled form: image, title, brand, price (MNT). They confirm or correct.
   **Never block on extraction.** If it fails entirely, show the empty form with the URL kept and
   let them fill it manually. A failed extract must still end in a pick.

Rules:
- Price stored as `price_mnt bigint`. If the source currency isn't MNT, keep the raw amount +
  currency in `pick.meta` and show it as-is; do not auto-convert (rates go stale and mislead).
- Store both `source_url` (what they pasted) and `outbound_url` (where taps go — same for now;
  this seam is where link-wrapping lands later, so keep them separate columns).
- Image: download and re-host to Supabase Storage, don't hotlink. Hotlinked product images rot and
  many CDNs block cross-origin. Re-host, convert to WebP, store dimensions for the blur placeholder.
- Let the creator set status (`testing` / `recommend` / `repurchased` / `wont_rebuy`), a one-line
  note, and assign to a collection, all from the same add screen.

---

## 3. Spotify connect + sync

Build the full OAuth flow now, keyed on env vars. If `SPOTIFY_CLIENT_ID` is absent, the connect
button is hidden and the Listening section falls back to seed/manual — no errors.

- OAuth 2.0 Authorization Code flow. Scopes: `user-top-read`, `user-read-recently-played`.
- Store `refresh_token` **encrypted** (AES-256-GCM, key from `ENCRYPTION_KEY`). Access tokens are
  short-lived; never send either to the client. All Spotify calls are server-side.
- Callback route creates/updates a `connection` row (provider `spotify`, status `active`).
- Sync writes `activity_item` rows:
  - `GET /v1/me/top/tracks?time_range=short_term&limit=10` → kind `track`, subtitle = artist,
    image = album art, `occurred_at` = sync time (top-tracks has no timestamp).
  - `GET /v1/me/player/recently-played?limit=20` → kind `track`, `occurred_at` = `played_at`.
  - Dedupe on the `(profile_id, provider, kind, external_id, occurred_at)` unique constraint.
- **Token health — required, not optional.** On 401, attempt refresh. If refresh fails
  (creator changed password / revoked app), set `connection.status = 'revoked'`, increment
  `error_count`, store `last_error`. A revoked connection hides its section on the public page and
  shows a reconnect banner in the dashboard. A frozen widget silently serving last month's data as
  if it were live is the failure mode to prevent — it makes the page lie.
- Disconnect: delete tokens, set status `revoked`, keep the `activity_item` history or clear it —
  give the creator the choice in the UI.

Sync trigger: `/api/cron/sync` route behind `CRON_SECRET`, plus a `vercel.json` cron every 6h.
Also expose a manual "sync now" button in the dashboard that calls the same code for one connection.

Check Spotify's developer policy on displaying content publicly before shipping — there are
attribution and caching rules. Note in README that a new Spotify app is in Development Mode (capped
at 25 users) until a quota extension is granted.

---

## 4. Films + books

**Films** — two paths into the same `activity_item` (kind `film`):
- Letterboxd: creator enters username → poll `https://letterboxd.com/{username}/rss/` (no API,
  RSS only). Each entry → title, year, rating, poster, watched date. Treat as a `connection`
  (provider `letterboxd`) with the same health/error handling. On 404, status `error` with a
  readable message. Poll on the same 6h cron.
- Manual: search TMDB (`/search/movie`) if `TMDB_API_KEY` is set, pick result, store poster + year.
  If no key, plain manual entry with optional image upload.

**Books** — manual only, no sync in v1 (Goodreads API is dead):
- Search Open Library (`https://openlibrary.org/search.json?q=` — no key). Store title, author,
  cover from `https://covers.openlibrary.org/b/id/{cover_i}-M.jpg`. Manual fallback if no match.

Both render as the existing portrait-poster shelves. Reuse the components already built.

---

## 5. Ask — anonymous questions (new feature)

An NGL-style inbox: anyone can send a creator a question without an account. The creator answers
from the dashboard, and can optionally publish the Q&A or turn a product question into a pick.

This is the highest-leverage feature in the app, because the most common question a Mongolian
creator gets — "хаанаас авсан бэ?" — is a product lead. Answering one is one tap to a new pick.
Wire that connection explicitly.

### Data

```
ask_message
  id, profile_id (fk), body text, status ('new'|'answered'|'hidden'|'reported'|'blocked'),
  answer_body text null, answer_pick_id uuid null (fk pick),
  is_public boolean default false,
  asker_ip_hash text,          -- sha256(ip + daily_salt), for rate-limit + abuse only
  asker_fingerprint text,      -- coarse client hash, for block/mute
  created_at, answered_at

ask_block
  id, profile_id, fingerprint, created_at   -- creator-muted askers

profile: add ask_enabled boolean default true, ask_prompt text null
  ("Асуух зүйл байна уу?" default)
```

### Public submit — `/[handle]/ask`

- Simple: the prompt, a textarea, a send button. No login, no name, nothing that collects asker
  identity. That's the whole appeal.
- On submit → `ask_message` row, status `new`. Show a friendly confirmation, clear the box, allow
  another. Never reveal whether/when it was answered from this surface.

### Creator inbox — dashboard `/dashboard/ask`

- List `new` first. Each message: answer inline, hide, block sender, or **turn into a pick**
  (opens the add-a-pick flow pre-seeded; on save, links `answer_pick_id` and marks answered).
- Toggle `is_public` per answered message. Public answered Q&As render in an Ask section on the
  profile — question text + answer, never anything about who asked.
- Master switch: `ask_enabled` on/off, editable prompt.

### Abuse controls — build these now, not later

Anonymous inboxes are a known harassment vector. NGL-style products have caused real harm,
especially to younger users, precisely because they shipped the inbox without the guardrails. The
guardrails ARE the feature here — treat them as first-class:

- **Rate limit** per `asker_ip_hash` per creator: e.g. max 5/hour, 15/day. Reject over-limit
  silently (return success, drop the message) so a spammer can't probe the limit.
- **Length bounds**: reject empty and anything over ~500 chars.
- **Wordlist filter** for slurs/explicit content in Mongolian Cyrillic AND English. Matches don't
  hard-delete — they land as `status='hidden'` so nothing surfaces to the creator unprompted, with
  a filtered folder they can open deliberately. Never push or notify on filtered content.
- **Block**: a blocked `asker_fingerprint` gets the same silent-success drop.
- **No asker notifications of any kind** — there's no identity to notify, and building a back-channel
  to an anonymous asker is exactly how these tools become harassment loops. One-directional only.
- **Creator can disable Ask entirely** and it disappears from their public page immediately.
- Store only the hashed IP with a rotating daily salt — enough for rate-limiting, not enough to
  identify a person. Never store raw IP.

If the signed-in creator is a minor, this feature is higher-risk. At minimum, default
`ask_enabled` to off for any account flagged as under 18 and require an explicit opt-in. Flag this
in the README as a policy decision to confirm before public launch.

---

## Env

Add to `.env.example` (all optional except the first three; features hide when their key is absent):

```
DATABASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ENCRYPTION_KEY=            # 32-byte hex
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REDIRECT_URI=
TMDB_API_KEY=
CRON_SECRET=
ASK_DAILY_SALT=           # rotated daily, for asker_ip_hash
```

---

## Deliverables

1. Working auth → onboarding → dashboard, RLS enforced on every table
2. Add-a-pick with server-side URL extraction + manual fallback + image re-hosting
3. Spotify OAuth connect/disconnect/sync with token-health handling
4. Letterboxd sync, TMDB film search, Open Library book search
5. Anonymous Ask: public submit, creator inbox, question→pick, public Q&A, full abuse controls
6. Updated seed so the whole thing demos with zero keys, including a few Ask messages
7. README: Supabase setup, how to register the Spotify app + redirect URI locally, how to run the
   cron manually, and the Ask safety notes above

Start with the schema diff (Ask tables + the two profile columns) and the auth/onboarding flow.
Show me both before writing feature UI.