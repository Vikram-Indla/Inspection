"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { supabaseBrowser } from "@/lib/supabase";
import { getVerifiedUser } from "@/lib/verified-user";
import { local, processOutbox, sha256b64, type SyncState } from "@/lib/offline";
import { getFieldDeviceMetadata } from "@/lib/field-device";
import type { GeoMarkerData } from "@/components/GeoMap";
import { transitionOperationalState, requestVisitCancellation, requestVisitReturn } from "./actions";
import ContextualAiPanel from "@/components/ContextualAiPanel";
import EmptyState from "@/components/EmptyState";

// SB19 — strings built server-side with t() and passed as props.
export type StartupStrings = {
  mapLoading: string;
  readiness: string; window: string; packageLine: string; packageCached: string;
  journeySession: string; geofenceCheck: string;
  geofenceHeading: string; insideFence: string; outsideFence: string;
  fenceCaption: string; factoryOverride: string; engineDefault: string; positionHint: string;
  step1: string; step2: string; step3: string; step4: string; resume: string;
  officialLabel: string; plannedLabel: string; youLabel: string; insideWord: string; outsideWord: string;
  logCached: string; logJourneyBlocked: string; logJourneyStarted: string;
  logAccuracyBlocked: string; logCheckinRejected: string; logArrivalRejected: string; logOutside: string; logInside: string; logStartBlocked: string;
  logInspectionCreateFailed: string;
  // E3 — telemetry / arrival auto-detect / deviation / exception / pre-start / STM-OPS
  telemetryRow: string; liveDistance: string; arrivalDetected: string; liveLabel: string;
  prestartHeading: string; prestartRep: string; prestartLoc: string;
  logPrestartBlocked: string; logPrestartSaved: string;
  exceptionHeading: string; exceptionPlaceholder: string; exceptionSend: string;
  logExceptionSent: string; logExceptionFailed: string; logDeviation: string;
  logOpState: string; logOpBlocked: string; logGpsFallback: string;
  mapsGeo: string; mapsCaption: string; progressLabel: string; progressCaption: string; cardsFactoryTitle: string; cardsVisitTitle: string; lblCode: string; lblCity: string; lblRegion: string; lblCr: string; lblLicense: string; lblCoords: string; lblFence: string; lblType: string; lblMode: string; lblWindow: string; lblPackage: string; lblPriority: string; lblPlanningStatus: string; lblPlannerNotes: string; cancelHeading: string; cancelCaption: string; cancelSelectReason: string; cancelCommentPlaceholder: string; cancelEvidenceLabel: string; cancelSubmit: string; cancelRequestedChip: string; cancelReasonsMissing: string; logCancelEvidenceQueued: string; logCancelSent: string; logCancelFailed: string; returnHeading: string; returnCaption: string; returnPlaceholder: string; returnSubmit: string; returnRequestedChip: string; logReturnSent: string; logReturnFailed: string;
  deviceInfo: string; etaLabel: string; etaAvailable: string; etaUnavailable: string; etaStale: string;
  overrideHeading: string; overrideBody: string; overrideReason: string; overrideReasonCode: string; overrideEvidence: string; overrideSafetyException: string; overrideConfirm: string; overrideCancel: string; overridePending: string; overrideQueued: string; overrideApproved: string; overrideClosed: string; logOverrideQueued: string; logOverrideOfflineQueued: string; logOverrideEvidenceRequired: string; logOverrideFailed: string;
  arrivalEvidenceHeading: string; arrivalEvidenceCaption: string; arrivalPhoto: string; arrivalComment: string; arrivalSave: string; arrivalSaved: string; arrivalRequired: string;
  arrivalEvidenceNote: string; arrivalEvidenceFile: string; arrivalEvidenceSubmit: string; arrivalEvidenceQueued: string; arrivalEvidenceMissing: string;
  aiTitle: string; aiDescription: string; aiGenerate: string; aiUnavailable: string; aiEvidence: string; aiAdvisory: string;
};

// Module-level label so the dynamic() loading component (defined outside the
// component) can render the localized text passed via props at render time.
let mapLoadingLabel = "Loading geofence map";

// SB20 / ENG-08 — Mapbox geofence card is client-only (ssr:false).
const GeoMap = dynamic(() => import("@/components/GeoMap"), {
  ssr: false,
  loading: () => <EmptyState glyph="…" title={mapLoadingLabel} inline bare role="status" ariaBusy />,
});

type Insp = { id: string; status: string };
type V = { id: string; window_start: string; window_end: string; execution_mode: string;
  visit_type: string; priority: string | null; notes: string | null; planning_status: string;
  dispatch_lat: number; dispatch_lng: number; dispatch_source: "official" | "planned";
  factories: { name: string; factory_code: string | null; city: string | null; region: string | null;
    cr_number: string | null; license_number: string | null;
    official_lat: number; official_lng: number; geofence_radius_m: number | null };
  package_versions: { id: string; version_label: string; definition: unknown; packages: { code: string } };
  // visits -> inspections is TO-ONE; array tolerated defensively (server normalizes)
  inspections: Insp[] | Insp | null };
type Reason = { key: string; label: string };
type Flags = { cancellationRequested: boolean; returnRequested: boolean };
type InitialOverride = {
  id: string; status: "pending" | "approved" | "rejected" | "expired";
  expires_at: string; decision_event_id: string | null;
};
type Gis = { gps_accuracy_checkin_max_m?: number; geofence_default_radius_m?: number;
  arrival_detection_radius_m?: number; telemetry_interval_s?: number;
  arrival_evidence_required?: boolean;
  route_deviation?: { off_route_m?: number; sustain_s?: number } };

type Fix = { lat: number; lng: number; acc: number; alt: number | null; speed: number | null; heading: number | null; d: number };

