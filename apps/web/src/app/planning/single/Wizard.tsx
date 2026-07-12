"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { GeoMarkerData } from "@/components/GeoMap";
import { publishSingleVisit, type PublishResult } from "./actions";

type Factory = {
  id: string; factory_code: string; name: string; cr_number: string; license_number: string | null;
  region: string; city: string; risk_band: string | null; risk_score: number | null;
  official_lat: number | null; official_lng: number | null; geofence_radius_m: number | null;
};
type Pkg = { id: string; version_label: string; packages: { code: string; title: string } };
type Insp = { user_id: string; full_name: string };

// SB19 — server page builds every user-facing string with t() and passes them here.
export type WizardStrings = {
  findFactory: string; searchPlaceholder: string; noMatch: string; crPrefix: string;
  licenseStep: string; licenseSelect: string; licenseLabel: string; licenseNone: string;
  locationStep: string; officialPin: string; noOfficialPin: string;
  plannerLat: string; plannerLng: string; plannerPin: string; locationConfirmed: string; mapLoading: string;
  configStep: string;
  visitType: string; typePeriodic: string; typeFollowUp: string; typeComplaint: string;
  packageLabel: string; mode: string; modePhysical: string; modeVirtual: string;
  windowStart: string; windowEnd: string; inspector: string; selectOption: string;
  blockedTitle: string; publish: string; publishing: string;
  riskBands: Record<string, string>;
};

// Module-level label so the dynamic() loading component can render localized text.
let mapLoadingLabel = "Loading location map";

// G-MAP pattern — react-leaflet v5 is client-only (ssr:false).
const GeoMap = dynamic(() => import("@/components/GeoMap"), {
  ssr: false,
  loading: () => (
    <div className="ax-state ax-state--inline">
      <span className="ax-state__glyph">…</span><h4>{mapLoadingLabel}</h4>
    </div>
  ),
});

