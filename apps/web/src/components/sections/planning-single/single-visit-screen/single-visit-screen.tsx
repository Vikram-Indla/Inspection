"use client";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { publishSingleVisit, saveSingleDraft } from "@/app/(app)/planning/single/actions";
import PlanningNotice from "@/components/sections/planning-single/planning-notice/planning-notice";
import PortfolioPicker from "@/components/sections/planning-single/portfolio-picker/portfolio-picker";
import PublishBlockers from "@/components/sections/planning-single/publish-blockers/publish-blockers";
import PublishReadiness from "@/components/sections/planning-single/publish-readiness/publish-readiness";
import TargetConfirmation from "@/components/sections/planning-single/target-confirmation/target-confirmation";
import ConfigurationCard from "./configuration-card";
import FactorySearch from "./factory-search";
import PublishActions from "./publish-actions";
import TargetFields from "./target-fields";
import { SEARCH_MIN_LENGTH } from "@/features/planning-single/shapes";
import type { DraftInfo, SinglePlanningData } from "@/features/planning-single/shapes";
import type { SingleVisitStrings } from "@/features/planning-single/strings";
import {
  effectiveMode,
  licenceEntries,
  modeEligibility,
  readinessOf,
  resolveTarget,
  type ExecutionMode,
} from "@/features/planning-single/target";
import type { Locale } from "@/lib/i18n";
import styles from "./single-visit-screen.module.css";

const SEARCH_DEBOUNCE_MS = 300;

