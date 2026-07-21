"use client";

import { useEffect, useState } from "react";
import { factory360Offline, type Factory360Snapshot } from "@/lib/factory360/offline-snapshot";

// TASK-FACTORY-360-IPAD-011 · F360IPAD-OFFLINE-005
// Honest offline/freshness signalling for the iPad Factory 360. Caches the
// permission-filtered server projection when a refresh SUCCEEDS; a failed
// refresh retains the previously cached snapshot (never overwritten). Shows
// Live vs Offline/Cached ("not live") — no invented staleness threshold and it
// never claims live synchronisation while offline.

export type Factory360OfflineStrings = {
  live: string;        // "Available offline · cached {ts}"
  offline: string;     // "Offline — showing cached snapshot from {ts} (not live)"
  cached: string;      // "Cached for offline · {ts} (values may be out of date)"
  unavailable: string; // "No offline snapshot cached for this license yet — open while online to cache it."
  refreshing: string;  // "Refreshing offline snapshot…"
  omitted: string;     // "Sections excluded by your permissions:"
  gaps: string;        // "Integration gaps:"
};

type Mode = "refreshing" | "live" | "cached" | "offline" | "unavailable";

export default function Factory360Offline({ crId, licenseId, strings, locale }: {
  crId: string; licenseId: string | null; strings: Factory360OfflineStrings; locale: "ar" | "en";
}) {
  const [mode, setMode] = useState<Mode>("refreshing");
  const [snapshot, setSnapshot] = useState<Factory360Snapshot | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      // Offline at entry: serve the prior cached snapshot, honestly labelled.
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        const cached = await factory360Offline.get(crId, licenseId).catch(() => undefined);
        if (cancelled) return;
        if (cached) { setSnapshot(cached); setMode("offline"); }
        else setMode("unavailable");
        return;
      }
      setMode("refreshing");
      try {
        const res = await fetch(`/api/field/factory-360/snapshot?cr=${encodeURIComponent(crId)}${licenseId ? `&license=${encodeURIComponent(licenseId)}` : ""}`, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const fresh = (await res.json()) as Factory360Snapshot;
        if (cancelled) return;
        await factory360Offline.put(fresh).catch(() => { /* cache write best-effort; UI still live */ });
        setSnapshot(fresh);
        setMode("live");
      } catch {
        // Failed refresh: retain the PRIOR snapshot (do not overwrite the cache).
        const cached = await factory360Offline.get(crId, licenseId).catch(() => undefined);
        if (cancelled) return;
        if (cached) { setSnapshot(cached); setMode("cached"); }
        else setMode("unavailable");
      }
    }

    refresh();
    const onOffline = () => { void refresh(); };
    const onOnline = () => { void refresh(); };
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => { cancelled = true; window.removeEventListener("offline", onOffline); window.removeEventListener("online", onOnline); };
  }, [crId, licenseId, locale]);

  const generatedAtLabel = snapshot ? (() => {
    try { return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(snapshot.generatedAt)); }
    catch { return snapshot.generatedAt; }
  })() : "";

  const tone = mode === "live" ? "ax-lozenge--success" : mode === "unavailable" ? "" : "ax-lozenge--warning";
  const message =
    mode === "refreshing" ? strings.refreshing :
    mode === "live" ? strings.live.replace("{ts}", generatedAtLabel) :
    mode === "offline" ? strings.offline.replace("{ts}", generatedAtLabel) :
    mode === "cached" ? strings.cached.replace("{ts}", generatedAtLabel) :
    strings.unavailable;

  return (
    <div className={`ax-sync ${mode === "live" ? "ax-sync--synced" : mode === "unavailable" ? "ax-sync--offline" : "ax-sync--offline"}`} role="status" aria-live="polite">
      <span className={`ax-lozenge ${tone}`}>{message}</span>
      {snapshot && snapshot.sectionsOmitted.length > 0 && <span className="t-caption"> · {strings.omitted} {snapshot.sectionsOmitted.join(", ")}</span>}
      {snapshot && snapshot.providerGaps.length > 0 && <span className="t-caption"> · {strings.gaps} {snapshot.providerGaps.join(", ")}</span>}
    </div>
  );
}
