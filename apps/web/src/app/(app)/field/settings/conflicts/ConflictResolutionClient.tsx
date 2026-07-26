"use client";

// SAQEEL Field Conflict Resolution — client surface over the REAL offline
// `conflicts` IndexedDB store (lib/offline.ts). Reads conflicts on the client
// only (SSR-safe, like FieldSyncChips), renders each record as a local-vs-server
// compare, and resolves through the existing store methods ONLY:
//   • list    → localForUser(userId).conflicts()
//   • discard → localForUser(userId).resolveConflict(key)   ("Keep server")
//   • re-apply→ localForUser(userId).enqueue({ kind:"response", ... })  ("Keep mine")
// "Keep mine" re-enqueues the local response through the same outbox the field
// workspace uses; baseline_updated_at is null so processOutbox() upserts it as
// the winner on next sync (never a direct server write from here). It never
// touches the Factory-360 cache and never fabricates conflicts or values.

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import FieldHeader from "@/components/field/FieldHeader";
import { localForUser, processOutbox, promptLegacyOfflineRestore, type Conflict, type OutboxOp } from "@/lib/offline";
import { supabaseBrowser } from "@/lib/supabase";
import styles from "./conflicts.module.css";

export type ConflictStrings = {
  intro: string;
  pending: string;
  itemLabel: string;
  detected: string;
  key: string;
  localValue: string;
  serverValue: string;
  keepServer: string;
  keepMine: string;
  applicable: string;
  compliant: string;
  notes: string;
  yes: string;
  no: string;
  none: string;
  empty: string;
  emptySub: string;
  resolving: string;
  resolveFailed: string;
  policyNote: string;
  groundingNote: string;
};

type Field = { label: string; value: string };

/** The governed identity of a checklist item, as frozen into the package the
 *  inspector executed. Either half may be absent — nothing is ever invented. */
type ItemIdentity = { code: string | null; title: string | null };

// Ordered first so the two compare columns read in the checklist's own order;
// any further response keys follow, sorted, so both sides stay aligned.
const PRIMARY_KEYS = ["applicable", "compliant", "notes"];

const asPlainObject = (payload: unknown): Record<string, unknown> | null =>
  payload && typeof payload === "object" && !Array.isArray(payload) ? (payload as Record<string, unknown>) : null;

// ── Checklist item identity ────────────────────────────────────────────────
// The design's card heading is "Checklist item #12 — Fire Safety": an item
// reference plus its human title. Both are real, governed data and are already
// on this device.
//
// The offline `packages` store holds the FROZEN package definition the
// inspector downloaded (lib/offline.ts cachePackage / cacheVerifiedPackage).
// That definition carries `item_snapshot`, built by
// admin/packages/actions.ts::freezeDefinition as
//     item_snapshot[<item code>] = { id, code, title, response_model, ... }
// i.e. the complete `inspection_items` row, and it is exactly what the
// inspection workspace reads to render item titles
// (field/inspection/[id]/page.tsx: `frozenDefinition.item_snapshot?.[code]`).
// Conflicts are keyed by the item UUID (`item_id` on the response outbox op is
// `item.id`), so the snapshot is inverted here into id → { code, title }.
//
// The store holds two shapes under different keys — the legacy raw
// `package_versions` row (key: the inspection id) and the sealed
// saqeel-inspection-package-v1 envelope (key: `inspection:<id>`). Both expose
// the definition on `.definition`, so one accessor covers each.
const definitionOf = (cached: unknown): unknown => {
  if (!cached || typeof cached !== "object") return null;
  return (cached as { definition?: unknown }).definition ?? null;
};

const itemIdentitiesFrom = (definition: unknown): [string, ItemIdentity][] => {
  const snapshot = definition && typeof definition === "object"
    ? (definition as { item_snapshot?: unknown }).item_snapshot
    : null;
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) return [];
  const rows: [string, ItemIdentity][] = [];
  for (const row of Object.values(snapshot as Record<string, unknown>)) {
    if (!row || typeof row !== "object") continue;
    const { id, code, title } = row as { id?: unknown; code?: unknown; title?: unknown };
    if (typeof id !== "string" || !id) continue;
    rows.push([id, {
      code: typeof code === "string" && code ? code : null,
      title: typeof title === "string" && title ? title : null,
    }]);
  }
  return rows;
};

