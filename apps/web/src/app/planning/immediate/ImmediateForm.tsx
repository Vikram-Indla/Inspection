"use client";
// CD-023 (SCR-WEB-130) — Minimum Viable Authority Bar composition. Fixes
// defect 6 (no work preservation): every native control below is BOTH
// React-controlled AND remounted via `resetKey` after every action
// completion — the same pattern as planning/single/Wizard.tsx, needed
// because React 19's native form auto-reset writes to the DOM directly and
// bypasses controlled-input reconciliation on a blocked-create retry.
import { useActionState, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { GeoMarkerData } from "@/components/GeoMap";
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

export type ImmediateStrings = {
  identity: string; identityToggleRegistered: string; identityToggleUnregistered: string;
  searchLabel: string; searchPlaceholder: string; searchNoMatch: string; existingFactory: string; selectOption: string;
  previewCr: string; previewLicense: string; previewRegion: string; previewFreshness: string; previewFreshnessNever: string;
  previewRisk: string; previewRiskUnknown: string;
  manualName: string; manualPlaceholder: string; manualCr: string; manualLicense: string;
  manualActivity: string; manualActivityPlaceholder: string; manualRegion: string; manualCity: string; manualCityPlaceholder: string;
  temporaryNote: string;
  urgencyReason: string; reasonComplaint: string; reasonIncident: string; reasonReferral: string;
  reasonOther: string; reasonOtherHint: string;
  locationDispatch: string; useOfficialLocation: string; latitude: string; longitude: string;
  locationSourceOfficial: string; locationSourceManual: string; locationSourceNone: string; mapLoading: string;
  packageLabel: string; inspector: string; autoAssign: string;
  visitType: string; typePeriodic: string; typeFollowUp: string; typeComplaint: string;
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

let mapLoadingLabel = "Loading location map";
const GeoMap = dynamic(() => import("@/components/GeoMap"), {
  ssr: false,
  loading: () => <EmptyState glyph="…" title={mapLoadingLabel} inline bare role="status" ariaBusy />,
});

export default function ImmediateForm({ factories, packages, inspectors, regionOptions, cityOptions, hasInspectorPool, actorName, actorMode, locale, strings, initialFactoryId }: {
  factories: F[]; packages: P[]; inspectors: I[]; regionOptions: string[]; cityOptions: string[]; hasInspectorPool: boolean;
  actorName: string; actorMode: "planner" | "inspector"; locale: "en" | "ar"; strings: ImmediateStrings; initialFactoryId?: string;
}) {
  const [state, formAction, pending] = useActionState<ImmResult, FormData>(createImmediateVisit, {});

  const [mode, setMode] = useState<"registered" | "unregistered">("registered");
  const [query, setQuery] = useState("");
  const [factory, setFactory] = useState<F | null>(() => (initialFactoryId ? factories.find(f => f.id === initialFactoryId) ?? null : null));
  const [manualName, setManualName] = useState("");
  const [manualCr, setManualCr] = useState("");
  const [manualLicense, setManualLicense] = useState("");
  const [manualActivity, setManualActivity] = useState("");
  const [manualRegion, setManualRegion] = useState("");
  const [manualCity, setManualCity] = useState("");
  const [reason, setReason] = useState("");
  const [enforcementAction, setEnforcementAction] = useState("");
  const [enforcementNotes, setEnforcementNotes] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [locationSource, setLocationSource] = useState<"official" | "manual" | null>(null);
  const [locationAt, setLocationAt] = useState("");
  const [packageId, setPackageId] = useState(packages[0]?.id ?? "");
  const [inspectorId, setInspectorId] = useState("auto");
  const [visitType, setVisitType] = useState("complaint");
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

  const ql = query.trim().toLowerCase();
  const shown = ql.length >= 2
    ? factories.filter(f => f.cr_number?.toLowerCase().includes(ql) || (f.license_number ?? "").toLowerCase().includes(ql) || f.name.toLowerCase().includes(ql))
    : factories;

  const latNum = Number(lat); const lngNum = Number(lng);
  const locationOk = lat !== "" && lng !== "" && Number.isFinite(latNum) && Number.isFinite(lngNum)
    && latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180;
  const identityOk = mode === "registered" ? factory != null
    : [manualName, manualCr, manualLicense, manualActivity].some(v => v.trim() !== "");
  const reasonOk = reason !== "" && (reason !== "Other" || notes.trim() !== "");
  const packageOk = packageId !== "";
  const windowOk = actorMode === "inspector"
    || (!!windowStart && !!windowEnd && new Date(windowEnd).getTime() > new Date(windowStart).getTime());
  const inspectorOk = actorMode === "inspector" || hasInspectorPool;

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
      id: "identity", label: strings.chipIdentityLabel, controlId: mode === "registered" ? "imm-search" : "imm-manual-name",
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
    <form action={formAction} className="stack" style={{ gap: "var(--ax-space-300)" }}>
      <input type="hidden" name="request_id" value={requestId} />
      <input type="hidden" name="actor_mode" value={actorMode} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="location_source" value={locationSource ?? ""} />
      <AuthorityBar chips={chips} strings={{ groupLabel: strings.chipGroupLabel, satisfied: strings.chipSatisfied, blocking: strings.chipBlocking, truth: strings.chipTruth, allSatisfied: strings.chipAllSatisfied, blockedAnnouncement: strings.chipBlockedAnnouncement }} />

      <div className="ax-grid-2">
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
          <h4>{strings.identity}</h4>
          <div className="ax-segmented" role="group" aria-label={strings.identity}>
            <button type="button" aria-pressed={mode === "registered"} onClick={() => setMode("registered")}>{strings.identityToggleRegistered}</button>
            <button type="button" aria-pressed={mode === "unregistered"} onClick={() => setMode("unregistered")}>{strings.identityToggleUnregistered}</button>
          </div>

          {mode === "registered" ? (
            <>
              <div className="ax-field" style={{ maxInlineSize: "none" }}>
                <label className="ax-field__label" htmlFor="imm-search">{strings.searchLabel}</label>
                <span className="ax-search"><input id="imm-search" key={`s-${resetKey}`} className="ax-input" placeholder={strings.searchPlaceholder} value={query} onChange={e => setQuery(e.target.value)} /></span>
              </div>
              {ql.length >= 2 && shown.length === 0 && (
                <div className="ax-banner ax-banner--warning"><div>{strings.searchNoMatch}</div></div>
              )}
              <div className="ax-field" style={{ maxInlineSize: "none" }}>
                <label className="ax-field__label" htmlFor="imm-existing">{strings.existingFactory}</label>
                <select id="imm-existing" key={`e-${resetKey}`} className="ax-select" name="existing_factory_id"
                  value={factory?.id ?? ""} onChange={e => { setFactory(shown.find(f => f.id === e.target.value) ?? null); setLocationSource(null); }}>
                  <option value="">{strings.selectOption}</option>
                  {shown.map(f => <option key={f.id} value={f.id}>{f.name} · {f.cr_number}{f.license_number ? ` · ${f.license_number}` : ""}</option>)}
                </select>
              </div>
              {factory && (
                <div className="ax-surface" style={{ padding: "var(--ax-space-200)", background: "var(--ax-color-surface-sunken)" }}>
                  <strong><bdi>{factory.name}</bdi></strong>
                  <div className="ax-caption">{strings.previewCr} <bdi>{factory.cr_number}</bdi>
                    {factory.license_number && <> · {strings.previewLicense} <bdi>{factory.license_number}</bdi></>}
                    {" · "}{strings.previewRegion} <bdi>{factory.region ?? "—"}{factory.city ? `, ${factory.city}` : ""}</bdi></div>
                  <div className="ax-caption">{strings.previewFreshness}: {factory.source_synced_at ? <bdi>{new Date(factory.source_synced_at).toISOString().slice(0, 10)}</bdi> : strings.previewFreshnessNever}
                    {" · "}{strings.previewRisk}: {factory.risk_band ?? strings.previewRiskUnknown}{factory.risk_score != null ? ` (${factory.risk_score})` : ""}</div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="ax-field" style={{ maxInlineSize: "none" }}><label className="ax-field__label" htmlFor="imm-manual-name">{strings.manualName}</label>
                <input id="imm-manual-name" key={`mn-${resetKey}`} className="ax-input" name="manual_name" value={manualName} onChange={e => setManualName(e.target.value)} placeholder={strings.manualPlaceholder} /></div>
              <div className="row">
                <div className="ax-field"><label className="ax-field__label" htmlFor="imm-manual-region">{strings.manualRegion}</label>
                  <input id="imm-manual-region" key={`mrg-${resetKey}`} className="ax-input" name="manual_region" list="imm-region-options" value={manualRegion} onChange={e => setManualRegion(e.target.value)} /></div>
                <div className="ax-field"><label className="ax-field__label" htmlFor="imm-manual-city">{strings.manualCity}</label>
                  <input id="imm-manual-city" key={`mci-${resetKey}`} className="ax-input" name="manual_city" list="imm-city-options" value={manualCity} onChange={e => setManualCity(e.target.value)} placeholder={strings.manualCityPlaceholder} /></div>
              </div>
              <datalist id="imm-region-options">{regionOptions.map(r => <option key={r} value={r} />)}</datalist>
              <datalist id="imm-city-options">{cityOptions.map(c => <option key={c} value={c} />)}</datalist>
              <div className="row">
                <div className="ax-field"><label className="ax-field__label" htmlFor="imm-manual-cr">{strings.manualCr}</label>
                  <input id="imm-manual-cr" key={`mcr-${resetKey}`} className="ax-input ax-numeric" name="manual_cr" value={manualCr} onChange={e => setManualCr(e.target.value)} /></div>
                <div className="ax-field"><label className="ax-field__label" htmlFor="imm-manual-license">{strings.manualLicense}</label>
                  <input id="imm-manual-license" key={`mli-${resetKey}`} className="ax-input ax-numeric" name="manual_license" value={manualLicense} onChange={e => setManualLicense(e.target.value)} /></div>
              </div>
              <div className="ax-field" style={{ maxInlineSize: "none" }}><label className="ax-field__label" htmlFor="imm-manual-activity">{strings.manualActivity}</label>
                <input id="imm-manual-activity" key={`mac-${resetKey}`} className="ax-input" name="manual_activity" value={manualActivity} onChange={e => setManualActivity(e.target.value)} placeholder={strings.manualActivityPlaceholder} /></div>
              <p className="ax-caption">{strings.temporaryNote}</p>

              {/* DEC-F — recommendation only. This inspector never executes the
                  decision: enforcement_recommendations RLS grants inspector
                  insert-only; ops/compliance_admin hold the sole update policy. */}
              <div className="ax-field" style={{ maxInlineSize: "none" }}>
                <label className="ax-field__label" htmlFor="imm-enforcement">{strings.enforcementLabel}</label>
                <p className="ax-caption" style={{ marginBlockEnd: "var(--ax-space-100)" }}>{strings.enforcementHint}</p>
                <div id="imm-enforcement" className="ax-segmented" role="group" aria-label={strings.enforcementLabel} style={{ flexWrap: "wrap", maxInlineSize: "100%" }}>
                  {[["", strings.enforcementNone], ["fine", strings.enforcementFine], ["committee", strings.enforcementCommittee], ["warning", strings.enforcementWarning], ["closure", strings.enforcementClosure]].map(([v, label]) => (
                    <button key={v} type="button" aria-pressed={enforcementAction === v} onClick={() => setEnforcementAction(v)}>{label}</button>
                  ))}
                </div>
              </div>
              <input type="hidden" name="enforcement_action" value={enforcementAction} key={`ea-${resetKey}`} />
              {enforcementAction !== "" && (
                <label className="ax-field" style={{ maxInlineSize: "none" }}>
                  <span className="ax-field__label">{strings.enforcementNotes}</span>
                  <textarea className="ax-textarea" name="enforcement_notes" rows={2} value={enforcementNotes}
                    onChange={e => setEnforcementNotes(e.target.value)} placeholder={strings.enforcementNotesPlaceholder} />
                </label>
              )}
            </>
          )}

          <div className="ax-field" style={{ maxInlineSize: "none" }} id="imm-reason" tabIndex={-1}>
            <label className="ax-field__label" htmlFor="imm-reason">{strings.urgencyReason}</label>
            <div className="ax-segmented" role="group" aria-label={strings.urgencyReason} style={{ flexWrap: "wrap", maxInlineSize: "100%" }}>
              {[["Complaint received", strings.reasonComplaint], ["Incident / accident report", strings.reasonIncident], ["Referral from authority", strings.reasonReferral], ["Other", strings.reasonOther]].map(([v, label]) => (
                <button key={v} type="button" aria-pressed={reason === v} onClick={() => setReason(v)}>{label}</button>
              ))}
            </div>
            {reason === "Other" && <p id="imm-reason-other-hint" className="ax-caption">{strings.reasonOtherHint}</p>}
          </div>
          <input type="hidden" name="urgency_reason" value={reason} key={`ur-${resetKey}`} />

          <div className="ax-field" style={{ maxInlineSize: "none" }}><label className="ax-field__label" htmlFor="imm-visit-type">{strings.visitType}</label>
            <select id="imm-visit-type" key={`vt-${resetKey}`} className="ax-select" name="visit_type" value={visitType} onChange={e => setVisitType(e.target.value)}>
              <option value="complaint">{strings.typeComplaint}</option>
              <option value="follow_up">{strings.typeFollowUp}</option>
              <option value="periodic">{strings.typePeriodic}</option>
            </select></div>
        </div>

        <div className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
          <h4>{strings.locationDispatch}</h4>
          {mode === "registered" && factory?.official_lat != null && factory?.official_lng != null && (
            <button type="button" className="ax-btn ax-btn--secondary" onClick={useOfficialLocation}>{strings.useOfficialLocation}</button>
          )}
          <div style={{ blockSize: 240, marginBlockEnd: "var(--ax-space-100)" }}>
            <GeoMap center={mapCenter} zoom={locationOk ? 14 : 6} markers={mapMarkers} height="100%" />
          </div>
          <div className="row">
            <div className="ax-field"><label className="ax-field__label" htmlFor="imm-lat">{strings.latitude}</label>
              <input id="imm-lat" key={`lat-${resetKey}`} className="ax-input ax-numeric" name="lat" value={lat} onChange={e => onLatChange(e.target.value)} /></div>
            <div className="ax-field"><label className="ax-field__label" htmlFor="imm-lng">{strings.longitude}</label>
              <input id="imm-lng" key={`lng-${resetKey}`} className="ax-input ax-numeric" name="lng" value={lng} onChange={e => onLngChange(e.target.value)} /></div>
          </div>
          <p className="ax-caption" dir="ltr">
            {!locationOk ? strings.locationSourceNone
              : locationSource === "official" ? strings.locationSourceOfficial
                : strings.locationSourceManual.replace("{who}", actorName || "—").replace("{when}", locationAt ? new Date(locationAt).toLocaleString() : "")}
          </p>

          {actorMode === "planner" ? <>
            <div className="row">
              <div className="ax-field"><label className="ax-field__label" htmlFor="imm-window-start">{strings.windowStart}</label>
                <input id="imm-window-start" key={`ws-${resetKey}`} className="ax-input ax-numeric" name="window_start" type="datetime-local" value={windowStart} onChange={e => setWindowStart(e.target.value)} /></div>
              <div className="ax-field"><label className="ax-field__label" htmlFor="imm-window-end">{strings.windowEnd}</label>
                <input id="imm-window-end" key={`we-${resetKey}`} className="ax-input ax-numeric" name="window_end" type="datetime-local" value={windowEnd} onChange={e => setWindowEnd(e.target.value)} /></div>
            </div>
            <span className="ax-caption">{strings.windowHint}</span>
          </> : <div className="ax-banner ax-banner--info"><div>{strings.inspectorStartNow}</div></div>}

          <div className="ax-field" style={{ maxInlineSize: "none" }}><label className="ax-field__label" htmlFor="imm-priority">{strings.priority}</label>
            <input id="imm-priority" key={`pr-${resetKey}`} className="ax-input" name="priority" value={priority} onChange={e => setPriority(e.target.value)} placeholder={strings.priorityPlaceholder} /></div>

          <div className="ax-field" style={{ maxInlineSize: "none" }}>
            <label className="ax-field__label" id="imm-package-label">{strings.packageLabel}</label>
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

          {actorMode === "planner" && <div className="ax-field" style={{ maxInlineSize: "none" }}><label className="ax-field__label" htmlFor="imm-inspector">{strings.inspector}</label>
            <select id="imm-inspector" key={`in-${resetKey}`} className="ax-select" name="inspector_id" value={inspectorId} onChange={e => setInspectorId(e.target.value)}>
              <option value="auto">{strings.autoAssign}</option>
              {inspectors.map(i => <option key={i.user_id} value={i.user_id}>{i.full_name}</option>)}
            </select></div>}

          <div className="ax-field" style={{ maxInlineSize: "none" }}><label className="ax-field__label" htmlFor="imm-notes">{strings.notes}</label>
            <textarea id="imm-notes" key={`no-${resetKey}`} className="ax-input" name="notes" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder={strings.notesPlaceholder} /></div>
        </div>
      </div>

      <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <h4 style={{ marginBlockEnd: "var(--ax-space-100)" }}>{strings.consequenceTitle}</h4>
        <ul style={{ margin: 0, paddingInlineStart: "1.2em", display: "flex", flexDirection: "column", gap: "var(--ax-space-050)" }}>
          <li className="ax-caption">{strings.consequenceVisit}</li>
          <li className="ax-caption">{strings.consequenceAssign}</li>
          <li className="ax-caption">{strings.consequenceNotify}</li>
          <li className="ax-caption">{strings.consequenceAudit}</li>
        </ul>
        {actorMode === "planner" && <label className="ax-check" style={{ marginBlockStart: "var(--ax-space-200)" }}>
          <input type="checkbox" name="review_confirmed" value="yes" checked={reviewed} onChange={e => setReviewed(e.target.checked)} />
          <span>{strings.reviewConfirm}</span>
        </label>}
      </div>

      {state.error && <div className="ax-validation" role="alert"><strong>{strings.blockedTitle}</strong><div>{state.error}</div></div>}

      <div className="row" style={{ justifyContent: "flex-end" }}>
        <button className="ax-btn ax-btn--prominent" disabled={pending || !requestId || (actorMode === "planner" && !reviewed)}>
          {pending ? strings.creating : actorMode === "inspector" ? strings.createAndStart : strings.create}
        </button>
      </div>
    </form>
  );
}
