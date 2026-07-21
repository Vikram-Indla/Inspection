"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { publishSingleVisit, saveSingleDraft, type PublishResult } from "./actions";
import IdentityDossier from "./IdentityDossier";
import type { ResolvedLicence, ResolvedPortfolio } from "@/lib/planning/factory-resolver";

// CD-022 / PLN-REQ-020..024 — a search result graded by RULE, never scored.
// EXACT = governed identifier equality only. SIMILAR_NAME = the name matched,
// identifiers differ from the search term (the dossier always shows the real
// identifier). `degraded` is an independent data-quality flag (missing
// license or coordinates), not a third competing grade. `duplicate` is the
// selection-time M02-012 warning — the hard block still lives at publish.
// `source:'legacy'` marks the legacy factories fallback explicitly: canonical
// CR → licence → plant results arrive as portfolios instead.
export type GradedFactory = {
  // factory_code/cr_number/region/city are optional on temporary entities
  // (created e.g. by Immediate Visit Planning, which never assigns a code) —
  // null here is real data, not a type-safety shortcut.
  id: string; factory_code: string | null; name: string; cr_number: string | null; license_number: string | null;
  region: string | null; city: string | null; risk_band: string | null; risk_score: number | null;
  official_lat: number | null; official_lng: number | null; geofence_radius_m: number | null;
  source_synced_at: string | null;
  source: "legacy";
  grade: "exact" | "similar_name";
  degraded: boolean;
  duplicate: boolean;
  duplicateVisitId: string | null;
  duplicateVisitStatus: string | null;
};

// Draft resume hydration (PLN-REQ-020/022): config values are restored
// verbatim from visit_plans.draft_payload; the location-confirmation gate is
// deliberately NOT restored — the planner re-confirms explicitly (M01-038).
export type DraftConfig = {
  visitType?: string; packageVersionId?: string; executionMode?: string;
  windowStart?: string; windowEnd?: string; inspectorId?: string;
  notes?: string; plannerLat?: string; plannerLng?: string; licenseNumber?: string;
};
export type DraftInfo = { id: string; planReference: string; version: number };
export type InitialSelection = { factoryId?: string; licenceId?: string };

type Pkg = { id: string; version_label: string; packages: { code: string; title: string } };
type Insp = { user_id: string; full_name: string };

// The resolved publish target, unified across the two source models. The
// hidden form fields are built from this — never from the radio DOM state.
type Target = {
  kind: "canonical" | "legacy";
  factoryId: string;
  name: string;
  crNumber: string | null;
  // factories.license_number — the value the publish RPC revalidates against.
  factoryLicenseNumber: string | null;
  canonicalLicenseNumber: string | null;
  plantNumber: string | null;
  officialLat: number | null;
  officialLng: number | null;
  riskBand: string | null;
  riskScore: number | null;
  sourceSyncedAt: string | null;
};

