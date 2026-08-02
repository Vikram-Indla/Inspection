"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { publishSingleVisit, saveSingleDraft, type PublishResult } from "./actions";
import IdentityDossier from "./IdentityDossier";
import type { ResolvedLicence, ResolvedPortfolio } from "@/lib/planning/factory-resolver";
import type { Locale } from "@/lib/i18n";
import styles from "./single-planning.module.css";

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
  source_synced_at: string | null; master_source: string | null;
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
  visitType?: string; packageVersionId?: string; packageVersionIds?: string[]; executionMode?: string;
  windowStart?: string; windowEnd?: string; inspectorId?: string;
  notes?: string; licenseNumber?: string;
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
  officialAddress: string;
  masterSource: string | null;
};

// SB19 — server page builds every user-facing string with t() and passes them here.
export type WizardStrings = {
  findFactory: string; searchPlaceholder: string; noMatch: string; registryUnavailable: string; crPrefix: string;
  exactBadge: string; exactRule: string; similarBadge: string; similarRule: string;
  degradedBadge: string; degradedRule: string; duplicateWarning: string; duplicateOpenVisit: string; duplicateStatusLabel: string;
  portfolioStep: string; crIdentity: string; selectLicenceHint: string; licenceRequired: string;
  noLicences: string; noFactoryLink: string; plantLabel: string; selectedProfile: string; sourceLabel: string;
  prefilledHandoff: string; adminPackageHandoff: string; prefillMiss: string; draftRestored: string;
  saveDraft: string; savingDraft: string; draftSavedPrefix: string; draftError: string;
  licenseStep: string; licenseSelect: string; licenseLabel: string; licenseNone: string;
  locationStep: string; officialAddress: string; officialPin: string; noOfficialPin: string;
  locationAuthority: string; locationReadOnly: string; locationConfirmed: string; mapLoading: string;
  mapToggle: string; textEquivalent: string; riskContext: string; riskUnknown: string;
  freshnessLabel: string; freshnessNever: string; factory360: string;
  configStep: string;
  visitType: string; typePeriodic: string; typeFollowUp: string; typeComplaint: string;
  packageLabel: string; packageOptionalHint: string; mode: string; modePhysical: string; modeVirtual: string; modeIneligible: string;
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
  sourceChannel, handoff, adminPackageHandoff, prefillMiss, packages, inspectors, strings, virtualEligible,
  transitionsExecutable, locale,
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
  adminPackageHandoff: string | null;
  prefillMiss: boolean;
  packages: Pkg[];
  inspectors: Insp[];
  strings: WizardStrings;
  virtualEligible: boolean;
  transitionsExecutable: boolean;
  locale: Locale;
}) {
  const [state, formAction, pending] = useActionState<PublishResult, FormData>(publishSingleVisit, {});
  const router = useRouter();
  const [queryInput, setQueryInput] = useState(query);
  // Nothing is pre-selected by a search alone; picking a radio is the
  // explicit act that selects a target. Handoff/draft prefill arrives through
  // initialSelection (server-resolved, never guessed client-side).
  const [factoryId, setFactoryId] = useState<string | null>(initialSelection.factoryId ?? null);
  const [licenceId, setLicenceId] = useState<string | null>(initialSelection.licenceId ?? null);
  // Controlled, not uncontrolled — a blocked-publish retry (M01-041) re-renders
  // this form via useActionState, and uncontrolled inputs (date/radio/checkbox)
  // lose their entered value on that re-render, silently discarding the planner's
  // work. React-owned state survives the same re-render fine, which is why every
  // field below is lifted into state rather than left as a bare DOM value.
  const [visitType, setVisitType] = useState(draftConfig.visitType ?? "periodic");
  // M7 — zero-or-more packages (checkbox list). The first checked version is
  // the primary; none checked is an honest preparation-time choice.
  const [packageIds, setPackageIds] = useState<string[]>(
    draftConfig.packageVersionIds ?? (draftConfig.packageVersionId ? [draftConfig.packageVersionId] : (packages[0] ? [packages[0].id] : []))
  );
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
  const joinAddress = (parts: Array<string | null | undefined>) =>
    [...new Set(parts.filter((part): part is string => Boolean(part)))].join(", ") || "—";

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
        officialAddress: joinAddress([
          selectedLicenceEntry.licence.plantAddress?.addressLine1,
          selectedLicenceEntry.licence.plantAddress?.districtEn,
          selectedLicenceEntry.licence.plantAddress?.cityEn ?? selectedLicenceEntry.licence.factory.city,
          selectedLicenceEntry.licence.plantAddress?.regionEn ?? selectedLicenceEntry.licence.factory.region,
        ]),
        masterSource: selectedLicenceEntry.licence.plantAddress?.sourceSystem
          ?? selectedLicenceEntry.licence.factory.source
          ?? selectedLicenceEntry.licence.sourceSystem,
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
          officialAddress: joinAddress([legacyFactory.city, legacyFactory.region]),
          masterSource: legacyFactory.master_source,
        }
      : null;

  const hasOfficial = target != null && target.officialLat != null && target.officialLng != null;
  // M03-011 — execution-mode eligibility: physical needs a GIS-verifiable
  // official master location; virtual needs the OTP engine configured.
  const physicalEligible = hasOfficial;
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
  const scheduleReady = windowStart !== "" && windowEnd !== "" && windowEnd > windowStart;
  // A Planner may suggest an Inspector but cannot release a visit. A named
  // Inspector is required only when the Supervisor approves the request.
  const publishReady = configUnlocked && scheduleReady;

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
        packageVersionIds: packageIds,
        executionMode,
        windowStart,
        windowEnd,
        inspectorId,
        notes,
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
    <li className="timeline">
      <span aria-hidden="true">{status === "done" ? "✓" : status === "failed" ? "✕" : "◌"}</span>{" "}
      {label} — {status === "done" ? strings.stepDone : status === "failed" ? strings.stepFailed : strings.stepPending}
    </li>
  );

  const licenceFreshness = (l: ResolvedLicence) => l.sourceSyncedAt ? new Date(l.sourceSyncedAt).toISOString().slice(0, 10) : strings.freshnessNever;

  return (
    <form action={formAction} className={`sq-stack ${styles.form}`}>
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
        <div className="alert alert-info" role="status">
          <div>{strings.draftRestored} <bdi>{draft.planReference}</bdi></div>
        </div>
      )}
      {prefillMiss && (
        <div className="alert alert-warning" role="status">
          <div>{strings.prefillMiss}</div>
        </div>
      )}
      {adminPackageHandoff && (
        <div className="alert alert-info" role="status">
          <div>{strings.adminPackageHandoff} <bdi>{adminPackageHandoff}</bdi></div>
        </div>
      )}

      <div className={`panel panel-body ${styles.stepPanel}`}>
        <h4 className="panel-title">{strings.findFactory}</h4>
        <span className={`input-affix ${styles.searchField}`}><input className="input" placeholder={strings.searchPlaceholder} value={queryInput} onChange={e => setQueryInput(e.target.value)} /></span>
        {searching && registryUnavailable && (
          <div className="alert alert-critical" role="alert">
            <div>{strings.registryUnavailable}</div>
            <button type="button" className="btn btn-secondary btn-touch" onClick={() => router.refresh()}>{strings.retry}</button>
          </div>
        )}
        {searching && !registryUnavailable && portfolios.length === 0 && results.length === 0 && (
          <div className="alert alert-warning"><div>{strings.noMatch}</div></div>
        )}

        {/* Legacy fallback comparison rail — graded result cards (source:'legacy'),
            nothing pre-selected; opening a dossier is an explicit click. */}
        {results.length > 0 && (
          <ul className={styles.resultList} role="listbox" aria-label={strings.findFactory}>
            {results.map(f => (
              <li className={styles.resultItem} key={f.id}>
                {/* Selecting a candidate IS the explicit act that opens its dossier —
                    a single radio per result, nothing pre-checked by default (M01-035). */}
                <label className={`radio ${styles.choiceRow}`}>
                  <input type="radio" name="factory_id" value={f.id} checked={factoryId === f.id}
                    onChange={() => { setFactoryId(f.id); setLicenceId(null); setLicenseNumber(""); setLocationConfirmed(false); }} />
                  <span className={`badge ${f.grade === "exact" ? "badge-compliant" : "badge-warning"}`}>
                    {f.grade === "exact" ? strings.exactBadge : strings.similarBadge}
                  </span>
                  {f.degraded && <span className="badge badge-critical">{strings.degradedBadge}</span>}
                  <span><strong>{f.name}</strong> · <bdi>{f.cr_number ?? "—"}</bdi>{f.license_number ? <> · <bdi>{f.license_number}</bdi></> : null}</span>
                </label>
                {factoryId === f.id && (
                  <div className={styles.dossier}>
                    <IdentityDossier factory={f} strings={strings} locale={locale} />
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
        <div className={`panel panel-body ${styles.stepPanel}`}>
          <h4 className="panel-title">{strings.portfolioStep}</h4>
          {handoff && (
            <div className="alert alert-info" role="status">
              <div>{strings.prefilledHandoff}</div>
            </div>
          )}
          {portfolios.map(p => (
            <section key={p.id} className={`panel panel-body ${styles.nestedPanel}`}>
              <header className="panel-header">
                <strong>{strings.crIdentity}</strong>{" "}
                <bdi className="numeric">{p.crNumber}</bdi>
                {p.legalNameEn || p.legalName ? <> · {p.legalNameEn ?? p.legalName}</> : null}
                {p.status ? <> · <span className="t-caption">{p.status}</span></> : null}
                <p className="tl-meta">
                  {strings.sourceLabel}: <bdi>{p.sourceSystem ?? "—"}</bdi> · {strings.freshnessLabel}: <bdi>{p.sourceSyncedAt ? new Date(p.sourceSyncedAt).toISOString().slice(0, 10) : strings.freshnessNever}</bdi>
                </p>
              </header>
              {p.licences.length === 0 ? (
                <div className="alert alert-warning" role="status"><div>{strings.noLicences}</div></div>
              ) : (
                <>
                  <p className="tl-meta">{strings.selectLicenceHint}</p>
                  <ul className={styles.resultList} role="listbox" aria-label={strings.portfolioStep}>
                    {p.licences.map(l => (
                      <li className={styles.resultItem} key={l.id}>
                        <label className={`radio ${styles.choiceRow}`}>
                          <input type="radio" name="licence_id" value={l.id} disabled={!l.factory}
                            checked={licenceId === l.id}
                            onChange={() => { setLicenceId(l.id); setFactoryId(null); setLicenseNumber(""); setLocationConfirmed(false); }} />
                          <span>
                            <strong className="numeric"><bdi>{l.licenseNumber}</bdi></strong>
                            {" · "}{strings.plantLabel} <bdi>{l.plantNumber ?? "—"}</bdi>
                            {" · "}{l.factory ? l.factory.name : strings.noFactoryLink}
                            {l.status ? <> · <span className="badge badge-info">{l.status}</span></> : null}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                  {licenceId == null && (
                    <div className="alert alert-info" role="status">
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
        <div className={`panel panel-body ${styles.stepPanel} ${styles.profilePanel}`} role="region" aria-label={strings.selectedProfile}>
          <h4 className="panel-title">{strings.selectedProfile}</h4>
          <p><strong>{target.name}</strong></p>
          <dl>
            <div><dt className="t-caption">{strings.crPrefix}</dt><dd><bdi>{target.crNumber ?? "—"}</bdi></dd></div>
            <div><dt className="t-caption">{strings.licenseLabel}</dt><dd><bdi>{target.canonicalLicenseNumber ?? "—"}</bdi></dd></div>
            <div><dt className="t-caption">{strings.plantLabel}</dt><dd><bdi>{target.plantNumber ?? "—"}</bdi></dd></div>
            <div><dt className="t-caption">{strings.officialAddress}</dt><dd>{target.officialAddress}</dd></div>
            <div><dt className="t-caption">{strings.officialPin}</dt><dd>{hasOfficial ? <bdi>{target.officialLat}, {target.officialLng}</bdi> : strings.noOfficialPin}</dd></div>
          </dl>
          <p className="tl-meta">
            {strings.sourceLabel}: <bdi>{selectedLicenceEntry.licence.sourceSystem ?? "—"}</bdi>
            {" · "}{strings.freshnessLabel}: <bdi>{licenceFreshness(selectedLicenceEntry.licence)}</bdi>
            {" · "}{strings.riskContext}: {target.riskBand ?? strings.riskUnknown}{target.riskScore != null ? ` (${target.riskScore})` : ""}
          </p>
          <a href={`/factories/${target.factoryId}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-touch">{strings.factory360}</a>
        </div>
      )}

      {/* Legacy license step — unchanged: explicit radio when the legacy
          factory carries a license_number, otherwise the CR-only note. */}
      {target?.kind === "legacy" && legacyFactory && (
        <div className={`panel panel-body ${styles.stepPanel}`}>
          <h4 className="panel-title">{strings.licenseStep}</h4>
          {legacyFactory.license_number ? (
            <>
              <p className="tl-meta">{strings.licenseSelect}</p>
              <label className={`radio ${styles.choiceRow}`}>
                <input key={resetKey} type="radio" name="license_number" value={legacyFactory.license_number} required
                  checked={licenseNumber === legacyFactory.license_number} onChange={() => setLicenseNumber(legacyFactory.license_number as string)} />
                <span><strong className="numeric">{legacyFactory.license_number}</strong> · {strings.licenseLabel} · {legacyFactory.name}</span>
              </label>
            </>
          ) : (
            <div className="alert alert-info"><div>{strings.licenseNone}</div></div>
          )}
        </div>
      )}
      {target && (
        <div className={`panel panel-body ${styles.stepPanel}`}>
          <h4 className="panel-title">{strings.locationStep}</h4>
          {!hasOfficial && (
            <div className="alert alert-warning"><div>{strings.noOfficialPin}</div></div>
          )}
          <dl>
            <div><dt className="t-caption">{strings.officialAddress}</dt><dd>{target.officialAddress}</dd></div>
            <div><dt className="t-caption">{strings.officialPin}</dt><dd>{hasOfficial ? <bdi>{target.officialLat}, {target.officialLng}</bdi> : strings.noOfficialPin}</dd></div>
          </dl>
          <p className="tl-meta">
            {strings.locationAuthority}: <bdi>{target.masterSource ?? "—"}</bdi> · {strings.locationReadOnly}
          </p>
          <label className={`check ${styles.confirmRow}`}>
            <input key={resetKey} type="checkbox" name="location_confirmed" value="1" required
              disabled={!hasOfficial}
              checked={locationConfirmed} onChange={e => setLocationConfirmed(e.target.checked)} />
            <span>{strings.locationConfirmed}</span>
          </label>
        </div>
      )}
      {target && configUnlocked && (
        <div className={`panel panel-body ${styles.stepPanel}`}>
          <h4 className="panel-title">{strings.configStep}</h4>
          <div className={styles.configGrid}>
            <div className={`field ${styles.visitTypeField}`}><label htmlFor="wizard-visit-type">{strings.visitType}</label>
              <select key={resetKey} className="select" name="visit_type" id="wizard-visit-type" value={visitType} onChange={e => setVisitType(e.target.value)}>
                <option value="periodic">{strings.typePeriodic}</option><option value="follow_up">{strings.typeFollowUp}</option><option value="complaint">{strings.typeComplaint}</option>
              </select></div>
            <div className={`field ${styles.packageField}`} role="group" aria-labelledby="wizard-package-label">
              <span id="wizard-package-label">{strings.packageLabel}</span>
              <div className={styles.packageGrid}>
                {packages.map(p => (
                  <label key={`${resetKey}-${p.id}`} className={`check ${styles.packageChoice}`}>
                    <input type="checkbox" name="package_version_id" value={p.id}
                      checked={packageIds.includes(p.id)}
                      onChange={e => setPackageIds(ids => e.target.checked ? [...ids, p.id] : ids.filter(x => x !== p.id))} />
                    <span>{p.packages.code} · {p.version_label}</span>
                  </label>
                ))}
              </div>
              {packageIds.length === 0 && (
                <p className="alert alert-info" role="status">
                  {strings.packageOptionalHint}
                </p>
              )}
            </div>
            <div className={`field ${styles.modeField}`}><label htmlFor="wizard-mode">{strings.mode}</label>
              <select key={resetKey} className="select" name="execution_mode" id="wizard-mode" value={executionMode} onChange={e => setExecutionMode(e.target.value as "physical" | "virtual")}>
                <option value="physical" disabled={!physicalEligible}>{strings.modePhysical}{!physicalEligible ? ` — ${strings.modeIneligible}` : ""}</option>
                <option value="virtual" disabled={!virtualEligible}>{strings.modeVirtual}{!virtualEligible ? ` — ${strings.modeIneligible}` : ""}</option>
              </select></div>
            <div className={`field ${styles.startField}`}><label htmlFor="wizard-window-start">{strings.windowStart}</label>
              <input key={resetKey} className="input" name="window_start" id="wizard-window-start" type="datetime-local" required value={windowStart} onChange={e => setWindowStart(e.target.value)} /></div>
            <div className={`field ${styles.endField}`}><label htmlFor="wizard-window-end">{strings.windowEnd}</label>
              <input key={resetKey} className="input" name="window_end" id="wizard-window-end" type="datetime-local" required min={windowStart || undefined} value={windowEnd} onChange={e => setWindowEnd(e.target.value)} /></div>
            {/* The Planner may suggest an Inspector. “No preference” leaves the
                governed final assignment to the approving Supervisor. */}
            <div className={`field ${styles.inspectorField}`}><label htmlFor="wizard-inspector">{strings.inspector}</label>
              <select key={resetKey} className="select" name="inspector_id" id="wizard-inspector" value={inspectorId} onChange={e => setInspectorId(e.target.value)}><option value="">{strings.autoAssign}</option>{inspectors.map(i => <option key={i.user_id} value={i.user_id}>{i.full_name}</option>)}</select></div>
          </div>
          <div className={`field ${styles.notesField}`}><label htmlFor="wizard-notes">{strings.notes}</label>
            <textarea key={resetKey} className="input" name="notes" id="wizard-notes" rows={2} placeholder={strings.notesPlaceholder}
              value={notes} onChange={e => setNotes(e.target.value)} /></div>
        </div>
      )}

      {target && (
        <div className={`panel panel-body ${styles.stepPanel}`}>
          <h4 className="panel-title">{strings.readinessTitle}</h4>
          <div className={styles.readinessGrid}>
            <span className="badge badge-compliant">✓ {strings.readyIdentity}</span>
            <span className={`badge ${licenseOk ? "badge-compliant" : "badge-critical"}`}>{licenseOk ? "✓" : "✕"} {strings.readyLicense}</span>
            <span className={`badge ${locationConfirmed ? "badge-compliant" : "badge-critical"}`}>{locationConfirmed ? "✓" : "✕"} {strings.readyLocation}</span>
            <span className={`badge ${inspectorId ? "badge-compliant" : "badge-draft"}`}>{inspectorId ? "✓" : "○"} {strings.readyInspector}</span>
          </div>
        </div>
      )}

      {state.error && (
        <div ref={errorRef} tabIndex={-1} className="alert alert-critical" role="alert"><strong>{strings.blockedTitle}</strong>
          <ul>{state.error.split(" · ").map(b => <li key={b}>{b}</li>)}</ul>
          {steps && (
            <ul className="timeline">
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
        <div className="alert alert-critical" role="alert"><div>{strings.draftError}</div></div>
      )}
      {draftJustSaved && draftState && (
        <p className="tl-meta" role="status">{strings.draftSavedPrefix} — <bdi>{draftState.planReference}</bdi> · v{draftState.version}</p>
      )}

      {!transitionsExecutable && (
        <div className="alert alert-warning" role="status">
          <div><strong>{strings.blockedTitle}</strong></div>
        </div>
      )}
      <div className={styles.actionBar}>
        <button type="button" className="btn btn-secondary btn-touch"
          disabled={!transitionsExecutable || savingDraft || !target} onClick={onSaveDraft}>
          {savingDraft ? strings.savingDraft : strings.saveDraft}
        </button>
        <button className="btn btn-primary btn-lg btn-touch"
          disabled={!transitionsExecutable || pending || !publishReady}>
          {pending ? strings.publishing : state.resumeId ? strings.retry : strings.publish}
        </button>
      </div>
    </form>
  );
}
