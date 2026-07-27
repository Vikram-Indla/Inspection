"use server";

import { getLocale } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import {
  parseExecutionVisitDetailRead,
  type ExecutionVisitDetailRead,
} from "./read-model";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function loadExecutionVisitDetail(visitId: string): Promise<ExecutionVisitDetailRead> {
  if (!UUID.test(visitId)) return { status: "not_found_or_denied" };
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) return { status: "not_found_or_denied" };
  const [{ data, error }, locale] = await Promise.all([
    sb.rpc("execution_visit_detail_read" as never, { p_visit_id: visitId } as never),
    getLocale(),
  ]);
  if (error) return error.code === "42501"
    ? { status: "not_found_or_denied" }
    : { status: "invalid" };
  return parseExecutionVisitDetailRead(data, locale);
}
