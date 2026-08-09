import type { EnforcementTrend } from "./enforcement-trend";
import type { DashboardScope } from "./scope";

export type ExecutiveBriefFacts = {
  readonly completedInspections: number;
  readonly criticalFactories: number;
  readonly factories: number;
};

const line = (label: string, value: string) => `${label}: ${value}`;

/**
 * The evidence handed to the brief. Only figures already rendered on this
 * screen appear here — the brief may summarise what the officer can see, and
 * nothing else. A period the caller could not read is stated as unreadable
 * rather than omitted, so the model never treats a denied read as a zero.
 */
export function buildBriefContext(
  scope: DashboardScope,
  trend: EnforcementTrend,
  facts: ExecutiveBriefFacts,
): string {
  const enforcement = trend.readable
    ? trend.periods.map(period => line(`Penalty notices ${period.from} to ${period.to}`, String(period.count)))
    : ["Penalty notices: not readable by this role"];

  return [
    line("Scope", `${scope.scope.fromDate} to ${scope.scope.toDate}, grouped by ${scope.lens}`),
    line("Region filter", scope.region || "none"),
    ...enforcement,
    line("Completed inspections in scope", String(facts.completedInspections)),
    line("Factories at critical risk", String(facts.criticalFactories)),
    line("Factories in scope", String(facts.factories)),
  ].join("\n");
}
