"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * 30s song previews, backed by ONE <audio> element for the whole page.
 *
 * A profile can list a dozen songs and every card wants a play button. With an
 * element per card, tapping a second card layers it over the first; with one
 * shared element, starting a preview stops whatever was playing, which is the
 * only behaviour that makes sense for a page you scroll through.
 *
 * The element is created lazily on first play — never during render, and never
 * on the server, so importing this from a component that also renders on the
 * server is safe.
 */

let element: HTMLAudioElement | null = null;
let currentSrc: string | null = null;
const listeners = new Set<() => void>();

function emit(next: string | null) {
  currentSrc = next;
  for (const notify of listeners) notify();
}

function audio(): HTMLAudioElement {
  if (!element) {
    element = new Audio();
    element.preload = "none";
    // `ended` and `error` are the only two events that clear state. `pause` is
    // deliberately not one: swapping src to start a different track fires it,
    // and reacting would blank out the preview that just started.
    element.addEventListener("ended", () => emit(null));
    element.addEventListener("error", () => emit(null));
  }
  return element;
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  return () => {
    listeners.delete(notify);
  };
}

/**
 * `playing` is the preview URL currently sounding (null when silent), so a
 * card compares it against its own URL to decide whether to show play or stop.
 */
export function usePreviewAudio() {
  const playing = useSyncExternalStore(
    subscribe,
    () => currentSrc,
    () => null,
  );

  const toggle = useCallback((src: string) => {
    const el = audio();
    if (currentSrc === src) {
      el.pause();
      el.currentTime = 0;
      emit(null);
      return;
    }
    el.src = src;
    emit(src);
    // Autoplay policy rejects only when there was no user gesture; this always
    // runs from a click, but a network failure lands here too.
    void el.play().catch(() => {
      if (currentSrc === src) emit(null);
    });
  }, []);

  return { playing, toggle };
}