export default function Wizard({ factories, packages, inspectors, strings }: { factories: Factory[]; packages: Pkg[]; inspectors: Insp[]; strings: WizardStrings }) {
  const [state, formAction, pending] = useActionState<PublishResult, FormData>(publishSingleVisit, {});
  const [query, setQuery] = useState("");
  const [factory, setFactory] = useState(null as Factory | null);
  const [plannerLat, setPlannerLat] = useState("");
  const [plannerLng, setPlannerLng] = useState("");
  // Controlled, not uncontrolled — a blocked-publish retry (M01-041) re-renders
  // this form via useActionState, and uncontrolled inputs (date/radio/checkbox)
  // lose their entered value on that re-render, silently discarding the planner's
  // work. React-owned state (like `factory` above) survives the same re-render
  // fine, which is why every field below is lifted into state rather than left
  // as a bare DOM value/checked attribute.
  const [windowStart, setWindowStart] = useState("");
  const [windowEnd, setWindowEnd] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  // React 19 auto-resets a <form action={...}>'s native controls after every
  // action completion (success AND blocked/validation failure) — a documented
  // behavior that writes directly to the DOM and bypasses controlled-input
  // reconciliation, silently wiping the planner's already-entered values on a
  // blocked-publish retry (M01-041). React's own state above is untouched by
  // that reset; remounting the affected controls once `state` settles makes
  // them re-initialize from that still-correct state instead of the DOM value
  // the native reset left behind.
  const isFirstRender = useRef(true);
  const [resetKey, setResetKey] = useState(0);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setResetKey(k => k + 1);
  }, [state]);
  mapLoadingLabel = strings.mapLoading;
  const searching = query.length >= 3;
  const ql = query.toLowerCase();
  const matches = searching ? factories.filter(f => {
    return f.cr_number?.includes(query) || f.factory_code.toLowerCase().includes(ql) || (f.license_number ?? "").toLowerCase().includes(ql);
  }) : [];

  const hasOfficial = factory != null && factory.official_lat != null && factory.official_lng != null;
  const pLat = Number(plannerLat); const pLng = Number(plannerLng);
  const hasPlannerPin = plannerLat !== "" && plannerLng !== "" && Number.isFinite(pLat) && Number.isFinite(pLng);
  const mapMarkers: GeoMarkerData[] = factory ? [
    ...(hasOfficial ? [{
      id: "official", lat: factory.official_lat as number, lng: factory.official_lng as number,
      label: `${strings.officialPin} — ${factory.name}`,
      tone: (factory.risk_band === "high" ? "high" : factory.risk_band === "medium" ? "medium" : "low") as GeoMarkerData["tone"],
      radiusM: factory.geofence_radius_m ?? undefined,
    }] : []),
    ...(hasPlannerPin ? [{ id: "planner", lat: pLat, lng: pLng, label: strings.plannerPin, tone: "neutral" as const }] : []),
  ] : [];
  const mapCenter: [number, number] = hasOfficial
    ? [factory!.official_lat as number, factory!.official_lng as number]
    : hasPlannerPin ? [pLat, pLng] : [24.7136, 46.6753];

  return (
    <form action={formAction} className="ax-stack" style={{ gap: "var(--ax-space-300)" }}>
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{strings.findFactory}</h4>
        <span className="ax-search"><input className="ax-input" placeholder={strings.searchPlaceholder} value={query} onChange={e => setQuery(e.target.value)} /></span>
        {searching && matches.length === 0 && (
          <div className="ax-banner ax-banner--warning" style={{ marginBlockStart: "var(--ax-space-150)" }}><div>{strings.noMatch}</div></div>
        )}
        {matches.map(f => (
          <label key={f.id} className="ax-choice" style={{ display: "flex", marginBlockStart: "var(--ax-space-100)" }}>
            <input type="radio" name="factory_id" value={f.id} checked={factory?.id === f.id} onChange={() => setFactory(f)} />
            <span><strong>{f.name}</strong> · {f.factory_code} · {strings.crPrefix} {f.cr_number} · {f.city}
              {f.risk_band && <span className={`ax-lozenge ${f.risk_band === "high" ? "ax-lozenge--critical" : f.risk_band === "medium" ? "ax-lozenge--warning" : "ax-lozenge--success"}`} style={{ marginInlineStart: 8 }}>{strings.riskBands[f.risk_band] ?? f.risk_band} · {f.risk_score}</span>}
            </span>
          </label>
        ))}
      </div>
      {factory && (
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{strings.licenseStep}</h4>
          {factory.license_number ? (
            <>
              <p className="ax-caption" style={{ marginBlockEnd: "var(--ax-space-100)" }}>{strings.licenseSelect}</p>
              <label className="ax-choice" style={{ display: "flex" }}>
                <input key={resetKey} type="radio" name="license_number" value={factory.license_number} required
                  checked={licenseNumber === factory.license_number} onChange={() => setLicenseNumber(factory.license_number as string)} />
                <span><strong className="ax-numeric">{factory.license_number}</strong> · {strings.licenseLabel} · {factory.name}</span>
              </label>
            </>
          ) : (
            <div className="ax-banner ax-banner--info"><div>{strings.licenseNone}</div></div>
          )}
        </div>
      )}
      {factory && (
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{strings.locationStep}</h4>
          {!hasOfficial && (
            <div className="ax-banner ax-banner--warning" style={{ marginBlockEnd: "var(--ax-space-150)" }}><div>{strings.noOfficialPin}</div></div>
          )}
          <div style={{ blockSize: 280, marginBlockEnd: "var(--ax-space-200)" }}>
            <GeoMap center={mapCenter} zoom={14} markers={mapMarkers} height="100%" />
          </div>
          <div className="ax-row" style={{ flexWrap: "wrap", gap: "var(--ax-space-200)" }}>
            <div className="ax-field"><label className="ax-field__label">{strings.plannerLat}</label>
              <input key={resetKey} className="ax-input ax-numeric" name="planner_lat" value={plannerLat} onChange={e => setPlannerLat(e.target.value)} /></div>
            <div className="ax-field"><label className="ax-field__label">{strings.plannerLng}</label>
              <input key={resetKey} className="ax-input ax-numeric" name="planner_lng" value={plannerLng} onChange={e => setPlannerLng(e.target.value)} /></div>
          </div>
          <label className="ax-choice" style={{ display: "flex", marginBlockStart: "var(--ax-space-150)" }}>
            <input key={resetKey} type="checkbox" name="location_confirmed" value="1" required
              checked={locationConfirmed} onChange={e => setLocationConfirmed(e.target.checked)} />
            <span>{strings.locationConfirmed}</span>
          </label>
        </div>
      )}
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{strings.configStep}</h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "var(--ax-space-200)" }}>
          <div className="ax-field"><label className="ax-field__label">{strings.visitType}</label>
            <select className="ax-select" name="visit_type"><option value="periodic">{strings.typePeriodic}</option><option value="follow_up">{strings.typeFollowUp}</option><option value="complaint">{strings.typeComplaint}</option></select></div>
          <div className="ax-field"><label className="ax-field__label">{strings.packageLabel}</label>
            <select className="ax-select" name="package_version_id">{packages.map(p => <option key={p.id} value={p.id}>{p.packages.code} · {p.version_label}</option>)}</select></div>
          <div className="ax-field"><label className="ax-field__label">{strings.mode}</label>
            <select className="ax-select" name="execution_mode"><option value="physical">{strings.modePhysical}</option><option value="virtual">{strings.modeVirtual}</option></select></div>
          <div className="ax-field"><label className="ax-field__label">{strings.windowStart}</label>
            <input key={resetKey} className="ax-input ax-numeric" name="window_start" type="datetime-local" required value={windowStart} onChange={e => setWindowStart(e.target.value)} /></div>
          <div className="ax-field"><label className="ax-field__label">{strings.windowEnd}</label>
            <input key={resetKey} className="ax-input ax-numeric" name="window_end" type="datetime-local" required value={windowEnd} onChange={e => setWindowEnd(e.target.value)} /></div>
          <div className="ax-field"><label className="ax-field__label">{strings.inspector}</label>
            <select className="ax-select" name="inspector_id"><option value="">{strings.selectOption}</option>{inspectors.map(i => <option key={i.user_id} value={i.user_id}>{i.full_name}</option>)}</select></div>
        </div>
      </div>
      {state.error && (
        <div className="ax-validation" role="alert"><strong>{strings.blockedTitle}</strong>
          <ul>{state.error.split(" · ").map(b => <li key={b}>{b}</li>)}</ul></div>
      )}
      <div className="ax-row" style={{ justifyContent: "flex-end" }}>
        <button className="ax-btn ax-btn--prominent" disabled={pending}>{pending ? strings.publishing : strings.publish}</button>
      </div>
    </form>
  );
}