// SB19 — server page builds every user-facing string with t() and passes them here.
export type WizardStrings = {
  findFactory: string; searchPlaceholder: string; noMatch: string; registryUnavailable: string; crPrefix: string;
  exactBadge: string; exactRule: string; similarBadge: string; similarRule: string;
  degradedBadge: string; degradedRule: string; duplicateWarning: string; duplicateOpenVisit: string; duplicateStatusLabel: string;
  portfolioStep: string; crIdentity: string; selectLicenceHint: string; licenceRequired: string;
  noLicences: string; noFactoryLink: string; plantLabel: string; selectedProfile: string; sourceLabel: string;
  prefilledHandoff: string; prefillMiss: string; draftRestored: string;
  saveDraft: string; savingDraft: string; draftSavedPrefix: string; draftError: string;
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

export default function Wizard({
  query, portfolios, results, registryUnavailable, initialSelection, draft, draftConfig,
  sourceChannel, handoff, prefillMiss, packages, inspectors, strings, virtualEligible,
}: {
  query: string;
  portfolios: ResolvedPortfolio[];
  results: GradedFactory[];
  registryUnavailable: boolean;
  initialSelection: InitialSelection;
  draft: DraftInfo | null;
  draftConfig: DraftConfig;
  sourceChannel: string;
  handoff: boolean;
  prefillMiss: boolean;
  packages: Pkg[];
  inspectors: Insp[];
  strings: WizardStrings;
  virtualEligible: boolean;
}) {
  const [state, formAction, pending] = useActionState<PublishResult, FormData>(publishSingleVisit, {});
  const router = useRouter();
  const [queryInput, setQueryInput] = useState(query);
  // Nothing is pre-selected by a search alone; picking a radio is the
  // explicit act that selects a target. Handoff/draft prefill arrives through
  // initialSelection (server-resolved, never guessed client-side).
  const [factoryId, setFactoryId] = useState<string | null>(initialSelection.factoryId ?? null);
  const [licenceId, setLicenceId] = useState<string | null>(initialSelection.licenceId ?? null);
  const [plannerLat, setPlannerLat] = useState(draftConfig.plannerLat ?? "");
  const [plannerLng, setPlannerLng] = useState(draftConfig.plannerLng ?? "");
  // Controlled, not uncontrolled — a blocked-publish retry (M01-041) re-renders
  // this form via useActionState, and uncontrolled inputs (date/radio/checkbox)
  // lose their entered value on that re-render, silently discarding the planner's
  // work. React-owned state survives the same re-render fine, which is why every
  // field below is lifted into state rather than left as a bare DOM value.
  const [visitType, setVisitType] = useState(draftConfig.visitType ?? "periodic");
  const [packageVersionId, setPackageVersionId] = useState(draftConfig.packageVersionId ?? (packages[0]?.id ?? ""));
  const [windowStart, setWindowStart] = useState(draftConfig.windowStart ?? "");
  const [windowEnd, setWindowEnd] = useState(draftConfig.windowEnd ?? "");
  const [licenseNumber, setLicenseNumber] = useState(draftConfig.licenseNumber ?? "");
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [inspectorId, setInspectorId] = useState(draftConfig.inspectorId ?? "");
  const [executionMode, setExecutionMode] = useState<"physical" | "virtual">(draftConfig.executionMode === "virtual" ? "virtual" : "physical");
  const [notes, setNotes] = useState(draftConfig.notes ?? "");
  // Draft save state — after the first save the same draft row is updated
  // (draft_version bumps), and the publish path consumes it via resume id.
  const [draftState, setDraftState] = useState<DraftInfo | null>(draft);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSaveFailed, setDraftSaveFailed] = useState(false);
  const [draftJustSaved, setDraftJustSaved] = useState(false);
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
  // so page.tsx re-runs the canonical resolver / graded legacy search.
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

  const legacyFactory = results.find(f => f.id === factoryId) ?? null;
  const selectedLicenceEntry = portfolios
    .flatMap(p => p.licences.map(l => ({ portfolio: p, licence: l })))
    .find(x => x.licence.id === licenceId) ?? null;
  const searching = queryInput.trim().length >= 3;

  const target: Target | null = selectedLicenceEntry?.licence.factory
    ? {
        kind: "canonical",
        factoryId: selectedLicenceEntry.licence.factory.id,
        name: selectedLicenceEntry.licence.factory.name,
        crNumber: selectedLicenceEntry.portfolio.crNumber,
        factoryLicenseNumber: selectedLicenceEntry.licence.factory.licenseNumber,
        canonicalLicenseNumber: selectedLicenceEntry.licence.licenseNumber,
        plantNumber: selectedLicenceEntry.licence.plantNumber,
        officialLat: selectedLicenceEntry.licence.factory.officialLat,
        officialLng: selectedLicenceEntry.licence.factory.officialLng,
        riskBand: selectedLicenceEntry.licence.factory.riskBand,
        riskScore: selectedLicenceEntry.licence.factory.riskScore,
        sourceSyncedAt: selectedLicenceEntry.licence.factory.sourceSyncedAt ?? selectedLicenceEntry.licence.sourceSyncedAt,
      }
    : legacyFactory
      ? {
          kind: "legacy",
          factoryId: legacyFactory.id,
          name: legacyFactory.name,
          crNumber: legacyFactory.cr_number,
          factoryLicenseNumber: legacyFactory.license_number,
          canonicalLicenseNumber: null,
          plantNumber: null,
          officialLat: legacyFactory.official_lat,
          officialLng: legacyFactory.official_lng,
          riskBand: legacyFactory.risk_band,
          riskScore: legacyFactory.risk_score,
          sourceSyncedAt: legacyFactory.source_synced_at,
        }
      : null;

  const hasOfficial = target != null && target.officialLat != null && target.officialLng != null;
  const pLat = Number(plannerLat); const pLng = Number(plannerLng);
  const hasPlannerPin = plannerLat !== "" && plannerLng !== "" && Number.isFinite(pLat) && Number.isFinite(pLng);
  // M03-011 — execution-mode eligibility: physical needs a GIS-verifiable
  // location (official pin, or a planner override pin); virtual needs the OTP
  // engine configured.
  const physicalEligible = hasOfficial || hasPlannerPin;
  useEffect(() => {
    if (!target) return;
    if (executionMode === "physical" && !physicalEligible && virtualEligible) setExecutionMode("virtual");
    if (executionMode === "virtual" && !virtualEligible && physicalEligible) setExecutionMode("physical");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, physicalEligible, virtualEligible]);

  // Progressive configuration: unlocked once identity + license + location
  // are all confirmed. For a canonical target the licence IS the selection
  // (already confirmed); the legacy path keeps the explicit license radio.
  const licenseOk = target != null && (
    target.kind === "canonical" ||
    !target.factoryLicenseNumber ||
    licenseNumber === target.factoryLicenseNumber
  );
  const configUnlocked = target != null && licenseOk && locationConfirmed;

  async function onSaveDraft() {
    if (!target || savingDraft) return;
    setSavingDraft(true);
    setDraftSaveFailed(false);
    const res = await saveSingleDraft({
      planId: draftState?.id,
      sourceChannel,
      target: {
        factoryId: target.factoryId,
        factoryName: target.name,
        crNumber: target.crNumber,
        licenseNumber: target.factoryLicenseNumber,
        canonicalLicenseNumber: target.canonicalLicenseNumber,
        plantNumber: target.plantNumber,
        source: target.kind,
      },
      config: {
        visitType,
        packageVersionId,
        executionMode,
        windowStart,
        windowEnd,
        inspectorId,
        notes,
        plannerLat,
        plannerLng,
      },
    });
    setSavingDraft(false);
    if (res.error || !res.planId) {
      setDraftSaveFailed(true);
      setDraftJustSaved(false);
      return;
    }
    setDraftState({ id: res.planId, planReference: res.planReference ?? "", version: res.version ?? 0 });
    setDraftJustSaved(true);
  }

  const steps = state.steps;
  const StepRow = ({ label, status }: { label: string; status?: "pending" | "done" | "failed" }) => (
    <li className={`ax-step is-${status ?? "pending"}`}>
      <span aria-hidden="true">{status === "done" ? "✓" : status === "failed" ? "✕" : "◌"}</span>{" "}
      {label} — {status === "done" ? strings.stepDone : status === "failed" ? strings.stepFailed : strings.stepPending}
    </li>
  );

  const licenceFreshness = (l: ResolvedLicence) => l.sourceSyncedAt ? new Date(l.sourceSyncedAt).toISOString().slice(0, 10) : strings.freshnessNever;

  return (
    <form action={formAction} className="ax-stack" style={{ gap: "var(--ax-space-300)" }}>
      {/* Targeting fields — built from the resolved target, never from radio DOM state */}
      <input type="hidden" name="target_factory_id" value={target?.factoryId ?? ""} />
      <input type="hidden" name="target_license_number" value={target ? (target.factoryLicenseNumber ?? target.canonicalLicenseNumber ?? "") : ""} />
      <input type="hidden" name="target_cr_number" value={target?.crNumber ?? ""} />
      <input type="hidden" name="target_canonical_license_number" value={target?.canonicalLicenseNumber ?? ""} />
      <input type="hidden" name="target_plant_number" value={target?.plantNumber ?? ""} />
      <input type="hidden" name="target_source" value={target?.kind ?? ""} />
      <input type="hidden" name="source_channel" value={sourceChannel} />
      <input type="hidden" name="resume_visit_plan_id" value={state.resumeId ?? draftState?.id ?? ""} />

      {draft && (
        <div className="ax-banner ax-banner--info" role="status">
          <div>{strings.draftRestored} <bdi>{draft.planReference}</bdi></div>
        </div>
      )}
      {prefillMiss && (
        <div className="ax-banner ax-banner--warning" role="status">
          <div>{strings.prefillMiss}</div>
        </div>
      )}

      <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{strings.findFactory}</h4>
        <span className="ax-search"><input className="ax-input" placeholder={strings.searchPlaceholder} value={queryInput} onChange={e => setQueryInput(e.target.value)} /></span>
        {searching && registryUnavailable && (
          <div className="ax-banner ax-banner--critical" role="alert" style={{ marginBlockStart: "var(--ax-space-150)" }}>
            <div>{strings.registryUnavailable}</div>
            <button type="button" className="ax-btn ax-btn--secondary" onClick={() => router.refresh()}>{strings.retry}</button>
          </div>
        )}
        {searching && !registryUnavailable && portfolios.length === 0 && results.length === 0 && (
          <div className="ax-banner ax-banner--warning" style={{ marginBlockStart: "var(--ax-space-150)" }}><div>{strings.noMatch}</div></div>
        )}

        {/* Legacy fallback comparison rail — graded result cards (source:'legacy'),
            nothing pre-selected; opening a dossier is an explicit click. */}
        {results.length > 0 && (
          <ul role="listbox" aria-label={strings.findFactory} style={{ listStyle: "none", padding: 0, marginBlockStart: "var(--ax-space-150)", display: "flex", flexDirection: "column", gap: "var(--ax-space-100)" }}>
            {results.map(f => (
              <li key={f.id}>
                {/* Selecting a candidate IS the explicit act that opens its dossier —
                    a single radio per result, nothing pre-checked by default (M01-035). */}
                <label className="ax-choice" style={{ display: "flex", alignItems: "center", gap: "var(--ax-space-100)" }}>
                  <input type="radio" name="factory_id" value={f.id} checked={factoryId === f.id}
                    onChange={() => { setFactoryId(f.id); setLicenceId(null); setLicenseNumber(""); setLocationConfirmed(false); setPlannerLat(""); setPlannerLng(""); }} />
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

      {/* Canonical portfolio — CR identity plus EVERY licence/plant under it.
          A licence/plant selection is mandatory before continuing; a CR with
          licences can never be targeted as a whole (explicit eligibility
          state), and a CR with none is not plannable at all (M01-036). */}
      {portfolios.length > 0 && (
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{strings.portfolioStep}</h4>
          {handoff && (
            <div className="ax-banner ax-banner--info" role="status" style={{ marginBlockEnd: "var(--ax-space-150)" }}>
              <div>{strings.prefilledHandoff}</div>
            </div>
          )}
          {portfolios.map(p => (
            <section key={p.id} className="ax-surface" style={{ padding: "var(--ax-space-200)", marginBlockEnd: "var(--ax-space-150)" }}>
              <header style={{ marginBlockEnd: "var(--ax-space-100)" }}>
                <strong>{strings.crIdentity}</strong>{" "}
                <bdi className="ax-numeric">{p.crNumber}</bdi>
                {p.legalNameEn || p.legalName ? <> · {p.legalNameEn ?? p.legalName}</> : null}
                {p.status ? <> · <span className="ax-caption">{p.status}</span></> : null}
                <p className="ax-caption" style={{ marginBlockStart: "var(--ax-space-50)" }}>
                  {strings.sourceLabel}: <bdi>{p.sourceSystem ?? "—"}</bdi> · {strings.freshnessLabel}: <bdi>{p.sourceSyncedAt ? new Date(p.sourceSyncedAt).toISOString().slice(0, 10) : strings.freshnessNever}</bdi>
                </p>
              </header>
              {p.licences.length === 0 ? (
                <div className="ax-banner ax-banner--warning" role="status"><div>{strings.noLicences}</div></div>
              ) : (
                <>
                  <p className="ax-caption" style={{ marginBlockEnd: "var(--ax-space-100)" }}>{strings.selectLicenceHint}</p>
                  <ul role="listbox" aria-label={strings.portfolioStep} style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "var(--ax-space-100)" }}>
                    {p.licences.map(l => (
                      <li key={l.id}>
                        <label className="ax-choice" style={{ display: "flex", alignItems: "center", gap: "var(--ax-space-100)" }}>
                          <input type="radio" name="licence_id" value={l.id} disabled={!l.factory}
                            checked={licenceId === l.id}
                            onChange={() => { setLicenceId(l.id); setFactoryId(null); setLicenseNumber(""); setLocationConfirmed(false); setPlannerLat(""); setPlannerLng(""); }} />
                          <span>
                            <strong className="ax-numeric"><bdi>{l.licenseNumber}</bdi></strong>
                            {" · "}{strings.plantLabel} <bdi>{l.plantNumber ?? "—"}</bdi>
                            {" · "}{l.factory ? l.factory.name : strings.noFactoryLink}
                            {l.status ? <> · <span className="ax-caption">{l.status}</span></> : null}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  {licenceId == null && (
                    <div className="ax-banner ax-banner--info" role="status" style={{ marginBlockStart: "var(--ax-space-150)" }}>
                      <div>{strings.licenceRequired}</div>
                    </div>
                  )}
                </>
              )}
            </section>
          ))}
        </div>
      )}

      {/* Selected canonical plant profile — registered fields + provenance,
          read-only; nothing here mutates the registry. */}
      {target?.kind === "canonical" && selectedLicenceEntry && (
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }} role="region" aria-label={strings.selectedProfile}>
          <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{strings.selectedProfile}</h4>
          <p><strong>{target.name}</strong></p>
          <dl className="ax-grid-2" style={{ rowGap: "var(--ax-space-100)" }}>
            <div><dt className="ax-caption">{strings.crPrefix}</dt><dd><bdi>{target.crNumber ?? "—"}</bdi></dd></div>
            <div><dt className="ax-caption">{strings.licenseLabel}</dt><dd><bdi>{target.canonicalLicenseNumber ?? "—"}</bdi></dd></div>
            <div><dt className="ax-caption">{strings.plantLabel}</dt><dd><bdi>{target.plantNumber ?? "—"}</bdi></dd></div>
            <div><dt className="ax-caption">{strings.officialPin}</dt><dd>{hasOfficial ? <bdi>{target.officialLat}, {target.officialLng}</bdi> : strings.noOfficialPin}</dd></div>
          </dl>
          <p className="ax-caption">
            {strings.sourceLabel}: <bdi>{selectedLicenceEntry.licence.sourceSystem ?? "—"}</bdi>
            {" · "}{strings.freshnessLabel}: <bdi>{licenceFreshness(selectedLicenceEntry.licence)}</bdi>
            {" · "}{strings.riskContext}: {target.riskBand ?? strings.riskUnknown}{target.riskScore != null ? ` (${target.riskScore})` : ""}
          </p>
          <a href={`/factories/${target.factoryId}`} target="_blank" rel="noopener noreferrer" className="ax-btn ax-btn--secondary">{strings.factory360}</a>
        </div>
      )}

      {/* Legacy license step — unchanged: explicit radio when the legacy
          factory carries a license_number, otherwise the CR-only note. */}
      {target?.kind === "legacy" && legacyFactory && (
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{strings.licenseStep}</h4>
          {legacyFactory.license_number ? (
            <>
              <p className="ax-caption" style={{ marginBlockEnd: "var(--ax-space-100)" }}>{strings.licenseSelect}</p>
              <label className="ax-choice" style={{ display: "flex" }}>
                <input key={resetKey} type="radio" name="license_number" value={legacyFactory.license_number} required
                  checked={licenseNumber === legacyFactory.license_number} onChange={() => setLicenseNumber(legacyFactory.license_number as string)} />
                <span><strong className="ax-numeric">{legacyFactory.license_number}</strong> · {strings.licenseLabel} · {legacyFactory.name}</span>
              </label>
            </>
          ) : (
            <div className="ax-banner ax-banner--info"><div>{strings.licenseNone}</div></div>
          )}
        </div>
      )}
      {target && (
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
      {target && configUnlocked && (
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{strings.configStep}</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "var(--ax-space-200)" }}>
            <div className="ax-field"><label className="ax-field__label" htmlFor="wizard-visit-type">{strings.visitType}</label>
              <select key={resetKey} className="ax-select" name="visit_type" id="wizard-visit-type" value={visitType} onChange={e => setVisitType(e.target.value)}>
                <option value="periodic">{strings.typePeriodic}</option><option value="follow_up">{strings.typeFollowUp}</option><option value="complaint">{strings.typeComplaint}</option>
              </select></div>
            <div className="ax-field"><label className="ax-field__label" htmlFor="wizard-package">{strings.packageLabel}</label>
              <select key={resetKey} className="ax-select" name="package_version_id" id="wizard-package" value={packageVersionId} onChange={e => setPackageVersionId(e.target.value)}>
                {packages.map(p => <option key={p.id} value={p.id}>{p.packages.code} · {p.version_label}</option>)}
              </select></div>
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

      {target && (
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <h4 style={{ marginBlockEnd: "var(--ax-space-100)" }}>{strings.readinessTitle}</h4>
          <div className="ax-row" style={{ gap: "var(--ax-space-100)", flexWrap: "wrap" }}>
            <span className="ax-lozenge ax-lozenge--success">✓ {strings.readyIdentity}</span>
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

      {draftSaveFailed && (
        <div className="ax-banner ax-banner--critical" role="alert"><div>{strings.draftError}</div></div>
      )}
      {draftJustSaved && draftState && (
        <p className="ax-caption" role="status">{strings.draftSavedPrefix} — <bdi>{draftState.planReference}</bdi> · v{draftState.version}</p>
      )}

      <div className="ax-row" style={{ justifyContent: "flex-end", gap: "var(--ax-space-100)" }}>
        <button type="button" className="ax-btn ax-btn--secondary" disabled={savingDraft || !target} onClick={onSaveDraft}>
          {savingDraft ? strings.savingDraft : strings.saveDraft}
        </button>
        <button className="ax-btn ax-btn--prominent" disabled={pending || !configUnlocked}>
          {pending ? strings.publishing : state.resumeId ? strings.retry : strings.publish}
        </button>
      </div>
    </form>
  );
}
