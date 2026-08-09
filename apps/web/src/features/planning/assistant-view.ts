import { fill } from "@/i18n/messages";
import type { PlanningListCounts, PlanningTab } from "@/lib/planning/visit-list";
import type { PlanningInsightFact } from "@/components/sections/planning/planning-insights/planning-insights";
import type { PlanningQuickAction, PlanningQuickActionCount } from "@/components/sections/planning/planning-quick-actions/planning-quick-actions";
import type { PlanningStat } from "@/components/sections/planning/planning-stat-cards/planning-stat-cards";
import type { PlanningAssistantData, PlanningRecommendation } from "./assistant";

type AssistantStrings = Record<string, string>;

export type PlanningRecommendationView = PlanningRecommendation & {
  readonly riskBandLabel: string | null;
};

export type PlanningAssistantView = {
  readonly headline: string;
  readonly facts: readonly PlanningInsightFact[];
  readonly quickActions: readonly PlanningQuickAction[];
  readonly stats: readonly PlanningStat[];
  readonly recommendations: readonly PlanningRecommendationView[];
};

export function buildPlanningAssistantView({
  assistant, counts, countsAvailable, activeTab, assistantStrings, statStrings, tabHref, enumLabel,
}: {
  assistant: PlanningAssistantData;
  counts: PlanningListCounts;
  countsAvailable: boolean;
  activeTab: PlanningTab;
  assistantStrings: AssistantStrings;
  statStrings: AssistantStrings;
  tabHref: (tab: string) => string;
  enumLabel: (value: string) => string;
}): PlanningAssistantView {
  const visitCount = (tab: PlanningTab) => (countsAvailable ? counts[tab] : null);
  const actionCount = (value: number | null): PlanningQuickActionCount =>
    (value === null ? "unavailable" : value);
  const attention = countsAvailable ? counts.draft + counts.returned + counts.expired : null;

  const headline = attention === null
    ? assistantStrings.headlineUnavailable
    : attention === 0
      ? assistantStrings.headlineNone
      : fill(assistantStrings.headline, { n: attention });

  const facts: PlanningInsightFact[] = [
    { key: "highRisk", label: assistantStrings.factHighRisk, count: assistant.highRiskFactories },
    { key: "returned", label: assistantStrings.factReturned, count: visitCount("returned") },
    { key: "draft", label: assistantStrings.factDraft, count: visitCount("draft") },
    { key: "expired", label: assistantStrings.factExpired, count: visitCount("expired") },
  ];

  const quickActions: PlanningQuickAction[] = [
    { key: "planRecommended", label: assistantStrings.quickPlanRecommended, icon: "ai", href: "/planning/bulk", count: actionCount(assistant.aiSuggested) },
    { key: "returned", label: assistantStrings.quickReviewReturned, icon: "review", href: tabHref("returned"), count: actionCount(visitCount("returned")) },
    { key: "draft", label: assistantStrings.quickReviewDraft, icon: "forms", href: tabHref("draft"), count: actionCount(visitCount("draft")) },
    { key: "supervision", label: assistantStrings.quickAwaitingSupervisor, icon: "inspect", href: tabHref("pending_supervision"), count: actionCount(visitCount("pending_supervision")) },
    { key: "weeklyPlan", label: assistantStrings.quickWeeklyPlan, icon: "workflow", href: "/planning/bulk" },
  ];

  const tabStat = (key: string, label: string, tab: PlanningTab): PlanningStat => ({
    key,
    label,
    count: visitCount(tab),
    href: tabHref(activeTab === tab ? "" : tab),
    active: activeTab === tab,
  });

  const stats: PlanningStat[] = [
    { key: "needsPlanning", label: statStrings.needsPlanning, count: null, href: null, active: false },
    { key: "highRisk", label: statStrings.highRisk, count: assistant.highRiskFactories, href: "/factories", active: false },
    tabStat("draft", statStrings.draft, "draft"),
    tabStat("returned", statStrings.returned, "returned"),
    tabStat("published", statStrings.published, "published"),
    { key: "expiringWindows", label: statStrings.expiringWindows, count: null, href: null, active: false },
    tabStat("expired", statStrings.expired, "expired"),
    { key: "aiSuggested", label: statStrings.aiSuggested, count: assistant.aiSuggested, href: null, active: false },
  ];

  const recommendations: PlanningRecommendationView[] = assistant.recommendations.map(item => ({
    ...item,
    riskBandLabel: item.riskBand === null ? null : enumLabel(item.riskBand),
  }));

  return { headline, facts, quickActions, stats, recommendations };
}
