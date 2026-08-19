import { isTestFixtureEstablishment } from "@/lib/field/fixtures";
import { logProviderError } from "@/lib/neutral-error";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { ASSIGNMENT_COLUMNS, toVisits, type FieldVisit } from "./rows";

export type FieldVisitsData = {
  userId: string;
  failed: boolean;
  visits: readonly FieldVisit[];
};

export async function loadFieldVisits(): Promise<FieldVisitsData | null> {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) return null;

  const read = await sb.from("assignments")
    .select(ASSIGNMENT_COLUMNS)
    .eq("inspector_id", user.id)
    .order("created_at", { ascending: false });

  if (read.error) {
    logProviderError("field visits", read.error);
    return { userId: user.id, failed: true, visits: [] };
  }

  const visits = toVisits(read.data).filter(visit => !isTestFixtureEstablishment({
    name: visit.factory.name,
    factory_code: visit.factory.code,
  }));

  return { userId: user.id, failed: false, visits };
}
