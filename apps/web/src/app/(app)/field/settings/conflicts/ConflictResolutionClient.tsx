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

import { useCallback, useEffect, useMemo, useState } from "react";
import { localForUser, promptLegacyOfflineRestore, type Conflict, type OutboxOp } from "@/lib/offline";
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
  keepServerHint: string;
  keepMine: string;
  keepMineHint: string;
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
  groundingNote: string;
};

type Field = { label: string; value: string };

export default function ConflictResolutionClient({
  locale,
  userId,
  strings,
}: {
  locale: "en" | "ar";
  userId: string;
  strings: ConflictStrings;
}) {
  const local = useMemo(() => localForUser(userId), [userId]);
  // null = store not yet read on the client (SSR-safe: render nothing about
  // conflict state until we actually know).
  const [conflicts, setConflicts] = useState<Conflict[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

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
        const suffix = `:${c.item_id}`;
        const inspectionId = c.key.endsWith(suffix) ? c.key.slice(0, c.key.length - suffix.length) : "";
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
        await refresh();
      } catch {
        setFailed(c.key);
      } finally {
        setBusy(null);
      }
    },
    [local, refresh],
  );

  // SSR-safe: nothing about conflict state until the store has been read.
  if (conflicts === null) return null;

  return (
    <div className={styles.wrap}>
      <p className="t-caption" style={{ margin: 0 }}>{strings.intro}</p>

      {conflicts.length === 0 ? (
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
          const localFields = toFields(c.local);
          const serverFields = toFields(c.server);
          const rowBusy = busy === c.key;
          return (
            <div className={styles.card} key={c.key}>
              <div className={styles.head}>
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--status-warning-text)" strokeWidth="1.7" style={{ width: 17, height: 17, flex: "none" }} aria-hidden="true">
                  <path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                  <path d="M12 9v4M12 17h.01" />
                </svg>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{strings.itemLabel} · {c.item_id}</span>
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
                  <span>{strings.keepServer}</span>
                  <span className={`t-caption ${styles.btnHint}`}>{strings.keepServerHint}</span>
                </button>
                <button type="button" className="btn btn-primary btn-sm" style={{ flex: 1 }} disabled={rowBusy} onClick={() => void keepMine(c)}>
                  <span>{rowBusy ? strings.resolving : strings.keepMine}</span>
                  {!rowBusy ? <span className={`t-caption ${styles.btnHint}`}>{strings.keepMineHint}</span> : null}
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
  );
}
