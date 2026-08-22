import { NextResponse } from "next/server";
import { cachedOperationsSnapshot } from "@/features/operations/cache";
import { scopeFromSearchParams } from "@/features/operations/scope";
import { CLEAN_FACTORY_CODES } from "@/features/operations/factory-codes";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { buildShellNavigation } from "@/lib/shell-navigation";

export const dynamic = "force-dynamic";

function mayViewOperations() {
  const destination = buildShellNavigation([])
    .flatMap(group => group.items)
    .find(item => item.href === "/operations");
  return destination?.enabled === true;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const scope = scopeFromSearchParams(url.searchParams);

  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  if (!mayViewOperations()) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const snapshot = await cachedOperationsSnapshot(
    sb, scope, user.id, CLEAN_FACTORY_CODES, new Date().toISOString(),
  );
  return NextResponse.json(snapshot);
}
