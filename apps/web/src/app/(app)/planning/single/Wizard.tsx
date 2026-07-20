"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { publishSingleVisit, type PublishResult } from "./actions";
import IdentityDossier from "./IdentityDossier";

// CD-022 — a search result graded by RULE, never scored. EXACT = governed
// identifier equality only. SIMILAR_NAME = the name matched, identifiers
// differ from the search term (the dossier always shows the real
// identifier). `degraded` is an independent data-quality flag (missing
// license or coordinates), not a third competing grade. `duplicate` is the
// selection-time M02-012 warning — the hard block still lives at publish.
export type GradedFactory = {
  // factory_code/cr_number/region/city are optional on temporary entities
  // (created e.g. by Immediate Visit Planning, which never assigns a code) —
  // null here is real data, not a type-safety shortcut.
  id: string; factory_code: string | null; name: string; cr_number: string | null; license_number: string | null;
  region: string | null; city: string | null; risk_band: string | null; risk_score: number | null;
  official_lat: number | null; official_lng: number | null; geofence_radius_m: number | null;
  source_synced_at: string | null;
  grade: "exact" | "similar_name";
  degraded: boolean;
  duplicate: boolean;
  duplicateVisitId: string | null;
  duplicateVisitStatus: string | null;
};

type Pkg = { id: string; version_label: string; packages: { code: string; title: string } };
type Insp = { user_id: string; full_name: string };

// SB19 — server page builds every user-facing string with t() and passes them here.
export type WizardStrings = {
  findFactory: string; searchPlaceholder: string; noMatch: string; registryUnavailable: string; crPrefix: string;
  exactBadge: string; exactRule: string; similarBadge: string; similarRule: string;
  degradedBadge: string; degradedRule: string; duplicateWarning: string; duplicateOpenVisit: string; duplicateStatusLabel: string;
  licenseStep: string; licenseSelect: string; licenseLabel: string; licenseNone: string;
  locationStep: string; officialPin: string; noOfficialPin: string;
  plannerLat: string; plannerLng: string; plannerPin: string; locationConfirmed: string; mapLoading: string;
  mapToggle: string; textEquivalent: string; riskContext: string; riskUnknown: string;
  freshnessLabel: string; freshnessNever: string; factory360: string;
  configStep: string;
  visitType: string; typePeriodic: string; typeFollowUp: string; typeComplaint: string;
  packageLabel: string; mode: string; modePhysical: string; modeVirtual: string; modeIneligible: string;
  windowStart: string; windowEnd: string; inspector: string; selectOption: string; autoAssign: string;
  notes: string; notesPlaceholder: string;
  readinessTitle: string; readyIdentity: string; readyLicense: string; readyLocation: string; readyInspector: string;
  blockedTitle: string; publish: string; publishing: string; retry: string;
  stepPlan: string; stepVisit: string; stepAssignment: string; stepStatus: string; stepNotification: string;
  stepDone: string; stepFailed: string; stepPending: string;
  riskBands: Record<string, string>;
};

