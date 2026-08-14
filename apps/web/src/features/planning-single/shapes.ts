import type { ResolvedPortfolio } from "@/lib/planning/factory-resolver";
import type { PlanningInspectorOption, PlanningPackageOption } from "@/lib/planning/read-contract";

export type GradedFactory = {
  readonly id: string;
  readonly factory_code: string | null;
  readonly name: string;
  readonly cr_number: string | null;
  readonly license_number: string | null;
  readonly region: string | null;
  readonly city: string | null;
  readonly risk_band: string | null;
  readonly risk_score: number | null;
  readonly official_lat: number | null;
  readonly official_lng: number | null;
  readonly geofence_radius_m: number | null;
  readonly source_synced_at: string | null;
  readonly master_source: string | null;
  readonly source: "legacy";
  readonly grade: "exact" | "similar_name";
  readonly degraded: boolean;
  readonly duplicate: boolean;
  readonly duplicateVisitId: string | null;
  readonly duplicateVisitStatus: string | null;
};

export type DraftConfig = {
  readonly visitType?: string;
  readonly packageVersionId?: string;
  readonly packageVersionIds?: readonly string[];
  readonly executionMode?: string;
  readonly windowStart?: string;
  readonly windowEnd?: string;
  readonly inspectorId?: string;
  readonly notes?: string;
  readonly licenseNumber?: string;
};

export type DraftInfo = {
  readonly id: string;
  readonly planReference: string;
  readonly version: number;
};

export type InitialSelection = {
  readonly factoryId?: string;
  readonly licenceId?: string;
};

export type SinglePlanningData = {
  readonly query: string;
  readonly portfolios: readonly ResolvedPortfolio[];
  readonly results: readonly GradedFactory[];
  readonly registryUnavailable: boolean;
  readonly initialSelection: InitialSelection;
  readonly draft: DraftInfo | null;
  readonly draftConfig: DraftConfig;
  readonly sourceChannel: string;
  readonly handoff: boolean;
  readonly adminPackageHandoff: string | null;
  readonly prefillMiss: boolean;
  readonly packages: readonly PlanningPackageOption[];
  readonly inspectors: readonly PlanningInspectorOption[];
  readonly virtualEligible: boolean;
  readonly transitionsExecutable: boolean;
};

/**
 * Search runs from the first character typed.
 *
 * It was 3, duplicated as a literal in the screen, the results list and the
 * server read — so the three could disagree and the reader would see a prompt
 * that contradicted what the server had already answered. One constant now, and
 * the batched duplicate read (duplicates.ts) is what makes a one-character
 * query affordable: it used to cost one query per result.
 */
export const SEARCH_MIN_LENGTH = 1;
