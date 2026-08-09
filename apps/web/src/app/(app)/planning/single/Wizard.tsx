"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { publishSingleVisit, saveSingleDraft, type PublishResult } from "./actions";
import IdentityDossier from "./IdentityDossier";
import type { ResolvedLicence, ResolvedPortfolio } from "@/lib/planning/factory-resolver";
import type { Locale } from "@/lib/i18n";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Choice from "@/components/saqeel/choice/choice";
import DefinitionList from "@/components/saqeel/definition-list/definition-list";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import PlanningNotice from "@/components/sections/planning-single/planning-notice/planning-notice";
import FactoryResults from "@/components/sections/planning-single/factory-results/factory-results";
import PublishReadiness from "@/components/sections/planning-single/publish-readiness/publish-readiness";
import VisitConfiguration from "@/components/sections/planning-single/visit-configuration/visit-configuration";
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
  noMatchBody: string; noLicences: string; noFactoryLink: string; plantLabel: string; selectedProfile: string; sourceLabel: string;
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
  windowDate: string; windowTime: string; windowHint: string; noPackages: string;
  readinessTitle: string; readyIdentity: string; readyLicense: string; readyLocation: string; readyInspector: string;
  gateMet: string; gateUnmet: string; gateOptional: string;
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
  const configStrings = {
    visitType: strings.visitType,
    packageLabel: strings.packageLabel,
    packageOptionalHint: strings.packageOptionalHint,
    mode: strings.mode,
    modePhysical: strings.modePhysical,
    modeVirtual: strings.modeVirtual,
    modeIneligible: strings.modeIneligible,
    windowStart: strings.windowStart,
    windowEnd: strings.windowEnd,
    windowDate: strings.windowDate,
    windowTime: strings.windowTime,
    windowHint: strings.windowHint,
    inspector: strings.inspector,
    autoAssign: strings.autoAssign,
    notes: strings.notes,
    notesPlaceholder: strings.notesPlaceholder,
    noPackages: strings.noPackages,
  };
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

      {draft ? (
        <PlanningNotice tone="info">{strings.draftRestored} <bdi>{draft.planReference}</bdi></PlanningNotice>
      ) : null}
      {prefillMiss ? <PlanningNotice tone="warning">{strings.prefillMiss}</PlanningNotice> : null}
      {adminPackageHandoff ? (
        <PlanningNotice tone="info">{strings.adminPackageHandoff} <bdi>{adminPackageHandoff}</bdi></PlanningNotice>
      ) : null}

      <Card as="section" labelledBy="single-visit-search">
        <CardHeader level="h2" titleId="single-visit-search" title={strings.findFactory} />
        <CardBody>
          <FactoryResults
            query={queryInput}
            results={results.map(f => ({
              id: f.id,
              name: f.name,
              crNumber: f.cr_number,
              licenseNumber: f.license_number,
              grade: f.grade,
              degraded: f.degraded,
              duplicate: f.duplicate,
            }))}
            registryUnavailable={registryUnavailable}
            selectedId={factoryId}
            onQueryChange={setQueryInput}
            onSelect={id => { setFactoryId(id); setLicenceId(null); setLicenseNumber(""); setLocationConfirmed(false); }}
            onRetry={() => router.refresh()}
            dossierFor={id => {
              const found = results.find(entry => entry.id === id);
              return found ? <IdentityDossier factory={found} strings={strings} locale={locale} /> : null;
            }}
            strings={{
              heading: strings.findFactory,
              searchLabel: strings.findFactory,
              searchPlaceholder: strings.searchPlaceholder,
              exactBadge: strings.exactBadge,
              similarBadge: strings.similarBadge,
              degradedBadge: strings.degradedBadge,
              duplicateWarning: strings.duplicateWarning,
              noMatch: strings.noMatch,
              noMatchBody: strings.noMatchBody,
              registryUnavailable: strings.registryUnavailable,
              retry: strings.retry,
              absent: "—",
            }}
          />
        </CardBody>
      </Card>

      {/* Canonical portfolio — CR identity plus EVERY licence/plant under it.
          A licence/plant selection is mandatory before continuing; a CR with
          licences can never be targeted as a whole (explicit eligibility
          state), and a CR with none is not plannable at all (M01-036). */}
      {portfolios.length > 0 && (
        <div className={`panel panel-body ${styles.stepPanel}`}>
          <h4 className="panel-title">{strings.portfolioStep}</h4>
          {handoff && (
            <PlanningNotice tone="info">{strings.prefilledHandoff}</PlanningNotice>
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
                <PlanningNotice tone="warning">{strings.noLicences}</PlanningNotice>
              ) : (
                <>
                  <p className="tl-meta">{strings.selectLicenceHint}</p>
                  <ul className={styles.resultList} role="listbox" aria-label={strings.portfolioStep}>
                    {p.licences.map(l => (
                      <li className={styles.resultItem} key={l.id}>
                        <Choice
                          kind="radio"
                          name="licence_id"
                          value={l.id}
                          disabled={!l.factory}
                          checked={licenceId === l.id}
                          onChange={() => { setLicenceId(l.id); setFactoryId(null); setLicenseNumber(""); setLocationConfirmed(false); }}
                          label={
                            <span className={styles.choiceLabel}>
                              <bdi>{l.licenseNumber}</bdi>
                              {l.status ? <StatusPill tone="info">{l.status}</StatusPill> : null}
                            </span>
                          }
                          description={
                            <>
                              {strings.plantLabel} <bdi>{l.plantNumber ?? "—"}</bdi>
                              {" · "}{l.factory ? l.factory.name : strings.noFactoryLink}
                            </>
                          }
                        />
                      </li>
                    ))}
                  </ul>
                  {licenceId == null && (
                    <PlanningNotice tone="info">{strings.licenceRequired}</PlanningNotice>
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
        <Card as="section" labelledBy="single-visit-licence">
          <CardHeader
            level="h2"
            titleId="single-visit-licence"
            title={strings.licenseStep}
            description={legacyFactory.license_number ? strings.licenseSelect : undefined}
          />
          <CardBody>
            {legacyFactory.license_number ? (
              <Choice
                kind="radio"
                name="license_number"
                value={legacyFactory.license_number}
                required
                checked={licenseNumber === legacyFactory.license_number}
                onChange={() => setLicenseNumber(legacyFactory.license_number as string)}
                label={<bdi>{legacyFactory.license_number}</bdi>}
                description={`${strings.licenseLabel} · ${legacyFactory.name}`}
              />
            ) : (
              <PlanningNotice tone="info">{strings.licenseNone}</PlanningNotice>
            )}
          </CardBody>
        </Card>
      )}
      {target && (
        <Card as="section" labelledBy="single-visit-location">
          <CardHeader
            level="h2"
            titleId="single-visit-location"
            title={strings.locationStep}
            description={`${strings.locationAuthority}: ${target.masterSource ?? "—"} · ${strings.locationReadOnly}`}
          />
          <CardBody gap="tight">
            {!hasOfficial ? <PlanningNotice tone="warning">{strings.noOfficialPin}</PlanningNotice> : null}
            <DefinitionList
              columns="two"
              items={[
                { label: strings.officialAddress, value: target.officialAddress },
                {
                  label: strings.officialPin,
                  value: hasOfficial
                    ? <bdi>{target.officialLat}, {target.officialLng}</bdi>
                    : strings.noOfficialPin,
                },
              ]}
            />
            <Choice
              kind="checkbox"
              name="location_confirmed"
              value="1"
              required
              disabled={!hasOfficial}
              checked={locationConfirmed}
              onChange={setLocationConfirmed}
              label={strings.locationConfirmed}
            />
          </CardBody>
        </Card>
      )}
      {target && configUnlocked && (
        <Card as="section" labelledBy="single-visit-config">
          <CardHeader level="h2" titleId="single-visit-config" title={strings.configStep} />
          <CardBody>
            <VisitConfiguration
              value={{ visitType, packageIds, mode: executionMode, windowStart, windowEnd, inspectorId, notes }}
              onChange={next => {
                setVisitType(next.visitType);
                setPackageIds([...next.packageIds]);
                setExecutionMode(next.mode);
                setWindowStart(next.windowStart);
                setWindowEnd(next.windowEnd);
                setInspectorId(next.inspectorId);
                setNotes(next.notes);
              }}
              visitTypeOptions={[
                { value: "periodic", label: strings.typePeriodic },
                { value: "follow_up", label: strings.typeFollowUp },
                { value: "complaint", label: strings.typeComplaint },
              ]}
              inspectorOptions={inspectors.map(entry => ({ value: entry.user_id, label: entry.full_name }))}
              packages={packages.map(entry => ({
                id: entry.id,
                versionLabel: entry.version_label,
                code: entry.packages.code,
                title: entry.packages.title,
              }))}
              eligibility={{ physical: physicalEligible, virtual: virtualEligible }}
              strings={configStrings}
            />
          </CardBody>
        </Card>
      )}

      {target && (
        <PublishReadiness
          gates={[
            { key: "identity", label: strings.readyIdentity, state: "met" },
            { key: "licence", label: strings.readyLicense, state: licenseOk ? "met" : "unmet" },
            { key: "location", label: strings.readyLocation, state: locationConfirmed ? "met" : "unmet" },
            { key: "inspector", label: strings.readyInspector, state: inspectorId ? "met" : "optional" },
          ]}
          strings={{
            heading: strings.readinessTitle,
            met: strings.gateMet,
            unmet: strings.gateUnmet,
            optional: strings.gateOptional,
          }}
        />
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
        <PlanningNotice tone="danger">{strings.draftError}</PlanningNotice>
      )}
      {draftJustSaved && draftState && (
        <p className="tl-meta" role="status">{strings.draftSavedPrefix} — <bdi>{draftState.planReference}</bdi> · v{draftState.version}</p>
      )}

      {!transitionsExecutable && (
        <PlanningNotice tone="warning">{strings.blockedTitle}</PlanningNotice>
      )}
      <div className={styles.actionBar}>
        <Button
          type="button"
          variant="secondary"
          disabled={!transitionsExecutable || savingDraft || !target}
          onClick={onSaveDraft}
          label={strings.saveDraft}
        >
          {savingDraft ? strings.savingDraft : strings.saveDraft}
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={!transitionsExecutable || pending || !publishReady}
          label={strings.publish}
        >
          {pending ? strings.publishing : state.resumeId ? strings.retry : strings.publish}
        </Button>
      </div>
    </form>
  );
}
