"use client";

import { useEffect, useMemo, useState } from "react";
import { localForUser, mergeDraftSummaries, type DraftSummary, type OutboxOp } from "@/lib/offline";

// Draft row carries the factory code when the server read has one. It is the
// only real identifier this channel holds for a draft — `visits` has no
// reference/code column, so the design's `d.ref` has no governed source and is
// rendered as the factory code alone, or not at all.
export type ServerFieldDraft = DraftSummary & { factoryCode?: string | null };

// Per-inspection facts derived from the REAL offline stores — never estimated:
//   items   = getDrafts(inspectionId).length  (drafts store, keyed `${id}:${item}`)
//   pending = the outbox holds at least one op for this inspection
type DraftMeta = { items: number; pending: boolean };

export default function FieldDraftList({
  userId, serverDrafts, resumeLabel, localLabel, emptyLabel, cardClassName, strings,
}: {
  userId: string;
  serverDrafts: ServerFieldDraft[];
  resumeLabel: string;
  localLabel: string;
  emptyLabel?: string;
  cardClassName?: string;
  strings: { storeKey: string; itemsQueued: string; syncPending: string; syncLocal: string };
}) {
  const local = useMemo(() => localForUser(userId), [userId]);
  // Server drafts render immediately — local (IndexedDB) drafts are a
  // client-only enhancement layered in once ready. Gating the whole list on
  // the IndexedDB read resolving left the page permanently blank whenever
  // that read stalled or never settled, even with server data already in hand.
  const [localIds, setLocalIds] = useState<string[]>([]);
  // null = the offline stores have not been read yet. Until they have, the
  // per-row sync badge and queued-items line render NOTHING rather than a
  // guessed state.
  const [meta, setMeta] = useState<Record<string, DraftMeta> | null>(null);

  const serverKey = serverDrafts.map(d => d.inspectionId).join(",");

  useEffect(() => {
    let alive = true;
    void (async () => {
      let ids: string[] = [];
      try { ids = await local.draftInspectionIds(); } catch { ids = []; }
      if (!alive) return;
      setLocalIds(ids);

      let ops: OutboxOp[] = [];
      try { ops = await local.peekAll(); } catch { ops = []; }
      const queued = new Set(
        ops
          .map(op => ("inspection_id" in op ? op.inspection_id : null))
          .filter((id): id is string => !!id),
      );

      const merged = [...new Set([...serverKey.split(",").filter(Boolean), ...ids])];
      const next: Record<string, DraftMeta> = {};
      for (const id of merged) {
        let items = 0;
        try { items = (await local.getDrafts(id)).length; } catch { items = 0; }
        next[id] = { items, pending: queued.has(id) };
      }
      if (alive) setMeta(next);
    })();
    return () => { alive = false; };
  }, [local, serverKey]);

  const drafts = useMemo(() => {
    return mergeDraftSummaries(localIds, serverDrafts, localLabel);
  }, [serverDrafts, localIds, localLabel]);

  const codeFor = useMemo(() => {
    const byInspection = new Map(serverDrafts.map(d => [d.inspectionId, d.factoryCode ?? null]));
    return (inspectionId: string) => byInspection.get(inspectionId) ?? null;
  }, [serverDrafts]);

  // Card geometry ported from SAQEEL PWA-Field Drafts.dc.html (.dr-card). The
  // container class comes from the route's CSS module; contents are styled
  // inline from DS tokens, exactly as the design does. Only presentation
  // changed — the offline merge and the resume target are untouched.
  if (!drafts.length) return emptyLabel ? <span className="t-caption">{emptyLabel}</span> : null;
  return (
    <>
      {drafts.map(draft => {
        const m = meta?.[draft.inspectionId] ?? null;
        const code = codeFor(draft.inspectionId);
        return (
          <a
            key={`draft-${draft.inspectionId}`}
            href={`/field/inspection/${draft.inspectionId}`}
            className={cardClassName}
            aria-label={`${resumeLabel}: ${draft.factoryName}`}
          >
            <span
              aria-hidden="true"
              style={{
                width: 38, height: 38, borderRadius: 10, flex: "none",
                background: "var(--status-warning-soft)", color: "var(--status-warning-text)",
                display: "grid", placeItems: "center",
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 18, height: 18 }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6M9 13h6M9 17h4" />
              </svg>
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 14, minWidth: 0, overflowWrap: "anywhere" }}>
                  <bdi>{draft.factoryName}</bdi>
                </span>
                <span className="grow" />
                {m ? (
                  <span className={`badge ${m.pending ? "badge-warning" : "badge-outline"}`} style={{ height: 18, flex: "none" }}>
                    {m.pending ? strings.syncPending : strings.syncLocal}
                  </span>
                ) : null}
              </div>
              {/* No visit reference exists in the schema and the drafts store
                  holds no edit timestamp or item total — so the design's ref,
                  report kind, last-edited and progress lines render nothing
                  rather than a fabricated value. */}
              {code ? <div className="t-caption id-code" style={{ marginBlockStart: 2 }}>{code}</div> : null}
              {m && m.items > 0 ? (
                <div className="t-caption id-code" style={{ marginBlockStart: 2, opacity: 0.75 }}>
                  {strings.storeKey}: {draft.inspectionId}:* · {m.items} {strings.itemsQueued}
                </div>
              ) : null}
            </div>
          </a>
        );
      })}
    </>
  );
}