function distM(a: [number, number], b: [number, number]) {
  const R = 6371000, dLat = (b[0] - a[0]) * Math.PI / 180, dLng = (b[1] - a[1]) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

const fmt = (s: string, vars: Record<string, string | number>) => { return s.replace(/\{(\w+)\}/g, (m, k) => String(vars[k] ?? m)); };

export default function Startup({ visit, gis, strings, reasons, overrideReasons, initialOverride, flags, appVersion }: { visit: V; gis: Gis; strings: StartupStrings; reasons: Reason[]; overrideReasons: Reason[]; initialOverride: InitialOverride | null; flags: Flags; appVersion: string }) {
  mapLoadingLabel = strings.mapLoading;
  const router = useRouter();
  const [log, setLog] = useState([] as string[]);
  const [cached, setCached] = useState(false);
  const [journeyId, setJourneyId] = useState(null as string | null);
  const [checkedIn, setCheckedIn] = useState(initialOverride?.status === "approved");
  const [busy, setBusy] = useState(false);
  const [checkin, setCheckin] = useState(null as { lat: number; lng: number; acc: number; d: number; inside: boolean } | null);
  // E3 — live journey telemetry + arrival auto-detect + pre-start confirmations
  const [live, setLive] = useState(null as Fix | null);
  const [telemetryCount, setTelemetryCount] = useState(0);
  const [repPresent, setRepPresent] = useState(false);
  const [locConfirmed, setLocConfirmed] = useState(false);
  const [exceptionNote, setExceptionNote] = useState("");
  // F3 — journey progress % (M04-026): baseline = distance-to-factory at first fix
  const [initialD, setInitialD] = useState(null as number | null);
  // F3 — cancellation (M04-056/057/058) + return (M03-006) request state
  const [cancelReason, setCancelReason] = useState("");
  const [cancelComment, setCancelComment] = useState("");
  const [cancelFile, setCancelFile] = useState(null as File | null);
  const [cancelRequested, setCancelRequested] = useState(flags.cancellationRequested);
  const [returnReason, setReturnReason] = useState("");
  const [returnRequested, setReturnRequested] = useState(flags.returnRequested);
  const [deviceInfo, setDeviceInfo] = useState(null as { device_id: string; os_version: string; app_version: string } | null);
  const [eta, setEta] = useState(null as { minutes: number; distance: number; updatedAt: string; provider: string; stale?: boolean } | null);
  const [etaUnavailable, setEtaUnavailable] = useState(false);
  const [pendingOverride, setPendingOverride] = useState(null as { lat: number; lng: number; acc: number; d: number; checkinEventId: string } | null);
  const [overrideReasonKey, setOverrideReasonKey] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideFile, setOverrideFile] = useState(null as File | null);
  const [overrideSafetyException, setOverrideSafetyException] = useState(false);
  const [overrideState, setOverrideState] = useState<"none" | "queued" | "pending" | "approved" | "closed">(
    initialOverride?.status === "approved" ? "approved" : initialOverride?.status === "pending" ? "pending" : initialOverride ? "closed" : "none",
  );
  const [arrivalEventId, setArrivalEventId] = useState(initialOverride?.decision_event_id ?? null as string | null);
  const [arrivalFile, setArrivalFile] = useState(null as File | null);
  const [arrivalComment, setArrivalComment] = useState("");
  const [arrivalEvidenceSaved, setArrivalEvidenceSaved] = useState(false);
  const [journeyStartedAt, setJourneyStartedAt] = useState<string | null>(null);
  const [arrivalAt, setArrivalAt] = useState<string | null>(null);
  const [distanceTravelledM, setDistanceTravelledM] = useState(0);
  const maxAcc = gis.gps_accuracy_checkin_max_m ?? 25;
  // SB20 — per-factory geofence override, else ENG-06 engine default.
  const fence = visit.factories.geofence_radius_m ?? gis.geofence_default_radius_m ?? 150;
  const arrivalRadius = gis.arrival_detection_radius_m ?? 200;      // ENG-06 arrival_detection_radius_m
  const telemetryS = gis.telemetry_interval_s ?? 30;                // ENG-06 telemetry_interval_s
  const offRouteM = gis.route_deviation?.off_route_m ?? 500;        // ENG-06 route_deviation
  const sustainS = gis.route_deviation?.sustain_s ?? 120;
  const dispatchPoint: [number, number] = [visit.dispatch_lat, visit.dispatch_lng];
  const add = (m: string) => setLog(l => [...l, m]);
  // refs for the tracking loop (M04-021/022/031/037)
  const posRef = useRef(null as Fix | null);
  const posObservedAtRef = useRef(0);
  const lastPostRef = useRef(0);
  const minDRef = useRef(Infinity);
  const devSinceRef = useRef(null as number | null);
  const devDoneRef = useRef(false);
  const lastEtaRef = useRef(0);
  const lastFixRef = useRef(null as Fix | null);
  const stringsRef = useRef(strings); stringsRef.current = strings;

  // A reconnect must continue a durable request rather than invite the field
  // user to begin a second arrival attempt. If only the offline outside check-
  // in exists, reconstruct its captured facts so the user can add the governed
  // reason/evidence request after a reload.
  useEffect(() => {
    let cancelled = false;
    void local.peekAll().then(ops => {
      if (cancelled || initialOverride) return;
      const queuedRequest = ops.find(op => op.kind === "geo_override_request" && op.visit_id === visit.id);
      if (queuedRequest?.kind === "geo_override_request") {
        setOverrideState("queued"); return;
      }
      const queuedCheckin = ops.find(op => op.kind === "geo_checkin" && op.visit_id === visit.id);
      if (queuedCheckin?.kind === "geo_checkin") {
        setCheckin({ lat: queuedCheckin.observed_lat, lng: queuedCheckin.observed_lng, acc: queuedCheckin.accuracy_m, d: queuedCheckin.distance_m, inside: false });
        setPendingOverride({ lat: queuedCheckin.observed_lat, lng: queuedCheckin.observed_lng, acc: queuedCheckin.accuracy_m, d: queuedCheckin.distance_m, checkinEventId: queuedCheckin.id });
      }
    });
    return () => { cancelled = true; };
  }, [initialOverride, visit.id]);

  // Server-rendered state is authoritative after an Operations decision. A
  // short, bounded refresh while pending keeps the field workflow usable
  // without granting the iPad any approval authority.
  useEffect(() => {
    if (!initialOverride) return;
    if (initialOverride.status === "approved") {
      setCheckedIn(true); setOverrideState("approved"); setArrivalEventId(initialOverride.decision_event_id);
    } else if (initialOverride.status === "pending") {
      setOverrideState("pending");
    } else {
      setOverrideState("closed"); setPendingOverride(null);
    }
  }, [initialOverride]);
  useEffect(() => {
    if (overrideState !== "pending") return;
    const timer = window.setInterval(() => router.refresh(), 15_000);
    return () => window.clearInterval(timer);
  }, [overrideState, router]);
  useEffect(() => {
    if (overrideState !== "queued") return;
    const retry = () => {
      void processOutbox(state => {
        if (state === "synced") { setOverrideState("pending"); router.refresh(); }
      });
    };
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [overrideState, router]);

  // STM-OPS — guarded server-action transition (guard = set_operational_state RPC, 0015)
  async function opTransition(next: "on_the_way" | "arrived" | "executing"): Promise<boolean> {
    const fd = new FormData();
    fd.set("visit_id", visit.id); fd.set("next", next);
    const r = await transitionOperationalState({}, fd);
    if (r.error) { add(strings.logOpBlocked); return false; }
    add(fmt(strings.logOpState, { state: next.replace(/_/g, " ") }));
    return true;
  }

  async function downloadPackage() {
    await local.cachePackage(`visit:${visit.id}`, visit.package_versions);
    setCached(true); add(fmt(strings.logCached, { version: visit.package_versions.version_label }));
  }
  function captureDeviceInfo() {
    const captured = getFieldDeviceMetadata(appVersion);
    return { device_id: captured.deviceId, os_version: captured.osVersion, app_version: captured.applicationVersion };
  }

  async function refreshEta(fix: Fix, activeJourneyId: string) {
    if (Date.now() - lastEtaRef.current < telemetryS * 1000 - 500) return;
    lastEtaRef.current = Date.now();
    if (!navigator.onLine) {
      const cachedEstimate = await local.getRouteEstimate(visit.id);
      if (cachedEstimate) {
        setEta({
          minutes: cachedEstimate.etaMinutes,
          distance: cachedEstimate.remainingDistanceM,
          updatedAt: cachedEstimate.estimatedAt,
          provider: cachedEstimate.provider,
          stale: true,
        });
      }
      setEtaUnavailable(!cachedEstimate);
      return;
    }
    try {
      const response = await fetch("/api/routing/eta", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: { lat: fix.lat, lng: fix.lng }, destination: { lat: visit.dispatch_lat, lng: visit.dispatch_lng } }),
      });
      const result = await response.json() as { status: string; etaMinutes?: number; distanceMeters?: number; calculatedAt?: string; provider?: string };
      if (!response.ok || result.status !== "ok" || result.etaMinutes == null || result.distanceMeters == null || !result.calculatedAt) {
        throw new Error("routing provider unavailable");
      }
      setEtaUnavailable(false);
      const provider = result.provider ?? "mapbox_directions";
      setEta({ minutes: result.etaMinutes, distance: result.distanceMeters, updatedAt: result.calculatedAt, provider });
      await local.cacheRouteEstimate(visit.id, {
        etaMinutes: result.etaMinutes,
        remainingDistanceM: result.distanceMeters,
        estimatedAt: result.calculatedAt,
        provider,
        mode: "production",
        refreshAfterMs: telemetryS * 1000,
      });
      const sb = supabaseBrowser();
      await sb.from("journey_sessions").update({
        eta_minutes: result.etaMinutes, remaining_distance_m: result.distanceMeters,
        route_provider: provider, eta_updated_at: result.calculatedAt,
        routing_provider: provider, route_estimate_mode: "production", route_estimated_at: result.calculatedAt,
      }).eq("id", activeJourneyId);
    } catch {
      const cachedEstimate = await local.getRouteEstimate(visit.id);
      if (cachedEstimate) {
        setEta({
          minutes: cachedEstimate.etaMinutes,
          distance: cachedEstimate.remainingDistanceM,
          updatedAt: cachedEstimate.estimatedAt,
          provider: cachedEstimate.provider,
          stale: true,
        });
      }
      setEtaUnavailable(!cachedEstimate);
    }
  }

  async function startJourney() {
    setBusy(true);
    const sb = supabaseBrowser();
    const { data: { user } } = await getVerifiedUser(sb);
    const capturedDevice = captureDeviceInfo();
    const { data, error } = await sb.from("journey_sessions")
      .insert({
        visit_id: visit.id, inspector_id: user!.id, device_started_at: new Date().toISOString(),
        device_info: capturedDevice, device_id: capturedDevice.device_id,
        device_os_version: capturedDevice.os_version, application_version: capturedDevice.app_version,
      })  // M04-009/012
      .select().single();
    setBusy(false);
    if (error || !data) {
      // Provider/RLS detail stays diagnostic-only. The field timeline must never
      // expose raw database text (DEC-012 cross-cutting error-sink rule).
      // eslint-disable-next-line no-console
      console.error("[field start journey]", error);
      add(strings.logJourneyBlocked);
      return;
    }
    setDeviceInfo(capturedDevice); setJourneyId(data.id); setJourneyStartedAt(new Date().toISOString()); add(strings.logJourneyStarted);
    await opTransition("on_the_way");                                // M04-018 · STM-OPS leg 1
  }

  // M04-021/022/027/031/037 — continuous tracking while journey active:
  // watchPosition feeds live distance (arrival auto-detect display) and a
  // throttled 30s telemetry post (ENG-06 telemetry_interval_s) with
  // lat/lng/altitude/speed/heading/accuracy. Deviation heuristic: distance to
  // destination exceeding closest approach by off_route_m sustained sustain_s
  // records ONE geo_events kind 'deviation'. Everything stops on unmount.
  useEffect(() => {
    // DEC-002: telemetry exists only while the journey is active.  Arrival or
    // an approved arrival override tears down both the watcher and timer; no
    // background location collection continues during the inspection itself.
    if (!journeyId || checkedIn || !navigator.geolocation) return;
    const jId = journeyId;
    const watch = navigator.geolocation.watchPosition(p => {
      const d = distM([p.coords.latitude, p.coords.longitude], dispatchPoint);
      const fix: Fix = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy,
        alt: p.coords.altitude, speed: p.coords.speed, heading: p.coords.heading, d };
      const prior = lastFixRef.current;
      if (prior) setDistanceTravelledM(total => total + distM([prior.lat, prior.lng], [fix.lat, fix.lng]));
      lastFixRef.current = fix;
      posRef.current = fix; posObservedAtRef.current = Date.now(); setLive(fix);
      void refreshEta(fix, jId);                                  // M04-017/024 provider ETA, refreshed at telemetry cadence
      // M04-026 — first fix after journey start anchors the progress baseline
      setInitialD(prev => prev ?? d);
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
  }, [journeyId, checkedIn]);

  // M04-024 — the last provider result remains visible but explicitly stale
  // while offline; reconnect triggers an immediate provider refresh. It never
  // mutates workflow state or pretends a straight-line estimate is a road ETA.
  useEffect(() => {
    if (!journeyId) return;
    const markOffline = async () => {
      const cachedEstimate = await local.getRouteEstimate(visit.id);
      if (!cachedEstimate) { setEtaUnavailable(true); return; }
      setEta({
        minutes: cachedEstimate.etaMinutes,
        distance: cachedEstimate.remainingDistanceM,
        updatedAt: cachedEstimate.estimatedAt,
        provider: cachedEstimate.provider,
        stale: true,
      });
    };
    const refreshOnline = () => {
      const fix = posRef.current;
      if (!fix) return;
      lastEtaRef.current = 0;
      void refreshEta(fix, journeyId);
    };
    window.addEventListener("offline", markOffline);
    window.addEventListener("online", refreshOnline);
    return () => {
      window.removeEventListener("offline", markOffline);
      window.removeEventListener("online", refreshOnline);
    };
    // refreshEta reads current visit/config values and is intentionally bound
    // to this mounted journey lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journeyId, visit.id]);

  async function checkIn() {
    if (overrideState !== "none") return;
    setBusy(true);
    // A continuous journey fix is the best available device observation. Reuse
    // it briefly instead of requiring a second radio acquisition at the gate;
    // request a fresh one-shot fix only when tracking has not produced a recent
    // position. This remains fail-closed: no synthetic coordinates are used.
    let fix = Date.now() - posObservedAtRef.current <= 15_000 ? posRef.current : null;
    if (!fix) {
      const pos = await new Promise<GeolocationPosition | null>(res =>
        navigator.geolocation ? navigator.geolocation.getCurrentPosition(p => res(p), () => res(null), { enableHighAccuracy: true, timeout: 4000 }) : res(null));
      if (pos) {
        const d = distM([pos.coords.latitude, pos.coords.longitude], dispatchPoint);
        fix = { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy,
          alt: pos.coords.altitude, speed: pos.coords.speed, heading: pos.coords.heading, d };
      }
    }
    if (!fix) { add(strings.logGpsFallback); setBusy(false); return; }
    const { lat, lng, acc } = fix;
    const d = distM([lat, lng], dispatchPoint);
    if (acc > maxAcc) { add(fmt(strings.logAccuracyBlocked, { acc: acc.toFixed(0), max: maxAcc })); setBusy(false); return; }
    const inside = d <= fence;
    setCheckin({ lat, lng, acc, d, inside }); // SB20 — plot observed position on the map card
    const sb = supabaseBrowser();
    const checkinEventId = crypto.randomUUID();
    const observedAt = new Date().toISOString();
    let immutableCheckin: { id: string } | null = null;
    let error: unknown = null;
    if (!navigator.onLine && !inside) {
      // 4A: queue only the immutable OUTSIDE observation. It is followed by
      // photo evidence and a request, but cannot unlock arrival while offline.
      await local.enqueue({
        kind: "geo_checkin", id: checkinEventId, journey_id: journeyId!, visit_id: visit.id,
        observed_lat: lat, observed_lng: lng, accuracy_m: acc, altitude_m: fix.alt ?? null,
        distance_m: d, device_occurred_at: observedAt, gis_version: "v1-accepted-2026-07-11",
        device_id: deviceInfo?.device_id ?? "field-pwa", queued_at: observedAt,
      });
      immutableCheckin = { id: checkinEventId };
    } else if (!navigator.onLine) {
      // An inside-fence arrival is outside this governed-request flow. Never
      // create a local arrival that could bypass the canonical state guard.
      error = new Error("online confirmation required for inside-fence arrival");
    } else {
      const result = await sb.from("geo_events").insert({
        id: checkinEventId, journey_id: journeyId, visit_id: visit.id, kind: "checkin",
        observed_lat: lat, observed_lng: lng, accuracy_m: acc,
        altitude_m: fix.alt ?? null,                                  // M04-040 altitude at arrival
        device_occurred_at: observedAt,                               // M04-039 device timestamp
        geofence_result: inside ? "inside" : "outside", gis_version: "v1-accepted-2026-07-11", device_id: "field-pwa",
      }).select("id").single();
      immutableCheckin = result.data; error = result.error;
    }
    setBusy(false);
    if (error || !immutableCheckin) {
      // eslint-disable-next-line no-console
      console.error("[field check-in]", error);
      add(strings.logCheckinRejected);
      return;
    }
    if (!inside && immutableCheckin) {
      setPendingOverride({ lat, lng, acc, d, checkinEventId: immutableCheckin.id });
      add(fmt(strings.logOutside, { d: d.toFixed(0), fence }));
      return;
    }
    const arrivedAt = new Date().toISOString();
    // M04-039/047 — arrival is a distinct immutable geo event, separate from
    // the check-in event that establishes the geofence result.
    const { data: immutableArrival, error: arrivalError } = await sb.from("geo_events").insert({
      journey_id: journeyId, visit_id: visit.id, kind: "arrival",
      observed_lat: lat, observed_lng: lng, accuracy_m: acc,
      altitude_m: fix.alt ?? null, device_occurred_at: arrivedAt,
      geofence_result: "inside", gis_version: "v1-accepted-2026-07-11",
      device_id: deviceInfo?.device_id ?? "field-pwa",
    }).select("id").single();
    if (arrivalError || !immutableArrival) {
      // Do not present arrival as complete when its immutable event was not
      // persisted; the operator can retry without creating a false state.
      // eslint-disable-next-line no-console
      console.error("[field arrival]", arrivalError);
      add(strings.logArrivalRejected);
      return;
    }
    setArrivalEventId(immutableArrival.id); setCheckedIn(true); setArrivalAt(arrivedAt);
    add(fmt(strings.logInside, { d: d.toFixed(0), acc: acc.toFixed(1) }));
    await sb.from("journey_sessions").update({ status: "arrived" }).eq("id", journeyId!);
    await opTransition("arrived");                                    // M04-046 · STM-OPS leg 2
  }

  async function requestGpsOverride() {
    const explanation = overrideReason.trim();
    const requiresPhoto = !overrideSafetyException;
    if (!pendingOverride || !journeyId || !overrideReasonKey || !explanation) return;
    if (overrideSafetyException && overrideReasonKey !== "safety_security") {
      add(strings.logOverrideEvidenceRequired); return;
    }
    if (requiresPhoto && !overrideFile) {
      add(strings.logOverrideEvidenceRequired); return;
    }
    setBusy(true);
    try {
      const requestId = crypto.randomUUID();
      const capturedAt = new Date().toISOString();
      if (overrideFile) {
        const b64 = btoa(String.fromCharCode(...new Uint8Array(await overrideFile.arrayBuffer())));
        const sha = await sha256b64(b64);
        // The evidence op is enqueued first. Replay order prevents the guarded
        // request RPC from seeing an approvable request before photo custody is durable.
        await local.enqueue({
          kind: "evidence", inspection_id: null, visit_id: visit.id,
          linked_type: "geo_override", linked_id: requestId, evidence_type: "photo",
          name: `geo-override-${requestId}-${overrideFile.name}`,
          mime: overrideFile.type || "image/jpeg", data_b64: b64,
          captured_at: capturedAt, sha256: sha, queued_at: capturedAt,
        });
      }
      await local.enqueue({
        kind: "geo_override_request", request_id: requestId, visit_id: visit.id,
        journey_id: journeyId, checkin_event_id: pendingOverride.checkinEventId,
        reason_key: overrideReasonKey, explanation,
        safety_security_exception: overrideSafetyException, queued_at: capturedAt,
      });
      let synced = false;
      await processOutbox((state: SyncState) => { synced = state === "synced"; });
      setOverrideState(synced ? "pending" : "queued");
      setPendingOverride(null); setOverrideReasonKey(""); setOverrideReason("");
      setOverrideFile(null); setOverrideSafetyException(false);
      add(synced ? strings.logOverrideQueued : strings.logOverrideOfflineQueued);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[field geo override request]", error);
      add(strings.logOverrideFailed);
    } finally { setBusy(false); }
  }

  async function saveArrivalEvidence() {
    if (!arrivalEventId || (!arrivalFile && !arrivalComment.trim())) return;
    setBusy(true);
    try {
      const capturedAt = new Date().toISOString();
      if (arrivalFile) {
        const b64 = btoa(String.fromCharCode(...new Uint8Array(await arrivalFile.arrayBuffer())));
        const sha = await sha256b64(b64);
        await local.enqueue({
          kind: "evidence", inspection_id: visit.id, visit_id: visit.id,
          linked_type: "arrival", linked_id: arrivalEventId, evidence_type: "photo",
          evidence_note: arrivalComment.trim() || undefined,
          name: `arrival-${arrivalEventId}-${arrivalFile.name}`, mime: arrivalFile.type || "image/jpeg",
          data_b64: b64, captured_at: capturedAt, sha256: sha, queued_at: capturedAt,
        });
      } else {
        const bytes = new TextEncoder().encode(arrivalComment.trim());
        const b64 = btoa(String.fromCharCode(...bytes));
        const sha = await sha256b64(b64);
        await local.enqueue({
          kind: "evidence", inspection_id: visit.id, visit_id: visit.id,
          linked_type: "arrival", linked_id: arrivalEventId, evidence_type: "comment",
          evidence_note: arrivalComment.trim(), name: `arrival-${arrivalEventId}-comment.txt`, mime: "text/plain",
          data_b64: b64, captured_at: capturedAt, sha256: sha, queued_at: capturedAt,
        });
      }
      await processOutbox(() => { /* failure remains queued and is retried by the field sync engine */ });
      setArrivalEvidenceSaved(true); add(strings.arrivalSaved);
    } finally { setBusy(false); }
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
    if (error) {
      // eslint-disable-next-line no-console
      console.error("[field exception record]", error);
      add(strings.logExceptionFailed);
      return;
    }
    setExceptionNote(""); add(fmt(strings.logExceptionSent, { acc: fix.acc.toFixed(1) }));
  }

  // F3 · M04-056/057/058 — cancellation REQUEST at arrival. Evidence (optional
  // photo) is queued durably in the outbox linked to the CANCELLATION (visit-
  // anchored, 0020) before the request itself; the request flags the visit and
  // notifies planner/ops — planning_status stays untouched (planner/ops decide).
  async function submitCancellation() {
    if (!cancelReason) return;
    setBusy(true);
    try {
      if (cancelFile) {
        const b64 = btoa(String.fromCharCode(...new Uint8Array(await cancelFile.arrayBuffer())));
        const sha = await sha256b64(b64);
        await local.enqueue({
          kind: "evidence", inspection_id: visit.id, visit_id: visit.id,
          linked_type: "cancellation", linked_id: visit.id,
          name: `cancellation-${Date.now()}-${cancelFile.name}`, mime: cancelFile.type || "image/jpeg",
          data_b64: b64, captured_at: new Date().toISOString(), sha256: sha, queued_at: new Date().toISOString(),
        });
        add(fmt(strings.logCancelEvidenceQueued, { name: cancelFile.name, sha: sha.slice(0, 12) }));
        processOutbox(() => { /* startup has no sync banner; failures stay queued for the workspace runner */ });
      }
      const fd = new FormData();
      fd.set("visit_id", visit.id); fd.set("reason_key", cancelReason); fd.set("comment", cancelComment);
      const r = await requestVisitCancellation({}, fd);
      if (r.error) { add(strings.logCancelFailed); return; }
      setCancelRequested(true);           // M04-056 — stop transition to execution
      add(strings.logCancelSent);
    } finally { setBusy(false); }
  }

  // F3 · M03-006 — inspector return for blocked visits: assignment -> returned,
  // visit flagged return_requested, planner notified (request_visit_return, 0020).
  async function submitReturn() {
    const reason = returnReason.trim();
    if (!reason) return;
    setBusy(true);
    const fd = new FormData();
    fd.set("visit_id", visit.id); fd.set("reason", reason);
    const r = await requestVisitReturn({}, fd);
    setBusy(false);
    if (r.error) { add(strings.logReturnFailed); return; }
    setReturnRequested(true);
    add(strings.logReturnSent);
  }

  async function startInspection() {
    // M04-056 — a requested cancellation stops the transition to execution
    if (cancelRequested) { add(fmt(strings.logStartBlocked, { error: strings.cancelRequestedChip })); return; }
    if (returnRequested) { add(fmt(strings.logStartBlocked, { error: strings.returnRequestedChip })); return; }
    if (gis.arrival_evidence_required && !arrivalEvidenceSaved) { add(fmt(strings.logStartBlocked, { error: strings.arrivalRequired })); return; }
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
    if (error) {
      // Provider/constraint details stay in diagnostics; field users receive
      // stable localized recovery guidance, never raw database text.
      // eslint-disable-next-line no-console
      console.error("[field start inspection]", error);
      add(strings.logInspectionCreateFailed);
      setBusy(false);
      return;
    }
    await opTransition("executing");                                  // M04-055 · STM-OPS leg 3
    await local.cachePackage(data.id, visit.package_versions);  // key by inspection for the workspace
    router.push(`/field/inspection/${data.id}`);
  }
  // visits -> inspections is TO-ONE (object | null); arrays tolerated defensively.
  const existing = Array.isArray(visit.inspections) ? visit.inspections[0] : (visit.inspections ?? undefined);
  const arrivalDetected = !!live && live.d <= arrivalRadius;          // M04-037 arrival auto-detect
  const started = !!existing && existing.status !== "not_started";
  // M04-026 — travelled vs initial distance-to-factory from the first fix; clamped 0–100.
  const remainingD = checkedIn ? 0 : live?.d ?? null;
  const progress = initialD != null && initialD > 0 && remainingD != null
    ? Math.min(100, Math.max(0, ((initialD - remainingD) / initialD) * 100))
    : null;
  // SB20 / ENG-08 — governed dispatch point + geofence ring; observed dot after check-in; live dot while journeying.
  const mapMarkers: GeoMarkerData[] = [
    { id: "dispatch", lat: visit.dispatch_lat, lng: visit.dispatch_lng,
      label: fmt(visit.dispatch_source === "official" ? strings.officialLabel : strings.plannedLabel, { name: visit.factories.name }), tone: "neutral", radiusM: fence },
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
  const journeyDurationM = journeyStartedAt
    ? Math.max(0, Math.round(((new Date(arrivalAt ?? new Date().toISOString()).getTime() - new Date(journeyStartedAt).getTime()) / 60000)))
    : null;
  return (
    <div className="stack" style={{ gap: "var(--ax-space-300)" }}>
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }} data-testid="field-device-readiness">
        <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{strings.readiness}</h4>
        <div className="stack" style={{ gap: 8 }}>
          <div className="adm-check adm-check--pass" style={{ display: "flex", gap: 8 }}>✓ {strings.window} {new Date(visit.window_start).toISOString().slice(0,16).replace("T"," ")} → {new Date(visit.window_end).toISOString().slice(11,16)}</div>
          <div style={{ display: "flex", gap: 8 }}>{cached ? "✓" : "○"} {strings.packageLine} {visit.package_versions.packages.code} · {visit.package_versions.version_label} {cached && strings.packageCached}</div>
          <div style={{ display: "flex", gap: 8 }}>{journeyId ? "✓" : "○"} {strings.journeySession}</div>
          <div style={{ display: "flex", gap: 8 }}>{deviceInfo ? "✓" : "○"} {strings.deviceInfo}{deviceInfo ? ` · ${deviceInfo.os_version} · app ${deviceInfo.app_version}` : ""}</div>
          <div style={{ display: "flex", gap: 8 }}>{telemetryCount > 0 ? "✓" : "○"} {fmt(strings.telemetryRow, { s: telemetryS, n: telemetryCount })}</div>
          <div style={{ display: "flex", gap: 8 }} data-testid="route-estimate">{eta ? "✓" : "○"} {strings.etaLabel} {eta
            ? <span>{fmt(strings.etaAvailable, { minutes: eta.minutes, distance: eta.distance, at: new Date(eta.updatedAt).toISOString().slice(11, 16) })} · {eta.provider}{eta.stale ? ` · ${strings.etaStale}` : ""}</span>
            : etaUnavailable ? strings.etaUnavailable : "—"}</div>
          <div style={{ display: "flex", gap: 8 }}>{checkedIn ? "✓" : "○"} {fmt(strings.geofenceCheck, { acc: maxAcc, fence })}</div>
        </div>
        {/* F3 · M04-016 — real navigation handoff with this Visit's governed dispatch coordinates */}
        <div className="row" style={{ gap: 8, flexWrap: "wrap", alignItems: "center", marginBlockStart: "var(--ax-space-200)" }}>
          <a className="ax-btn" target="_blank" rel="noopener noreferrer"
            href={`geo:${visit.dispatch_lat},${visit.dispatch_lng}?q=${visit.dispatch_lat},${visit.dispatch_lng}`}>
            {strings.mapsGeo}
          </a>
        </div>
        <p className="t-caption" style={{ marginBlockStart: "var(--ax-space-100)" }}>{strings.mapsCaption}</p>
        {/* F3 · M04-026 — journey progress % (travelled vs initial distance from first fix) */}
        {journeyId && progress != null && (
          <div className="stack" style={{ gap: 4, marginBlockStart: "var(--ax-space-200)" }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="t-caption">{strings.progressLabel}</span>
              <span className="t-caption ax-numeric">{progress.toFixed(0)}%</span>
            </div>
            <div role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}
              aria-label={strings.progressLabel}
              style={{ blockSize: 8, borderRadius: "var(--ax-radius-full)", background: "var(--ax-color-border)", overflow: "hidden" }}>
              <div style={{ blockSize: "100%", inlineSize: `${progress}%`, background: "var(--ax-color-primary)", borderRadius: "inherit" }} />
            </div>
            <span className="t-caption ax-numeric">
              {fmt(strings.progressCaption, { remaining: (remainingD ?? 0).toFixed(0), initial: (initialD ?? 0).toFixed(0) })}
            </span>
          </div>
        )}
      </div>
      <ContextualAiPanel
        surface="preparation_assistant"
        title={strings.aiTitle}
        description={strings.aiDescription}
        context={JSON.stringify({ visit_id: visit.id, factory: visit.factories.factory_code, package: visit.package_versions.version_label })}
        targetRef={visit.id}
        evidenceRefs={["AC-0107", "M03-009", "SCR-IPAD-610", `VISIT-${visit.id}`]}
        generateLabel={strings.aiGenerate}
        unavailableLabel={strings.aiUnavailable}
        evidenceLabel={strings.aiEvidence}
        advisoryLabel={strings.aiAdvisory}
      />
      {/* SB20 / ENG-08 — compact geofence map card; official and visit-selected coordinates remain distinct (FND-007/M01-046). */}
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", marginBlockEnd: "var(--ax-space-150)" }}>
          <h4>{fmt(strings.geofenceHeading, { name: visit.factories.name })} <span className="ax-lozenge ax-lozenge--info">SB20 · ENG-08</span></h4>
          <span className="row" style={{ gap: 8, alignItems: "center" }}>
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
          <GeoMap center={[visit.dispatch_lat, visit.dispatch_lng]} zoom={15} markers={mapMarkers} height="100%" />
        </div>
        <p className="t-caption" style={{ marginBlockStart: "var(--ax-space-100)" }}>
          {fmt(strings.fenceCaption, { fence, source: visit.factories.geofence_radius_m != null ? strings.factoryOverride : strings.engineDefault, acc: maxAcc })}{!checkin && ` ${strings.positionHint}`}
        </p>
      </div>
      {pendingOverride && !checkedIn && (
        <div className="ax-surface" role="dialog" aria-modal="false" aria-labelledby="gps-override-heading"
          style={{ padding: "var(--ax-space-300)", borderColor: "var(--ax-color-critical)" }}>
          <h4 id="gps-override-heading" style={{ marginBlockEnd: "var(--ax-space-100)" }}>{strings.overrideHeading}</h4>
          <p className="t-caption">{fmt(strings.overrideBody, { d: pendingOverride.d.toFixed(0), fence, lat: pendingOverride.lat.toFixed(6), lng: pendingOverride.lng.toFixed(6) })}</p>
          <label className="ax-field"><span className="ax-field__label">{strings.overrideReasonCode}</span>
            <select className="ax-select" value={overrideReasonKey} onChange={e => {
              setOverrideReasonKey(e.target.value);
              if (e.target.value !== "safety_security") setOverrideSafetyException(false);
            }}>
              <option value="">—</option>
              {overrideReasons.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          </label>
          <label className="ax-field"><span className="ax-field__label">{strings.overrideReason}</span>
            <textarea className="ax-textarea" rows={2} value={overrideReason} onChange={e => setOverrideReason(e.target.value)} />
          </label>
          <label className="ax-field"><span className="ax-field__label">{strings.overrideEvidence}</span>
            <input className="ax-input" type="file" accept="image/*" onChange={e => setOverrideFile(e.target.files?.[0] ?? null)} />
          </label>
          <label className="row" style={{ gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={overrideSafetyException} disabled={overrideReasonKey !== "safety_security"}
              onChange={e => setOverrideSafetyException(e.target.checked)} />
            <span>{strings.overrideSafetyException}</span>
          </label>
          <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
            <button className="ax-btn ax-btn--subtle" onClick={() => { setPendingOverride(null); setOverrideReason(""); setOverrideReasonKey(""); setOverrideFile(null); setOverrideSafetyException(false); }}>{strings.overrideCancel}</button>
            <button className="ax-btn ax-btn--danger" onClick={requestGpsOverride}
              disabled={busy || !overrideReasonKey || !overrideReason.trim() || (!overrideSafetyException && !overrideFile)}>{strings.overrideConfirm}</button>
          </div>
        </div>
      )}
      {(overrideState === "queued" || overrideState === "pending") && !checkedIn && (
        <div className="ax-banner ax-banner--warning" role="status"><div>
          {overrideState === "queued" ? strings.overrideQueued : strings.overridePending}
          {initialOverride?.status === "pending" && <> · <span className="ax-numeric">{new Date(initialOverride.expires_at).toISOString().slice(0, 16).replace("T", " ")} UTC</span></>}
        </div></div>
      )}
      {overrideState === "approved" && (
        <div className="ax-banner ax-banner--success" role="status"><div>{strings.overrideApproved}</div></div>
      )}
      {overrideState === "closed" && (
        <div className="ax-banner ax-banner--critical" role="status"><div>{strings.overrideClosed}</div></div>
      )}
      {/* M04-050..054 — arrival confirmation, context cards and journey summary. */}
      {checkedIn && (
        <section className="ax-surface" style={{ padding: "var(--ax-space-300)" }} aria-label={strings.cardsVisitTitle}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h4 style={{ marginBlockEnd: "var(--ax-space-100)" }}>{strings.cardsVisitTitle}</h4>
              <p className="t-caption">{arrivalAt ? new Date(arrivalAt).toISOString().replace("T", " ").slice(0, 19) : "—"} · {strings.insideFence}</p>
            </div>
            <span className="ax-lozenge ax-lozenge--success">{strings.arrivalDetected}</span>
          </div>
          <div className="row" style={{ gap: "var(--ax-space-200)", flexWrap: "wrap", marginBlock: "var(--ax-space-200)" }}>
            <span className="ax-badge">{strings.progressLabel}: {progress == null ? "—" : `${progress.toFixed(0)}%`}</span>
            <span className="ax-badge">{strings.lblCoords}: {checkin ? `${checkin.lat.toFixed(5)}, ${checkin.lng.toFixed(5)}` : "—"}</span>
            <span className="ax-badge">GPS ±{checkin?.acc.toFixed(1) ?? "—"}m</span>
            <span className="ax-badge">{strings.lblWindow}: {journeyDurationM == null ? "—" : `${journeyDurationM} min`}</span>
            <span className="ax-badge">{Math.round(distanceTravelledM)} m travelled</span>
          </div>
          <div className="stack" style={{ gap: "var(--ax-space-150)" }}>
            <details open>
              <summary style={{ cursor: "pointer", font: "var(--ax-text-body-strong)" }}>{strings.cardsFactoryTitle}</summary>
              <dl className="ax-detail-grid" style={{ marginBlockStart: "var(--ax-space-150)" }}>
                <dt>{strings.lblCode}</dt><dd>{visit.factories.factory_code ?? "—"}</dd>
                <dt>{strings.lblCity}</dt><dd>{visit.factories.city ?? "—"}</dd>
                <dt>{strings.lblRegion}</dt><dd>{visit.factories.region ?? "—"}</dd>
                <dt>{strings.lblCr}</dt><dd>{visit.factories.cr_number ?? "—"}</dd>
                <dt>{strings.lblLicense}</dt><dd>{visit.factories.license_number ?? "—"}</dd>
                <dt>{strings.lblCoords}</dt><dd>{`${visit.factories.official_lat}, ${visit.factories.official_lng}`}</dd>
                <dt>{strings.lblFence}</dt><dd>{fence} m</dd>
              </dl>
            </details>
            <details open>
              <summary style={{ cursor: "pointer", font: "var(--ax-text-body-strong)" }}>{strings.cardsVisitTitle}</summary>
              <dl className="ax-detail-grid" style={{ marginBlockStart: "var(--ax-space-150)" }}>
                <dt>{strings.lblType}</dt><dd>{visit.visit_type}</dd>
                <dt>{strings.lblMode}</dt><dd>{visit.execution_mode}</dd>
                <dt>{strings.lblWindow}</dt><dd>{new Date(visit.window_start).toISOString().slice(0, 16).replace("T", " ")} → {new Date(visit.window_end).toISOString().slice(11, 16)}</dd>
                <dt>{strings.lblPackage}</dt><dd>{visit.package_versions.packages.code} · {visit.package_versions.version_label}</dd>
                <dt>{strings.lblPriority}</dt><dd>{visit.priority ?? "—"}</dd>
                <dt>{strings.lblPlanningStatus}</dt><dd>{visit.planning_status}</dd>
                <dt>{strings.lblPlannerNotes}</dt><dd>{visit.notes ?? "—"}</dd>
              </dl>
            </details>
          </div>
          {arrivalEventId && (
            <div className="ax-surface" style={{ padding: "var(--ax-space-200)", marginBlockStart: "var(--ax-space-200)" }}>
              <h5 style={{ marginBlockEnd: "var(--ax-space-100)" }}>{strings.arrivalEvidenceHeading}</h5>
              <p className="t-caption">{strings.arrivalEvidenceCaption}</p>
              {arrivalEvidenceSaved ? <span className="ax-lozenge ax-lozenge--success">{strings.arrivalSaved}</span> : (
                <div className="stack" style={{ gap: "var(--ax-space-100)" }}>
                  <label className="ax-field"><span className="ax-field__label">{strings.arrivalPhoto}</span>
                    <input className="ax-input" type="file" accept="image/*" onChange={e => setArrivalFile(e.target.files?.[0] ?? null)} />
                  </label>
                  <label className="ax-field"><span className="ax-field__label">{strings.arrivalComment}</span>
                    <textarea className="ax-textarea" rows={2} value={arrivalComment} onChange={e => setArrivalComment(e.target.value)} />
                  </label>
                  <button className="ax-btn" onClick={saveArrivalEvidence} disabled={busy || (!arrivalFile && !arrivalComment.trim())}>{strings.arrivalSave}</button>
                </div>
              )}
            </div>
          )}
        </section>
      )}
      {/* M03-010 — mandatory pre-start confirmations, persisted to journey_sessions.prestart */}
      {checkedIn && !existing && (
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{strings.prestartHeading}</h4>
          <div className="stack" style={{ gap: 8 }}>
            <label className="row" style={{ gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={repPresent} onChange={e => setRepPresent(e.target.checked)} />
              <span>{strings.prestartRep}</span>
            </label>
            <label className="row" style={{ gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={locConfirmed} onChange={e => setLocConfirmed(e.target.checked)} />
              <span>{strings.prestartLoc}</span>
            </label>
          </div>
        </div>
      )}
      <div className="row">
        <button className="ax-btn ax-btn--field" onClick={downloadPackage} disabled={cached}>{strings.step1}</button>
        <button className="ax-btn ax-btn--field" onClick={startJourney} disabled={!cached || !!journeyId || busy}>{strings.step2}</button>
        <button className="ax-btn ax-btn--field" onClick={checkIn} disabled={!journeyId || checkedIn || busy || overrideState !== "none"}>{strings.step3}</button>
        {existing && existing.status !== "not_started"
          ? <a className="ax-btn ax-btn--field ax-btn--prominent" href={`/field/inspection/${existing.id}`}>{strings.resume}</a>
          : <button className="ax-btn ax-btn--field ax-btn--prominent" onClick={startInspection} disabled={!checkedIn || busy || !repPresent || !locConfirmed}>{strings.step4}</button>}
      </div>
      {/* ENG-06 / FLD-GEO-005 — manual exception record while the journey is active */}
      {journeyId && (
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{strings.exceptionHeading}</h4>
          <div className="row" style={{ gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input className="ax-input" style={{ flex: 1, minInlineSize: 220 }} value={exceptionNote}
              onChange={e => setExceptionNote(e.target.value)} placeholder={strings.exceptionPlaceholder} />
            <button className="ax-btn" onClick={reportException} disabled={busy || !exceptionNote.trim() || (!live && !checkin)}>{strings.exceptionSend}</button>
          </div>
        </div>
      )}
      {/* F3 M04-056/057/058 cancellation REQUEST (RBAC: planner/ops own the actual cancel). */}
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <h4 style={{ marginBlockEnd: "var(--ax-space-100)" }}>{strings.cancelHeading}</h4>
        <p className="t-caption" style={{ marginBlockEnd: "var(--ax-space-150)" }}>{strings.cancelCaption}</p>
        {cancelRequested ? (
          <span className="ax-lozenge ax-lozenge--warning">{strings.cancelRequestedChip}</span>
        ) : reasons.length === 0 ? (
          <p className="t-caption" style={{ color: "var(--ax-color-critical)" }}>{strings.cancelReasonsMissing}</p>
        ) : (
          <div className="stack" style={{ gap: "var(--ax-space-150)" }}>
            <label className="ax-field"><span className="ax-field__label">{strings.cancelSelectReason}</span>
              <select className="ax-select" value={cancelReason} onChange={e => setCancelReason(e.target.value)}>
                <option value="">\u2014</option>
                {reasons.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
            </label>
            <textarea className="ax-textarea" rows={2} value={cancelComment} onChange={e => setCancelComment(e.target.value)} placeholder={strings.cancelCommentPlaceholder} />
            <label className="ax-field"><span className="ax-field__label">{strings.cancelEvidenceLabel}</span>
              <input className="ax-input" type="file" accept="image/*" onChange={e => setCancelFile(e.target.files?.[0] ?? null)} />
            </label>
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button className="ax-btn ax-btn--danger" onClick={submitCancellation} disabled={busy || !cancelReason}>{strings.cancelSubmit}</button>
            </div>
          </div>
        )}
      </div>
      {/* F3 M03-006 inspector return for blocked visits (request + notify planner). */}
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <h4 style={{ marginBlockEnd: "var(--ax-space-100)" }}>{strings.returnHeading}</h4>
        <p className="t-caption" style={{ marginBlockEnd: "var(--ax-space-150)" }}>{strings.returnCaption}</p>
        {returnRequested ? (
          <span className="ax-lozenge ax-lozenge--warning">{strings.returnRequestedChip}</span>
        ) : (
          <div className="row" style={{ gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
            <textarea className="ax-textarea" style={{ flex: 1, minInlineSize: 220 }} rows={2} value={returnReason}
              onChange={e => setReturnReason(e.target.value)} placeholder={strings.returnPlaceholder} />
            <button className="ax-btn" onClick={submitReturn} disabled={busy || !returnReason.trim()}>{strings.returnSubmit}</button>
          </div>
        )}
      </div>
      {log.length > 0 && <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <ul className="ax-timeline">{log.map((m, i) => <li key={i}><div>{m}</div></li>)}</ul>
      </div>}
    </div>
  );
}
