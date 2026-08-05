# Pickly

A mobile-web app where Mongolian creators publish a single page showing what they
actually use, listen to, watch, and read — and what they recommend. Music, film,
and book sections keep themselves fresh by syncing from connected accounts.

Next.js 15 (App Router) · TypeScript · Tailwind v4 · Supabase (Postgres + Auth) ·
Drizzle · deploys to Vercel. **Mobile web only** — the canvas is capped at 480px
and centered on a treated backdrop.

---

## Quick start (zero keys)

The public profile renders a complete, real page with **no configuration at all**,
against built-in fixtures.

```bash
pnpm install
pnpm dev
# open http://localhost:3000/sarnai
```

That is the whole product surface a viewer sees. Everything below lights up the
authenticated dashboard and the auto-syncing sections.

---

## Full setup (dashboard + features)

Every feature degrades gracefully: a provider whose env vars are absent hides its
UI; it never shows a broken state to a viewer. Copy the env template and fill in
what you have.

```bash
cp .env.example .env
```

### 1. Supabase (required for auth, dashboard, all DB reads/writes)

1. Create a project at [supabase.com](https://supabase.com).
2. From **Project settings → API**, copy:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only — never exposed to the client)
3. From **Project settings → Database**, copy the connection string into
   `DATABASE_URL` (use the **session pooler** URL for serverless).
4. Create a public Storage bucket named **`pick-images`** (Storage → New bucket →
   Public). Re-hosted product images land here.

Run migrations (creates tables, then applies RLS policies):

```bash
pnpm db:migrate
```

> Migrations target a **Supabase** Postgres — the RLS policies reference
> Supabase's `auth.uid()`. `auth.users` is managed by Supabase; our migration
> does not create or alter it.

Seed two demo creators (`@sarnai`, `@tuguldur`) with realistic content, including
a few Ask messages in every state:

```bash
pnpm db:seed
```

### 2. Encryption key (required to connect Spotify)

Provider refresh tokens are stored AES-256-GCM encrypted. Generate a 32-byte key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Put it in `ENCRYPTION_KEY`.

### 3. Spotify (optional — the connect button hides when absent)

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   → **Create app**.
2. Set a **Redirect URI**. For local dev, Spotify requires a loopback IP, not
   `localhost`:
   ```
   http://127.0.0.1:3000/api/auth/spotify/callback
   ```
   Add your production URL too (`https://yourdomain/api/auth/spotify/callback`).
3. Copy the Client ID / Secret into `.env`:
   ```
   SPOTIFY_CLIENT_ID=...
   SPOTIFY_CLIENT_SECRET=...
   SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/auth/spotify/callback
   ```
4. Run the app at **`http://127.0.0.1:3000`** (not `localhost`) so the redirect
   URI matches exactly, then connect from the dashboard's Listening section.

**Scopes:** `user-top-read`, `user-read-recently-played`.

> A new Spotify app starts in **Development Mode**, capped at 25 users you add by
> hand under *Users and Access*. Public use needs a **quota extension** request to
> Spotify. Spotify's Developer Policy also has attribution/caching rules for
> displaying content publicly — review before a public launch.

### 4. TMDB (optional — film poster/year search)

