import { isTestFixtureEstablishment } from "@/lib/field/fixtures";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";

export type EnforcementFactory = {
  id: string;
  name: string;
  factory_code: string | null;
  license_number: string | null;
  region: string | null;
  city: string | null;
};

export type EnforcementActionForm = {
  id: string;
  violation_id: string | null;
  form_type: string;
  status: string;
  due_at: string | null;
  owner_name: string | null;
  owner_role: string | null;
  required_correction: string | null;
  is_blocking: boolean;
};

export type EnforcementViolationRow = {
  id: string;
  mapping_version: string;
  invalidated_at: string | null;
  violation_codes: { title: string; code: string; level: string; corrective_action: string | null } | null;
  inspections: {
    id: string;
    inspection_no: string | null;
    status: string;
    started_at: string | null;
    submitted_at: string | null;
    visits: {
      id: string;
      visit_reference: string | null;
      factories: EnforcementFactory | null;
      assignments: Array<{ status: string; profiles: { full_name: string } | null }>;
    } | null;
    action_forms: EnforcementActionForm[];
    evidence: Array<{ id: string; linked_id: string; content_sha256: string | null }>;
  } | null;
};

export type EnforcementPenaltyRow = {
  violation_id: string;
  status: string;
  issued_at: string | null;
  mapping_snapshot: unknown;
};

export type EnforcementLibrary =
  | { readonly kind: "unauthenticated" }
  | { readonly kind: "unavailable" }
  | {
      readonly kind: "ok";
      readonly violations: readonly EnforcementViolationRow[];
      readonly penalties: readonly EnforcementPenaltyRow[];
      readonly penaltiesReadable: boolean;
    };

const VIOLATION_SELECT = `
  id,mapping_version,invalidated_at,
  violation_codes(title,code,level,corrective_action),
  inspections!inner(
    id,inspection_no,status,started_at,submitted_at,
    visits!inner(
      id,visit_reference,
      factories!inner(id,name,factory_code,license_number,region,city),
      assignments(status,profiles(full_name))
    ),
    action_forms(id,violation_id,form_type,status,due_at,owner_name,owner_role,required_correction,is_blocking),
    evidence(id,linked_id,content_sha256)
  )
`;

const VIOLATION_LIMIT = 100;
const PENALTY_LIMIT = 500;

/**
 * Recorded enforcement, scoped by RLS.
 *
 * `inspection_penalties` is separately gated, and an empty result there is not
 * the same as "no penalty was issued" — `penaltiesReadable` keeps the two
 * apart so a hidden penalty never renders as an absent one.
 */
export async function queryEnforcementLibrary(): Promise<EnforcementLibrary> {
  const sb = await supabaseServer();
  const verified = await getVerifiedUser(sb);
  if (verified.error || !verified.data.user) return { kind: "unauthenticated" };

  const violationRead = await sb.from("violations")
    .select(VIOLATION_SELECT)
    .order("id", { ascending: false })
    .limit(VIOLATION_LIMIT);

  if (violationRead.error) {
    console.error(`[enforcement.library] violation read failed: ${violationRead.error.message}`);
    return { kind: "unavailable" };
  }

  const violations = ((violationRead.data ?? []) as unknown as EnforcementViolationRow[])
    .filter(row => !isTestFixtureEstablishment(row.inspections?.visits?.factories));

  const ids = violations.map(row => row.id);
  const penaltyRead = ids.length
    ? await sb.from("inspection_penalties")
        .select("violation_id,status,issued_at,mapping_snapshot")
        .in("violation_id", ids)
        .limit(PENALTY_LIMIT)
    : { data: [], error: null };

  if (penaltyRead.error) console.error(`[enforcement.library] penalty read failed: ${penaltyRead.error.message}`);

  return {
    kind: "ok",
    violations,
    penalties: (penaltyRead.data ?? []) as unknown as EnforcementPenaltyRow[],
    penaltiesReadable: !penaltyRead.error,
  };
}
