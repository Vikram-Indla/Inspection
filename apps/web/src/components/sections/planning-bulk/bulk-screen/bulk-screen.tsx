import { useT } from "@/lib/i18n";
import WidgetBoundary from "@/components/WidgetBoundary";
import ErrorBoundary from "@/components/saqeel/error-boundary/error-boundary";
import BulkAiAdvisory from "@/components/sections/planning-bulk/bulk-ai-advisory/bulk-ai-advisory";
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
      <WidgetBoundary label={advisory.unavailable}>
        <BulkAiAdvisory context={planningAiContext(view)} locale={uiLocale} strings={advisory} />
      </WidgetBoundary>
      {view.criteriaUnreadable && (
        <PlanningNotice tone="warning" label={notices.unreadableTitle}>{notices.unreadableBody}</PlanningNotice>
      )}
      <ErrorBoundary strings={buildBoundaryStrings(locale)}>
        <TargetingLensClient
          initialTree={view.tree}
          fieldOptions={view.fieldOptions}
          criteriaStrings={buildCriteriaStrings(locale)}
          contributions={view.contributions}
          leafInfo={view.leafInfo}
          denominator={view.denominator}
          eligible={view.eligible}
          oldestSyncedAt={view.oldestSyncedAt}
          missingSync={view.missingSync}
          ledgerStrings={buildLedgerStrings(locale)}
          distributions={distributionsOf(view, buildDistributionHeadings(locale), buildValueLabel(locale))}
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
