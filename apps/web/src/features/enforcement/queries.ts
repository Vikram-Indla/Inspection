import { cache } from "react";
import { isTestFixtureEstablishment } from "@/lib/field/fixtures";
import { supabaseServer } from "@/lib/supabase-server";
import type { PenaltyRow, ViolationRow } from "./types";

export type EnforcementLibraryRead = {
  readonly rows: readonly ViolationRow[];
  readonly penalties: readonly PenaltyRow[];
  readonly failed: boolean;
};

const VIOLATION_SELECT = `
  id,mapping_version,invalidated_at,
  violation_codes(title,code,level,corrective_action),
  inspections!inner(
    id,status,started_at,submitted_at,
    visits!inner(
      id,
      factories!inner(id,name,factory_code,license_number,region,city),
      assignments(status,profiles(full_name))
    ),
    action_forms(id,violation_id,form_type,status,due_at,owner_name,owner_role,required_correction,is_blocking),
    evidence(id,linked_id,content_sha256)
  )
`;

export const getEnforcementLibrary = cache(async (): Promise<EnforcementLibraryRead> => {
  const sb = await supabaseServer();
  const violationRead = await sb.from("violations")
    .select(VIOLATION_SELECT)
    .order("id", { ascending: false })
    .limit(100);

  const rows = ((violationRead.data ?? []) as unknown as ViolationRow[])
    .filter(row => !isTestFixtureEstablishment(row.inspections?.visits?.factories));

  const violationIds = rows.map(row => row.id);
  const penaltyRead = violationIds.length
    ? await sb.from("inspection_penalties")
        .select("violation_id,status,mapping_snapshot")
        .in("violation_id", violationIds)
        .limit(500)
    : { data: [], error: null };

  return {
    rows,
    penalties: (penaltyRead.data ?? []) as unknown as PenaltyRow[],
    failed: Boolean(violationRead.error || penaltyRead.error),
  };
});