Get a v3 API key from [TMDB](https://www.themoviedb.org/settings/api) and set
`TMDB_API_KEY`. Without it, film search is disabled but manual entry and
Letterboxd sync still work. Book search (Open Library) needs no key.

### 5. Cron secret + Ask salt

```bash
# Both like the encryption key:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- `CRON_SECRET` — protects `/api/cron/sync`.
- `ASK_DAILY_SALT` — salts the asker IP hash. **Rotate it daily** (a scheduled
  redeploy or a cron that updates the env var). Rotation is what keeps stored
  hashes usable for rate-limiting but useless for identifying a person.

---

## Syncing

One worker, one adapter per provider (`src/lib/sync/*`), one normalized output
table (`activity_item`). Adding a provider later means writing one adapter file —
the profile page never changes.

- **Automatic:** `vercel.json` runs `/api/cron/sync` every 6 hours. Vercel Cron
  sends `CRON_SECRET` as a Bearer token.
- **Manually, via HTTP:**
  ```bash
  curl "http://127.0.0.1:3000/api/cron/sync?secret=$CRON_SECRET"
  ```
- **Manually, from the CLI** (same code path, all connections):
  ```bash
  pnpm sync:manual
  ```
- **Per-connection:** the dashboard's "Одоо шинэчлэх" (sync now) button.

### Connection health

Every sync updates the connection's `status`, `error_count`, and `last_error`:

- **Spotify 401** → refresh the access token. If the refresh is rejected (password
  change / app revoked), status becomes **`revoked`**.
- **Letterboxd 404** (bad/private username) → status **`error`** with a readable
  message.
- A **non-active** connection has its section **hidden entirely** on the public
  page, and shows a reconnect banner in the dashboard. A frozen widget serving
  last month's data as if it were live is the failure this prevents — the page
  never lies about being fresh.

---

## Security model (RLS + server-derived ownership)

RLS is **enabled on every table** (`src/db/rls.sql`, applied by `db:migrate`).

- **Public reads** go through a restricted `anon` policy exposing only
  published/non-hidden rows (active picks, public+answered Ask messages, activity
  from active connections). This makes the public anon key safe to ship.
- **Creator writes** run in server actions that derive the creator's `profile.id`
  from the authenticated Supabase session (`auth.uid()`) and scope every query by
  it — client-supplied `profile_id` is never trusted. RLS is the DB-level backstop
  behind that.
- Provider **refresh tokens** are AES-256-GCM encrypted at rest and never sent to
  the client; all provider API calls are server-side.

---

## Ask — anonymous questions (safety notes)

An NGL-style inbox where anyone can send a creator a question with no account. The
guardrails are treated as first-class, because anonymous inboxes are a known
harassment vector:

- **Rate limits** per salted IP hash per creator (5/hour, 15/day). Over-limit,
  blocked, and filtered messages all return the **same success** shape — a spammer
  can't probe the limits, and there's no signal to weaponize.
- **Length bounds:** empty and >500 chars are rejected.
- **Wordlist filter** (Mongolian Cyrillic + English) routes matches to
  `status='hidden'` — never deleted, never notified. The creator opens a filtered
  folder deliberately. **The starter wordlist in `src/lib/ask/wordlist.ts` is
  intentionally small and MUST be expanded and reviewed (ideally with a native
  Mongolian speaker) before public launch.**
- **Block** by coarse fingerprint → silent-success drop of future messages.
- **No asker notifications of any kind.** The channel is one-directional by design;
  there is no back-channel to an anonymous asker.
- **Creator can disable Ask entirely**, and it disappears from the public page
  immediately (`/[handle]/ask` returns 404).
- Only a **salted IP hash** is stored (rotating daily salt) — enough to
  rate-limit, not enough to identify a person. Raw IP is never stored.

### Minors — policy decision to confirm before launch

The schema carries `profile.is_minor`. The intended policy is: **default
`ask_enabled` to off for any account flagged under 18 and require explicit
opt-in.** Age is not collected at onboarding in this build, so `is_minor` defaults
false. **Confirm the age-gating policy (and how age is determined) before enabling
Ask publicly.**

---

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` | Production build |
| `pnpm db:generate` | Generate a Drizzle migration from schema changes |
| `pnpm db:migrate` | Apply migrations + RLS policies |
| `pnpm db:seed` | Seed two demo creators |
| `pnpm db:studio` | Drizzle Studio |
| `pnpm sync:manual` | Run the sync worker once against all connections |
| `pnpm typecheck` | `tsc --noEmit` |

See `DESIGN.md` for the token plan (palette, type, layout, signature element).
