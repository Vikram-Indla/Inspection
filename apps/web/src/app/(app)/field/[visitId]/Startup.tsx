"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { supabaseBrowser } from "@/lib/supabase";
import { getVerifiedUser } from "@/lib/verified-user";
import { localForUser, processOutbox, promptLegacyOfflineRestore, sha256b64, type SyncState } from "@/lib/offline";
import { getFieldDeviceMetadata } from "@/lib/field-device";
import { formatDateTime, formatTime } from "@/lib/dates";
import type { Locale } from "@/lib/i18n";
import type { GeoMarkerData } from "@/components/GeoMap";
import { transitionOperationalState, requestVisitCancellation, requestVisitReturn, startJourneyAction, confirmArrivalAction, requestActiveCancellationAction, correctVisitLocationAction } from "./actions";
// M03-005 — drag/propose-window reschedule REQUEST lives with the field-home
// write legs (field/actions.ts), sibling to the notification legs; the return
// request above is [visitId]-scoped. Both are planner-decided REQUESTS.
import { requestVisitReschedule } from "../actions";
import ContextualAiPanel from "@/components/ContextualAiPanel";
import EmptyState from "@/components/EmptyState";
import styles from "./startup.module.css";

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
  // M03-005 — propose-window reschedule REQUEST (planners decide)
  rescheduleHeading: string; rescheduleCaption: string; rescheduleStartLabel: string; rescheduleEndLabel: string; rescheduleSubmit: string; rescheduleRequestedChip: string; rescheduleInvalid: string; logRescheduleSent: string; logRescheduleFailed: string;
  deviceInfo: string; etaLabel: string; etaAvailable: string; etaUnavailable: string; etaStale: string;
  overrideHeading: string; overrideBody: string; overrideReason: string; overrideReasonCode: string; overrideEvidence: string; overrideSafetyException: string; overrideConfirm: string; overrideCancel: string; overridePending: string; overrideQueued: string; overrideApproved: string; overrideClosed: string; logOverrideQueued: string; logOverrideOfflineQueued: string; logOverrideEvidenceRequired: string; logOverrideFailed: string;
  arrivalEvidenceHeading: string; arrivalEvidenceCaption: string; arrivalPhoto: string; arrivalComment: string; arrivalSave: string; arrivalSaved: string; arrivalRequired: string;
  arrivalEvidenceNote: string; arrivalEvidenceFile: string; arrivalEvidenceSubmit: string; arrivalEvidenceQueued: string; arrivalEvidenceMissing: string;
  aiTitle: string; aiDescription: string; aiGenerate: string; aiUnavailable: string; aiEvidence: string; aiAdvisory: string;
  // Phase 3B — readiness gate (download/journey locked pre-Ready, reason shown)
  preparationRequired: string; packagePending: string;
  // Phase 4B — journey RPC path (used only when the server schema probe passed)
  journeyOverdueWarning: string;
  correctionHeading: string; correctionCaption: string; correctionAffordance: string;
  correctionReason: string; correctionReasonPlaceholder: string; correctionEvidence: string;
  correctionSubmit: string; correctionCancel: string; correctionSaved: string; correctionFailed: string;
  correctionOriginalLabel: string; correctionCorrectedLabel: string; correctionMeta: string;
  cancelPendingActive: string; cancelApprovedCopy: string; cancelRejectedCopy: string; logActiveCancelSent: string;
};

// Module-level label so the dynamic() loading component (defined outside the
// component) can render the localized text passed via props at render time.
let mapLoadingLabel = "Loading geofence map";

// SB20 / ENG-08 — Mapbox geofence card is client-only (ssr:false).
const GeoMap = dynamic(() => import("@/components/GeoMap"), {
  ssr: false,
  loading: () => <EmptyState glyph="…" title={mapLoadingLabel} inline bare role="status" ariaBusy />,
});

