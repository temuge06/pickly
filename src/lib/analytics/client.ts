"use client";

import {
  MAX_EVENTS_PER_BATCH,
  type AnalyticsEvent,
  type AnalyticsEventType,
  type AnalyticsMetadata,
} from "./events";

/**
 * The browser half of profile analytics: a queue that drains to /api/analytics
 * in batches, so a visitor who taps five links produces one request, not five.
 *
 * Module state rather than React state on purpose. The queue outlives any one
 * component — PromoCard logs into it from deep in the tree, and the final
 * flush runs from a `pagehide` listener after React has already stopped
 * caring — so the only thing a component does is call `startTracking` once.
 *
 * Delivery is `navigator.sendBeacon`, which the browser keeps alive after the
 * page is gone; `fetch` with `keepalive` is the fallback for the (now rare)
 * browsers without it. Nothing here awaits a response and nothing retries: a
 * lost event is a rounding error, whereas a retry loop on a closing tab is a
 * hang.
 */

const ENDPOINT = "/api/analytics";
const SESSION_KEY = "linkspot_vid";
/** How long early events wait for company before the first flush. */
const FLUSH_DELAY_MS = 2000;

let creatorId: string | null = null;
let queue: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let visibleSince: number | null = null;

/**
 * A random id this browser keeps, so "distinct viewers" means something and a
 * ticket can be "used" once per person. Same shape and the same deliberate
 * weakness as the Ask fingerprint: anyone can clear it, and that is fine —
 * it is a counter, not a security boundary. Regenerated per page load when
 * storage is unavailable (private mode), which merely over-counts viewers.
 */
function sessionId(): string {
  try {
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, fresh);
    return fresh;
  } catch {
    return crypto.randomUUID();
  }
}

function send(events: AnalyticsEvent[]) {
  if (!creatorId || events.length === 0) return;
  const body = JSON.stringify({ creatorId, sessionId: sessionId(), events });
  try {
    // A Blob typed as JSON so the route can parse it like any other POST;
    // same-origin, so no preflight is involved.
    if (navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: "application/json" }))) {
      return;
    }
  } catch {
    /* fall through to fetch */
  }
  try {
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    /* offline, or the tab is already gone — nothing sensible to do */
  }
}

function flush() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  // Slice into route-sized batches; in practice one, but a long-lived tab with
  // a lot of clicks should never produce a request the server will refuse.
  while (queue.length > 0) {
    send(queue.splice(0, MAX_EVENTS_PER_BATCH));
  }
}

function scheduleFlush() {
  if (queue.length >= MAX_EVENTS_PER_BATCH) {
    flush();
    return;
  }
  if (!flushTimer) flushTimer = setTimeout(flush, FLUSH_DELAY_MS);
}

/** Queue one event. A no-op until startTracking has named the creator. */
export function track(type: AnalyticsEventType, metadata: AnalyticsMetadata = {}) {
  if (!creatorId) return;
  queue.push({ type, metadata });
  scheduleFlush();
}

/**
 * Time-on-page, as the sum of visible stretches. Each time the tab is hidden
 * the seconds since it became visible go out as one session_duration event —
 * so switching tabs and coming back yields two rows whose sum is the truth,
 * rather than one row that has to be updated in place after the fact.
 */
function closeStretch() {
  if (visibleSince === null) return;
  const seconds = Math.round((Date.now() - visibleSince) / 1000);
  visibleSince = null;
  if (seconds >= 1) track("session_duration", { seconds });
}

/** The visitor is gone, or at least not looking: bank the stretch and send. */
function onHidden() {
  closeStretch();
  flush();
}

function onVisibilityChange() {
  if (document.visibilityState === "hidden") onHidden();
  else visibleSince = Date.now();
}

/**
 * Wire the page up: log the view, start the clock, and arrange for the queue
 * to drain when the visitor leaves. Returns a teardown for React's cleanup.
 *
 * The teardown deliberately leaves `creatorId` set. StrictMode mounts, tears
 * down and mounts again in development; the second mount then finds the same
 * creator, re-arms the listeners and restarts the clock, but does not count a
 * second view. A different creator (client-side navigation between profiles)
 * is a fresh start — the previous one's queue was already flushed on the way
 * out.
 */
export function startTracking(id: string): () => void {
  const fresh = creatorId !== id;
  creatorId = id;
  if (fresh) {
    queue = [];
    track("profile_view");
  }
  if (document.visibilityState === "visible") visibleSince = Date.now();

  document.addEventListener("visibilitychange", onVisibilityChange);
  // pagehide is unconditional: on a same-tab navigation Chromium does not
  // reliably flip visibilityState to "hidden" first, so asking it would drop
  // the final stretch. When both fire, the second finds nothing to send.
  window.addEventListener("pagehide", onHidden);

  return () => {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pagehide", onHidden);
    onHidden();
  };
}
