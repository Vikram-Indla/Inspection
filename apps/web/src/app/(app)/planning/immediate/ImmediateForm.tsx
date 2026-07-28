"use client";
// CD-023 (SCR-WEB-130) — Minimum Viable Authority Bar composition. Fixes
// defect 6 (no work preservation): every native control below is BOTH
// React-controlled AND remounted via `resetKey` after every action
// completion — the same pattern as planning/single/Wizard.tsx, needed
// because React 19's native form auto-reset writes to the DOM directly and
// bypasses controlled-input reconciliation on a blocked-create retry.
//
// M5 (PLN-REQ-025..028) — manual (unregistered) entry contract:
// three eligibility legs (permission · visit-type allows · explicit not-found
// confirmation, all re-verified server-side), required establishment name /
// region / dependent city / map pin, governed manual-entry reason (Other →
// comment), conditional contact mobile when factory notification is enabled,
// and an honest "unverified — pending reconciliation" marker.
import { useActionState, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { GeoMarkerData } from "@/components/GeoMap";
import { formatDate } from "@/lib/dates";
import PackageTypeSelector from "@/components/PackageTypeSelector";
import { createImmediateVisit, type ImmResult } from "./actions";
import AuthorityBar, { type Chip } from "./AuthorityBar";
import EmptyState from "@/components/EmptyState";

type F = {
  id: string; name: string; factory_code: string; cr_number: string; license_number: string | null;
  region: string | null; city: string | null; risk_band: string | null; risk_score: number | null;
  official_lat: number | null; official_lng: number | null; source_synced_at: string | null;
};
type P = { id: string; version_label: string; packages: { code: string; title: string } };
type I = { user_id: string; full_name: string };

export type VisitTypeOption = { key: string; label: string; manualEntryAllowed: boolean; attachmentRequired: boolean };
export type ManualReasonOption = { key: string; label: string };

export type ImmediateStrings = {
  identity: string; identityToggleRegistered: string; identityToggleUnregistered: string;
  r05BlockedTitle: string; r05BlockedBody: string;
  manualLockedPermission: string; manualLockedType: string; manualLockedLookups: string; notFoundConfirm: string;
  searchLabel: string; searchPlaceholder: string; searchNoMatch: string; existingFactory: string; selectOption: string;
  previewCr: string; previewLicense: string; previewRegion: string; previewFreshness: string; previewFreshnessNever: string;
  previewRisk: string; previewRiskUnknown: string;
  manualName: string; manualPlaceholder: string; manualCr: string; manualLicense: string;
  manualActivity: string; manualActivityPlaceholder: string; manualRegion: string; manualCity: string; manualCityPlaceholder: string;
  manualReasonLabel: string; manualReasonComment: string; manualReasonCommentPlaceholder: string;
  notifyFactory: string; factoryMobile: string; factoryMobilePlaceholder: string;
  unverifiedBadge: string; attachmentRequiredNote: string;
  temporaryNote: string;
  urgencyReason: string; reasonComplaint: string; reasonIncident: string; reasonReferral: string;
  reasonOther: string; reasonOtherHint: string;
  locationDispatch: string; useOfficialLocation: string; latitude: string; longitude: string;
  locationSourceOfficial: string; locationSourceManual: string; locationSourceNone: string; mapLoading: string;
  packageLabel: string; inspector: string; autoAssign: string;
  visitType: string;
  windowStart: string; windowEnd: string; windowHint: string;
  priority: string; priorityPlaceholder: string; notes: string; notesPlaceholder: string;
  consequenceTitle: string; consequenceVisit: string; consequenceAssign: string; consequenceNotify: string; consequenceAudit: string;
  reviewConfirm: string; inspectorStartNow: string;
  blockedTitle: string; create: string; createAndStart: string; creating: string;
  chipGroupLabel: string; chipSatisfied: string; chipBlocking: string; chipTruth: string;
  chipAllSatisfied: string; chipBlockedAnnouncement: string;
  chipAuthorizedLabel: string; chipReasonLabel: string; chipIdentityLabel: string; chipLocationLabel: string;
  chipPackageLabel: string; chipInspectorLabel: string; chipWindowLabel: string; chipAuditLabel: string; chipNotifyLabel: string;
  chipAuthorizedDetail: string; chipReasonBlocked: string; chipReasonOtherBlocked: string;
  chipIdentityBlocked: string; chipIdentityRegistered: string; chipIdentityTemporary: string;
  chipLocationBlocked: string; chipLocationOfficial: string; chipLocationManual: string;
  chipPackageBlocked: string; chipInspectorAuto: string; chipInspectorManual: string; chipInspectorBlocked: string;
  chipWindowImmediate: string; chipWindowSet: string; chipWindowBlocked: string;
  chipAuditDetail: string; chipNotifyDetail: string;
  enforcementLabel: string; enforcementHint: string;
  enforcementFine: string; enforcementCommittee: string; enforcementWarning: string; enforcementClosure: string;
  enforcementNone: string; enforcementNotes: string; enforcementNotesPlaceholder: string;
};

// Saudi mobile, configurable-format stand-in: optional +966/0 prefix then 5XXXXXXXX.
const MOBILE_RE = /^(?:\+?966|0)?5\d{8}$/;
const normalizeMobile = (v: string) => v.replace(/[\s-]/g, "");

let mapLoadingLabel = "Loading location map";
const GeoMap = dynamic(() => import("@/components/GeoMap"), {
  ssr: false,
  loading: () => <EmptyState glyph="…" title={mapLoadingLabel} inline bare role="status" ariaBusy />,
});

export default function ImmediateForm({ factories, packages, inspectors, regionOptions, cityOptions, cityByRegion, hasInspectorPool, actorName, actorMode, locale, manualAllowed, visitTypes, manualReasons, strings, initialFactoryId }: {
  factories: F[]; packages: P[]; inspectors: I[]; regionOptions: string[]; cityOptions: string[]; cityByRegion: Record<string, string[]>; hasInspectorPool: boolean;
  actorName: string; actorMode: "planner" | "inspector"; locale: "en" | "ar";
  manualAllowed: boolean; visitTypes: VisitTypeOption[]; manualReasons: ManualReasonOption[];
  strings: ImmediateStrings; initialFactoryId?: string;
}) {
  const [state, formAction, pending] = useActionState<ImmResult, FormData>(createImmediateVisit, {});

  const [mode, setMode] = useState<"registered" | "unregistered">("registered");
  const [query, setQuery] = useState("");
  const [factory, setFactory] = useState<F | null>(() => (initialFactoryId ? factories.find(f => f.id === initialFactoryId) ?? null : null));
  const [notFoundConfirmed, setNotFoundConfirmed] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualCr, setManualCr] = useState("");
  const [manualLicense, setManualLicense] = useState("");
  const [manualActivity, setManualActivity] = useState("");
  const [manualRegion, setManualRegion] = useState("");
  const [manualCity, setManualCity] = useState("");
  const [manualReasonKey, setManualReasonKey] = useState("");
  const [manualReasonComment, setManualReasonComment] = useState("");
  const [notifyFactory, setNotifyFactory] = useState(false);
  const [factoryMobile, setFactoryMobile] = useState("");
  const [reason, setReason] = useState("");
  const [enforcementAction, setEnforcementAction] = useState("");
  const [enforcementNotes, setEnforcementNotes] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [locationSource, setLocationSource] = useState<"official" | "manual" | null>(null);
  const [locationAt, setLocationAt] = useState("");
  const [packageId, setPackageId] = useState(packages[0]?.id ?? "");
  const [inspectorId, setInspectorId] = useState("auto");
  const [visitType, setVisitType] = useState(visitTypes.find(v => v.manualEntryAllowed)?.key ?? visitTypes[0]?.key ?? "complaint");
  const [windowStart, setWindowStart] = useState("");
  const [windowEnd, setWindowEnd] = useState("");
  const [priority, setPriority] = useState("");
  const [notes, setNotes] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [requestId, setRequestId] = useState("");
  useEffect(() => { setRequestId(crypto.randomUUID()); }, []);

  // Work preservation (defect 6) — see file header.
  const isFirstRender = useRef(true);
  const [resetKey, setResetKey] = useState(0);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setResetKey(k => k + 1);
  }, [state]);
  mapLoadingLabel = strings.mapLoading;

  // PLN-REQ-025 — all three legs must hold before manual entry is reachable:
  // permission (manualAllowed), the selected visit type permits unregistered
  // factories, and the governed reason list loaded. The not-found confirmation
  // (fourth control) sits inside the manual panel itself.
  const selectedType = visitTypes.find(v => v.key === visitType);
  // PLN-R05 — Immediate/unregistered creation is deliberately non-executable
  // until the governed establishment lifecycle is approved. The server action
  // carries the same unconditional stop before any provider or mutation work.
  const immediateExecutable = false;
  const manualAvailable = immediateExecutable && manualAllowed && manualReasons.length > 0 && selectedType?.manualEntryAllowed === true;
  useEffect(() => {
    if (mode === "unregistered" && !manualAvailable) setMode("registered");
  }, [manualAvailable, mode]);
  const manualLockReason = manualAvailable ? null
    : !manualAllowed ? strings.manualLockedPermission
      : manualReasons.length === 0 ? strings.manualLockedLookups
        : strings.manualLockedType;

  const ql = query.trim().toLowerCase();
  const shown = ql.length >= 2
    ? factories.filter(f => f.cr_number?.toLowerCase().includes(ql) || (f.license_number ?? "").toLowerCase().includes(ql) || f.name.toLowerCase().includes(ql))
    : factories;

  const latNum = Number(lat); const lngNum = Number(lng);
  const locationOk = lat !== "" && lng !== "" && Number.isFinite(latNum) && Number.isFinite(lngNum)
    && latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180;
  // PLN-REQ-026 — manual identity: not-found confirmation + establishment name +
  // region + city are required; the reason dropdown (Other → comment) and the
  // conditional contact mobile (required when factory notification is on) too.
  const manualReasonOk = manualReasonKey !== "" && (manualReasonKey !== "other" || manualReasonComment.trim() !== "");
  const mobileOk = !notifyFactory || MOBILE_RE.test(normalizeMobile(factoryMobile));
  const identityOk = mode === "registered" ? factory != null
    : notFoundConfirmed && manualName.trim() !== "" && manualRegion.trim() !== "" && manualCity.trim() !== "" && manualReasonOk && mobileOk;
  const reasonOk = reason !== "" && (reason !== "Other" || notes.trim() !== "");
  const packageOk = packageId !== "";
  const windowOk = actorMode === "inspector"
    || (!!windowStart && !!windowEnd && new Date(windowEnd).getTime() > new Date(windowStart).getTime());
  const inspectorOk = actorMode === "inspector" || hasInspectorPool;

  // Dependent city list (PLN-REQ-026): cities observed under the chosen region,
  // falling back to the full list when the region is free-typed.
  const manualCityOptions = (manualRegion && cityByRegion[manualRegion]) || cityOptions;

  const useOfficialLocation = () => {
    if (!factory || factory.official_lat == null || factory.official_lng == null) return;
    setLat(String(factory.official_lat)); setLng(String(factory.official_lng)); setLocationSource("official");
  };
  const onLatChange = (v: string) => { setLat(v); setLocationSource("manual"); setLocationAt(new Date().toISOString()); };
  const onLngChange = (v: string) => { setLng(v); setLocationSource("manual"); setLocationAt(new Date().toISOString()); };

  const reasonLabel = (r: string) => r === "Complaint received" ? strings.reasonComplaint
    : r === "Incident / accident report" ? strings.reasonIncident
      : r === "Referral from authority" ? strings.reasonReferral
        : r === "Other" ? strings.reasonOther : r;

  // --- 9 protection chips — derived entirely from the state above, no new
  // policy objects. Server-side blockingField wins if the server found
  // something the client couldn't (e.g. exact-CR match, availability race). ---
  const bf = state.blockingField;
  const chips: Chip[] = [
    { id: "authorized", label: strings.chipAuthorizedLabel, state: "satisfied", detail: strings.chipAuthorizedDetail },
    {
      id: "reason", label: strings.chipReasonLabel, controlId: "imm-reason",
      state: (bf === "reason" || !reasonOk) ? "blocking" : "satisfied",
      detail: (bf === "reason" || !reasonOk)
        ? (reason === "Other" && notes.trim() === "" ? strings.chipReasonOtherBlocked : strings.chipReasonBlocked)
        : reasonLabel(reason),
    },
    {
      id: "identity", label: strings.chipIdentityLabel, controlId: mode === "registered" ? "imm-search" : "imm-not-found",
      state: (bf === "identity" || !identityOk) ? "blocking" : "satisfied",
      detail: (bf === "identity" || !identityOk) ? strings.chipIdentityBlocked : (mode === "registered" ? strings.chipIdentityRegistered : strings.chipIdentityTemporary),
    },
    {
      id: "location", label: strings.chipLocationLabel, controlId: "imm-lat",
      state: (bf === "location" || !locationOk) ? "blocking" : "satisfied",
      detail: (bf === "location" || !locationOk) ? strings.chipLocationBlocked : (locationSource === "official" ? strings.chipLocationOfficial : strings.chipLocationManual),
    },
    {
      id: "package", label: strings.chipPackageLabel, controlId: "imm-package",
      state: (bf === "package" || !packageOk) ? "blocking" : "satisfied",
      detail: (bf === "package" || !packageOk) ? strings.chipPackageBlocked : (packages.find(p => p.id === packageId)?.version_label ?? ""),
    },
    {
      id: "inspector", label: strings.chipInspectorLabel, controlId: actorMode === "planner" ? "imm-inspector" : undefined,
      state: (bf === "inspector" || !inspectorOk) ? "blocking" : "satisfied",
      detail: (bf === "inspector" || !inspectorOk) ? strings.chipInspectorBlocked : (actorMode === "inspector" ? strings.chipInspectorManual : inspectorId === "auto" ? strings.chipInspectorAuto : strings.chipInspectorManual),
    },
    {
      id: "window", label: strings.chipWindowLabel, controlId: actorMode === "planner" ? "imm-window-start" : undefined,
      state: (bf === "window" || !windowOk) ? "blocking" : "satisfied",
      detail: (bf === "window" || !windowOk) ? strings.chipWindowBlocked : (actorMode === "inspector" ? strings.chipWindowImmediate : strings.chipWindowSet),
    },
    { id: "audit", label: strings.chipAuditLabel, state: "truth", detail: strings.chipAuditDetail },
    { id: "notify", label: strings.chipNotifyLabel, state: "truth", detail: actorMode === "planner" ? strings.chipNotifyDetail : strings.inspectorStartNow },
  ];

  const mapMarkers: GeoMarkerData[] = [
    ...(factory?.official_lat != null && factory?.official_lng != null ? [{ id: "official", lat: factory.official_lat, lng: factory.official_lng, label: strings.locationSourceOfficial, tone: "neutral" as const }] : []),
    ...(locationOk ? [{ id: "candidate", lat: latNum, lng: lngNum, label: strings.locationSourceManual.replace("{who}", actorName || "—").replace("{when}", locationAt ? new Date(locationAt).toLocaleString() : ""), tone: "low" as const }] : []),
  ];
  const mapCenter: [number, number] = locationOk ? [latNum, lngNum] : (factory?.official_lat != null ? [factory.official_lat, factory.official_lng as number] : [23.8859, 45.0792]);

  return (
    <form action={formAction} className="stack">
      <input type="hidden" name="request_id" value={requestId} />
      <input type="hidden" name="actor_mode" value={actorMode} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="location_source" value={locationSource ?? ""} />
      <AuthorityBar chips={chips} strings={{ groupLabel: strings.chipGroupLabel, satisfied: strings.chipSatisfied, blocking: strings.chipBlocking, truth: strings.chipTruth, allSatisfied: strings.chipAllSatisfied, blockedAnnouncement: strings.chipBlockedAnnouncement }} />

      <div className="alert alert-warning" role="status">
        <div><div className="alert-title">{strings.r05BlockedTitle}</div><p>{strings.r05BlockedBody}</p></div>
      </div>

      <div className="saqeel-reference__fields">
        <section className="panel" aria-labelledby="immediate-identity-heading">
          <div className="panel-header"><h2 className="panel-title" id="immediate-identity-heading">{strings.identity}</h2></div>
          <div className="panel-body stack">
          <div className="btn-group" role="group" aria-label={strings.identity}>
            <button className="btn btn-primary" type="button" aria-pressed={mode === "registered"} onClick={() => setMode("registered")}>{strings.identityToggleRegistered}</button>
            <button className="btn btn-secondary" type="button" aria-pressed={false} aria-disabled="true" disabled onClick={() => setMode("unregistered")}>{strings.identityToggleUnregistered}</button>
          </div>
          <p className="t-caption" role="note">{strings.r05BlockedBody}</p>
          {manualLockReason && <p className="t-caption" role="note">{manualLockReason}</p>}

          {mode === "registered" ? (
            <>
              <div className="field">
                <label htmlFor="imm-search">{strings.searchLabel}</label>
                <input id="imm-search" key={`s-${resetKey}`} className="input" placeholder={strings.searchPlaceholder} value={query} onChange={e => setQuery(e.target.value)} />
              </div>
              {ql.length >= 2 && shown.length === 0 && (
                <div className="alert alert-warning">{strings.searchNoMatch}</div>
              )}
              <div className="field">
                <label htmlFor="imm-existing">{strings.existingFactory}</label>
                <select id="imm-existing" key={`e-${resetKey}`} className="select" name="existing_factory_id"
                  value={factory?.id ?? ""} onChange={e => { setFactory(shown.find(f => f.id === e.target.value) ?? null); setLocationSource(null); }}>
                  <option value="">{strings.selectOption}</option>
                  {shown.map(f => <option key={f.id} value={f.id}>{f.name} · {f.cr_number}{f.license_number ? ` · ${f.license_number}` : ""}</option>)}
                </select>
              </div>
              {factory && (
                <div className="alert alert-info">
                  <div><strong><bdi>{factory.name}</bdi></strong>
                  <div className="t-caption">{strings.previewCr} <bdi>{factory.cr_number}</bdi>
                    {factory.license_number && <> · {strings.previewLicense} <bdi>{factory.license_number}</bdi></>}
                    {" · "}{strings.previewRegion} <bdi>{factory.region ?? "—"}{factory.city ? `, ${factory.city}` : ""}</bdi></div>
                  <div className="t-caption">{strings.previewFreshness}: {factory.source_synced_at ? <bdi>{formatDate(factory.source_synced_at, locale)}</bdi> : strings.previewFreshnessNever}
                    {" · "}{strings.previewRisk}: {factory.risk_band ?? strings.previewRiskUnknown}{factory.risk_score != null ? ` (${factory.risk_score})` : ""}</div></div>
                </div>
              )}
            </>
          ) : (
            <div className="alert alert-immutable">
              <div><div className="alert-title">{strings.unverifiedBadge}</div><p>{strings.r05BlockedBody}</p></div>
            </div>
          )}

          <div className="field" id="imm-reason" tabIndex={-1}>
            <label htmlFor="imm-reason">{strings.urgencyReason}</label>
            <div className="btn-group" role="group" aria-label={strings.urgencyReason}>
              {[["Complaint received", strings.reasonComplaint], ["Incident / accident report", strings.reasonIncident], ["Referral from authority", strings.reasonReferral], ["Other", strings.reasonOther]].map(([v, label]) => (
                <button className={`btn ${reason === v ? "btn-primary" : "btn-secondary"}`} key={v} type="button" aria-pressed={reason === v} onClick={() => setReason(v)}>{label}</button>
              ))}
            </div>
            {reason === "Other" && <p id="imm-reason-other-hint" className="t-caption">{strings.reasonOtherHint}</p>}
          </div>
          <input type="hidden" name="urgency_reason" value={reason} key={`ur-${resetKey}`} />

          <div className="field"><label htmlFor="imm-visit-type">{strings.visitType}</label>
            <select id="imm-visit-type" key={`vt-${resetKey}`} className="select" name="visit_type" value={visitType} onChange={e => setVisitType(e.target.value)}>
              {visitTypes.map(v => <option key={v.key} value={v.key}>{v.label}</option>)}
            </select></div>
          </div>
        </section>

        <section className="panel" aria-labelledby="immediate-location-heading">
          <div className="panel-header"><h2 className="panel-title" id="immediate-location-heading">{strings.locationDispatch}</h2></div>
          <div className="panel-body stack">
          {mode === "registered" && factory?.official_lat != null && factory?.official_lng != null && (
            <button type="button" className="btn btn-secondary" onClick={useOfficialLocation}>{strings.useOfficialLocation}</button>
          )}
          <GeoMap center={mapCenter} zoom={locationOk ? 14 : 6} markers={mapMarkers} height={240} />
          <div className="row">
            <div className="field"><label htmlFor="imm-lat">{strings.latitude}</label>
              <input id="imm-lat" key={`lat-${resetKey}`} className="input numeric" name="lat" value={lat} onChange={e => onLatChange(e.target.value)} /></div>
            <div className="field"><label htmlFor="imm-lng">{strings.longitude}</label>
              <input id="imm-lng" key={`lng-${resetKey}`} className="input numeric" name="lng" value={lng} onChange={e => onLngChange(e.target.value)} /></div>
          </div>
          <p className="t-caption" dir="ltr">
            {!locationOk ? strings.locationSourceNone
              : locationSource === "official" ? strings.locationSourceOfficial
                : strings.locationSourceManual.replace("{who}", actorName || "—").replace("{when}", locationAt ? new Date(locationAt).toLocaleString() : "")}
          </p>

          {actorMode === "planner" ? <>
            <div className="row">
              <div className="field"><label htmlFor="imm-window-start">{strings.windowStart}</label>
                <input id="imm-window-start" key={`ws-${resetKey}`} className="input numeric" name="window_start" type="datetime-local" value={windowStart} onChange={e => setWindowStart(e.target.value)} /></div>
              <div className="field"><label htmlFor="imm-window-end">{strings.windowEnd}</label>
                <input id="imm-window-end" key={`we-${resetKey}`} className="input numeric" name="window_end" type="datetime-local" value={windowEnd} onChange={e => setWindowEnd(e.target.value)} /></div>
            </div>
            <span className="t-caption">{strings.windowHint}</span>
          </> : <div className="alert alert-info">{strings.inspectorStartNow}</div>}

          <div className="field"><label htmlFor="imm-priority">{strings.priority}</label>
            <input id="imm-priority" key={`pr-${resetKey}`} className="input" name="priority" value={priority} onChange={e => setPriority(e.target.value)} placeholder={strings.priorityPlaceholder} /></div>

          <div className="field">
            <label id="imm-package-label">{strings.packageLabel}</label>
            <PackageTypeSelector
              key={`pk-${resetKey}`}
              id="imm-package"
              labelledBy="imm-package-label"
              name="package_version_id"
              value={packageId}
              onChange={setPackageId}
              options={packages.map(p => ({ id: p.id, code: `${p.packages.code} · ${p.version_label}`, title: p.packages.title }))}
            />
          </div>

          {actorMode === "planner" && <div className="field"><label htmlFor="imm-inspector">{strings.inspector}</label>
            <select id="imm-inspector" key={`in-${resetKey}`} className="select" name="inspector_id" value={inspectorId} onChange={e => setInspectorId(e.target.value)}>
              <option value="auto">{strings.autoAssign}</option>
              {inspectors.map(i => <option key={i.user_id} value={i.user_id}>{i.full_name}</option>)}
            </select></div>}

          <div className="field"><label htmlFor="imm-notes">{strings.notes}</label>
            <textarea id="imm-notes" key={`no-${resetKey}`} className="input" name="notes" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder={strings.notesPlaceholder} /></div>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-header"><h2 className="panel-title">{strings.consequenceTitle}</h2></div>
        <div className="panel-body stack">
        <ul className="stack">
          <li className="t-caption">{strings.consequenceVisit}</li>
          <li className="t-caption">{strings.consequenceAssign}</li>
          <li className="t-caption">{strings.consequenceNotify}</li>
          <li className="t-caption">{strings.consequenceAudit}</li>
        </ul>
        {actorMode === "planner" && <label className="check">
          <input type="checkbox" name="review_confirmed" value="yes" checked={reviewed} onChange={e => setReviewed(e.target.checked)} />
          <span>{strings.reviewConfirm}</span>
        </label>}
        </div>
      </section>

      {state.error && <div className="alert alert-critical" role="alert"><div><strong>{strings.blockedTitle}</strong><div>{state.error}</div></div></div>}

      <div className="panel-row">
        <button className="btn btn-primary" disabled={!immediateExecutable || pending || !requestId || (actorMode === "planner" && !reviewed)}>
          {pending ? strings.creating : actorMode === "inspector" ? strings.createAndStart : strings.create}
        </button>
      </div>
    </form>
  );
}
