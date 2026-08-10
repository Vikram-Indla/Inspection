import { readPages, type ReadResult } from "@/lib/postgrest/read";
import type { OperationsClient } from "./client-type";
import type { ActionRow, VisitRow } from "../types";
import { actionRow, visitRow } from "./shapes";

const VISIT_COLUMNS =
  "id, operational_state, planning_status, window_start, window_end, factory_id, factories(id, name, region, city, factory_code, source), assignments(profiles(full_name))";

const ACTION_COLUMNS =
  "id, form_type, owner_name, owner_role, due_at, status, is_blocking, required_correction, inspections(visit_id, visits(factories(id, name, factory_code, region, city)))";

export function loadVisits(sb: OperationsClient): Promise<ReadResult<VisitRow>> {
  return readPages((from, to) => sb.from("visits")
    .select(VISIT_COLUMNS)
    .order("window_start", { ascending: true })
    .order("id", { ascending: true })
    .range(from, to), visitRow, "operations.visits");
}

export function loadActionForms(sb: OperationsClient): Promise<ReadResult<ActionRow>> {
  return readPages((from, to) => sb.from("action_forms")
    .select(ACTION_COLUMNS)
    .neq("status", "closed")
    .order("due_at", { ascending: true })
    .order("id", { ascending: true })
    .range(from, to), actionRow, "operations.action_forms");
}
