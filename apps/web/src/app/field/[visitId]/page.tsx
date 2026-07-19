import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import Startup, { type StartupStrings } from "./Startup";
import CreatedToast from "@/components/CreatedToast";
import packageInfo from "../../../../package.json";

export const dynamic = "force-dynamic";

export default async function FieldVisit({ params, searchParams }: { params: Promise<{ visitId: string }>; searchParams: Promise<{ created?: string }> }) {
  const { visitId } = await params;
  const { created } = await searchParams;
  const { t, locale } = await useT();
  const sb = await supabaseServer();
  const { data: v } = await sb.from("visits")
    .select("id, window_start, window_end, execution_mode, visit_type, priority, notes, planning_status, planner_lat, planner_lng, immediate_creator_role, visit_location_source, factories(name, name_is_system_generated, factory_code, city, region, cr_number, license_number, official_lat, official_lng, geofence_radius_m), package_versions(id, version_label, definition, packages(code)), inspections(id, status)")
    .eq("id", visitId).single();
  const { data: engines } = await sb.from("engine_settings").select("engine, settings").in("engine", ["gis", "otp", "field"]);
  const gis = engines?.find(e => e.engine === "gis")?.settings ?? {};
  const otpConfigured = !!engines?.find(e => e.engine === "otp");
  // M04-057 — governed cancellation reasons (engine_settings.field, 0020 seed).
  // Reason labels are configuration data, localized from the config itself.
  const fieldCfg = (engines?.find(e => e.engine === "field")?.settings ?? {}) as
    { cancellation_reasons?: { key: string; en: string; ar?: string }[]; geo_override_reasons?: { key: string; en: string; ar?: string }[] };
  const reasons = (fieldCfg.cancellation_reasons ?? []).map(r => ({
    key: r.key, label: (locale === "ar" && r.ar) ? r.ar : r.en,
  }));
  const overrideReasons = (fieldCfg.geo_override_reasons ?? []).map(r => ({
    key: r.key, label: (locale === "ar" && r.ar) ? r.ar : r.en,
  }));
  // F3 request flags — separate tolerant read so a pending 0020 (columns not
  // yet applied) degrades to hidden chips instead of breaking the whole page.
  const { data: flagRow } = await sb.from("visits")
    .select("cancellation_requested, return_requested")
    .eq("id", visitId).maybeSingle();
  const flags = {
    cancellationRequested: !!flagRow?.cancellation_requested,
    returnRequested: !!flagRow?.return_requested,
  };
  // Materialize elapsed requests before reading state. The database decision
  // guard independently checks the deadline, so this is usability/audit
  // maintenance rather than an authorization shortcut.
  const { error: expiryError } = await sb.rpc("expire_stale_geo_override_requests");
  if (expiryError) console.error("[field geo override expiry]", expiryError.message);
  // The request is an Operations workflow object. A missing forward migration
  // degrades to no server state; it never fabricates approval in the field UI.
  const { data: overrideRows } = await sb.from("geo_override_requests")
    .select("id, status, expires_at, decision_event_id")
    .eq("visit_id", visitId)
    .order("requested_at", { ascending: false })
    .limit(1);
  const initialOverride = overrideRows?.[0] ?? null;
  if (!v) {
    return (
      <Shell current="/field" title={t("field.start.notFoundTitle", "Not found")}>
        <div className="ax-surface"><div className="ax-state">
          <span className="ax-state__glyph">∅</span><h4>{t("field.start.notFound", "Visit not found")}</h4>
          <p className="ax-caption">{t("field.start.notFoundDesc", "This visit does not exist or is outside your organizational scope (M02-001).")}</p>
        </div></div>
      </Shell>
    );
  }
  const factory = v.factories as unknown as { name: string; name_is_system_generated: boolean; official_lat: number | null; official_lng: number | null };
  const factoryName = factory.name_is_system_generated ? t("field.start.unregisteredFactory", "Unregistered factory") : factory.name;
  const dispatchLat = v.planner_lat ?? factory.official_lat;
  const dispatchLng = v.planner_lng ?? factory.official_lng;
  const dispatchSource = v.visit_location_source === "official" ? "official" : "planned";
  // visits -> inspections is TO-ONE (object | null) — normalize defensively so
  // the client never regresses on the array/object shape.
  const rawInspections = v.inspections as unknown;
  const vNorm = {
    ...v,
    dispatch_lat: dispatchLat,
    dispatch_lng: dispatchLng,
    dispatch_source: dispatchSource,
    factories: { ...(v.factories as object), name: factoryName },
    inspections: Array.isArray(rawInspections) ? (rawInspections[0] ?? null) : rawInspections ?? null,
  };
  // M03-011 — execution-mode eligibility evaluated from engine configuration + master data,
  // never invented: physical requires GIS-verifiable official coordinates (M04-004);
  // virtual requires the OTP engine to be configured for identity verification (0009).
  const physicalEligible = dispatchLat != null && dispatchLng != null;
  const virtualEligible = otpConfigured;
  const strings: StartupStrings = {
    mapLoading: t("field.start.mapLoading", "Loading geofence map"),
    readiness: t("field.start.readiness", "Readiness (SCR-IPAD-610)"),
    window: t("field.start.window", "Window"),
    packageLine: t("field.start.package", "Package"),
    packageCached: t("field.start.packageCached", "— cached, version-locked"),
    journeySession: t("field.start.journeySession", "Journey session"),
    geofenceCheck: t("field.start.geofenceCheck", "Geofence check-in (≤{acc}m accuracy, {fence}m fence — live config)"),
    geofenceHeading: t("field.start.geofenceHeading", "Geofence — {name}"),
    insideFence: t("field.start.insideFence", "inside fence · {d} m"),
    outsideFence: t("field.start.outsideFence", "outside fence · {d} m"),
    fenceCaption: t("field.start.fenceCaption", "Fence {fence} m {source} · accuracy gate ≤{acc} m (ERR-GEO-001)"),
    factoryOverride: t("field.start.factoryOverride", "(factory override — SB20)"),
    engineDefault: t("field.start.engineDefault", "(engine default — ENG-06)"),
    positionHint: t("field.start.positionHint", "· your position appears after step 3 check-in"),
    step1: t("field.start.step1", "1 · Download package"),
    step2: t("field.start.step2", "2 · Start journey"),
    step3: t("field.start.step3", "3 · Geofence check-in"),
    step4: t("field.start.step4", "4 · Start inspection"),
    resume: t("field.start.resume", "Resume inspection →"),
    officialLabel: t("field.start.officialLabel", "{name} — official location (FND-007)"),
    plannedLabel: t("field.start.plannedLabel", "{name} — visit location confirmed at planning (M01-046; not official master data)"),
    youLabel: t("field.start.youLabel", "You — ±{acc}m · {state} fence ({d}m)"),
    insideWord: t("enum.inside", "inside"),
    outsideWord: t("enum.outside", "outside"),
    logCached: t("field.start.logCached", "Package {version} cached & version-locked (M04-005/007)"),
    logJourneyBlocked: locale === "ar"
      ? "تعذر بدء الرحلة. تحقق من التكليف والاتصال ثم أعد المحاولة."
      : t("field.start.logJourneyBlockedSafe", "The journey could not be started. Check the assignment and connection, then try again."),
    logJourneyStarted: t("field.start.logJourneyStarted", "Journey started — telemetry active (STM-JRN-001)"),
    logAccuracyBlocked: t("field.start.logAccuracyBlocked", "BLOCKED: accuracy ±{acc}m > {max}m required (ERR-GEO-001) — retry or governed override"),
    logCheckinRejected: locale === "ar"
      ? "تعذر حفظ تسجيل الوصول. تحقق من الاتصال ثم أعد المحاولة."
      : t("field.start.logCheckinRejectedSafe", "Check-in could not be saved. Check the connection, then try again."),
    logArrivalRejected: locale === "ar"
      ? "تعذر حفظ الوصول. تحقق من الاتصال ثم أعد المحاولة."
      : t("field.start.logArrivalRejectedSafe", "Arrival could not be saved. Check the connection, then try again."),
    logOutside: t("field.start.logOutside", "OUTSIDE geofence ({d}m > {fence}m) — check-in recorded as outside; governed override required (ERR-GEO-002)"),
    logInside: t("field.start.logInside", "Checked in INSIDE fence ({d}m, ±{acc}m) — start allowed (STM-JRN-003)"),
    logStartBlocked: t("field.start.logStartBlocked", "Start blocked: {error}"),
    logInspectionCreateFailed: locale === "ar"
      ? "تعذر بدء التفتيش. تحقق من الجاهزية ثم أعد المحاولة."
      : t("field.start.logInspectionCreateFailed", "The inspection could not be started. Check readiness and try again."),
    // E3 — telemetry / arrival auto-detect / deviation / exception / pre-start / STM-OPS
    telemetryRow: t("field.start.telemetryRow", "Telemetry every {s}s while journeying — {n} points (ENG-06 · M04-021)"),
    liveDistance: t("field.start.liveDistance", "live · {d} m out · arrival radius {radius} m"),
    arrivalDetected: t("field.start.arrivalDetected", "arrival auto-detected (M04-037)"),
    liveLabel: t("field.start.liveLabel", "Live position ±{acc}m"),
    prestartHeading: t("field.start.prestartHeading", "Pre-start confirmations (M03-010)"),
    prestartRep: t("field.start.prestartRep", "Factory representative is present"),
    prestartLoc: t("field.start.prestartLoc", "Location confirmed — this is the correct factory"),
    logPrestartBlocked: t("field.start.logPrestartBlocked", "Start blocked: confirm representative present and location first (M03-010)"),
    logPrestartSaved: t("field.start.logPrestartSaved", "Pre-start confirmations persisted to journey session (M03-010)"),
    exceptionHeading: t("field.start.exceptionHeading", "Report exception (ENG-06 · FLD-GEO-005)"),
    exceptionPlaceholder: t("field.start.exceptionPlaceholder", "Describe the exception — mandatory"),
    exceptionSend: t("field.start.exceptionSend", "Record exception"),
    logExceptionSent: t("field.start.logExceptionSent", "Exception recorded at ±{acc}m — immutable geo event (FLD-GEO-005)"),
    logExceptionFailed: locale === "ar"
      ? "تعذر حفظ الاستثناء. تحقق من الاتصال ثم أعد المحاولة."
      : t("field.start.logExceptionFailedSafe", "The exception could not be saved. Check the connection, then try again."),
    logDeviation: t("field.start.logDeviation", "Route deviation recorded — {d} m beyond closest approach, sustained {s}s (ENG-06 route_deviation)"),
    logOpState: t("field.start.logOpState", "Operational state → {state} (STM-OPS)"),
    logOpBlocked: locale === "ar"
      ? "تعذر تحديث حالة الزيارة. تحقق من الجاهزية والاتصال ثم أعد المحاولة."
      : t("field.start.logOpBlockedSafe", "The visit state could not be updated. Check readiness and the connection, then try again."),
    logGpsFallback: t("field.start.logGpsFallback", "GPS unavailable — check-in remains blocked. Restore location access and retry (M04-049)."),
    // F3 — navigation launch (M04-016)
    mapsGeo: t("field.start.mapsGeo", "Open in device navigation"),
    mapsCaption: dispatchSource === "official"
      ? t("field.start.mapsCaption", "Launches the device navigation app with the official factory coordinates (M04-016 · FND-007)")
      : t("field.start.mapsCaptionImmediate", "Launches navigation with the location confirmed on this Immediate Visit; official factory master coordinates remain unchanged (M01-046 · FND-007)"),
    // F3 — journey progress % (M04-026)
    progressLabel: t("field.start.progressLabel", "Journey progress (M04-026)"),
    progressCaption: t("field.start.progressCaption", "{remaining} m remaining of {initial} m from first GPS fix — straight-line basis"),
    // F3 — expandable Factory / Visit confirmation cards (M04-054)
    cardsFactoryTitle: t("field.start.cardsFactoryTitle", "Factory card"),
    cardsVisitTitle: t("field.start.cardsVisitTitle", "Visit card"),
    lblCode: t("field.start.lblCode", "Factory code"),
    lblCity: t("field.start.lblCity", "City"),
    lblRegion: t("field.start.lblRegion", "Region"),
    lblCr: t("field.start.lblCr", "CR number"),
    lblLicense: t("field.start.lblLicense", "License number"),
    lblCoords: t("field.start.lblCoords", "Official coordinates"),
    lblFence: t("field.start.lblFence", "Geofence radius"),
    lblType: t("field.start.lblType", "Visit type"),
    lblMode: t("field.start.lblMode", "Execution mode"),
    lblWindow: t("field.start.lblWindow", "Visit window"),
    lblPackage: t("field.start.lblPackage", "Inspection package"),
    lblPriority: t("field.start.lblPriority", "Priority"),
    lblPlanningStatus: t("field.start.lblPlanningStatus", "Planning status"),
    lblPlannerNotes: t("field.start.lblPlannerNotes", "Notes"),
    // F3 — field cancellation request (M04-056/057/058)
    cancelHeading: t("field.start.cancelHeading", "Cancel visit (M04-056)"),
    cancelCaption: t("field.start.cancelCaption", "Cancellation is a request: planner/ops decide the actual cancel (RBAC — visits stay planner-owned). Reason list is governed configuration (M04-057)."),
    cancelSelectReason: t("field.start.cancelSelectReason", "Select cancellation reason — mandatory"),
    cancelCommentPlaceholder: t("field.start.cancelCommentPlaceholder", "Comments (mandatory for reason “Other”)"),
    cancelEvidenceLabel: t("field.start.cancelEvidenceLabel", "Photo evidence (optional, M04-058)"),
    cancelSubmit: t("field.start.cancelSubmit", "Request cancellation"),
    cancelRequestedChip: t("field.start.cancelRequestedChip", "cancellation requested — awaiting planner/ops"),
    cancelReasonsMissing: t("field.start.cancelReasonsMissing", "Cancellation reasons unavailable — engine_settings.field not seeded yet (0020 pending)."),
    logCancelEvidenceQueued: t("field.start.logCancelEvidenceQueued", "Cancellation evidence {name} queued (sha256 {sha}…) — syncs to the visit record (M04-058)"),
    logCancelSent: t("field.start.logCancelSent", "Cancellation requested — planner/ops notified; execution stopped (M04-056)"),
    logCancelFailed: locale === "ar"
      ? "تعذر إرسال طلب الإلغاء. تحقق من الاتصال ثم أعد المحاولة."
      : t("field.start.logCancelFailedSafe", "The cancellation request could not be sent. Check the connection, then try again."),
    // F3 — inspector return (M03-006)
    returnHeading: t("field.start.returnHeading", "Return visit (M03-006)"),
    returnCaption: t("field.start.returnCaption", "Blocked from proceeding (outside fence, no access, GPS)? Return the visit with a reason — the assignment moves to returned and the planner is notified."),
    returnPlaceholder: t("field.start.returnPlaceholder", "Return reason — mandatory"),
    returnSubmit: t("field.start.returnSubmit", "Return visit"),
    returnRequestedChip: t("field.start.returnRequestedChip", "return requested — planner notified"),
    logReturnSent: t("field.start.logReturnSent", "Visit returned — assignment set to returned, planner notified (M03-006)"),
    logReturnFailed: locale === "ar"
      ? "تعذر إرسال طلب الإرجاع. تحقق من الاتصال ثم أعد المحاولة."
      : t("field.start.logReturnFailedSafe", "The return request could not be sent. Check the connection, then try again."),
    deviceInfo: t("field.start.deviceInfo", "Device information (M04-012)"),
    etaLabel: t("field.start.etaLabel", "Road-network ETA (M04-017/024)"),
    etaAvailable: t("field.start.etaAvailable", "{minutes} min · {distance} m · updated {at}"),
    etaUnavailable: t("field.start.etaUnavailable", "routing provider unavailable — navigation remains available"),
    etaStale: t("field.start.etaStale", "Offline — showing the last known route estimate as stale; it is not refreshed."),
    overrideHeading: t("field.start.overrideHeading", "Outside the planned location"),
    overrideBody: t("field.start.overrideBody", "You are {d} m from the planned point (fence {fence} m). Request Operations approval using the captured actual coordinates {lat}, {lng}. Check-in remains blocked until approval."),
    overrideReason: t("field.start.overrideReason", "Explanation — mandatory"),
    overrideReasonCode: t("field.start.overrideReasonCode", "Governed reason code — mandatory"),
    overrideEvidence: t("field.start.overrideEvidence", "Photo evidence — mandatory unless safety/security makes capture unsafe"),
    overrideSafetyException: t("field.start.overrideSafetyException", "Photo cannot be captured safely because of the selected safety/security condition"),
    overrideConfirm: t("field.start.overrideConfirm", "Request Operations override"),
    overrideCancel: t("common.cancel", "Cancel"),
    overridePending: t("field.start.overridePending", "Operations override pending — check-in remains blocked until an Operations Supervisor or Manager approves online."),
    overrideQueued: t("field.start.overrideQueued", "Override request safely queued — it will be sent with its captured GPS/evidence when online. Check-in remains blocked."),
    overrideApproved: t("field.start.overrideApproved", "Operations override approved — actual coordinates and decision are immutably recorded."),
    overrideClosed: t("field.start.overrideClosed", "This arrival attempt has already been rejected or expired. Check-in remains blocked; return the visit or contact Operations."),
    logOverrideQueued: t("field.start.logOverrideQueued", "Operations override requested with captured GPS/time and evidence — check-in remains blocked pending approval."),
    logOverrideOfflineQueued: t("field.start.logOverrideOfflineQueued", "Override request queued offline with captured GPS/evidence — it cannot self-approve or unlock check-in."),
    logOverrideEvidenceRequired: t("field.start.logOverrideEvidenceRequired", "A photo is mandatory unless the selected safety/security condition makes capture unsafe."),
    logOverrideFailed: t("field.start.logOverrideFailed", "The override could not be saved. Nothing was changed."),
    arrivalEvidenceHeading: t("field.start.arrivalEvidenceHeading", "Arrival evidence (M04-045)"),
    arrivalEvidenceCaption: t("field.start.arrivalEvidenceCaption", "Add a photo or comment. Evidence is linked to this exact arrival event and remains queued safely while offline."),
    arrivalPhoto: t("field.start.arrivalPhoto", "Arrival photo"),
    arrivalComment: t("field.start.arrivalComment", "Arrival comment"),
    arrivalSave: t("field.start.arrivalSave", "Save arrival evidence"),
    arrivalSaved: t("field.start.arrivalSaved", "Arrival evidence saved or queued for sync"),
    arrivalRequired: t("field.start.arrivalRequired", "arrival evidence is required by the active GIS configuration"),
    arrivalEvidenceNote: t("field.start.arrivalEvidenceNote", "Arrival note"),
    arrivalEvidenceFile: t("field.start.arrivalEvidenceFile", "Arrival photo (optional)"),
    arrivalEvidenceSubmit: t("field.start.arrivalEvidenceSubmit", "Queue arrival evidence"),
    arrivalEvidenceQueued: t("field.start.arrivalEvidenceQueued", "Arrival evidence queued — custody hash recorded; sync pending"),
    arrivalEvidenceMissing: t("field.start.arrivalEvidenceMissing", "Add a photo or note before queueing arrival evidence."),
    aiTitle: t("field.start.aiTitle", "AI preparation assistant"),
    aiDescription: t("field.start.aiDescription", "Daily, risk and preparation guidance from this visit's recorded facts. It never gates the journey or inspection start."),
    aiGenerate: t("field.start.aiGenerate", "Generate preparation brief"),
    aiUnavailable: t("field.start.aiUnavailable", "AI provider unavailable or offline — nothing was generated or changed."),
    aiEvidence: t("field.start.aiEvidence", "Source evidence"),
    aiAdvisory: t("field.start.aiAdvisory", "Advisory only · human decides"),
  };
  const modeWord = (m: string) => m === "virtual" ? t("enum.virtual", "virtual") : t("enum.physical", "physical");
  return (
    <Shell current="/field" title={t("field.start.title", "Startup — {name}").replace("{name}", factoryName)}
      context={<span className="ax-lozenge ax-lozenge--info">SCR-IPAD-610/620</span>}>
      <CreatedToast created={created}
        registeredMessage={t("field.start.createdToast", "Visit created and dispatched.")}
        unregisteredMessage={t("field.start.createdToastUnregistered", "Unregistered establishment recorded and visit dispatched.")} />
      <div className="ax-stack" style={{ gap: "var(--ax-space-300)" }}>
        {/* M03-011 — execution-mode eligibility from engine rules, with the why */}
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{t("field.start.eligibilityHeading", "Execution mode eligibility (M03-011)")}</h4>
          <div className="ax-stack" style={{ gap: 8 }}>
            <div className="ax-row" style={{ gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span className={`ax-lozenge ${physicalEligible ? "ax-lozenge--success" : "ax-lozenge--critical"}`}>
                {physicalEligible ? t("field.start.eligible", "eligible") : t("field.start.notEligible", "not eligible")}
              </span>
              <span>{dispatchSource === "official"
                ? t("field.start.physicalRule", "Physical — using GIS-verified official coordinates for geofence arrival (M04-004 · ENG-06)")
                : t("field.start.physicalImmediateRule", "Physical Immediate Visit — using the location confirmed with the visit (M01-046); factory master coordinates remain unchanged (FND-007)")}</span>
              {v.execution_mode !== "virtual" && <span className="ax-lozenge ax-lozenge--info">{t("field.start.plannedMode", "planned mode")}</span>}
            </div>
            <div className="ax-row" style={{ gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span className={`ax-lozenge ${virtualEligible ? "ax-lozenge--success" : "ax-lozenge--critical"}`}>
                {virtualEligible ? t("field.start.eligible", "eligible") : t("field.start.notEligible", "not eligible")}
              </span>
              <span>{t("field.start.virtualRule", "Virtual — requires OTP identity-verification engine configured (ENG · REF-011)")}</span>
              {v.execution_mode === "virtual" && <span className="ax-lozenge ax-lozenge--info">{t("field.start.plannedMode", "planned mode")}</span>}
            </div>
            <p className="ax-caption">
              {t("field.start.eligibilityCaption", "This visit is planned as {mode}. Eligibility is evaluated from engine configuration and factory master data — not selectable here.").replace("{mode}", modeWord(v.execution_mode))}
            </p>
          </div>
        </div>
        <Startup visit={vNorm as never} gis={gis as never} strings={strings} reasons={reasons} overrideReasons={overrideReasons} initialOverride={initialOverride as never} flags={flags} appVersion={packageInfo.version} />
      </div>
    </Shell>
  );
}
