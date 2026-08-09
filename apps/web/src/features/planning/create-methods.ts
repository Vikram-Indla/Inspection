import type { IconName } from "@/components/saqeel/icon/icon-registry";

export type PlanningCreateMethodKey = "bulk" | "single" | "immediate";

export type PlanningCreateMethod = {
  readonly key: PlanningCreateMethodKey;
  readonly icon: IconName;
  readonly title: string;
  readonly description: string;
  readonly href: string;
};

export type PlanningMethodStrings = {
  readonly bulkTitle: string;
  readonly bulkDesc: string;
  readonly singleTitle: string;
  readonly singleDesc: string;
  readonly immediateTitle: string;
  readonly immediateDesc: string;
};

/**
 * Ordered from the narrowest commitment to the widest: one visit, then a bulk
 * plan, then the urgent path that pulls a supervisor in. A planner reaching for
 * the common case should meet it first.
 */
export function planningCreateMethods(strings: PlanningMethodStrings): readonly PlanningCreateMethod[] {
  return [
    { key: "single", icon: "visits", title: strings.singleTitle, description: strings.singleDesc, href: "/planning/single" },
    { key: "bulk", icon: "workflow", title: strings.bulkTitle, description: strings.bulkDesc, href: "/planning/bulk" },
    { key: "immediate", icon: "risk", title: strings.immediateTitle, description: strings.immediateDesc, href: "/planning/immediate" },
  ];
}
