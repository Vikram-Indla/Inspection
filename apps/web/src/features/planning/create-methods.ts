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

export function planningCreateMethods(strings: PlanningMethodStrings): readonly PlanningCreateMethod[] {
  return [
    { key: "bulk", icon: "workflow", title: strings.bulkTitle, description: strings.bulkDesc, href: "/planning/bulk" },
    { key: "single", icon: "visits", title: strings.singleTitle, description: strings.singleDesc, href: "/planning/single" },
    { key: "immediate", icon: "risk", title: strings.immediateTitle, description: strings.immediateDesc, href: "/planning/immediate" },
  ];
}
