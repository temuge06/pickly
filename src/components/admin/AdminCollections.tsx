"use client";

import { useState, useTransition } from "react";
import {
  adminCreateCollection,
  adminDeleteCollection,
  adminRenameCollection,
} from "@/lib/actions/admin";
import { MAX_COLLECTIONS } from "@/lib/validation";
import { AButton, AError, AInput, ASpinner } from "./ui";

type Collection = { id: string; title: string };

/**
 * Collection management, staff-side. This exists because creators lost the
 * ability to make their own: without it, a creator with zero collections could
 * never receive a My Picks product, since Panel A requires an existing one.
 */
export function AdminCollections({
  profileId,
  collections,
}: {
  profileId: string;
  collections: Collection[];
}) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const full = collections.length >= MAX_COLLECTIONS;

  function run(fn: () => Promise<void>) {
    setError(null);
    start(async () => {
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Алдаа гарлаа.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2.5">
      {collections.map((c) => (
        <Row
          key={c.id}
          collection={c}
          disabled={pending}
          onRename={(t) => run(() => adminRenameCollection(c.id, t))}
          onDelete={() => run(() => adminDeleteCollection(c.id))}
        />
      ))}

      {full ? (
        <p className="font-inter text-[12px] text-white/35">
          Хамгийн ихдээ {MAX_COLLECTIONS} цуглуулга — My Picks хэсэг гурван
          хайрцаг харуулна.
        </p>
      ) : (
        <div className="flex gap-2">
          <AInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Шинэ цуглуулга…"
            aria-label="Шинэ цуглуулгын нэр"
          />
          <AButton
            disabled={!title.trim() || pending}
            onClick={() =>
              run(async () => {
                await adminCreateCollection(profileId, title);
                setTitle("");
              })
            }
          >
            Нэмэх
          </AButton>
        </div>
      )}

      {pending ? <ASpinner className="h-4 w-4 text-[#fe7f42]" /> : null}
      {error ? <AError>{error}</AError> : null}
    </div>
  );
}

function Row({
  collection,
  disabled,
  onRename,
  onDelete,
}: {
  collection: Collection;
  disabled: boolean;
  onRename: (title: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(collection.title);

  if (editing) {
    return (
      <div className="flex gap-2">
        <AInput
          value={draft}
          autoFocus
          onChange={(e) => setDraft(e.target.value)}
          aria-label="Цуглуулгын нэр"
        />
        <AButton
          disabled={!draft.trim() || disabled}
          onClick={() => {
            onRename(draft);
            setEditing(false);
          }}
        >
          Хадгалах
        </AButton>
        <AButton
          variant="ghost"
          onClick={() => {
            setDraft(collection.title);
            setEditing(false);
          }}
        >
          Болих
        </AButton>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-[12px] border border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5">
      <span className="min-w-0 flex-1 truncate font-inter text-[14px] text-white/85">
        {collection.title}
      </span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setEditing(true)}
        className="shrink-0 rounded-[8px] px-2 py-1 font-malt text-[12px] font-bold text-white/45 transition-colors hover:text-white/80 disabled:opacity-40"
      >
        Нэр солих
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onDelete}
        className="shrink-0 rounded-[8px] px-2 py-1 font-malt text-[12px] font-bold text-[#ffb3a3] transition-colors hover:text-[#ff8a75] disabled:opacity-40"
      >
        Устгах
      </button>
    </div>
  );
}
