import { NextResponse } from "next/server";
import { cachedDashboardSnapshot } from "@/features/dashboard/cache";
import { effectiveView, scopeFromSearchParams, withView } from "@/features/dashboard/scope";
import { loadPersona } from "@/features/dashboard/sources/persona";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const requestedScope = scopeFromSearchParams(url.searchParams, Date.now());

  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const persona = await loadPersona(sb, user.id);
  if (!persona) {
    return NextResponse.json({ error: "no_workspace" }, { status: 403 });
  }

  const scope = withView(requestedScope, effectiveView(requestedScope, persona === "admin"));
  const snapshot = await cachedDashboardSnapshot(sb, scope, persona, user.id);
  return NextResponse.json({ persona, view: scope.view, snapshot });
}
