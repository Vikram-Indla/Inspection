import { supabaseServer } from "@/lib/supabase-server";
import type { ApprovalComponentRow } from "./queries";

export type RecordedDependents = {
  readonly clauses: number;
  readonly items: number;
  readonly violations: number;
  readonly penalties: number;
};

export type DependentsIndex = {
  readonly byComponent: ReadonlyMap<string, RecordedDependents>;
  readonly readable: boolean;
};

const EMPTY: DependentsIndex = { byComponent: new Map(), readable: false };

/**
 * What is already recorded beneath the entity a component amends.
 *
 * This is **not** an impact analysis. No impact-receipt table exists, and the
 * reach of a change — which packages, which factories — is not computed
 * anywhere in this repository. What can be stated is what the library already
 * holds under the targeted entity, and the panel says exactly that.
 *
 * Only `modify` components have a target to count under; a `create` component
 * has no existing entity, so it has no recorded dependents and does not appear.
 */
export async function queryRecordedDependents(
  components: readonly ApprovalComponentRow[],
): Promise<DependentsIndex> {
  const targets = components.filter(component => component.target_entity_id);
  if (!targets.length) return { byComponent: new Map(), readable: true };

  const sb = await supabaseServer();
  const regulationIds = targets.filter(row => row.entity_kind === "regulation")
    .map(row => row.target_entity_id ?? "");
  const violationIds = targets.filter(row => row.entity_kind === "violation")
    .map(row => row.target_entity_id ?? "");

  const [clauseRead, penaltyRead] = await Promise.all([
    regulationIds.length
      ? sb.from("regulation_clauses").select("id,regulation_id").in("regulation_id", regulationIds)
      : Promise.resolve({ data: [], error: null }),
    violationIds.length
      ? sb.from("penalty_mappings").select("id,violation_code_id").in("violation_code_id", violationIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (clauseRead.error || penaltyRead.error) return EMPTY;

  const clauses = (clauseRead.data ?? []) as { id: string; regulation_id: string }[];
  const clauseIds = clauses.map(clause => clause.id);

  const [itemRead, violationRead] = await Promise.all([
    clauseIds.length
      ? sb.from("inspection_items").select("id,clause_id").in("clause_id", clauseIds)
      : Promise.resolve({ data: [], error: null }),
    clauseIds.length
      ? sb.from("violation_codes").select("id,clause_id").in("clause_id", clauseIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (itemRead.error || violationRead.error) return EMPTY;

  const items = (itemRead.data ?? []) as { clause_id: string }[];
  const violations = (violationRead.data ?? []) as { clause_id: string }[];
  const penalties = (penaltyRead.data ?? []) as { violation_code_id: string }[];
  const clauseRegulation = new Map(clauses.map(clause => [clause.id, clause.regulation_id]));

  const tally = (rows: readonly { clause_id: string }[]) => {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const regulationId = clauseRegulation.get(row.clause_id);
      if (regulationId) counts.set(regulationId, (counts.get(regulationId) ?? 0) + 1);
    }
    return counts;
  };

  const clauseCounts = new Map<string, number>();
  for (const clause of clauses) {
    clauseCounts.set(clause.regulation_id, (clauseCounts.get(clause.regulation_id) ?? 0) + 1);
  }
  const itemCounts = tally(items);
  const violationCounts = tally(violations);
  const penaltyCounts = new Map<string, number>();
  for (const penalty of penalties) {
    penaltyCounts.set(penalty.violation_code_id, (penaltyCounts.get(penalty.violation_code_id) ?? 0) + 1);
  }

  const byComponent = new Map<string, RecordedDependents>();
  for (const component of targets) {
    const target = component.target_entity_id ?? "";
    if (component.entity_kind === "regulation") {
      byComponent.set(component.id, {
        clauses: clauseCounts.get(target) ?? 0,
        items: itemCounts.get(target) ?? 0,
        violations: violationCounts.get(target) ?? 0,
        penalties: 0,
      });
    } else if (component.entity_kind === "violation") {
      byComponent.set(component.id, {
        clauses: 0, items: 0, violations: 0, penalties: penaltyCounts.get(target) ?? 0,
      });
    }
  }

  return { byComponent, readable: true };
}
