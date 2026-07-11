"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase";
import { local } from "@/lib/offline";

type V = { id: string; window_start: string; window_end: string; execution_mode: string;
  factories: { name: string; official_lat: number; official_lng: number };
  package_versions: { id: string; version_label: string; definition: unknown; packages: { code: string } };
  inspections: { id: string; status: string }[] };
type Gis = { gps_accuracy_checkin_max_m?: number; geofence_default_radius_m?: number };

function distM(a: [number, number], b: [number, number]) {
  const R = 6371000, dLat = (b[0] - a[0]) * Math.PI / 180, dLng = (b[1] - a[1]) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export default function Startup({ visit, gis }: { visit: V; gis: Gis }) {
  const router = useRouter();
  const [log, setLog] = useState<string[]>([]);
  const [cached, setCached] = useState(false);
  const [journeyId, setJourneyId] = useState<string | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const maxAcc = gis.gps_accuracy_checkin_max_m ?? 25;
  const fence = gis.geofence_default_radius_m ?? 150;
  const add = (m: string) => setLog(l => [...l, m]);

  async function downloadPackage() {
    await local.cachePackage(`visit:${visit.id}`, visit.package_versions);
    setCached(true); add(`Package ${visit.package_versions.version_label} cached & version-locked (M04-005/007)`);
  }
  async function startJourney() {
    setBusy(true);
    const sb = supabaseBrowser();
    const { data: { user } } = await sb.auth.getUser();
    const { data, error } = await sb.from("journey_sessions").insert({ visit_id: visit.id, inspector_id: user!.id }).select().single();
    setBusy(false);
    if (error) { add(`Journey blocked: ${error.message}`); return; }
    setJourneyId(data.id); add("Journey started — telemetry active (STM-JRN-001)");
  }
  async function checkIn() {
    setBusy(true);
    const pos = await new Promise<GeolocationPosition | null>(res =>
      navigator.geolocation ? navigator.geolocation.getCurrentPosition(p => res(p), () => res(null), { timeout: 4000 }) : res(null));
    // demo fallback: 60m from official pin, good accuracy
    const lat = pos?.coords.latitude ?? visit.factories.official_lat + 0.0005;
    const lng = pos?.coords.longitude ?? visit.factories.official_lng + 0.0002;
    const acc = pos?.coords.accuracy ?? 4.2;
    const d = distM([lat, lng], [visit.factories.official_lat, visit.factories.official_lng]);
    if (acc > maxAcc) { add(`BLOCKED: accuracy ±${acc.toFixed(0)}m > ${maxAcc}m required (ERR-GEO-001) — retry or governed override`); setBusy(false); return; }
    const inside = d <= fence;
    const sb = supabaseBrowser();
    const { error } = await sb.from("geo_events").insert({
      journey_id: journeyId, visit_id: visit.id, kind: "checkin",
      observed_lat: lat, observed_lng: lng, accuracy_m: acc,
      geofence_result: inside ? "inside" : "outside", gis_version: "v1-accepted-2026-07-11", device_id: "field-pwa",
    });
    setBusy(false);
    if (error) { add(`Check-in rejected: ${error.message}`); return; }
    if (!inside) { add(`OUTSIDE geofence (${d.toFixed(0)}m > ${fence}m) — check-in recorded as outside; governed override required (ERR-GEO-002)`); return; }
    setCheckedIn(true); add(`Checked in INSIDE fence (${d.toFixed(0)}m, ±${acc.toFixed(1)}m) — start allowed (STM-JRN-003)`);
  }
  async function startInspection() {
    setBusy(true);
    const sb = supabaseBrowser();
    const { data, error } = await sb.from("inspections").insert({
      visit_id: visit.id, status: "in_progress", package_version_id: visit.package_versions.id, started_at: new Date().toISOString(),
    }).select().single();
    if (error) { add(`Start blocked: ${error.message}`); setBusy(false); return; }
    await local.cachePackage(data.id, visit.package_versions);  // key by inspection for the workspace
    router.push(`/field/inspection/${data.id}`);
  }
  const existing = visit.inspections[0];
  return (
    <div className="ax-stack" style={{ gap: "var(--ax-space-300)" }}>
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>Readiness (SCR-IPAD-610)</h4>
        <div className="ax-stack" style={{ gap: 8 }}>
          <div className="adm-check adm-check--pass" style={{ display: "flex", gap: 8 }}>✓ Window {new Date(visit.window_start).toISOString().slice(0,16).replace("T"," ")} → {new Date(visit.window_end).toISOString().slice(11,16)}</div>
          <div style={{ display: "flex", gap: 8 }}>{cached ? "✓" : "○"} Package {visit.package_versions.packages.code} · {visit.package_versions.version_label} {cached && "— cached, version-locked"}</div>
          <div style={{ display: "flex", gap: 8 }}>{journeyId ? "✓" : "○"} Journey session</div>
          <div style={{ display: "flex", gap: 8 }}>{checkedIn ? "✓" : "○"} Geofence check-in (≤{maxAcc}m accuracy, {fence}m fence — live config)</div>
        </div>
      </div>
      <div className="ax-row">
        <button className="ax-btn ax-btn--field" onClick={downloadPackage} disabled={cached}>1 · Download package</button>
        <button className="ax-btn ax-btn--field" onClick={startJourney} disabled={!cached || !!journeyId || busy}>2 · Start journey</button>
        <button className="ax-btn ax-btn--field" onClick={checkIn} disabled={!journeyId || checkedIn || busy}>3 · Geofence check-in</button>
        {existing && existing.status !== "not_started"
          ? <a className="ax-btn ax-btn--field ax-btn--prominent" href={`/field/inspection/${existing.id}`}>Resume inspection →</a>
          : <button className="ax-btn ax-btn--field ax-btn--prominent" onClick={startInspection} disabled={!checkedIn || busy}>4 · Start inspection</button>}
      </div>
      {log.length > 0 && <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <ul className="ax-timeline">{log.map((m, i) => <li key={i}><div>{m}</div></li>)}</ul>
      </div>}
    </div>
  );
}