export default function Wizard({ query, results, registryUnavailable, packages, inspectors, strings, virtualEligible }: {
  query: string; results: GradedFactory[]; registryUnavailable: boolean; packages: Pkg[]; inspectors: Insp[]; strings: WizardStrings; virtualEligible: boolean;
}) {
  const [state, formAction, pending] = useActionState<PublishResult, FormData>(publishSingleVisit, {});
  const router = useRouter();
  const [queryInput, setQueryInput] = useState(query);
  // Comparison rail: nothing pre-selected; picking a radio is the explicit
  // act that both selects the candidate and opens its dossier.
  const [factoryId, setFactoryId] = useState<string | null>(null);
  const [plannerLat, setPlannerLat] = useState("");
  const [plannerLng, setPlannerLng] = useState("");
  // Controlled, not uncontrolled — a blocked-publish retry (M01-041) re-renders
  // this form via useActionState, and uncontrolled inputs (date/radio/checkbox)
  // lose their entered value on that re-render, silently discarding the planner's
  // work. React-owned state (like `factoryId` above) survives the same re-render
  // fine, which is why every field below is lifted into state rather than left
  // as a bare DOM value/checked attribute.
  const [windowStart, setWindowStart] = useState("");
  const [windowEnd, setWindowEnd] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [inspectorId, setInspectorId] = useState("");
  const [executionMode, setExecutionMode] = useState<"physical" | "virtual">("physical");
  const [notes, setNotes] = useState("");
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

  // Focus transfer to the first blocking error (DSG-A11Y-001) — the alert is
  // a real DOM focus target (tabIndex=-1), not just an aria-live announcement,
  // so keyboard-only planners land there directly on a blocked publish.
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.error) errorRef.current?.focus();
  }, [state.error]);

  // Server-side search (CD-022): debounce the query into a `?q=` navigation
  // so page.tsx re-runs the graded server search. Nothing is pre-selected —
  // opening a dossier is always an explicit click. Skipped on mount (and
  // whenever the input reverts to the server-rendered `query`) so this
  // effect never fires an unnecessary navigation on initial page load.
  const isFirstSearchEffect = useRef(true);
  useEffect(() => {
    if (isFirstSearchEffect.current) { isFirstSearchEffect.current = false; return; }
    if (queryInput === query) return;
    const h = setTimeout(() => {
      const params = new URLSearchParams();
      if (queryInput.trim().length >= 3) params.set("q", queryInput.trim());
      router.replace(params.toString() ? `/planning/single?${params.toString()}` : "/planning/single");
    }, 300);
    return () => clearTimeout(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryInput]);

  const factory = results.find(f => f.id === factoryId) ?? null;
  const searching = queryInput.trim().length >= 3;

  const hasOfficial = factory != null && factory.official_lat != null && factory.official_lng != null;
  const pLat = Number(plannerLat); const pLng = Number(plannerLng);
  const hasPlannerPin = plannerLat !== "" && plannerLng !== "" && Number.isFinite(pLat) && Number.isFinite(pLng);
  // M03-011 — execution-mode eligibility: physical needs a GIS-verifiable
  // location (official pin, or a planner override pin — same substitution
  // the M01-038 location-confirmation gate already accepts); virtual needs
  // the OTP engine configured. field/[visitId]/page.tsx computes and shows
  // this read-only after publish; this is the only place mode is actually
  // chosen, so it's the only place that can enforce it, not just display it.
  const physicalEligible = hasOfficial || hasPlannerPin;
  useEffect(() => {
    // Before a factory is picked, "physical ineligible" is meaningless (no
    // location exists yet to be ineligible) — only enforce once eligibility
    // is actually determined, or every session would open on Virtual.
    if (!factory) return;
    if (executionMode === "physical" && !physicalEligible && virtualEligible) setExecutionMode("virtual");
    if (executionMode === "virtual" && !virtualEligible && physicalEligible) setExecutionMode("physical");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory, physicalEligible, virtualEligible]);

  // Progressive configuration: unlocked once identity + license + location
  // are all confirmed (M01-036/038 gates, preserved verbatim below).
  const licenseOk = factory != null && (!factory.license_number || licenseNumber === factory.license_number);
  const configUnlocked = factory != null && licenseOk && locationConfirmed;

  const steps = state.steps;
  const StepRow = ({ label, status }: { label: string; status?: "pending" | "done" | "failed" }) => (
    <li className={`ax-step is-${status ?? "pending"}`}>
      <span aria-hidden="true">{status === "done" ? "✓" : status === "failed" ? "✕" : "◌"}</span>{" "}
      {label} — {status === "done" ? strings.stepDone : status === "failed" ? strings.stepFailed : strings.stepPending}
    </li>
  );

  return (
    <form action={formAction} className="ax-stack" style={{ gap: "var(--ax-space-300)" }}>
      <input type="hidden" name="resume_visit_plan_id" value={state.resumeId ?? ""} />

      <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{strings.findFactory}</h4>
        <span className="ax-search"><input className="ax-input" placeholder={strings.searchPlaceholder} value={queryInput} onChange={e => setQueryInput(e.target.value)} /></span>
        {searching && registryUnavailable && (
          <div className="ax-banner ax-banner--critical" role="alert" style={{ marginBlockStart: "var(--ax-space-150)" }}>
            <div>{strings.registryUnavailable}</div>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => router.refresh()}>{strings.retry}</button>
          </div>
        )}
        {searching && !registryUnavailable && results.length === 0 && (
          <div className="ax-banner ax-banner--warning" style={{ marginBlockStart: "var(--ax-space-150)" }}><div>{strings.noMatch}</div></div>
        )}

        {/* Comparison rail — graded result cards, nothing pre-selected; opening a
            dossier is an explicit click (never auto-opened). */}
        {results.length > 0 && (
          <ul role="listbox" aria-label={strings.findFactory} style={{ listStyle: "none", padding: 0, marginBlockStart: "var(--ax-space-150)", display: "flex", flexDirection: "column", gap: "var(--ax-space-100)" }}>
            {results.map(f => (
              <li key={f.id}>
                {/* Selecting a candidate IS the explicit act that opens its dossier —
                    a single radio per result, nothing pre-checked by default (M01-035). */}
                <label className="ax-choice" style={{ display: "flex", alignItems: "center", gap: "var(--ax-space-100)" }}>
                  <input type="radio" name="factory_id" value={f.id} checked={factoryId === f.id}
                    onChange={() => { setFactoryId(f.id); setLicenseNumber(""); setLocationConfirmed(false); setPlannerLat(""); setPlannerLng(""); }} />
                  <span className={`ax-lozenge ${f.grade === "exact" ? "ax-lozenge--success" : "ax-lozenge--warning"}`}>
                    {f.grade === "exact" ? strings.exactBadge : strings.similarBadge}
                  </span>
                  {f.degraded && <span className="ax-lozenge ax-lozenge--critical">{strings.degradedBadge}</span>}
                  <span><strong>{f.name}</strong> · <bdi>{f.cr_number ?? "—"}</bdi>{f.license_number ? <> · <bdi>{f.license_number}</bdi></> : null}</span>
                </label>
                {factoryId === f.id && (
                  <div style={{ marginBlockStart: "var(--ax-space-150)" }}>
                    <IdentityDossier factory={f} plannerLat={plannerLat} plannerLng={plannerLng} strings={strings} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
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
          <div className="ax-row" style={{ flexWrap: "wrap", gap: "var(--ax-space-200)" }}>
            <div className="ax-field"><label className="ax-field__label" htmlFor="wizard-planner-lat">{strings.plannerLat}</label>
              <input key={resetKey} className="ax-input ax-numeric" name="planner_lat" id="wizard-planner-lat" value={plannerLat} onChange={e => setPlannerLat(e.target.value)} /></div>
            <div className="ax-field"><label className="ax-field__label" htmlFor="wizard-planner-lng">{strings.plannerLng}</label>
              <input key={resetKey} className="ax-input ax-numeric" name="planner_lng" id="wizard-planner-lng" value={plannerLng} onChange={e => setPlannerLng(e.target.value)} /></div>
          </div>
          <label className="ax-choice" style={{ display: "flex", marginBlockStart: "var(--ax-space-150)" }}>
            <input key={resetKey} type="checkbox" name="location_confirmed" value="1" required
              checked={locationConfirmed} onChange={e => setLocationConfirmed(e.target.checked)} />
            <span>{strings.locationConfirmed}</span>
          </label>
        </div>
      )}
      {factory && configUnlocked && (
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{strings.configStep}</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "var(--ax-space-200)" }}>
            <div className="ax-field"><label className="ax-field__label" htmlFor="wizard-visit-type">{strings.visitType}</label>
              <select className="ax-select" name="visit_type" id="wizard-visit-type"><option value="periodic">{strings.typePeriodic}</option><option value="follow_up">{strings.typeFollowUp}</option><option value="complaint">{strings.typeComplaint}</option></select></div>
            <div className="ax-field"><label className="ax-field__label" htmlFor="wizard-package">{strings.packageLabel}</label>
              <select className="ax-select" name="package_version_id" id="wizard-package">{packages.map(p => <option key={p.id} value={p.id}>{p.packages.code} · {p.version_label}</option>)}</select></div>
            <div className="ax-field"><label className="ax-field__label" htmlFor="wizard-mode">{strings.mode}</label>
              <select key={resetKey} className="ax-select" name="execution_mode" id="wizard-mode" value={executionMode} onChange={e => setExecutionMode(e.target.value as "physical" | "virtual")}>
                <option value="physical" disabled={!physicalEligible}>{strings.modePhysical}{!physicalEligible ? ` — ${strings.modeIneligible}` : ""}</option>
                <option value="virtual" disabled={!virtualEligible}>{strings.modeVirtual}{!virtualEligible ? ` — ${strings.modeIneligible}` : ""}</option>
              </select></div>
            <div className="ax-field"><label className="ax-field__label" htmlFor="wizard-window-start">{strings.windowStart}</label>
              <input key={resetKey} className="ax-input ax-numeric" name="window_start" id="wizard-window-start" type="datetime-local" required value={windowStart} onChange={e => setWindowStart(e.target.value)} /></div>
            <div className="ax-field"><label className="ax-field__label" htmlFor="wizard-window-end">{strings.windowEnd}</label>
              <input key={resetKey} className="ax-input ax-numeric" name="window_end" id="wizard-window-end" type="datetime-local" required value={windowEnd} onChange={e => setWindowEnd(e.target.value)} /></div>
            {/* M01-040 — auto-assign option (availability-checked) beside the manual pick */}
            <div className="ax-field"><label className="ax-field__label" htmlFor="wizard-inspector">{strings.inspector}</label>
              <select key={resetKey} className="ax-select" name="inspector_id" id="wizard-inspector" value={inspectorId} onChange={e => setInspectorId(e.target.value)}><option value="">{strings.selectOption}</option><option value="auto">{strings.autoAssign}</option>{inspectors.map(i => <option key={i.user_id} value={i.user_id}>{i.full_name}</option>)}</select></div>
          </div>
          <div className="ax-field" style={{ marginBlockStart: "var(--ax-space-200)" }}><label className="ax-field__label" htmlFor="wizard-notes">{strings.notes}</label>
            <textarea key={resetKey} className="ax-textarea" name="notes" id="wizard-notes" rows={2} placeholder={strings.notesPlaceholder}
              value={notes} onChange={e => setNotes(e.target.value)} /></div>
        </div>
      )}

      {factory && (
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <h4 style={{ marginBlockEnd: "var(--ax-space-100)" }}>{strings.readinessTitle}</h4>
          <div className="ax-row" style={{ gap: "var(--ax-space-100)", flexWrap: "wrap" }}>
            <span className={`ax-lozenge ${factory ? "ax-lozenge--success" : "ax-lozenge--critical"}`}>{factory ? "✓" : "✕"} {strings.readyIdentity}</span>
            <span className={`ax-lozenge ${licenseOk ? "ax-lozenge--success" : "ax-lozenge--critical"}`}>{licenseOk ? "✓" : "✕"} {strings.readyLicense}</span>
            <span className={`ax-lozenge ${locationConfirmed ? "ax-lozenge--success" : "ax-lozenge--critical"}`}>{locationConfirmed ? "✓" : "✕"} {strings.readyLocation}</span>
            <span className={`ax-lozenge ${inspectorId ? "ax-lozenge--success" : "ax-lozenge--critical"}`}>{inspectorId ? "✓" : "✕"} {strings.readyInspector}</span>
          </div>
        </div>
      )}

      {state.error && (
        <div ref={errorRef} tabIndex={-1} className="ax-validation" role="alert"><strong>{strings.blockedTitle}</strong>
          <ul>{state.error.split(" · ").map(b => <li key={b}>{b}</li>)}</ul>
          {steps && (
            <ul style={{ marginBlockStart: "var(--ax-space-150)" }}>
              <StepRow label={strings.stepPlan} status={steps.plan} />
              <StepRow label={strings.stepVisit} status={steps.visit} />
              <StepRow label={strings.stepAssignment} status={steps.assignment} />
              <StepRow label={strings.stepStatus} status={steps.status} />
              <StepRow label={strings.stepNotification} status={steps.notification} />
            </ul>
          )}
        </div>
      )}

      <div className="ax-row" style={{ justifyContent: "flex-end" }}>
        <button className="ax-btn ax-btn--prominent" disabled={pending || !configUnlocked}>
          {pending ? strings.publishing : state.resumeId ? strings.retry : strings.publish}
        </button>
      </div>
    </form>
  );
}
