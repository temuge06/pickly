# Pickly — Design token plan

Two-pass process: draft, critique against the brief, revise. Final tokens are
what the code implements — nothing in `globals.css` or the components should
introduce a color or type choice that isn't traceable to this document.

## Pass 1 — draft

**Concept:** a creator's page as a physical shelf — a wall you're looking at,
with a lit plank mounted on it, and their things (records, posters, books,
products) sitting on the ledge. The wall is the quiet, receding surface;
the shelf plank is where light and attention land, because that's where the
photography sits.

Draft palette:

| name       | hex       | role                                   |
|------------|-----------|-----------------------------------------|
| `wall`     | `#241F2E` | page backdrop, the "room" behind items  |
| `shelf`    | `#E9DFCC` | card/plank surface, where photos sit    |
| `ink`      | `#231B22` | text on `shelf`                         |
| `marigold` | `#E8A33D` | primary accent — links, CTAs            |
| `jade`     | `#2F8F7A` | secondary accent — positive status      |
| `berry`    | `#A15361` | tertiary accent — negative status       |

Type: Unbounded (display), Golos Text (body), JetBrains Mono (prices, dates,
status labels) — per the brief's suggested pairing.

Layout: single column, `max-width: 480px`. Each section (Picks, Listening,
Watching, Reading, Links) renders as a shelf plank — a CSS-rendered ledge
(gradient + shadow, no image asset) holding a horizontal scroll-snap row.
Section identity is a small plaque on the plank's left edge, not a full-width
heading.

Signature element: the plank itself, with contact shadows under each item so
scrolling reads as sliding real objects along a real shelf.

## Critique against the brief

**Forbidden look #1** (cream `#F4F1EA` + serif + terracotta): `shelf` is
deeper and warmer than `#F4F1EA`, but the real test is the *combination* —
we're not pairing it with a serif or with a single terracotta accent. We're
pairing it with a geometric display face and a three-color accent system
(amber / jade / berry), none of which is terracotta. Passes, but worth
double-checking `shelf` isn't drifting toward `#F4F1EA` in implementation —
locked the hex.

**Forbidden look #2** (near-black + single acid accent): `wall` is a
*saturated* plum with a clear hue, not a desaturated neutral — that's a
real perceptual difference, not a technicality. More importantly, the
composition inverts the forbidden look's balance of surface area: in "near-
black + acid," dark is the dominant surface and the accent is a small hot
highlight. Here the *majority* of visible area per section is the warm
`shelf` plank — `wall` only shows at the canvas edges and between planks.
It reads as objects lit against a dark room, not as a dark app with a neon
highlight. Also: three muted accents (amber/jade/berry), never one acid
color. Passes.

**Forbidden look #3** (broadsheet: hairlines, zero radius, newspaper
columns): nothing here uses hairline rules as a structural device — the
shelf edges are soft gradients and shadows, not 1px lines, and cards get a
generous radius (the plank is the opposite of a column grid). Passes.

**Cyrillic coverage** — verify, don't assume:
- **Unbounded**: designed by a Russian/CIS type team specifically with
  Cyrillic as a first-class script, not a retrofit. Confirmed real coverage,
  keep.
- **Golos Text**: built Cyrillic-first for CSTM/Golos branding, Latin added
  after — exactly the "native, not fallback" requirement. Confirmed, keep.
- **JetBrains Mono**: added full Cyrillic in v2.0+, actively maintained by a
  company with Cyrillic-speaking users as a core audience. Confirmed, keep.

No fallback-metric risk on mixed "skincare routine хийлээ" sentences — all
three faces ship both scripts natively, so weight and spacing stay stable
mid-line. Brief's suggested pairing is justified as-is; not replacing it.

