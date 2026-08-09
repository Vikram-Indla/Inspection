import ContextualAiPanel from "@/components/ContextualAiPanel";
import WidgetBoundary from "@/components/WidgetBoundary";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";

const EVIDENCE_REFS = ["MVP1-M02-001", "MVP1-M02-002", "MVP1-M02-017", "MVP1-M02-035", "SCR-WEB-200"];

export default function VisitAiSummary({ locale }: { locale: Locale }) {
  const { ai } = getMessages(locale).planning.visit;
  return (
    <WidgetBoundary label={ai.unavailable}>
      <ContextualAiPanel
        surface="visit_management_summary"
        title={ai.title}
        description={ai.description}
        context={JSON.stringify({ scope: "visit-management" })}
        evidenceRefs={EVIDENCE_REFS}
        generateLabel={ai.generate}
        unavailableLabel={ai.unavailable}
        evidenceLabel={ai.evidence}
        advisoryLabel={ai.advisory}
        reviewLabel={ai.review}
      />
    </WidgetBoundary>
  );
}