/** `<inspection_id>:<item_id>` — the conflict key the outbox writes. */
const inspectionIdOf = (c: Conflict): string | null => {
  const suffix = `:${c.item_id}`;
  if (!c.item_id || !c.key.endsWith(suffix)) return null;
  return c.key.slice(0, c.key.length - suffix.length) || null;
};

export default function ConflictResolutionClient({
  locale,
  userId,
  strings,
  title,
  leading,
  langHref,
  langLabel,
}: {
  locale: "en" | "ar";
  userId: string;
  strings: ConflictStrings;
  title: ReactNode;
  leading: ReactNode;
  langHref: string;
  langLabel: string;
}) {
  const local = useMemo(() => localForUser(userId), [userId]);
  // null = store not yet read on the client (SSR-safe: render nothing about
  // conflict state until we actually know).
  const [conflicts, setConflicts] = useState<Conflict[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  // item UUID → governed { code, title }. Only ever holds entries that were
  // actually read from a frozen package or the governed catalogue.
  const [itemIdentities, setItemIdentities] = useState<Record<string, ItemIdentity>>({});

  const refresh = useCallback(async () => {
    try {
      const list = await local.conflicts();
      setConflicts(list);
    } catch {
      setConflicts([]);
    }
  }, [local]);

  useEffect(() => {
    void promptLegacyOfflineRestore(userId).then(refresh).catch(() => refresh());
    const on = () => void refresh();
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
    };
  }, [refresh, userId]);

  // Resolve each conflicting item's governed code + title. Offline-first: the
  // frozen package cached for execution is read first, so this works with no
  // network exactly like the rest of the field channel. Only ids the frozen
  // packages did not cover are then topped up from the governed
  // `inspection_items` catalogue under the inspector's own RLS scope — a read
  // only, never a write. Anything still unresolved stays unresolved and renders
  // as the raw id; no title is ever guessed or derived from the id.
  useEffect(() => {
    if (!conflicts || conflicts.length === 0) return;
    let cancelled = false;
    void (async () => {
      const resolved = new Map<string, ItemIdentity>();
      const inspectionIds = new Set(conflicts.map(inspectionIdOf).filter((id): id is string => !!id));
      for (const inspectionId of inspectionIds) {
        for (const cacheKey of [inspectionId, `inspection:${inspectionId}`]) {
          try {
            for (const [id, identity] of itemIdentitiesFrom(definitionOf(await local.getPackage(cacheKey)))) {
              if (!resolved.has(id)) resolved.set(id, identity);
            }
          } catch {
            // A cache miss or unreadable entry is not an error here — the
            // fallback render below is already honest.
          }
        }
      }
      const missing = [...new Set(conflicts.map(c => c.item_id).filter(id => !!id && !resolved.has(id)))];
      if (missing.length && typeof navigator !== "undefined" && navigator.onLine) {
        try {
          const { data } = await supabaseBrowser().from("inspection_items").select("id, code, title").in("id", missing);
          for (const row of (data ?? []) as { id: string; code: string | null; title: string | null }[]) {
            resolved.set(row.id, { code: row.code ?? null, title: row.title ?? null });
          }
        } catch {
          // Offline, out of scope, or a non-UUID id — leave it unresolved.
        }
      }
      if (!cancelled) setItemIdentities(Object.fromEntries(resolved));
    })();
    return () => { cancelled = true; };
  }, [conflicts, local]);

  // Honest, readable rendering of a stored response payload. Known checklist
  // response keys get localized labels; everything else is stringified verbatim.
  const fmtScalar = useCallback(
    (v: unknown): string =>
      v === true ? strings.yes : v === false ? strings.no : v == null ? strings.none : typeof v === "string" ? v : JSON.stringify(v),
    [strings.yes, strings.no, strings.none],
  );

  const labelFor = useCallback(
    (k: string): string =>
      k === "applicable" ? strings.applicable : k === "compliant" ? strings.compliant : k === "notes" ? strings.notes : k,
    [strings.applicable, strings.compliant, strings.notes],
  );

  const toFields = useCallback(
    (payload: unknown): Field[] => {
      if (payload && typeof payload === "object" && !Array.isArray(payload)) {
        return Object.entries(payload as Record<string, unknown>).map(([k, v]) => ({ label: labelFor(k), value: fmtScalar(v) }));
      }
      // Non-object payloads (primitive / array) are shown as one honest row.
      return [{ label: "", value: typeof payload === "string" ? payload : JSON.stringify(payload) }];
    },
    [labelFor, fmtScalar],
  );

  // A side-by-side compare is only readable if both columns carry the SAME rows
  // in the SAME order. Rendering each payload's own keys let a key present on
  // one side only (e.g. local added `notes`) shift every row below it, so the
  // columns no longer lined up and the compare read wrong. Both sides are now
  // projected over the union of their keys; a key absent on one side renders
  // through the same fmtScalar null path as an explicit null — no value is
  // invented, and nothing about detection or resolution changes.
  const toComparedFields = useCallback(
    (localPayload: unknown, serverPayload: unknown): { local: Field[]; server: Field[] } => {
      const localObject = asPlainObject(localPayload);
      const serverObject = asPlainObject(serverPayload);
      if (!localObject || !serverObject) {
        return { local: toFields(localPayload), server: toFields(serverPayload) };
      }
      const all = new Set([...Object.keys(localObject), ...Object.keys(serverObject)]);
      const keys = [
        ...PRIMARY_KEYS.filter(k => all.has(k)),
        ...[...all].filter(k => !PRIMARY_KEYS.includes(k)).sort(),
      ];
      return {
        local: keys.map(k => ({ label: labelFor(k), value: fmtScalar(localObject[k]) })),
        server: keys.map(k => ({ label: labelFor(k), value: fmtScalar(serverObject[k]) })),
      };
    },
    [toFields, labelFor, fmtScalar],
  );

  // "Keep server": discard the local response — the server value already stands.
  const keepServer = useCallback(
    async (c: Conflict) => {
      setFailed(null);
      setBusy(c.key);
      try {
        await local.resolveConflict(c.key);
        await refresh();
      } catch {
        setFailed(c.key);
      } finally {
        setBusy(null);
      }
    },
    [local, refresh],
  );

  // "Keep mine": re-queue the stored local response through the EXISTING outbox
  // so it wins on the next sync, then clear the conflict record. inspection_id is
  // recovered from the conflict key (`${inspection_id}:${item_id}`) using the
  // separately-stored item_id. baseline_updated_at:null makes processOutbox()
  // upsert without re-detecting a conflict — no direct server write from here.
  const keepMine = useCallback(
    async (c: Conflict) => {
      setFailed(null);
      setBusy(c.key);
      try {
        const inspectionId = inspectionIdOf(c);
        if (!inspectionId) {
          // Cannot safely reconstruct the target op — do not fabricate one.
          setFailed(c.key);
          return;
        }
        const op: OutboxOp = {
          kind: "response",
          inspection_id: inspectionId,
          item_id: c.item_id,
          response: c.local,
          baseline_updated_at: null,
          queued_at: new Date().toISOString(),
        };
        await local.enqueue(op);
        await local.resolveConflict(c.key);
        // The enqueue alone left the resolution sitting in the outbox: this
        // route mounts no reconnect/sync runner (FieldHeaderSync is only on
        // /field), so the op flushed only whenever the inspector next happened
        // to open a surface that runs one. Flush it here instead. processOutbox
        // returns immediately when navigator.onLine is false, so this is a safe
        // no-op offline. A replay failure is not a resolution failure — the
        // enqueue and the conflict clear are already committed and the op stays
        // queued for the field sync engine — so it never sets the failed state.
        try {
          await processOutbox(userId, () => { /* no sync banner on this route; queue state is retried by the field sync engine */ });
        } catch { /* op remains queued; nothing is lost */ }
        await refresh();
      } catch {
        setFailed(c.key);
      } finally {
        setBusy(null);
      }
    },
    [local, refresh, userId],
  );

  // The header renders unconditionally so the screen never paints chrome-less
  // while IndexedDB is read; only the pending-count badge waits for the real
  // count (design: badge-critical "{n} pending"). Zero-assumption — the count
  // is rendered once it is genuinely known (including a real 0), never before.
  const header = (
    <FieldHeader
      leading={leading}
      title={title}
      langHref={langHref}
      langLabel={langLabel}
      right={conflicts !== null
        ? <span className="badge badge-critical" style={{ height: 19, flex: "none" }}>{conflicts.length} {strings.pending}</span>
        : null}
    />
  );

  // The static chrome the design shows on every state — intro, resolution-policy
  // callout, grounding note — renders immediately; only the conflict list itself
  // waits for the IndexedDB read (SSR-safe, and no claim about conflict state is
  // made before one is known).
  return (
    <>
      {header}
      <div className={styles.wrap}>
      <p className="t-caption" style={{ margin: 0 }}>{strings.intro}</p>

      <div className={`panel ${styles.policy}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent-text)" strokeWidth="1.7" style={{ width: 14, height: 14, flex: "none", marginBlockStart: 1 }} aria-hidden="true">
          <path d="M12 2l1.6 5.2L19 9l-5.4 1.8L12 16l-1.6-5.2L5 9l5.4-1.8L12 2z" />
        </svg>
        <span>{strings.policyNote}</span>
      </div>

      {conflicts === null ? null : conflicts.length === 0 ? (
        <div className={`${styles.card} ${styles.empty}`}>
          <span className={styles.check} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 22, height: 22 }}>
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <div style={{ fontWeight: 600 }}>{strings.empty}</div>
          <div className="t-caption">{strings.emptySub}</div>
        </div>
      ) : (
        conflicts.map((c) => {
          const { local: localFields, server: serverFields } = toComparedFields(c.local, c.server);
          const rowBusy = busy === c.key;
          // Design heading: "Checklist item #12 — Fire Safety". Rendered from
          // the governed item code and title once resolved; while (or if) they
          // are not, the raw item id is shown rather than a plausible name.
          const identity = itemIdentities[c.item_id];
          const itemRef = identity?.code ?? c.item_id;
          const itemHeading = identity?.title
            ? `${strings.itemLabel} ${itemRef} — ${identity.title}`
            : `${strings.itemLabel} · ${c.item_id}`;
          return (
            <div className={styles.card} key={c.key}>
              <div className={styles.head}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--status-warning-text)" strokeWidth="1.7" style={{ width: 17, height: 17, flex: "none" }} aria-hidden="true">
                  <path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                  <path d="M12 9v4M12 17h.01" />
                </svg>
                <span style={{ fontWeight: 600, fontSize: 14 }} data-testid="conflict-item-heading">{itemHeading}</span>
                <span className="grow" />
                <span className="t-caption id-code">{strings.detected} {c.detected_at}</span>
              </div>
              <div className={`t-caption id-code ${styles.key}`}>{strings.key}: {c.key}</div>

              <div className={styles.sides}>
                <div className={styles.side}>
                  <div className={`t-label ${styles.sideTitle}`}>{strings.localValue}</div>
                  {localFields.map((f, i) => (
                    <div className={styles.field} key={`l-${i}`}>
                      <span className={styles.fieldK}>{f.label}</span>
                      <span className={styles.fieldV}>{f.value}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.side}>
                  <div className={`t-label ${styles.sideTitle}`}>{strings.serverValue}</div>
                  {serverFields.map((f, i) => (
                    <div className={styles.field} key={`s-${i}`}>
                      <span className={styles.fieldK}>{f.label}</span>
                      <span className={styles.fieldV}>{f.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {failed === c.key ? (
                <p className={`t-caption ${styles.failed}`} role="alert">{strings.resolveFailed}</p>
              ) : null}

              <div className={styles.actions}>
                <button type="button" className="btn btn-secondary btn-sm" style={{ flex: 1 }} disabled={rowBusy} onClick={() => void keepServer(c)}>
                  {strings.keepServer}
                </button>
                <button type="button" className="btn btn-primary btn-sm" style={{ flex: 1 }} disabled={rowBusy} onClick={() => void keepMine(c)}>
                  {rowBusy ? strings.resolving : strings.keepMine}
                </button>
              </div>
            </div>
          );
        })
      )}

      <div className={`panel ${styles.note}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 14, height: 14, flex: "none", marginBlockStart: 1 }} aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v5M12 16h.01" />
        </svg>
        <span>{strings.groundingNote}</span>
      </div>
      </div>
    </>
  );
}
