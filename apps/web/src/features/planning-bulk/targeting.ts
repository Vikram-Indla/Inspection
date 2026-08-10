import {
  FIELD_REGISTRY, emptyTree, evalNode, fromFlat, hasCriteria, leaves, parseCt, pathKey,
  type GroupNode,
} from "@/app/(app)/planning/bulk/criteria";
import {
  bucketsFor, citiesByRegion, countBy, freshnessOf, suggestionOptions,
  type CriteriaFactory, type ValueBucket,
} from "./view";

export type BulkCriteriaParams = {
  ct?: string;
  cf?: string | string[];
  co?: string | string[];
  cv?: string | string[];
  combine?: string;
};

export type CriteriaLeaf = { pathKey: string; field: string; value: string };

export type FieldDistribution = { key: string; heading: string; total: number; buckets: ValueBucket[] };

export type DistributionHeading = { key: string; heading: string };

export type BulkTargetingView = {
  tree: GroupNode;
  criteriaUnreadable: boolean;
  criteriaApplied: boolean;
  matched: CriteriaFactory[];
  denominator: number;
  eligible: number;
  fieldOptions: Record<string, string[]>;
  cityByRegion: Record<string, string[]>;
  contributions: Record<string, number>;
  leafInfo: CriteriaLeaf[];
  oldestSyncedAt: string | null;
  missingSync: number;
  riskCounts: Record<string, number>;
  regionCounts: Record<string, number>;
};

const UNKNOWN_BUCKET = "unknown";

const SUGGESTION_FIELDS = FIELD_REGISTRY
  .filter(field => field.supplied && (field.type === "text" || field.type === "enum"))
  .map(field => field.key);

const asList = (value: string | string[] | undefined): string[] =>
  value == null ? [] : Array.isArray(value) ? value : [value];

function criteriaTreeOf(params: BulkCriteriaParams): { tree: GroupNode; unreadable: boolean } {
  const parsed = parseCt(params.ct);
  const fallback = fromFlat(asList(params.cf), asList(params.co), asList(params.cv), params.combine ?? "and");
  return { tree: parsed ?? fallback ?? emptyTree(), unreadable: Boolean(params.ct) && parsed === null };
}

function focusOf(tree: GroupNode, everyFactory: readonly CriteriaFactory[]): {
  contributions: Record<string, number>;
  leafInfo: CriteriaLeaf[];
} {
  const leafList = leaves(tree);
  return {
    contributions: Object.fromEntries(leafList.map(leaf =>
      [pathKey(leaf.path), everyFactory.filter(factory => evalNode(factory, leaf.node)).length])),
    leafInfo: leafList.map(leaf => ({ pathKey: pathKey(leaf.path), field: leaf.node.field, value: leaf.node.value })),
  };
}

export function resolveBulkTargeting(
  params: BulkCriteriaParams,
  everyFactory: readonly CriteriaFactory[],
): BulkTargetingView {
  const { tree, unreadable } = criteriaTreeOf(params);
  const criteriaApplied = hasCriteria(tree);
  const matched = criteriaApplied ? everyFactory.filter(factory => evalNode(factory, tree)) : [];
  const freshness = freshnessOf(matched);
  return {
    tree,
    criteriaUnreadable: unreadable,
    criteriaApplied,
    matched,
    denominator: everyFactory.length,
    eligible: matched.length,
    fieldOptions: suggestionOptions(everyFactory, SUGGESTION_FIELDS),
    cityByRegion: citiesByRegion(everyFactory),
    ...focusOf(tree, everyFactory),
    oldestSyncedAt: freshness.oldestSyncedAt,
    missingSync: freshness.missingSync,
    riskCounts: countBy(everyFactory, "risk_band", UNKNOWN_BUCKET),
    regionCounts: countBy(everyFactory, "region", UNKNOWN_BUCKET),
  };
}

export function distributionsOf(
  view: BulkTargetingView,
  headings: readonly DistributionHeading[],
): FieldDistribution[] {
  return headings.map(({ key, heading }) => ({
    key,
    heading,
    total: view.eligible,
    buckets: bucketsFor(view.matched, key, UNKNOWN_BUCKET),
  }));
}

export function planningAiContext(view: BulkTargetingView): string {
  return JSON.stringify({
    scope: { factories: view.denominator, eligible: view.eligible, criteria_applied: view.criteriaApplied },
    risk_band_counts: view.riskCounts,
    region_counts: view.regionCounts,
    oldest_source_sync: view.oldestSyncedAt,
    missing_source_sync: view.missingSync,
    rule: "Use only these recorded aggregates. Do not select factories, alter risk values, invent thresholds, or publish a plan.",
  });
}
