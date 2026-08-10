import { useT } from "@/lib/i18n";
import WidgetBoundary from "@/components/WidgetBoundary";
import ErrorBoundary from "@/components/saqeel/error-boundary/error-boundary";
import AiAdvisory from "@/components/sections/ai/ai-advisory/ai-advisory";
import PlanningNotice from "@/components/sections/planning-single/planning-notice/planning-notice";
import TargetingLensClient from "@/app/(app)/planning/bulk/TargetingLensClient";
import type { CriteriaFactory } from "@/features/planning-bulk/view";
import {
  distributionsOf, planningAiContext, resolveBulkTargeting, type BulkCriteriaParams,
} from "@/features/planning-bulk/targeting";
import {
  buildAdvisoryStrings, buildDistributionHeadings, buildDistributionStrings, buildLedgerStrings,
  buildBoundaryStrings, buildNoticeStrings, buildValueLabel,
} from "@/features/planning-bulk/strings";
import { buildBuilderFields, buildCriteriaStrings } from "@/features/planning-bulk/criteria-strings";
import { buildBulkFormStrings } from "@/features/planning-bulk/form-strings";

const EVIDENCE_REFS = ["AC-0016", "AC-0026", "M01-016", "M01-026", "SCR-WEB-110"];

export default async function BulkScreen({ params, factories }: {
  params: BulkCriteriaParams;
  factories: readonly CriteriaFactory[];
}) {
  const { locale } = await useT();
  const view = resolveBulkTargeting(params, factories, buildValueLabel(locale));
  const notices = buildNoticeStrings(locale);
  const advisory = buildAdvisoryStrings(locale);
  const uiLocale = locale === "ar" ? "ar" : "en";

  return (
    <>
      {view.criteriaUnreadable && (
        <PlanningNotice tone="warning" label={notices.unreadableTitle}>{notices.unreadableBody}</PlanningNotice>
      )}
      {!view.criteriaApplied && !view.criteriaUnreadable && (
        <PlanningNotice tone="warning" label={notices.noCriteriaTitle}>{notices.noCriteriaBody}</PlanningNotice>
      )}
      <WidgetBoundary label={advisory.unavailable}>
        <AiAdvisory
          surface="planning_summary"
          context={planningAiContext(view)}
          evidenceRefs={EVIDENCE_REFS}
          locale={uiLocale}
          strings={advisory}
        />
      </WidgetBoundary>
      <ErrorBoundary strings={buildBoundaryStrings(locale)}>
        <TargetingLensClient
          initialTree={view.tree}
          fieldOptions={view.fieldOptions}
          matchCount={view.eligible}
          criteriaStrings={buildCriteriaStrings(locale)}
          contributions={view.contributions}
          leafInfo={view.leafInfo}
          denominator={view.denominator}
          eligible={view.eligible}
          oldestSyncedAt={view.oldestSyncedAt}
          missingSync={view.missingSync}
          ledgerStrings={buildLedgerStrings(locale)}
          distributions={distributionsOf(view, buildDistributionHeadings(locale))}
          distStrings={buildDistributionStrings(locale)}
          factories={view.matched}
          bulkFormStrings={buildBulkFormStrings(locale)}
          locale={uiLocale}
          builderFields={buildBuilderFields(locale)}
          cityByRegion={view.cityByRegion}
        />
      </ErrorBoundary>
    </>
  );
}
