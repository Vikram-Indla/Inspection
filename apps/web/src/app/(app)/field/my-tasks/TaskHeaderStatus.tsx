"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import styles from "./my-tasks.module.css";

// SAQEEL PWA-Field My Tasks.dc.html header cluster: the connectivity pill and
// the Sync Now control that sit between the title block and the language
// toggle. The route previously had neither — connectivity was a banner inside
// the list pane and there was no refresh control at all.
//
// Sync Now is real behaviour, not a placeholder: router.refresh() re-runs the
// server component, so the inspector-scoped assignment read and the dossier
// read execute again. It is disabled while offline, because there is nothing
// to re-fetch, and while the refresh transition is pending.
//
// The initial render is `online` on both server and client, then the effect
// reconciles from navigator.onLine — no suppressHydrationWarning, no
// server/client text divergence.
export default function TaskHeaderStatus({
  onlineLabel,
  offlineLabel,
  syncLabel,
  syncingLabel,
}: {
  onlineLabel: string;
  offlineLabel: string;
  syncLabel: string;
  syncingLabel: string;
}) {
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <div className={styles.headerCluster}>
      <span
        className={`${styles.statusPill} ${online ? styles.statusPillOnline : styles.statusPillOffline}`}
        role="status"
        aria-live="polite"
      >
        <span className={styles.statusDot} aria-hidden="true" />
        {online ? onlineLabel : offlineLabel}
      </span>
      <button
        type="button"
        className="btn btn-icon btn-ghost"
        aria-label={pending ? syncingLabel : syncLabel}
        disabled={!online || pending}
        onClick={() => startTransition(() => router.refresh())}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
          className={styles.syncIcon} aria-hidden="true">
          <path d="M21 2v6h-6" />
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
          <path d="M3 22v-6h6" />
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
        </svg>
      </button>
    </div>
  );
}