type Insp = { id: string; status: string; started_at: string | null };
type V = { id: string; window_start: string; window_end: string; execution_mode: string;
  visit_type: string; priority: string | null; notes: string | null; planning_status: string;
  operational_state: string;
  dispatch_lat: number; dispatch_lng: number; dispatch_source: "official" | "planned";
  factories: { name: string; factory_code: string | null; city: string | null; region: string | null;
    cr_number: string | null; license_number: string | null;
    official_lat: number; official_lng: number; geofence_radius_m: number | null };
  // Nullable: Planning may leave the package unresolved until preparation
  // (Phase 3B); the server backfills it once a preparation resolves one.
  package_versions: { id: string; version_label: string; definition: unknown; packages: { code: string } } | null;
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

// Phase 4B — server-provided journey-schema state (probe + latest request/corrections).
type ActiveCancellation = {
  id: string; status: "pending" | "approved" | "rejected" | "cancelled";
  reason_key: string; requested_at: string; decision_reason: string | null;
};
type LocationCorrectionView = {
  id: string; corrected_lat: number; corrected_lng: number; accuracy_m: number | null;
  reason: string; source: string; corrected_at: string; capture_context: string;
};

export default function Startup({ visit, gis, strings, reasons, overrideReasons, initialOverride, flags, appVersion, locale, userId, preparationGated, journeySchemaAvailable, initialCancellation, initialCorrections }: { visit: V; gis: Gis; strings: StartupStrings; reasons: Reason[]; overrideReasons: Reason[]; initialOverride: InitialOverride | null; flags: Flags; appVersion: string; locale: Locale; userId: string; preparationGated?: boolean; journeySchemaAvailable?: boolean; initialCancellation?: ActiveCancellation | null; initialCorrections?: LocationCorrectionView[] }) {
  const local = useMemo(() => localForUser(userId), [userId]);
  const dLang = locale === "ar" ? "ar" : "en";
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
  // M03-005 — propose-window reschedule REQUEST (start/end datetime-local)
  const [rescheduleStart, setRescheduleStart] = useState("");
  const [rescheduleEnd, setRescheduleEnd] = useState("");
  const [rescheduleRequested, setRescheduleRequested] = useState(false);
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
  // Phase 4B — journey RPC path state (inert unless the schema probe passed)
  const [overdueWarning, setOverdueWarning] = useState(false);
  const [corrections, setCorrections] = useState<LocationCorrectionView[]>(initialCorrections ?? []);
  const [activeCancel, setActiveCancel] = useState<ActiveCancellation | null>(initialCancellation ?? null);
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctionFile, setCorrectionFile] = useState(null as File | null);
  // Idempotency key persists in component state so retries reuse it (§12).
  const cancelIdemRef = useRef(null as string | null);
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

  useEffect(() => { void promptLegacyOfflineRestore(userId).catch(() => {}); }, [userId]);

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
      void processOutbox(userId, state => {
        if (state === "synced") { setOverrideState("pending"); router.refresh(); }
      });
    };
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [overrideState, router, userId]);

  // Phase 4B — server-rendered cancellation state is authoritative after an
  // Operations decision; a bounded refresh while pending mirrors the override
  // pattern. The inspector never decides anything locally.
  useEffect(() => {
    setActiveCancel(initialCancellation ?? null);
  }, [initialCancellation]);
  useEffect(() => {
    if (activeCancel?.status !== "pending") return;
    const timer = window.setInterval(() => router.refresh(), 15_000);
    return () => window.clearInterval(timer);
  }, [activeCancel?.status, router]);

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
    if (!visit.package_versions) return; // unresolved package — preparation resolves it first (Phase 3B)
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
    const capturedDevice = captureDeviceInfo();
    // Phase 4B / D-015 — when the journey schema probe succeeded, start_journey
    // is the single atomic start path (plan §11): it validates readiness,
    // window, package integrity, location and device, flips the visit
    // On the Way and records the first telemetry point in ONE transaction.
    // Multiple clicks/retries return the existing journey (reused: true).
    if (journeySchemaAvailable) {
      const fix = posRef.current ?? lastFixRef.current;
      const r = await startJourneyAction({
        visitId: visit.id,
        device: {
          device_id: capturedDevice.device_id,
          device_os_version: capturedDevice.os_version,
          application_version: capturedDevice.app_version,
          network: navigator.onLine ? "online" : "offline",
          gps: fix ? { lat: fix.lat, lng: fix.lng, accuracy_m: fix.acc } : null,
          device_occurred_at: new Date().toISOString(),
        },
      });
      setBusy(false);
      if (r.error || !r.journey) {
        // Neutral codes only (JOURNEY_* / NEUTRAL_WRITE_ERROR) — no state change.
        add(strings.logJourneyBlocked);
        return;
      }
      setDeviceInfo(capturedDevice);
      setJourneyId(r.journey.journey_id);                    // reused journeys are success (idempotent)
      setJourneyStartedAt(new Date().toISOString());
      if (r.journey.overdue) setOverdueWarning(true);        // overdue-inside-window: warn, proceed
      add(strings.logJourneyStarted);
      return; // operational_state on_the_way was set atomically by the RPC (D-012)
    }
    // LEGACY FALLBACK (pre-migration, D-015) — direct journey_sessions insert,
    // byte-for-byte the pre-Phase-4B behavior; removed once the migration is
    // applied everywhere.
    const sb = supabaseBrowser();
    const { data: { user } } = await getVerifiedUser(sb);
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
    // Phase 4B / plan §13 — server-validated arrival when the schema probe
    // passed and the device is online. confirm_arrival enforces the accuracy
    // gate, evaluates the fence against the EFFECTIVE target (latest
    // correction, else registered/planning) and, when inside, records the
    // arrival event + stops tracking + flips the visit Arrived atomically.
    // When outside, NOTHING mutates server-side (notice only).
    if (journeySchemaAvailable && navigator.onLine) {
      const observedAt = new Date().toISOString();
      const r = await confirmArrivalAction({
        visitId: visit.id, observedLat: lat, observedLng: lng, accuracyM: acc,
        device: { device_id: deviceInfo?.device_id ?? captureDeviceInfo().device_id, device_occurred_at: observedAt },
      });
      if (r.error) {
        setBusy(false);
        if (r.error === "ARRIVAL_ACCURACY") add(fmt(strings.logAccuracyBlocked, { acc: acc.toFixed(0), max: maxAcc }));
        else add(strings.logCheckinRejected);
        return;
      }
      if (r.result?.result === "inside") {
        setBusy(false);
        setCheckin({ lat, lng, acc, d, inside: true });
        setArrivalEventId(r.result.arrival_event_id ?? null);
        setCheckedIn(true); setArrivalAt(observedAt);
        add(fmt(strings.logInside, { d: d.toFixed(0), acc: acc.toFixed(1) }));
        return; // arrival event + journey 'arrived' + op state were set atomically by the RPC
      }
      // OUTSIDE (EXE-ARRIVAL-OUTSIDE notice) — record the immutable outside
      // observation so the governed Operations override flow keeps its
      // check-in anchor; the panel then offers retry / override / the new
      // location-correction path.
      const sbRpc = supabaseBrowser();
      const outsideEventId = crypto.randomUUID();
      const { data: outsideCheckin, error: outsideError } = await sbRpc.from("geo_events").insert({
        id: outsideEventId, journey_id: journeyId, visit_id: visit.id, kind: "checkin",
        observed_lat: lat, observed_lng: lng, accuracy_m: acc,
        altitude_m: fix.alt ?? null, device_occurred_at: observedAt,
        geofence_result: "outside", gis_version: "v1-accepted-2026-07-11",
        device_id: deviceInfo?.device_id ?? "field-pwa",
        source: "confirm_arrival_outside",
      }).select("id").single();
      setBusy(false);
      if (outsideError || !outsideCheckin) {
        // eslint-disable-next-line no-console
        console.error("[field check-in]", outsideError);
        add(strings.logCheckinRejected);
        return;
      }
      setCheckin({ lat, lng, acc, d, inside: false });
      setPendingOverride({ lat, lng, acc, d, checkinEventId: outsideCheckin.id });
      add(fmt(strings.logOutside, { d: (r.result?.distance_m ?? d).toFixed(0), fence }));
      return;
    }
    // LEGACY FALLBACK (pre-migration, D-015) — client-side geofence verdict +
    // direct geo_events writes, byte-for-byte the pre-Phase-4B behavior.
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
      await processOutbox(userId, (state: SyncState) => { synced = state === "synced"; });
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
      await processOutbox(userId, () => { /* failure remains queued and is retried by the field sync engine */ });
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
        processOutbox(userId, () => { /* startup has no sync banner; failures stay queued for the workspace runner */ });
      }
      const fd = new FormData();
      fd.set("visit_id", visit.id); fd.set("reason_key", cancelReason); fd.set("comment", cancelComment);
      const r = await requestVisitCancellation({}, fd);
      if (r.error) { add(strings.logCancelFailed); return; }
      setCancelRequested(true);           // M04-056 — stop transition to execution
      add(strings.logCancelSent);
    } finally { setBusy(false); }
  }

  // Phase 4B / plan §13 — corrected visit location (append-only; applies to
  // THIS visit only, original + corrected stay visible). Optional photo rides
  // the existing evidence outbox first so custody is durable before the RPC
  // references it — same ordering rule as the geo-override flow.
  async function submitCorrection() {
    const reason = correctionReason.trim();
    if (!reason || !navigator.onLine) { if (!navigator.onLine) add(strings.correctionFailed); return; }
    const fix = posRef.current ?? lastFixRef.current
      ?? (checkin ? { lat: checkin.lat, lng: checkin.lng, acc: checkin.acc, alt: null, speed: null, heading: null, d: checkin.d } : null);
    if (!fix) { add(strings.logGpsFallback); return; }
    setBusy(true);
    try {
      let evidenceId: string | null = null;
      if (correctionFile) {
        const correctionRef = crypto.randomUUID();
        const capturedAt = new Date().toISOString();
        const b64 = btoa(String.fromCharCode(...new Uint8Array(await correctionFile.arrayBuffer())));
        const sha = await sha256b64(b64);
        await local.enqueue({
          kind: "evidence", inspection_id: null, visit_id: visit.id,
          linked_type: "location_correction", linked_id: correctionRef, evidence_type: "photo",
          name: `location-correction-${correctionRef}-${correctionFile.name}`,
          mime: correctionFile.type || "image/jpeg", data_b64: b64,
          captured_at: capturedAt, sha256: sha, queued_at: capturedAt,
        });
        await processOutbox(userId, () => { /* failure stays queued; correction proceeds without the link */ });
        const { data: evRow } = await supabaseBrowser().from("evidence")
          .select("id").eq("linked_type", "location_correction").eq("linked_id", correctionRef).maybeSingle();
        evidenceId = evRow?.id ?? null;
      }
      const r = await correctVisitLocationAction({
        visitId: visit.id, lat: fix.lat, lng: fix.lng, accuracyM: fix.acc,
        reason, evidenceId, captureContext: "online",
      });
      if (r.error || !r.correction) { add(strings.correctionFailed); return; }
      setCorrections(c => [{
        id: r.correction!.id, corrected_lat: r.correction!.corrected_lat, corrected_lng: r.correction!.corrected_lng,
        accuracy_m: r.correction!.accuracy_m, reason: r.correction!.reason, source: r.correction!.source,
        corrected_at: r.correction!.corrected_at, capture_context: r.correction!.capture_context,
      }, ...c]);
      setShowCorrection(false); setCorrectionReason(""); setCorrectionFile(null);
      add(strings.correctionSaved);
    } finally { setBusy(false); }
  }

  // Phase 4B / plan §12 — active-session cancellation REQUEST (on_the_way /
  // arrived). The inspector never cancels directly; Operations decides. The
  // idempotency key is stable across retries inside this mounted component.
  async function submitActiveCancellation() {
    if (!cancelReason) return;
    if (cancelReason === "other" && !cancelComment.trim()) return; // server enforces too
    if (!cancelIdemRef.current) cancelIdemRef.current = crypto.randomUUID();
    setBusy(true);
    try {
      let evidenceId: string | null = null;
      if (cancelFile) {
        const capturedAt = new Date().toISOString();
        const b64 = btoa(String.fromCharCode(...new Uint8Array(await cancelFile.arrayBuffer())));
        const sha = await sha256b64(b64);
        await local.enqueue({
          kind: "evidence", inspection_id: null, visit_id: visit.id,
          linked_type: "cancellation_request", linked_id: cancelIdemRef.current, evidence_type: "photo",
          name: `cancellation-${cancelIdemRef.current}-${cancelFile.name}`,
          mime: cancelFile.type || "image/jpeg", data_b64: b64,
          captured_at: capturedAt, sha256: sha, queued_at: capturedAt,
        });
        await processOutbox(userId, () => { /* failure stays queued; request proceeds without the link */ });
        const { data: evRow } = await supabaseBrowser().from("evidence")
          .select("id").eq("linked_type", "cancellation_request").eq("linked_id", cancelIdemRef.current).maybeSingle();
        evidenceId = evRow?.id ?? null;
      }
      const r = await requestActiveCancellationAction({
        visitId: visit.id, reasonKey: cancelReason, comment: cancelComment.trim() || null,
        evidenceId, idempotencyKey: cancelIdemRef.current,
      });
      if (r.error || !r.request) { add(strings.logCancelFailed); return; }
      setActiveCancel({
        id: r.request.id, status: r.request.status, reason_key: r.request.reason_key,
        requested_at: r.request.requested_at, decision_reason: r.request.decision_reason,
      });
      add(strings.logActiveCancelSent);
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

  // M03-005 — inspector proposes a new visit window; this is a REQUEST only
  // (planners decide). Mirrors submitReturn: the inspector never mutates the
  // visit — request_visit_reschedule (SECURITY DEFINER) records the proposed
  // window on visits.reschedule_requested and notifies planners.
  async function submitReschedule() {
    if (!rescheduleStart || !rescheduleEnd) return;
    const startIso = new Date(rescheduleStart).toISOString();
    const endIso = new Date(rescheduleEnd).toISOString();
    if (!(new Date(startIso) < new Date(endIso))) { add(strings.rescheduleInvalid); return; }
    setBusy(true);
    const r = await requestVisitReschedule(visit.id, startIso, endIso);
    setBusy(false);
    if (r.error) { add(strings.logRescheduleFailed); return; }
    setRescheduleRequested(true);
    add(strings.logRescheduleSent);
  }

  async function startInspection() {
    // M04-056 — a requested cancellation stops the transition to execution
    if (cancelRequested) { add(fmt(strings.logStartBlocked, { error: strings.cancelRequestedChip })); return; }
    // Phase 4B — the active-session request holds the same gate until Operations decides.
    if (activeCancel?.status === "pending") { add(fmt(strings.logStartBlocked, { error: strings.cancelPendingActive })); return; }
    if (activeCancel?.status === "approved") { add(fmt(strings.logStartBlocked, { error: strings.cancelApprovedCopy })); return; }
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
    // D-011 — confirm_visit_ready may already have created the inspections row
    // at Ready (started_at NULL, D-008). Reuse it: the journey/session start
    // owns started_at and sets it only when still null (idempotent on the
    // visits -> inspections unique key); an existing value is never clobbered.
    let inspectionId: string;
    const { data: existingRow, error: findError } = await sb.from("inspections")
      .select("id, started_at").eq("visit_id", visit.id).maybeSingle();
    if (findError) {
      // eslint-disable-next-line no-console
      console.error("[field start inspection lookup]", findError);
      add(strings.logInspectionCreateFailed);
      setBusy(false);
      return;
    }
    if (existingRow) {
      if (!existingRow.started_at) {
        const { error: startError } = await sb.from("inspections")
          .update({ started_at: new Date().toISOString() })
          .eq("id", existingRow.id).is("started_at", null);
        if (startError) {
          // eslint-disable-next-line no-console
          console.error("[field start inspection reuse]", startError);
          add(strings.logInspectionCreateFailed);
          setBusy(false);
          return;
        }
      }
      inspectionId = existingRow.id;
    } else {
      if (!visit.package_versions) {
        // No resolved package (preparation incomplete) — cannot start.
        add(strings.logInspectionCreateFailed);
        setBusy(false);
        return;
      }
      const { data, error } = await sb.from("inspections").insert({
        visit_id: visit.id, status: "in_progress", package_version_id: visit.package_versions.id, started_at: new Date().toISOString(),
      }).select().single();
      if (error || !data) {
        // Provider/constraint details stay in diagnostics; field users receive
        // stable localized recovery guidance, never raw database text.
        // eslint-disable-next-line no-console
        console.error("[field start inspection]", error);
        add(strings.logInspectionCreateFailed);
        setBusy(false);
        return;
      }
      inspectionId = data.id;
    }
    await opTransition("executing");                                  // M04-055 · STM-OPS leg 3
    await local.cachePackage(inspectionId, visit.package_versions);  // key by inspection for the workspace
    router.push(`/field/inspection/${inspectionId}`);
  }
  // visits -> inspections is TO-ONE (object | null); arrays tolerated defensively.
  const existing = Array.isArray(visit.inspections) ? visit.inspections[0] : (visit.inspections ?? undefined);
  const arrivalDetected = !!live && live.d <= arrivalRadius;          // M04-037 arrival auto-detect
  // Phase 3B / D-008: the inspections row may exist from Ready with started_at
  // NULL — "started" (resume affordance, pre-start card hidden) requires the
  // actual start marker, identical to the pre-Phase-3B shape where the row
  // only existed after Start Inspection.
  const started = !!existing && existing.status !== "not_started" && existing.started_at != null;
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
  // Phase 4B — active-session cancellation phase split (§12): pre-start keeps
  // the flag flow; on_the_way/arrived file the Operations-decided request.
  const cancelApproved = activeCancel?.status === "approved";
  const activeCancellationPhase = !!journeySchemaAvailable && ["on_the_way", "arrived"].includes(visit.operational_state);
  const latestCorrection = corrections[0] ?? null;
  return (
    <div className="stack" style={{ gap: "var(--space-6)" }}>
      {/* Phase 4B — overdue-inside-window warning (start proceeds; delay is recorded) */}
      {overdueWarning && (
        <div className="alert alert-warning" role="status"><div>{strings.journeyOverdueWarning}</div></div>
      )}
      {/* Phase 4B — Operations approved the active-session cancellation: terminal, captured data preserved */}
      {cancelApproved && (
        <div className="alert alert-immutable" role="status"><div>{strings.cancelApprovedCopy}</div></div>
      )}
      {activeCancel?.status === "rejected" && (
        <div className="alert alert-warning" role="status"><div>{fmt(strings.cancelRejectedCopy, { reason: activeCancel.decision_reason ?? "—" })}</div></div>
      )}
      <div className="panel" style={{ padding: "var(--space-6)" }} data-testid="field-device-readiness">
        <h4 style={{ marginBlockEnd: "var(--space-3)" }}>{strings.readiness}</h4>
        <div className={styles.readyList}>
          <div className={styles.readyRow}>
            <span className={`${styles.readyMark} ${styles.readyMarkDone}`} aria-hidden>✓</span>
            <span className={styles.readyText}>{strings.window} {formatDateTime(visit.window_start, dLang)} → {formatTime(visit.window_end, dLang)}</span>
          </div>
          <div className={styles.readyRow}>
            <span className={`${styles.readyMark} ${cached ? styles.readyMarkDone : ""}`} aria-hidden>{cached ? "✓" : "○"}</span>
            <span className={styles.readyText}>{strings.packageLine} {visit.package_versions ? `${visit.package_versions.packages.code} · ${visit.package_versions.version_label}` : strings.packagePending} {cached && strings.packageCached}</span>
          </div>
          <div className={styles.readyRow}>
            <span className={`${styles.readyMark} ${journeyId ? styles.readyMarkDone : ""}`} aria-hidden>{journeyId ? "✓" : "○"}</span>
            <span className={styles.readyText}>{strings.journeySession}</span>
          </div>
          <div className={styles.readyRow}>
            <span className={`${styles.readyMark} ${deviceInfo ? styles.readyMarkDone : ""}`} aria-hidden>{deviceInfo ? "✓" : "○"}</span>
            <span className={styles.readyText}>{strings.deviceInfo}{deviceInfo ? ` · ${deviceInfo.os_version} · app ${deviceInfo.app_version}` : ""}</span>
          </div>
          <div className={styles.readyRow}>
            <span className={`${styles.readyMark} ${telemetryCount > 0 ? styles.readyMarkDone : ""}`} aria-hidden>{telemetryCount > 0 ? "✓" : "○"}</span>
            <span className={styles.readyText}>{fmt(strings.telemetryRow, { s: telemetryS, n: telemetryCount })}</span>
          </div>
          <div className={styles.readyRow} data-testid="route-estimate">
            <span className={`${styles.readyMark} ${eta ? styles.readyMarkDone : ""}`} aria-hidden>{eta ? "✓" : "○"}</span>
            <span className={styles.readyText}>{strings.etaLabel} {eta
              ? <span>{fmt(strings.etaAvailable, { minutes: eta.minutes, distance: eta.distance, at: formatTime(eta.updatedAt, dLang) })} · {eta.provider}{eta.stale ? ` · ${strings.etaStale}` : ""}</span>
              : etaUnavailable ? strings.etaUnavailable : "—"}</span>
          </div>
          <div className={styles.readyRow}>
            <span className={`${styles.readyMark} ${checkedIn ? styles.readyMarkDone : ""}`} aria-hidden>{checkedIn ? "✓" : "○"}</span>
            <span className={styles.readyText}>{fmt(strings.geofenceCheck, { acc: maxAcc, fence })}</span>
          </div>
        </div>
        {/* F3 · M04-016 — real navigation handoff with this Visit's governed dispatch coordinates */}
        <div className="row" style={{ gap: 8, flexWrap: "wrap", alignItems: "center", marginBlockStart: "var(--space-4)" }}>
          <a className="btn btn-secondary" target="_blank" rel="noopener noreferrer"
            href={`geo:${visit.dispatch_lat},${visit.dispatch_lng}?q=${visit.dispatch_lat},${visit.dispatch_lng}`}>
            {strings.mapsGeo}
          </a>
        </div>
        <p className="t-caption" style={{ marginBlockStart: "var(--space-2)" }}>{strings.mapsCaption}</p>
        {/* F3 · M04-026 — journey progress % (travelled vs initial distance from first fix) */}
        {journeyId && progress != null && (
          <div className="stack" style={{ gap: 4, marginBlockStart: "var(--space-4)" }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="t-caption">{strings.progressLabel}</span>
              <span className={`t-caption ${styles.num}`}>{progress.toFixed(0)}%</span>
            </div>
            <div role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}
              aria-label={strings.progressLabel}
              style={{ blockSize: 8, borderRadius: "var(--radius-full)", background: "var(--border-subtle)", overflow: "hidden" }}>
              <div style={{ blockSize: "100%", inlineSize: `${progress}%`, background: "var(--action-primary)", borderRadius: "inherit" }} />
            </div>
            <span className={`t-caption ${styles.num}`}>
              {fmt(strings.progressCaption, { remaining: (remainingD ?? 0).toFixed(0), initial: (initialD ?? 0).toFixed(0) })}
            </span>
          </div>
        )}
      </div>
      <ContextualAiPanel
        surface="preparation_assistant"
        title={strings.aiTitle}
        description={strings.aiDescription}
        context={JSON.stringify({ visit_id: visit.id, factory: visit.factories.factory_code, package: visit.package_versions?.version_label ?? null })}
        targetRef={visit.id}
        evidenceRefs={["AC-0107", "M03-009", "SCR-IPAD-610", `VISIT-${visit.id}`]}
        generateLabel={strings.aiGenerate}
        unavailableLabel={strings.aiUnavailable}
        evidenceLabel={strings.aiEvidence}
        advisoryLabel={strings.aiAdvisory}
      />
      {/* SB20 / ENG-08 — compact geofence map card; official and visit-selected coordinates remain distinct (FND-007/M01-046). */}
      <div className="panel" style={{ padding: "var(--space-6)" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", marginBlockEnd: "var(--space-3)" }}>
          <h4>{fmt(strings.geofenceHeading, { name: visit.factories.name })} <span className="badge badge-info">SB20 · ENG-08</span></h4>
          <span className="row" style={{ gap: 8, alignItems: "center" }}>
            {/* M04-037 — live distance-to-fence readout while journey active */}
            {live && !checkedIn && (
              <span className={`badge ${arrivalDetected ? "badge-compliant" : "badge-info"}`}>
                {arrivalDetected ? strings.arrivalDetected : fmt(strings.liveDistance, { d: live.d.toFixed(0), radius: arrivalRadius })}
              </span>
            )}
            {checkin && (
              <span className={`badge ${checkin.inside ? "badge-compliant" : "badge-critical"}`}>
                {fmt(checkin.inside ? strings.insideFence : strings.outsideFence, { d: checkin.d.toFixed(0) })}
              </span>
            )}
          </span>
        </div>
        <div style={{ blockSize: 240, borderRadius: "var(--radius-sm)", overflow: "hidden", border: "1px solid var(--border-subtle)" }} dir="ltr">
          <GeoMap center={[visit.dispatch_lat, visit.dispatch_lng]} zoom={15} markers={mapMarkers} height="100%" />
        </div>
        <p className="t-caption" style={{ marginBlockStart: "var(--space-2)" }}>
          {fmt(strings.fenceCaption, { fence, source: visit.factories.geofence_radius_m != null ? strings.factoryOverride : strings.engineDefault, acc: maxAcc })}{!checkin && ` ${strings.positionHint}`}
        </p>
      </div>
      {/* Phase 4B / plan §13 — original vs corrected location, side by side.
          The correction never overwrites the planned/registered coordinates;
          both stay visible with source and capture context. */}
      {journeySchemaAvailable && latestCorrection && (
        <div className="panel" style={{ padding: "var(--space-6)" }} data-testid="location-correction-display">
          <h4 style={{ marginBlockEnd: "var(--space-3)" }}>{strings.correctionHeading}</h4>
          <div className={styles.grid2}>
            <div className="panel" style={{ padding: "var(--space-4)", border: "1px solid var(--border-subtle)" }}>
              <span className="t-caption">{strings.correctionOriginalLabel}</span>
              <div className={styles.num}>{visit.dispatch_lat.toFixed(6)}, {visit.dispatch_lng.toFixed(6)}</div>
              <span className="t-caption">{visit.dispatch_source === "official" ? strings.officialLabel.replace("{name}", visit.factories.name) : strings.plannedLabel.replace("{name}", visit.factories.name)}</span>
            </div>
            <div className="panel" style={{ padding: "var(--space-4)", border: "1px solid var(--border-subtle)" }}>
              <span className="t-caption">{strings.correctionCorrectedLabel}</span>
              <div className={styles.num}>{Number(latestCorrection.corrected_lat).toFixed(6)}, {Number(latestCorrection.corrected_lng).toFixed(6)}{latestCorrection.accuracy_m != null ? ` · ±${Number(latestCorrection.accuracy_m).toFixed(1)}m` : ""}</div>
              <span className="t-caption">{latestCorrection.reason}</span><br />
              <span className={`t-caption ${styles.num}`}>{fmt(strings.correctionMeta, { at: formatDateTime(latestCorrection.corrected_at, dLang), context: latestCorrection.capture_context, source: latestCorrection.source })}</span>
            </div>
          </div>
        </div>
      )}
      {/* Phase 4B / plan §13 — explicit correction affordance while the journey
          is active (also reachable from the outside-fence panel below). */}
      {journeySchemaAvailable && journeyId && !checkedIn && !cancelApproved && (
        !showCorrection ? (
          <div className="row">
            <button className="btn btn-ghost" onClick={() => setShowCorrection(true)} disabled={busy}>{strings.correctionAffordance}</button>
          </div>
        ) : (
          <div className="panel" role="dialog" aria-modal="false" aria-labelledby="location-correction-heading"
            style={{ padding: "var(--space-6)" }} data-testid="location-correction-panel">
            <h4 id="location-correction-heading" style={{ marginBlockEnd: "var(--space-2)" }}>{strings.correctionHeading}</h4>
            <p className="t-caption" style={{ marginBlockEnd: "var(--space-3)" }}>{strings.correctionCaption}</p>
            <div className="stack" style={{ gap: "var(--space-3)" }}>
              <label className="field"><span className={styles.fieldLabel}>{strings.correctionReason}</span>
                <textarea className="input" rows={2} value={correctionReason} onChange={e => setCorrectionReason(e.target.value)} placeholder={strings.correctionReasonPlaceholder} />
              </label>
              <label className="field"><span className={styles.fieldLabel}>{strings.correctionEvidence}</span>
                <input className="input" type="file" accept="image/*" onChange={e => setCorrectionFile(e.target.files?.[0] ?? null)} />
              </label>
              <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                <button className="btn btn-ghost" onClick={() => { setShowCorrection(false); setCorrectionReason(""); setCorrectionFile(null); }}>{strings.correctionCancel}</button>
                <button className="btn btn-secondary" onClick={submitCorrection} disabled={busy || !correctionReason.trim()}>{strings.correctionSubmit}</button>
              </div>
            </div>
          </div>
        )
      )}
      {pendingOverride && !checkedIn && (
        <div className="panel" role="dialog" aria-modal="false" aria-labelledby="gps-override-heading"
          style={{ padding: "var(--space-6)", borderColor: "var(--status-critical)" }}>
          <h4 id="gps-override-heading" style={{ marginBlockEnd: "var(--space-2)" }}>{strings.overrideHeading}</h4>
          <p className="t-caption">{fmt(strings.overrideBody, { d: pendingOverride.d.toFixed(0), fence, lat: pendingOverride.lat.toFixed(6), lng: pendingOverride.lng.toFixed(6) })}</p>
          <label className="field"><span className={styles.fieldLabel}>{strings.overrideReasonCode}</span>
            <select className="select" value={overrideReasonKey} onChange={e => {
              setOverrideReasonKey(e.target.value);
              if (e.target.value !== "safety_security") setOverrideSafetyException(false);
            }}>
              <option value="">—</option>
              {overrideReasons.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          </label>
          <label className="field"><span className={styles.fieldLabel}>{strings.overrideReason}</span>
            <textarea className="input" rows={2} value={overrideReason} onChange={e => setOverrideReason(e.target.value)} />
          </label>
          <label className="field"><span className={styles.fieldLabel}>{strings.overrideEvidence}</span>
            <input className="input" type="file" accept="image/*" onChange={e => setOverrideFile(e.target.files?.[0] ?? null)} />
          </label>
          <label className="check">
            <input type="checkbox" checked={overrideSafetyException} disabled={overrideReasonKey !== "safety_security"}
              onChange={e => setOverrideSafetyException(e.target.checked)} />
            <span>{strings.overrideSafetyException}</span>
          </label>
          <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
            {journeySchemaAvailable && (
              <button className="btn btn-ghost" onClick={() => { setPendingOverride(null); setShowCorrection(true); }}>{strings.correctionAffordance}</button>
            )}
            <button className="btn btn-ghost" onClick={() => { setPendingOverride(null); setOverrideReason(""); setOverrideReasonKey(""); setOverrideFile(null); setOverrideSafetyException(false); }}>{strings.overrideCancel}</button>
            <button className="btn btn-danger" onClick={requestGpsOverride}
              disabled={busy || !overrideReasonKey || !overrideReason.trim() || (!overrideSafetyException && !overrideFile)}>{strings.overrideConfirm}</button>
          </div>
        </div>
      )}
      {(overrideState === "queued" || overrideState === "pending") && !checkedIn && (
        <div className="alert alert-warning" role="status"><div>
          {overrideState === "queued" ? strings.overrideQueued : strings.overridePending}
          {initialOverride?.status === "pending" && <> · <span className={styles.num}>{formatDateTime(initialOverride.expires_at, dLang)}</span></>}
        </div></div>
      )}
      {overrideState === "approved" && (
        <div className="alert alert-success" role="status"><div>{strings.overrideApproved}</div></div>
      )}
      {overrideState === "closed" && (
        <div className="alert alert-critical" role="status"><div>{strings.overrideClosed}</div></div>
      )}
      {/* M04-050..054 — arrival confirmation, context cards and journey summary. */}
      {checkedIn && (
        <section className="panel" style={{ padding: "var(--space-6)" }} aria-label={strings.cardsVisitTitle}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h4 style={{ marginBlockEnd: "var(--space-2)" }}>{strings.cardsVisitTitle}</h4>
              <p className="t-caption">{arrivalAt ? new Date(arrivalAt).toISOString().replace("T", " ").slice(0, 19) : "—"} · {strings.insideFence}</p>
            </div>
            <span className="badge badge-compliant">{strings.arrivalDetected}</span>
          </div>
          <div className="row" style={{ gap: "var(--space-4)", flexWrap: "wrap", marginBlock: "var(--space-4)" }}>
            <span className="badge badge-outline">{strings.progressLabel}: {progress == null ? "—" : `${progress.toFixed(0)}%`}</span>
            <span className="badge badge-outline">{strings.lblCoords}: {checkin ? `${checkin.lat.toFixed(5)}, ${checkin.lng.toFixed(5)}` : "—"}</span>
            <span className="badge badge-outline">GPS ±{checkin?.acc.toFixed(1) ?? "—"}m</span>
            <span className="badge badge-outline">{strings.lblWindow}: {journeyDurationM == null ? "—" : `${journeyDurationM} min`}</span>
            <span className="badge badge-outline">{Math.round(distanceTravelledM)} m travelled</span>
          </div>
          <div className="stack" style={{ gap: "var(--space-3)" }}>
            <details open>
              <summary style={{ cursor: "pointer", font: "600 14px/1.5 var(--font-body)" }}>{strings.cardsFactoryTitle}</summary>
              <dl className={styles.detailGrid} style={{ marginBlockStart: "var(--space-3)" }}>
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
              <summary style={{ cursor: "pointer", font: "600 14px/1.5 var(--font-body)" }}>{strings.cardsVisitTitle}</summary>
              <dl className={styles.detailGrid} style={{ marginBlockStart: "var(--space-3)" }}>
                <dt>{strings.lblType}</dt><dd>{visit.visit_type}</dd>
                <dt>{strings.lblMode}</dt><dd>{visit.execution_mode}</dd>
                <dt>{strings.lblWindow}</dt><dd>{formatDateTime(visit.window_start, dLang)} → {formatTime(visit.window_end, dLang)}</dd>
                <dt>{strings.lblPackage}</dt><dd>{visit.package_versions ? `${visit.package_versions.packages.code} · ${visit.package_versions.version_label}` : strings.packagePending}</dd>
                <dt>{strings.lblPriority}</dt><dd>{visit.priority ?? "—"}</dd>
                <dt>{strings.lblPlanningStatus}</dt><dd>{visit.planning_status}</dd>
                <dt>{strings.lblPlannerNotes}</dt><dd>{visit.notes ?? "—"}</dd>
              </dl>
            </details>
          </div>
          {arrivalEventId && (
            <div className="panel" style={{ padding: "var(--space-4)", marginBlockStart: "var(--space-4)" }}>
              <h5 style={{ marginBlockEnd: "var(--space-2)" }}>{strings.arrivalEvidenceHeading}</h5>
              <p className="t-caption">{strings.arrivalEvidenceCaption}</p>
              {arrivalEvidenceSaved ? <span className="badge badge-compliant">{strings.arrivalSaved}</span> : (
                <div className="stack" style={{ gap: "var(--space-2)" }}>
                  <label className="field"><span className={styles.fieldLabel}>{strings.arrivalPhoto}</span>
                    <input className="input" type="file" accept="image/*" onChange={e => setArrivalFile(e.target.files?.[0] ?? null)} />
                  </label>
                  <label className="field"><span className={styles.fieldLabel}>{strings.arrivalComment}</span>
                    <textarea className="input" rows={2} value={arrivalComment} onChange={e => setArrivalComment(e.target.value)} />
                  </label>
                  <button className="btn btn-secondary" onClick={saveArrivalEvidence} disabled={busy || (!arrivalFile && !arrivalComment.trim())}>{strings.arrivalSave}</button>
                </div>
              )}
            </div>
          )}
        </section>
      )}
      {/* M03-010 — mandatory pre-start confirmations, persisted to journey_sessions.prestart */}
      {checkedIn && !started && (
        <div className="panel" style={{ padding: "var(--space-6)" }}>
          <h4 style={{ marginBlockEnd: "var(--space-3)" }}>{strings.prestartHeading}</h4>
          <div className="stack" style={{ gap: 8 }}>
            <label className="check">
              <input type="checkbox" checked={repPresent} onChange={e => setRepPresent(e.target.checked)} />
              <span>{strings.prestartRep}</span>
            </label>
            <label className="check">
              <input type="checkbox" checked={locConfirmed} onChange={e => setLocConfirmed(e.target.checked)} />
              <span>{strings.prestartLoc}</span>
            </label>
          </div>
        </div>
      )}
      {/* Phase 3B — readiness gate: package download and journey start stay
          locked (never hidden) until the preparation is confirmed Ready. */}
      {preparationGated && (
        <div className="alert alert-warning" role="status" data-testid="readiness-gate-reason"><div>{strings.preparationRequired}</div></div>
      )}
      <div className="row">
        <button className="btn btn-secondary" onClick={downloadPackage} disabled={cached || !!preparationGated || !visit.package_versions || cancelApproved}>{strings.step1}</button>
        <button className="btn btn-secondary" onClick={startJourney} disabled={!cached || !!journeyId || busy || !!preparationGated || cancelApproved}>{strings.step2}</button>
        <button className="btn btn-secondary" onClick={checkIn} disabled={!journeyId || checkedIn || busy || overrideState !== "none" || cancelApproved}>{strings.step3}</button>
        {started && !cancelApproved
          ? <a className="btn btn-primary" href={`/field/inspection/${existing!.id}`}>{strings.resume}</a>
          : <button className="btn btn-primary" onClick={startInspection} disabled={!checkedIn || busy || !repPresent || !locConfirmed || cancelApproved}>{strings.step4}</button>}
      </div>
      {/* ENG-06 / FLD-GEO-005 — manual exception record while the journey is active */}
      {journeyId && (
        <div className="panel" style={{ padding: "var(--space-6)" }}>
          <h4 style={{ marginBlockEnd: "var(--space-3)" }}>{strings.exceptionHeading}</h4>
          <div className="row" style={{ gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input className="input" style={{ flex: 1, minInlineSize: 220 }} value={exceptionNote}
              onChange={e => setExceptionNote(e.target.value)} placeholder={strings.exceptionPlaceholder} />
            <button className="btn btn-secondary" onClick={reportException} disabled={busy || !exceptionNote.trim() || (!live && !checkin)}>{strings.exceptionSend}</button>
          </div>
        </div>
      )}
      {/* F3 M04-056/057/058 cancellation REQUEST (RBAC: planner/ops own the actual cancel).
          Phase 4B / plan §12 — phase split: pre-start (new/prepared) keeps the
          request_visit_cancellation flag flow; once on_the_way/arrived (and the
          journey schema probe passed) the request goes to Operations via
          request_active_cancellation and stays pending until decided. */}
      <div className="panel" style={{ padding: "var(--space-6)" }}>
        <h4 style={{ marginBlockEnd: "var(--space-2)" }}>{strings.cancelHeading}</h4>
        <p className="t-caption" style={{ marginBlockEnd: "var(--space-3)" }}>{strings.cancelCaption}</p>
        {cancelApproved ? (
          <span className="badge badge-critical">{strings.cancelApprovedCopy}</span>
        ) : activeCancellationPhase && activeCancel?.status === "pending" ? (
          <div className="stack" style={{ gap: "var(--space-2)" }}>
            <span className="badge badge-warning">{strings.cancelPendingActive}</span>
            <span className={`t-caption ${styles.num}`}>
              {(reasons.find(r => r.key === activeCancel.reason_key)?.label ?? activeCancel.reason_key)} · {formatDateTime(activeCancel.requested_at, dLang)}
            </span>
          </div>
        ) : cancelRequested ? (
          <span className="badge badge-warning">{strings.cancelRequestedChip}</span>
        ) : reasons.length === 0 ? (
          <p className="t-caption" style={{ color: "var(--status-critical)" }}>{strings.cancelReasonsMissing}</p>
        ) : (
          <div className="stack" style={{ gap: "var(--space-3)" }}>
            <label className="field"><span className={styles.fieldLabel}>{strings.cancelSelectReason}</span>
              <select className="select" value={cancelReason} onChange={e => setCancelReason(e.target.value)}>
                <option value="">\u2014</option>
                {reasons.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
            </label>
            <textarea className="input" rows={2} value={cancelComment} onChange={e => setCancelComment(e.target.value)} placeholder={strings.cancelCommentPlaceholder} />
            <label className="field"><span className={styles.fieldLabel}>{strings.cancelEvidenceLabel}</span>
              <input className="input" type="file" accept="image/*" onChange={e => setCancelFile(e.target.files?.[0] ?? null)} />
            </label>
            <div className="row" style={{ justifyContent: "flex-end" }}>
              <button className="btn btn-danger"
                onClick={activeCancellationPhase ? submitActiveCancellation : submitCancellation}
                disabled={busy || !cancelReason || (activeCancellationPhase && cancelReason === "other" && !cancelComment.trim())}>{strings.cancelSubmit}</button>
            </div>
          </div>
        )}
      </div>
      {/* F3 M03-006 inspector return for blocked visits (request + notify planner). */}
      <div className="panel" style={{ padding: "var(--space-6)" }}>
        <h4 style={{ marginBlockEnd: "var(--space-2)" }}>{strings.returnHeading}</h4>
        <p className="t-caption" style={{ marginBlockEnd: "var(--space-3)" }}>{strings.returnCaption}</p>
        {returnRequested ? (
          <span className="badge badge-warning">{strings.returnRequestedChip}</span>
        ) : (
          <div className="row" style={{ gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
            <textarea className="input" style={{ flex: 1, minInlineSize: 220 }} rows={2} value={returnReason}
              onChange={e => setReturnReason(e.target.value)} placeholder={strings.returnPlaceholder} />
            <button className="btn btn-secondary" onClick={submitReturn} disabled={busy || !returnReason.trim()}>{strings.returnSubmit}</button>
          </div>
        )}
      </div>
      {/* M03-005 propose-window reschedule REQUEST — planners decide, the visit
          is never mutated here (mirrors the return request above). */}
      <div className="panel" style={{ padding: "var(--space-6)" }}>
        <h4 style={{ marginBlockEnd: "var(--space-2)" }}>{strings.rescheduleHeading}</h4>
        <p className="t-caption" style={{ marginBlockEnd: "var(--space-3)" }}>{strings.rescheduleCaption}</p>
        {rescheduleRequested ? (
          <span className="badge badge-warning">{strings.rescheduleRequestedChip}</span>
        ) : (
          <div className="row" style={{ gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
            <label className="field"><span className={styles.fieldLabel}>{strings.rescheduleStartLabel}</span>
              <input className="input" type="datetime-local" value={rescheduleStart}
                onChange={e => setRescheduleStart(e.target.value)} />
            </label>
            <label className="field"><span className={styles.fieldLabel}>{strings.rescheduleEndLabel}</span>
              <input className="input" type="datetime-local" value={rescheduleEnd}
                onChange={e => setRescheduleEnd(e.target.value)} />
            </label>
            <button className="btn btn-secondary" onClick={submitReschedule} disabled={busy || !rescheduleStart || !rescheduleEnd}>{strings.rescheduleSubmit}</button>
          </div>
        )}
      </div>
      {log.length > 0 && <div className="panel" style={{ padding: "var(--space-6)" }}>
        <ul className="timeline">{log.map((m, i) => <li key={i}><div>{m}</div></li>)}</ul>
      </div>}
    </div>
  );
}