export default function SingleVisitScreen({ data, strings, locale }: {
  data: SinglePlanningData;
  strings: SingleVisitStrings;
  locale: Locale;
}) {
  const { query, portfolios, results } = data;
  const [state, formAction, pending] = useActionState(publishSingleVisit, {});
  const router = useRouter();
  const [searchPending, startSearchTransition] = useTransition();
  const [queryInput, setQueryInput] = useState(query);
  const [targetReselected, setTargetReselected] = useState(data.draft === null);
  const [factoryId, setFactoryId] = useState<string | null>(data.initialSelection.factoryId ?? null);
  const [licenceId, setLicenceId] = useState<string | null>(data.initialSelection.licenceId ?? null);
  const [visitType, setVisitType] = useState(data.draftConfig.visitType ?? "periodic");
  const [packageIds, setPackageIds] = useState<readonly string[]>(() => {
    const saved = data.draftConfig.packageVersionIds ?? (
      data.draftConfig.packageVersionId ? [data.draftConfig.packageVersionId] : null
    );
    if (saved) return saved;
    const first = data.packages[0];
    return first ? [first.id] : [];
  });
  const [windowStart, setWindowStart] = useState(data.draftConfig.windowStart ?? "");
  const [windowEnd, setWindowEnd] = useState(data.draftConfig.windowEnd ?? "");
  const [licenseNumber, setLicenseNumber] = useState(data.draftConfig.licenseNumber ?? "");
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [inspectorId, setInspectorId] = useState(data.draftConfig.inspectorId ?? "");
  const [chosenMode, setChosenMode] = useState<ExecutionMode>(
    data.draftConfig.executionMode === "virtual" ? "virtual" : "physical",
  );
  const [notes, setNotes] = useState(data.draftConfig.notes ?? "");
  const [draftState, setDraftState] = useState<DraftInfo | null>(data.draft);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSaveFailed, setDraftSaveFailed] = useState(false);
  const [draftJustSaved, setDraftJustSaved] = useState(false);

  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.error) errorRef.current?.focus();
  }, [state.error]);

  const isFirstSearchEffect = useRef(true);
  useEffect(() => {
    if (isFirstSearchEffect.current) {
      isFirstSearchEffect.current = false;
      return;
    }
    if (queryInput === query) return;
    const handle = setTimeout(() => {
      const params = new URLSearchParams();
      if (queryInput.trim().length >= SEARCH_MIN_LENGTH) params.set("q", queryInput.trim());
      startSearchTransition(() => {
        router.replace(params.toString() ? `/planning/single?${params.toString()}` : "/planning/single");
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [queryInput, query, router]);

  const legacyFactory = results.find(entry => entry.id === factoryId) ?? null;
  const selectedEntry = licenceEntries(portfolios).find(entry => entry.licence.id === licenceId) ?? null;
  const target = resolveTarget(selectedEntry, legacyFactory);
  const eligibility = modeEligibility(target, data.virtualEligible);
  const mode = effectiveMode(chosenMode, eligibility);
  const readiness = readinessOf({ target, licenseNumber, locationConfirmed, windowStart, windowEnd });
  const searchSettled = queryInput.trim() === query && !searchPending;

  const reselect = () => {
    setTargetReselected(true);
    setLicenseNumber("");
    setLocationConfirmed(false);
  };

  async function onSaveDraft() {
    if (!target || savingDraft) return;
    setSavingDraft(true);
    setDraftSaveFailed(false);
    const saved = await saveSingleDraft({
      planId: draftState?.id,
      sourceChannel: data.sourceChannel,
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
        packageVersionIds: [...packageIds],
        executionMode: mode,
        windowStart,
        windowEnd,
        inspectorId,
        notes,
      },
    });
    setSavingDraft(false);
    if (saved.error || !saved.planId) {
      setDraftSaveFailed(true);
      setDraftJustSaved(false);
      return;
    }
    setDraftState({ id: saved.planId, planReference: saved.planReference ?? "", version: saved.version ?? 0 });
    setDraftJustSaved(true);
  }

  return (
    <div className={styles.screen}>
      {data.transitionsExecutable ? null : (
        <PlanningNotice tone="warning">{strings.blockedTitle}</PlanningNotice>
      )}

      {data.draft ? (
        <PlanningNotice tone="info">{strings.draftRestored} <bdi>{data.draft.planReference}</bdi></PlanningNotice>
      ) : null}
      {data.prefillMiss ? <PlanningNotice tone="warning">{strings.prefillMiss}</PlanningNotice> : null}
      {data.adminPackageHandoff ? (
        <PlanningNotice tone="info">{strings.adminPackageHandoff} <bdi>{data.adminPackageHandoff}</bdi></PlanningNotice>
      ) : null}

      <FactorySearch
        query={queryInput}
        results={results}
        registryUnavailable={data.registryUnavailable}
        settled={searchSettled}
        matchedElsewhere={portfolios.length > 0}
        selectedId={factoryId}
        onQueryChange={setQueryInput}
        onSelect={id => { setFactoryId(id); setLicenceId(null); reselect(); }}
        onRetry={() => router.refresh()}
        strings={strings}
        locale={locale}
      />

      {searchSettled && portfolios.length > 0 ? (
        <PortfolioPicker
          portfolios={portfolios}
          handoff={data.handoff}
          selectedLicenceId={licenceId}
          onSelect={id => { setLicenceId(id); setFactoryId(null); reselect(); }}
          strings={strings}
          locale={locale}
        />
      ) : null}

      <form action={formAction} className={styles.form}>
        <TargetFields
          target={target}
          sourceChannel={data.sourceChannel}
          resumeId={state.resumeId ?? draftState?.id ?? ""}
          reselected={targetReselected}
        />

        {target ? (
          <TargetConfirmation
            target={target}
            licence={selectedEntry?.licence ?? null}
            legacyFactory={legacyFactory}
            licenseNumber={licenseNumber}
            onLicenseConfirm={setLicenseNumber}
            locationConfirmed={locationConfirmed}
            onLocationConfirm={setLocationConfirmed}
            strings={strings}
            locale={locale}
          />
        ) : null}

        {target && readiness.configUnlocked ? (
          <ConfigurationCard
            value={{ visitType, packageIds, mode, windowStart, windowEnd, inspectorId, notes }}
            onChange={next => {
              setVisitType(next.visitType);
              setPackageIds([...next.packageIds]);
              setChosenMode(next.mode);
              setWindowStart(next.windowStart);
              setWindowEnd(next.windowEnd);
              setInspectorId(next.inspectorId);
              setNotes(next.notes);
            }}
            inspectors={data.inspectors}
            packages={data.packages}
            eligibility={eligibility}
            strings={strings}
            locale={locale}
          />
        ) : null}

        {target ? (
          <PublishReadiness
            gates={[
              { key: "identity", label: strings.readyIdentity, state: "met" },
              { key: "licence", label: strings.readyLicense, state: readiness.licenceOk ? "met" : "unmet" },
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
        ) : null}

        {state.error ? (
          <PublishBlockers error={state.error} steps={state.steps} focusRef={errorRef} strings={strings} />
        ) : null}

        {target ? (
          <PublishActions
            transitionsExecutable={data.transitionsExecutable}
            savingDraft={savingDraft}
            draftSaveFailed={draftSaveFailed}
            savedDraft={draftJustSaved ? draftState : null}
            pending={pending}
            resumeId={state.resumeId ?? null}
            publishReady={readiness.publishReady}
            onSaveDraft={onSaveDraft}
            strings={strings}
          />
        ) : null}
      </form>
    </div>
  );
}
