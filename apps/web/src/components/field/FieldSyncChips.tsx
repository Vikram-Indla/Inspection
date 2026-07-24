"use client";
// Field sync/offline chips (CODEX 03 top context).
// Honest display of the ACTUAL device state — reads the real inspection outbox
// (lib/offline.ts) and navigator connectivity. This is a display of queue/cache
// state, NOT a KPI: it never recomputes a metric formula and never mutates the
// queue, the Factory 360 cache, or any workflow state. Strings arrive
// pre-translated from the server (strings-prop canon).

import { useEffect, useMemo, useState } from "react";
import { localForUser, promptLegacyOfflineRestore, type Conflict } from "@/lib/offline";

export type FieldSyncStrings = {
  offlineQueued: string;   // "Offline — {n} changes queued"
  online: string;          // "Online"
  synced: string;          // "All changes synced"
  syncFailed: string;      // "{n} sync conflict(s) — no data lost"
};

export default function FieldSyncChips({ strings, userId }: { strings: FieldSyncStrings; userId: string }) {
  const local = useMemo(() => localForUser(userId), [userId]);
  const [online, setOnline] = useState(true);
  const [queued, setQueued] = useState<number | null>(null);
  const [conflicts, setConflicts] = useState<number>(0);

  useEffect(() => {
    setOnline(navigator.onLine);
    let alive = true;
    const refresh = async () => {
      try {
        const [ops, conf] = await Promise.all([local.peekAll(), local.conflicts()]);
        if (!alive) return;
        setQueued(ops.length);
        setConflicts((conf as Conflict[]).length);
      } catch {
        if (alive) setQueued(0);
      }
    };
    void promptLegacyOfflineRestore(userId).then(refresh).catch(() => refresh());
    const on = () => { setOnline(true); void refresh(); };
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    const id = window.setInterval(refresh, 15000);
    return () => { alive = false; window.removeEventListener("online", on); window.removeEventListener("offline", off); window.clearInterval(id); };
  }, [local, userId]);

  // Until the outbox has been read on the client, render nothing (SSR-safe; no
  // fabricated "synced" state before we actually know).
  if (queued === null) return null;

  return (
    <>
      {!online && (
        <span className="sq-sync sq-sync--offline">
          <span aria-hidden>●</span>
          {strings.offlineQueued.replace("{n}", String(queued))}
        </span>
      )}
      {online && queued > 0 && (
        <span className="sq-sync sq-sync--pending">
          <span aria-hidden>●</span>
          {strings.offlineQueued.replace("{n}", String(queued))}
        </span>
      )}
      {online && queued === 0 && conflicts === 0 && (
        <span className="sq-sync sq-sync--synced">
          <span aria-hidden>●</span>
          {strings.synced}
        </span>
      )}
      {conflicts > 0 && (
        <span className="sq-sync sq-sync--conflict" role="status">
          <span aria-hidden>●</span>
          {strings.syncFailed.replace("{n}", String(conflicts))}
        </span>
      )}
    </>
  );
}
