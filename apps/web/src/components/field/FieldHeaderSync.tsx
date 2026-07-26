"use client";
// SAQEEL Field Dashboard header connectivity cluster — the design's Online pill
// + Sync-Now control, wired to the REAL device state (lib/offline.ts), never a
// fabricated status. Reads the actual inspection outbox (peekAll) and
// navigator connectivity directly, and Sync-Now runs the
// real processOutbox replay. DS tokens only; strings arrive pre-translated
// (strings-prop canon). SSR-safe: renders nothing about queue state until the
// outbox has actually been read on the client.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { localForUser, processOutbox, promptLegacyOfflineRestore, type SyncState } from "@/lib/offline";

export type FieldHeaderSyncStrings = {
  online: string;
  offline: string;
  syncNow: string;
  syncing: string;
};

export default function FieldHeaderSync({ strings, userId }: { strings: FieldHeaderSyncStrings; userId: string }) {
  const local = useMemo(() => localForUser(userId), [userId]);
  const [online, setOnline] = useState<boolean | null>(null);
  const [queued, setQueued] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  const aliveRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const ops = await local.peekAll();
      if (aliveRef.current) setQueued(ops.length);
    } catch {
      // Unknown is safer than claiming an empty, fully-synced outbox.
      if (aliveRef.current) setQueued(null);
    }
  }, [local]);

  useEffect(() => {
    aliveRef.current = true;
    setOnline(navigator.onLine);
    void promptLegacyOfflineRestore(userId).then(refresh).catch(() => refresh());
    const on = () => { setOnline(true); void refresh(); };
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    const id = window.setInterval(refresh, 15000);
    return () => { aliveRef.current = false; window.removeEventListener("online", on); window.removeEventListener("offline", off); window.clearInterval(id); };
  }, [refresh, userId]);

  const runSync = useCallback(async () => {
    if (syncing || online !== true) return;
    setSyncing(true);
    try {
      await processOutbox(userId, (_state: SyncState) => { /* state surfaced via queue refresh below */ });
    } catch {
      /* processOutbox is idempotent; a failure leaves the queue intact — no data lost */
    } finally {
      if (aliveRef.current) { setSyncing(false); void refresh(); }
    }
  }, [online, syncing, userId, refresh]);

  // Connectivity and replay state are separate facts in the design. A queued
  // outbox must not replace the real network label; its count belongs to the
  // sync affordance below. Until navigator has been read on the client, render
  // no connectivity claim.
  const statusLabel = online === null ? null : online ? strings.online : strings.offline;

  return (
    <>
      {statusLabel && (
        <span
          className="fd-pill"
          data-online={online ? "true" : "false"}
          data-sync-state={online ? "online" : "offline"}
          role="status"
          aria-live="polite"
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            minHeight: 32, paddingBlock: 7, paddingInline: 13,
            borderRadius: "var(--radius-full)", fontSize: 12, fontWeight: 600,
            lineHeight: 1.3, whiteSpace: "nowrap",
            border: `1px solid ${online ? "var(--status-compliant-text)" : "var(--status-warning-text)"}`,
            background: online ? "var(--status-compliant-soft)" : "var(--status-warning-soft)",
            color: online ? "var(--status-compliant-text)" : "var(--status-warning-text)",
          }}
        >
          <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: "var(--radius-full)", background: "currentColor", flex: "none" }} />
          {statusLabel}
        </span>
      )}

      <button
        type="button"
        className="btn btn-icon btn-ghost"
        onClick={runSync}
        disabled={syncing || online !== true}
        aria-label={syncing ? strings.syncing : strings.syncNow}
        title={syncing ? strings.syncing : strings.syncNow}
        style={{ position: "relative" }}
      >
        <svg className={syncing ? "fd-sync-icon--spinning" : undefined}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
          style={syncing ? { animation: "fd-spin 0.9s linear infinite" } : undefined}>
          <path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
          <path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
        </svg>
        {queued != null && queued > 0 && (
          <span aria-hidden="true" style={{
            position: "absolute", top: 2, insetInlineEnd: 2, minWidth: 14, height: 14, padding: "0 3px",
            borderRadius: "var(--radius-full)", background: "var(--status-critical)", color: "var(--text-on-action)",
            fontSize: 9, fontWeight: 700, lineHeight: "14px", textAlign: "center",
          }}>{queued}</span>
        )}
      </button>
      <style>{"@keyframes fd-spin{to{transform:rotate(360deg)}}@media (prefers-reduced-motion:reduce){.fd-sync-icon--spinning{animation:none!important}}@media (max-width:600px){.fd-pill{padding-inline:var(--space-3)!important}}"}</style>
    </>
  );
}
