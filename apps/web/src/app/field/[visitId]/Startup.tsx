"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { supabaseBrowser } from "@/lib/supabase";
import { local } from "@/lib/offline";
import type { GeoMarkerData } from "@/components/GeoMap";
import { transitionOperationalState } from "./actions";

// SB19 — strings built server-side with t() and passed as props.
export type StartupStrings = {
  mapLoading: string;
  readiness: string; window: string; packageLine: string; packageCached: string;
  journeySession: string; geofenceCheck: string;
  geofenceHeading: string; insideFence: string; outsideFence: string;
  fenceCaption: string; factoryOverride: string; engineDefault: string; positionHint: string;
  step1: string; step2: string; step3: string; step4: string; resume: string;
  officialLabel: string; youLabel: string; insideWord: string; outsideWord: string;
  logCached: string; logJourneyBlocked: string; logJourneyStarted: string;
  logAccuracyBlocked: string; logCheckinRejected: string; logOutside: string; logInside: string; logStartBlocked: string;
  // E3 — telemetry / arrival auto-detect / deviation / exception / pre-start / STM-OPS
  telemetryRow: string; liveDistance: string; arrivalDetected: string; liveLabel: string;
  prestartHeading: string; prestartRep: string; prestartLoc: string;
  logPrestartBlocked: string; logPrestartSaved: string;
  exceptionHeading: string; exceptionPlaceholder: string; exceptionSend: string;
  logExceptionSent: string; logExceptionFailed: string; logDeviation: string;
  logOpState: string; logOpBlocked: string; logGpsFallback: string;
};

// Module-level label so the dynamic() loading component (defined outside the
// component) can render the localized text passed via props at render time.
let mapLoadingLabel = "Loading geofence map";

// SB20 / ENG-08 — geofence map card. react-leaflet v5 is client-only (ssr:false).
const GeoMap = dynamic(() => import("@/components/GeoMap"), {
  ssr: false,
  loading: () => (
    <div className="ax-state ax-state--inline">
      <span className="ax-state__glyph">…</span><h4>{mapLoadingLabel}</h4>
    </div>
  ),
});

type V = { id: string; window_start: string; window_end: string; execution_mode: string;
  factories: { name: string; official_lat: number; official_lng: number; geofence_radius_m: number | null };
  package_versions: { id: string; version_label: string; definition: unknown; packages: { code: string } };
  inspections: { id: string; status: string }[] | null };
type Gis = { gps_accuracy_checkin_max_m?: number; geofence_default_radius_m?: number;
  arrival_detection_radius_m?: number; telemetry_interval_s?: number;
  route_deviation?: { off_route_m?: number; sustain_s?: number } };

type Fix = { lat: number; lng: number; acc: number; alt: number | null; speed: number | null; heading: number | null; d: number };

