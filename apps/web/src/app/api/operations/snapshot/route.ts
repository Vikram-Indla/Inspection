import { NextResponse } from "next/server";
import { cachedOperationsSnapshot } from "@/features/operations/cache";
import { scopeFromSearchParams } from "@/features/operations/scope";
import { CLEAN_FACTORY_CODES } from "@/features/operations/factory-codes";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { buildShellNavigation, BUSINESS_ROLE_KEYS } from "@/lib/shell-navigation";

export const dynamic = "force-dynamic";

async function mayViewOperations(sb: Awaited<ReturnType<typeof supabaseServer>>, userId: string) {
  const { data, error } = await sb.from("user_roles").select("role_key").eq("user_id", userId);
  if (error) return false;
  const roleKeys = (data ?? []).map(row => row.role_key);
  const destination = buildShellNavigation(roleKeys)
    .flatMap(group => group.items)
    .find(item => item.href === "/operations");
  const hasRole = roleKeys.some(role => BUSINESS_ROLE_KEYS.includes(role) || role === "admin");
  return destination?.enabled === true && hasRole;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const scope = scopeFromSearchParams(url.searchParams);

  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  if (!await mayViewOperations(sb, user.id)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const snapshot = await cachedOperationsSnapshot(
    sb, scope, user.id, CLEAN_FACTORY_CODES, new Date().toISOString(),
  );
  return NextResponse.json(snapshot);
}