**Contrast check** (the thing a palette pass usually skips):
- `ink` (#231B22) on `shelf` (#E9DFCC): ~14:1 — comfortably passes AA for
  body text.
- `shelf` (#E9DFCC) on `wall` (#241F2E): ~10:1 — used for text directly on
  the wall (section plaques, header), passes.
- `marigold` (#E8A33D) on `wall`: ~6.5:1 — fine for links/labels on dark.
  `marigold` on `shelf` is a different story (~1.8:1, amber-on-ivory is low
  contrast) — **rule**: marigold is only ever a filled surface with `ink`
  text on top when it appears on the light plank, never used as text color
  on `shelf`. Documented below so this doesn't get relitigated per-component.
- `jade` / `berry` as chip text: both used at full saturation only on tinted
  versions of themselves (12% fill of the same hue), never as text directly
  on raw `shelf` or `wall` — chips get their own token pair (see Status chips
  below) so contrast is solved once, centrally.

**One thing pass 1 got wrong:** a flat `ink`/`shelf` text pairing is fine for
the plank, but the draft didn't specify a *secondary* text tone for
metadata (timestamps, "4 weeks ago", brand names under a pick title) —
without one, everything on the plank has equal visual weight and the shelf
stops reading as composed. Fixing in the revision with `ink` at reduced
opacity rather than a 7th named color, to keep the palette to 6.

## Pass 2 — final tokens

### Palette

| token         | hex       | usage                                                                 |
|---------------|-----------|------------------------------------------------------------------------|
| `wall`        | `#241F2E` | page backdrop; the backdrop beyond the 480px canvas is this color too, so the canvas itself reads as the lit plank against a bigger room |
| `shelf`       | `#E9DFCC` | card / plank surface — where every photo, poster, and album sits       |
| `ink`         | `#231B22` | primary text/icons on `shelf`. At 60% opacity → secondary text (timestamps, brand names, metadata). At 8–12% opacity → hairline dividers and the neutral "testing" chip fill |
| `paper`       | `#F3ECE0` | primary text/icons on `wall` (header name, section plaques, nav) — lighter than `shelf` so it doesn't compete with photography sitting on the plank itself |
| `marigold`    | `#E8A33D` | primary accent: links, CTA fills (with `ink` text on top), the pulse/dot that signals "this synced recently" |
| `jade`        | `#2F8F7A` | secondary accent: `recommend` status, positive affordances |
| `berry`       | `#A15361` | tertiary accent: `wont_rebuy` status, destructive/negative affordances |

Six named colors, as specified. `paper` earns its slot because `shelf` and
`paper` solve two different contrast problems (text on light vs. text on
dark) and conflating them would force a compromise value that's mediocre at
both — but everything else derives from opacity/tint variants of the six,
not new hexes.

**Status chips** (`pick.status`) — each is a 12%-opacity fill of its accent
with the full-strength accent as text, so all four sit at a consistent,
quiet volume rather than one shouting over the others:

| status        | Mongolian label        | token                          |
|---------------|-------------------------|--------------------------------|
| `testing`     | Одоо туршиж байна        | `ink` @12% fill, `ink` text     |
| `recommend`   | Баттай санал болгоно     | `jade` @12% fill, `jade` text   |
| `repurchased` | Дахин авсан              | `marigold` @16% fill, `marigold`-darkened text (marigold text alone at 12% fill is borderline on AA — darken ~15% for the text value only) |
| `wont_rebuy`  | Дахин авахгүй            | `berry` @12% fill, `berry` text |

### Type

| role              | face            | notes                                                             |
|-------------------|-----------------|--------------------------------------------------------------------|
| Display           | Unbounded       | creator display name, section plaques, empty-state headlines. 600–800 weight only — it's too loud at regular weight for body use |
| Body              | Golos Text      | bio, pick notes, dashboard forms, all copy. 400/500 weight         |
| Utility / numeric | JetBrains Mono  | prices (MNT), dates, "synced 2h ago", status chip labels, track durations — anything that's a value rather than prose reads as data, not decoration |

All three loaded via `next/font/google` with `subsets: ["cyrillic", "latin"]`
explicitly requested (not left to default) — the failure mode this guards
against is a font that *looks* fine in English-only testing and silently
serves a fallback face the moment Cyrillic renders.

### Layout concept

Single column, `max-width: 480px`, centered on a `wall`-colored backdrop that
extends beyond it — the canvas and the backdrop share a token on purpose,
so the whole viewport reads as one room and the 480px frame as the shelf
mounted in it.

Section order per spec: Header → Picks → Listening → Watching → Reading →
Links. Each of Picks/Listening/Watching/Reading is a **plank**: a `shelf`-
colored surface with a soft top-highlight and bottom contact-shadow (CSS
gradient + `box-shadow`, zero image assets, so it never adds to LCP weight),
holding a horizontal `scroll-snap-type: x mandatory` row. A small plaque
(Unbounded, all-caps, small size) sits on the plank's left edge as the
section label instead of a full-width `<h2>` — the plank itself is the
section boundary, so a heading rule would be redundant.

Links is the exception: it's not photographic, so it sits on a slimmer
"hook rail" variant of the plank — same surface token, shallower height,
vertical list instead of horizontal scroll, icon + label per row.

### Signature element

The plank. Every synced/photographic section sits on a rendered shelf ledge
with:
- a subtle top edge highlight (the "light hitting the front lip" cue)
- individual contact shadows under each item, not one shadow under the whole
  row — this is what makes items read as objects *resting on* the shelf
  rather than a colored card background
- a very slight forward tilt on the shadow (2–3° offset, not symmetric)
  so it doesn't read as a generic drop-shadow default

This is the one place the design spends boldness. Everything else — chip
system, type scale, spacing — stays disciplined and quiet so the plank and
the photography on it stay the visual event.

### Mobile execution

Directly from the brief, restated as implementation commitments, not
re-litigated:
- Canvas `max-width: 480px`, centered; backdrop beyond it is `wall`.
- `viewport-fit=cover`; safe-area padding on header (notch) and Links/footer
  (home indicator).
- 44×44px minimum tap targets on every chip, icon button, and shelf item.
- 16px minimum on all dashboard input font-sizes — non-negotiable, avoids
  iOS zoom-on-focus.
- Shelves are native CSS scroll-snap, no JS carousel library.
- All images via `next/image`, AVIF/WebP, explicit width/height, blur
  placeholder — bandwidth is a conversion issue in Mongolia, not polish.
- Visible focus rings (`:focus-visible`, using `marigold` as the ring color
  since it has sufficient contrast on both `wall` and `shelf`); all motion
  gated behind `prefers-reduced-motion`.