function distM(a: [number, number], b: [number, number]) {
  const R = 6371000, dLat = (b[0] - a[0]) * Math.PI / 180, dLng = (b[1] - a[1]) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

const fmt = (s: string, vars: Record<string, string | number>) => { return s.replace(/\{(\w+)\}/g, (m, k) => String(vars[k] ?? m)); };

export default function Startup({ visit, gis, strings }: { visit: V; gis: Gis; strings: StartupStrings }) {
  mapLoadingLabel = strings.mapLoading;
  const router = useRouter();
  const [log, setLog] = useState([] as string[]);
  const [cached, setCached] = useState(false);
  const [journeyId, setJourneyId] = useState(null as string | null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [checkin, setCheckin] = useState(null as { lat: number; lng: number; acc: number; d: number; inside: boolean } | null);
  // E3 — live journey telemetry + arrival auto-detect + pre-start confirmations
  const [live, setLive] = useState(null as Fix | null);
  const [telemetryCount, setTelemetryCount] = useState(0);
  const [repPresent, setRepPresent] = useState(false);
  const [locConfirmed, setLocConfirmed] = useState(false);
  const [exceptionNote, setExceptionNote] = useState("");
  const maxAcc = gis.gps_accuracy_checkin_max_m ?? 25;
  // SB20 — per-factory geofence override, else ENG-06 engine default.
  const fence = visit.factories.geofence_radius_m ?? gis.geofence_default_radius_m ?? 150;
  const arrivalRadius = gis.arrival_detection_radius_m ?? 200;      // ENG-06 arrival_detection_radius_m
  const telemetryS = gis.telemetry_interval_s ?? 30;                // ENG-06 telemetry_interval_s
  const offRouteM = gis.route_deviation?.off_route_m ?? 500;        // ENG-06 route_deviation
  const sustainS = gis.route_deviation?.sustain_s ?? 120;
  const official: [number, number] = [visit.factories.official_lat, visit.factories.official_lng];
  const add = (m: string) => setLog(l => [...l, m]);
  // refs for the tracking loop (M04-021/022/031/037)
  const posRef = useRef(null as Fix | null);
  const lastPostRef = useRef(0);
  const minDRef = useRef(Infinity);
  const devSinceRef = useRef(null as number | null);
  const devDoneRef = useRef(false);
  const stringsRef = useRef(strings); stringsRef.current = strings;

  // STM-OPS — guarded server-action transition (guard = set_operational_state RPC, 0015)
  async function opTransition(next: "on_the_way" | "arrived" | "executing"): Promise<boolean> {
    const fd = new FormData();
    fd.set("visit_id", visit.id); fd.set("next", next);
    const r = await transitionOperationalState({}, fd);
    if (r.error) { add(fmt(strings.logOpBlocked, { error: r.error })); return false; }
    add(fmt(strings.logOpState, { state: next.replace(/_/g, " ") }));
    return true;
  }

  async function downloadPackage() {
    await local.cachePackage(`visit:${visit.id}`, visit.package_versions);
    setCached(true); add(fmt(strings.logCached, { version: visit.package_versions.version_label }));
  }
  async function startJourney() {
    setBusy(true);
    const sb = supabaseBrowser();
    const { data: { user } } = await sb.auth.getUser();
    const { data, error } = await sb.from("journey_sessions")
      .insert({ visit_id: visit.id, inspector_id: user!.id, device_started_at: new Date().toISOString() })  // M04-009 device clock
      .select().single();
    setBusy(false);
    if (error) { add(fmt(strings.logJourneyBlocked, { error: error.message })); return; }
    setJourneyId(data.id); add(strings.logJourneyStarted);
    await opTransition("on_the_way");                                // M04-018 · STM-OPS leg 1
  }

  // M04-021/022/027/031/037 — continuous tracking while journey active:
  // watchPosition feeds live distance (arrival auto-detect display) and a
  // throttled 30s telemetry post (ENG-06 telemetry_interval_s) with
  // lat/lng/altitude/speed/heading/accuracy. Deviation heuristic: distance to
  // destination exceeding closest approach by off_route_m sustained sustain_s
  // records ONE geo_events kind 'deviation'. Everything stops on unmount.
  useEffect(() => {
    if (!journeyId || !navigator.geolocation) return;
    const jId = journeyId;
    const watch = navigator.geolocation.watchPosition(p => {
      const d = distM([p.coords.latitude, p.coords.longitude], official);
      const fix: Fix = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy,
        alt: p.coords.altitude, speed: p.coords.speed, heading: p.coords.heading, d };
      posRef.current = fix; setLive(fix);
      if (d < minDRef.current) { minDRef.current = d; devSinceRef.current = null; }
    }, () => { /* GPS unavailable — one-shot check-in path handles fallback (M04-049) */ }, { enableHighAccuracy: true });
    const timer = setInterval(async () => {
      const fix = posRef.current;
      if (!fix || !navigator.onLine) return;                         // offline: skip; check-in remains the durable record
      if (Date.now() - lastPostRef.current < telemetryS * 1000 - 500) return;  // throttle to engine interval
      lastPostRef.current = Date.now();
      const sb = supabaseBrowser();
      const { error } = await sb.from("geo_events").insert({
        journey_id: jId, visit_id: visit.id, kind: "telemetry",
        observed_lat: fix.lat, observed_lng: fix.lng, accuracy_m: fix.acc,
        altitude_m: fix.alt, speed_mps: fix.speed, heading_deg: fix.heading,   // M04-022
        device_occurred_at: new Date().toISOString(),
        gis_version: "v1-accepted-2026-07-11", device_id: "field-pwa",
      });
      if (!error) setTelemetryCount(c => c + 1);
      // route-deviation heuristic vs closest approach (planned route service is out of MVP1 scope)
      if (fix.d > minDRef.current + offRouteM && !devDoneRef.current) {
        if (devSinceRef.current == null) devSinceRef.current = Date.now();
        else if (Date.now() - devSinceRef.current >= sustainS * 1000) {
          devDoneRef.current = true;
          await sb.from("geo_events").insert({
            journey_id: jId, visit_id: visit.id, kind: "deviation",
            observed_lat: fix.lat, observed_lng: fix.lng, accuracy_m: fix.acc,
            device_occurred_at: new Date().toISOString(),
            gis_version: "v1-accepted-2026-07-11", device_id: "field-pwa",
          });
          add(fmt(stringsRef.current.logDeviation, { d: (fix.d - minDRef.current).toFixed(0), s: sustainS }));
        }
      } else if (fix.d <= minDRef.current + offRouteM) {
        devSinceRef.current = null;
      }
    }, 1000);
    return () => { navigator.geolocation.clearWatch(watch); clearInterval(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journeyId]);

  async function checkIn() {
    setBusy(true);
    const pos = await new Promise<GeolocationPosition | null>(res =>
      navigator.geolocation ? navigator.geolocation.getCurrentPosition(p => res(p), () => res(null), { timeout: 4000 }) : res(null));
    // demo fallback: 60m from official pin, good accuracy — surfaced in the log (M04-049)
    if (!pos) add(strings.logGpsFallback);
    const lat = pos?.coords.latitude ?? visit.factories.official_lat + 0.0005;
    const lng = pos?.coords.longitude ?? visit.factories.official_lng + 0.0002;
    const acc = pos?.coords.accuracy ?? 4.2;
    const d = distM([lat, lng], official);
    if (acc > maxAcc) { add(fmt(strings.logAccuracyBlocked, { acc: acc.toFixed(0), max: maxAcc })); setBusy(false); return; }
    const inside = d <= fence;
    setCheckin({ lat, lng, acc, d, inside }); // SB20 — plot observed position on the map card
    const sb = supabaseBrowser();
    const { error } = await sb.from("geo_events").insert({
      journey_id: journeyId, visit_id: visit.id, kind: "checkin",
      observed_lat: lat, observed_lng: lng, accuracy_m: acc,
      altitude_m: pos?.coords.altitude ?? null,                       // M04-040 altitude at arrival
      device_occurred_at: new Date().toISOString(),                   // M04-039 device timestamp
      geofence_result: inside ? "inside" : "outside", gis_version: "v1-accepted-2026-07-11", device_id: "field-pwa",
    });
    setBusy(false);
    if (error) { add(fmt(strings.logCheckinRejected, { error: error.message })); return; }
    if (!inside) { add(fmt(strings.logOutside, { d: d.toFixed(0), fence })); return; }
    setCheckedIn(true); add(fmt(strings.logInside, { d: d.toFixed(0), acc: acc.toFixed(1) }));
    await sb.from("journey_sessions").update({ status: "arrived" }).eq("id", journeyId!);
    await opTransition("arrived");                                    // M04-046 · STM-OPS leg 2
  }

  // ENG-06 / FLD-GEO-005 — manual exception record (immutable geo_events row)
  async function reportException() {
    const note = exceptionNote.trim();
    const fix = live ?? (checkin ? { lat: checkin.lat, lng: checkin.lng, acc: checkin.acc, alt: null, speed: null, heading: null, d: checkin.d } : null);
    if (!note || !fix) return;
    setBusy(true);
    const sb = supabaseBrowser();
    const { error } = await sb.from("geo_events").insert({
      journey_id: journeyId, visit_id: visit.id, kind: "exception",
      observed_lat: fix.lat, observed_lng: fix.lng, accuracy_m: fix.acc,
      override_reason: note, device_occurred_at: new Date().toISOString(),
      gis_version: "v1-accepted-2026-07-11", device_id: "field-pwa",
    });
    setBusy(false);
    if (error) { add(fmt(strings.logExceptionFailed, { error: error.message })); return; }
    setExceptionNote(""); add(fmt(strings.logExceptionSent, { acc: fix.acc.toFixed(1) }));
  }

  async function startInspection() {
    // M03-010 — mandatory pre-start confirmations (rep present + location confirmed)
    if (!repPresent || !locConfirmed) { add(strings.logPrestartBlocked); return; }
    setBusy(true);
    const sb = supabaseBrowser();
    if (journeyId) {
      // persist confirmations on the journey session (M03-010), stop tracking (M04-055)
      const { error: pErr } = await sb.from("journey_sessions").update({
        prestart: { rep_present: true, location_confirmed: true, confirmed_at_device: new Date().toISOString() },
        status: "completed", ended_at: new Date().toISOString(),
      }).eq("id", journeyId);
      if (!pErr) add(strings.logPrestartSaved);
    }
    const { data, error } = await sb.from("inspections").insert({
      visit_id: visit.id, status: "in_progress", package_version_id: visit.package_versions.id, started_at: new Date().toISOString(),
    }).select().single();
    if (error) { add(fmt(strings.logStartBlocked, { error: error.message })); setBusy(false); return; }
    await opTransition("executing");                                  // M04-055 · STM-OPS leg 3
    await local.cachePackage(data.id, visit.package_versions);  // key by inspection for the workspace
    router.push(`/field/inspection/${data.id}`);
  }
  const existing = visit.inspections?.[0];
  const arrivalDetected = !!live && live.d <= arrivalRadius;          // M04-037 arrival auto-detect
  // SB20 / ENG-08 — official pin + geofence ring; observed dot after check-in; live dot while journeying.
  const mapMarkers: GeoMarkerData[] = [
    { id: "official", lat: visit.factories.official_lat, lng: visit.factories.official_lng,
      label: fmt(strings.officialLabel, { name: visit.factories.name }), tone: "neutral", radiusM: fence },
    ...(live && !checkin ? [{
      id: "live", lat: live.lat, lng: live.lng,
      label: fmt(strings.liveLabel, { acc: live.acc.toFixed(1) }), tone: "medium" as GeoMarkerData["tone"],
    }] : []),
    ...(checkin ? [{
      id: "observed", lat: checkin.lat, lng: checkin.lng,
      label: fmt(strings.youLabel, { acc: checkin.acc.toFixed(1), state: checkin.inside ? strings.insideWord : strings.outsideWord, d: checkin.d.toFixed(0) }),
      tone: (checkin.inside ? "low" : "high") as GeoMarkerData["tone"],
    }] : []),
  ];
  return (
    <div className="ax-stack" style={{ gap: "var(--ax-space-300)" }}>
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{strings.readiness}</h4>
        <div className="ax-stack" style={{ gap: 8 }}>
          <div className="adm-check adm-check--pass" style={{ display: "flex", gap: 8 }}>✓ {strings.window} {new Date(visit.window_start).toISOString().slice(0,16).replace("T"," ")} → {new Date(visit.window_end).toISOString().slice(11,16)}</div>
          <div style={{ display: "flex", gap: 8 }}>{cached ? "✓" : "○"} {strings.packageLine} {visit.package_versions.packages.code} · {visit.package_versions.version_label} {cached && strings.packageCached}</div>
          <div style={{ display: "flex", gap: 8 }}>{journeyId ? "✓" : "○"} {strings.journeySession}</div>
          <div style={{ display: "flex", gap: 8 }}>{telemetryCount > 0 ? "✓" : "○"} {fmt(strings.telemetryRow, { s: telemetryS, n: telemetryCount })}</div>
          <div style={{ display: "flex", gap: 8 }}>{checkedIn ? "✓" : "○"} {fmt(strings.geofenceCheck, { acc: maxAcc, fence })}</div>
        </div>
        {/* F3 · M04-016 — real navigation handoff with the official coordinates */}
        <div className="ax-row" style={{ gap: 8, flexWrap: "wrap", alignItems: "center", marginBlockStart: "var(--ax-space-200)" }}>
          <a className="ax-btn" target="_blank" rel="noopener noreferrer"
            href={`https://maps.google.com/?q=${visit.factories.official_lat},${visit.factories.official_lng}`}>
            {strings.mapsOpen} ↗
          </a>
          <a className="ax-btn" target="_blank" rel="noopener noreferrer"
            href={`geo:${visit.factories.official_lat},${visit.factories.official_lng}?q=${visit.factories.official_lat},${visit.factories.official_lng}`}>
            {strings.mapsGeo}
          </a>
        </div>
        <p className="ax-caption" style={{ marginBlockStart: "var(--ax-space-100)" }}>{strings.mapsCaption}</p>
        {/* F3 · M04-026 — journey progress % (travelled vs initial distance from first fix) */}
        {journeyId && progress != null && (
          <div className="ax-stack" style={{ gap: 4, marginBlockStart: "var(--ax-space-200)" }}>
            <div className="ax-row" style={{ justifyContent: "space-between" }}>
              <span className="ax-caption">{strings.progressLabel}</span>
              <span className="ax-caption ax-numeric">{progress.toFixed(0)}%</span>
            </div>
            <div role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}
              aria-label={strings.progressLabel}
              style={{ blockSize: 8, borderRadius: "var(--ax-radius-full)", background: "var(--ax-color-border)", overflow: "hidden" }}>
              <div style={{ blockSize: "100%", inlineSize: `${progress}%`, background: "var(--ax-color-primary)", borderRadius: "inherit" }} />
            </div>
            <span className="ax-caption ax-numeric">
              {fmt(strings.progressCaption, { remaining: (remainingD ?? 0).toFixed(0), initial: (initialD ?? 0).toFixed(0) })}
            </span>
          </div>
        )}
      </div>
      {/* SB20 / ENG-08 — compact geofence map card (official location is GIS-Admin-owned, FND-007) */}
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <div className="ax-row" style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", marginBlockEnd: "var(--ax-space-150)" }}>
          <h4>{fmt(strings.geofenceHeading, { name: visit.factories.name })} <span className="ax-lozenge ax-lozenge--info">SB20 · ENG-08</span></h4>
          <span className="ax-row" style={{ gap: 8, alignItems: "center" }}>
            {/* M04-037 — live distance-to-fence readout while journey active */}
            {live && !checkedIn && (
              <span className={`ax-lozenge ${arrivalDetected ? "ax-lozenge--success" : "ax-lozenge--info"}`}>
                {arrivalDetected ? strings.arrivalDetected : fmt(strings.liveDistance, { d: live.d.toFixed(0), radius: arrivalRadius })}
              </span>
            )}
            {checkin && (
              <span className={`ax-lozenge ${checkin.inside ? "ax-lozenge--success" : "ax-lozenge--critical"}`}>
                {fmt(checkin.inside ? strings.insideFence : strings.outsideFence, { d: checkin.d.toFixed(0) })}
              </span>
            )}
          </span>
        </div>
        <div style={{ blockSize: 240, borderRadius: "var(--ax-radius-standard)", overflow: "hidden", border: "1px solid var(--ax-color-border)" }} dir="ltr">
          <GeoMap center={[visit.factories.official_lat, visit.factories.official_lng]} zoom={15} markers={mapMarkers} height="100%" />
        </div>
        <p className="ax-caption" style={{ marginBlockStart: "var(--ax-space-100)" }}>
          {fmt(strings.fenceCaption, { fence, source: visit.factories.geofence_radius_m != null ? strings.factoryOverride : strings.engineDefault, acc: maxAcc })}{!checkin && ` ${strings.positionHint}`}
        </p>
      </div>
      {/* M03-010 — mandatory pre-start confirmations, persisted to journey_sessions.prestart */}
      {checkedIn && !existing && (
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{strings.prestartHeading}</h4>
          <div className="ax-stack" style={{ gap: 8 }}>
            <label className="ax-row" style={{ gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={repPresent} onChange={e => setRepPresent(e.target.checked)} />
              <span>{strings.prestartRep}</span>
            </label>
            <label className="ax-row" style={{ gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={locConfirmed} onChange={e => setLocConfirmed(e.target.checked)} />
              <span>{strings.prestartLoc}</span>
            </label>
          </div>
        </div>
      )}
      <div className="ax-row">
        <button className="ax-btn ax-btn--field" onClick={downloadPackage} disabled={cached}>{strings.step1}</button>
        <button className="ax-btn ax-btn--field" onClick={startJourney} disabled={!cached || !!journeyId || busy}>{strings.step2}</button>
        <button className="ax-btn ax-btn--field" onClick={checkIn} disabled={!journeyId || checkedIn || busy}>{strings.step3}</button>
        {existing && existing.status !== "not_started"
          ? <a className="ax-btn ax-btn--field ax-btn--prominent" href={`/field/inspection/${existing.id}`}>{strings.resume}</a>
          : <button className="ax-btn ax-btn--field ax-btn--prominent" onClick={startInspection} disabled={!checkedIn || busy || !repPresent || !locConfirmed}>{strings.step4}</button>}
      </div>
      {/* ENG-06 / FLD-GEO-005 — manual exception record while the journey is active */}
      {journeyId && (
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{strings.exceptionHeading}</h4>
          <div className="ax-row" style={{ gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input className="ax-input" style={{ flex: 1, minInlineSize: 220 }} value={exceptionNote}
              onChange={e => setExceptionNote(e.target.value)} placeholder={strings.exceptionPlaceholder} />
            <button className="ax-btn" onClick={reportException} disabled={busy || !exceptionNote.trim() || (!live && !checkin)}>{strings.exceptionSend}</button>
          </div>
        </div>
      )}
      {log.length > 0 && <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <ul className="ax-timeline">{log.map((m, i) => <li key={i}><div>{m}</div></li>)}</ul>
      </div>}
    </div>
  );
}
