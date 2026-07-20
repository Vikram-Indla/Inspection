export interface SyncIndicatorProps {
  /** offline-first lifecycle — synced | pending | syncing | offline | conflict | failed */
  state?: "synced" | "pending" | "syncing" | "offline" | "conflict" | "failed";
  /** localized label override */
  label?: string;
  /** tooltip detail (last sync time, queued count) */
  detail?: string;
}
