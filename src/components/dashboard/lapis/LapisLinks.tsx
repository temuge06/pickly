"use client";

import { useState, useTransition } from "react";
import { socialGlyph } from "@/components/social-icons";
import { createLink, deleteLink, reorderLinks } from "@/lib/actions/links";
import { detectLinkIcon, hostOf, suggestLinkLabel } from "@/lib/socials";
import {
  LButton,
  LInput,
  LLabel,
  LSection,
  Empty,
  ReorderButtons,
  Well,
  moveItem,
} from "./ui";

type Link = { id: string; label: string; url: string; icon?: string | null };

/**
 * Quick Links editor, Linktree-style.
 *
 * The old form was two unlabelled inputs and a button, always open, with the
 * title asked for BEFORE the URL — which is backwards: the URL is the thing
 * the creator has on their clipboard, and it already implies both the icon and
 * a reasonable title. So: paste first, watch the platform get recognised, and
 * accept or edit the title that gets filled in.
 *
 * Links show on the public profile as the Quick Links shelf, so order matters
 * — hence the up/down controls on each row.
 *
 * `embedded` drops the section chrome so the same editor can sit inside the
 * Профайл card, directly under the social rows, which is where the design
 * review asked for "нэмэлт холбоосууд" (e.g. a "My daily life vlog" YouTube
 * link). Every control is type="button", so living inside the profile <form>
 * submits nothing of its own.
 */
export function LapisLinks({
  links,
  embedded = false,
}: {
  links: Link[];
  embedded?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [labelTouched, setLabelTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const icon = url.trim() ? detectLinkIcon(url) : "link";
  const host = hostOf(url);

  function onUrlChange(next: string) {
    setUrl(next);
    setError(null);
    // Auto-title, until the creator types their own. Re-deriving it after they
    // have edited the field would throw their wording away on the next
    // keystroke in the URL box.
    if (!labelTouched) setLabel(next.trim() ? suggestLinkLabel(next) : "");
  }

  function reset() {
    setUrl("");
    setLabel("");
    setLabelTouched(false);
    setError(null);
    setOpen(false);
  }

  function submit() {
    if (!url.trim() || !label.trim()) return;
    start(async () => {
      try {
        await createLink(label, url);
        reset();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Нэмж чадсангүй.");
      }
    });
  }

  function move(index: number, to: number) {
    const next = moveItem(links, index, to);
    if (next === links) return;
    start(async () => void (await reorderLinks(next.map((l) => l.id))));
  }

  const addButton =
    links.length > 0 && !open ? (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-malt text-[12px] font-bold text-[var(--t-accent)]"
      >
        + Нэмэх
      </button>
    ) : null;

  const body = (
    <>
      {open || links.length === 0 ? (
        open ? (
          <Well className="animate-pop flex flex-col gap-3 p-3">
            <div>
              <LLabel htmlFor="link-url">Холбоос</LLabel>
              <div className="flex items-center gap-2 rounded-[14px] bg-[var(--t-field)] px-2.5 py-2 ring-1 ring-inset ring-[var(--t-ring)] focus-within:ring-2 focus-within:ring-[var(--t-accent)]">
                {/* The glyph switches as soon as the host is recognisable —
                    that is the whole confirmation that the paste landed. */}
                <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[var(--t-accent)] text-[var(--t-on-accent)] transition-colors">
                  {socialGlyph(icon, 15)}
                </span>
                <input
                  id="link-url"
                  type="url"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  value={url}
                  onChange={(e) => onUrlChange(e.target.value)}
                  placeholder="youtube.com/@myChannel"
                  className="min-w-0 flex-1 bg-transparent font-malt text-[16px] text-[var(--t-text)] outline-none placeholder:text-[var(--t-muted)] placeholder:opacity-55"
                />
              </div>
              {host ? (
                <p className="mt-1.5 px-1 font-malt text-[11.5px] text-[var(--t-muted)]">
                  {host}
                </p>
              ) : null}
            </div>

            <div>
              <LLabel htmlFor="link-label">Нэр</LLabel>
              <LInput
                id="link-label"
                value={label}
                onChange={(e) => {
                  setLabel(e.target.value);
                  setLabelTouched(true);
                }}
                maxLength={40}
                placeholder="Жишээ: My daily life vlog"
              />
            </div>

            {error ? (
              <p className="px-1 font-malt text-[12.5px] text-[var(--t-danger)]">{error}</p>
            ) : null}

            <div className="flex gap-2">
              <LButton
                variant="ghost"
                type="button"
                disabled={pending}
                onClick={reset}
                className="flex-1"
              >
                Болих
              </LButton>
              <LButton
                type="button"
                loading={pending}
                disabled={!url.trim() || !label.trim()}
                onClick={submit}
                className="flex-[2]"
              >
                {pending ? "" : "Хадгалах"}
              </LButton>
            </div>
          </Well>
        ) : (
          <>
            <Empty>
              YouTube, TikTok, newsletter — профайл дээрээ харагдах холбоосоо
              нэмээрэй. Жишээ нь: “My daily life vlog”.
            </Empty>
            <LButton type="button" onClick={() => setOpen(true)}>
              + Холбоос нэмэх
            </LButton>
          </>
        )
      ) : null}

      {links.map((l, i) => (
        <div
          key={l.id}
          className="flex items-center gap-2.5 rounded-[14px] bg-[var(--t-well)] px-3 py-2.5"
        >
          <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[var(--t-accent)] text-[var(--t-on-accent)]">
            {socialGlyph(l.icon ?? detectLinkIcon(l.url), 16)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-malt text-[14px] font-bold text-[var(--t-text)]">
              {l.label}
            </p>
            <p className="truncate font-malt text-[11px] text-[var(--t-muted)]">
              {hostOf(l.url) ?? l.url}
            </p>
          </div>
          <ReorderButtons
            index={i}
            count={links.length}
            disabled={pending}
            onMove={(to) => move(i, to)}
          />
          <button
            type="button"
            disabled={pending}
            aria-label={`${l.label} устгах`}
            onClick={() => start(async () => void (await deleteLink(l.id)))}
            className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full text-[var(--t-danger)] transition-colors active:bg-[var(--t-field)]"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      ))}
    </>
  );

  if (embedded) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <LLabel>Нэмэлт холбоосууд</LLabel>
          {/* The label carries its own bottom margin, so the action next to it
              needs the same nudge to sit on the baseline rather than below it. */}
          <span className="mb-1.5">{addButton}</span>
        </div>
        <div className="flex flex-col gap-2.5">{body}</div>
      </div>
    );
  }

  return (
    <LSection icon="🔗" title="Нэмэлт холбоосууд" action={addButton}>
      {body}
    </LSection>
  );
}
