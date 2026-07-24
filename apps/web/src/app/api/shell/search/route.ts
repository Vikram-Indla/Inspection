import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { performShellSearch } from "@/lib/shell-search";

// TASK-WEB-COMPLIANCE-SHARED-SHELL-001 · CMP-REQ-SHELL-002
// This endpoint performs ordinary authenticated SELECTs. Supabase RLS is the
// result boundary; the shell never uses an elevated client or bypass query.
// Query/ranking logic lives in lib/shell-search.ts — shared with the
// dedicated /field/search page so there is one rule, not two.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";

  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) return NextResponse.json({ results: [] }, { status: 401 });

  const outcome = await performShellSearch(sb, q);
  return NextResponse.json(outcome);
}
