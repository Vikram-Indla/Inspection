import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";

// TASK-WEB-COMPLIANCE-SHARED-SHELL-001 · CMP-REQ-SHELL-002
// This endpoint performs ordinary authenticated SELECTs. Supabase RLS is the
// result boundary; the shell never uses an elevated client or bypass query.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ results: [] });

  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) return NextResponse.json({ results: [] }, { status: 401 });

  const pattern = `%${q}%`;
  const [factoryName, factoryCode, visitRead, inspectionRead] = await Promise.all([
    sb.from("factories").select("id,name,factory_code,region,city").ilike("name", pattern).limit(5),
    sb.from("factories").select("id,name,factory_code,region,city").ilike("factory_code", pattern).limit(5),
    sb.from("visits").select("id,visit_type,planning_status,factories(name,factory_code)").ilike("visit_type", pattern).limit(5),
    sb.from("inspections").select("id,inspection_no,status,visits(factories(name,factory_code))").ilike("inspection_no", pattern).limit(5),
  ]);

  const seenFactories = new Set<string>();
  const factories = [...(factoryName.data ?? []), ...(factoryCode.data ?? [])].flatMap(row => {
    if (seenFactories.has(row.id)) return [];
    seenFactories.add(row.id);
    return [{
      id: row.id,
      type: "factory" as const,
      label: row.name,
      detail: [row.factory_code, row.region, row.city].filter(Boolean).join(" · "),
      href: `/factories/${row.id}`,
    }];
  }).slice(0, 5);

  const visits = (visitRead.data ?? []).map(row => {
    const factory = row.factories as unknown as { name: string | null; factory_code: string | null } | null;
    return {
      id: row.id,
      type: "visit" as const,
      label: factory?.name ?? row.id.slice(0, 8),
      detail: [factory?.factory_code, row.visit_type, row.planning_status].filter(Boolean).join(" · "),
      href: `/visits/${row.id}`,
    };
  });

  const inspections = (inspectionRead.data ?? []).map(row => {
    const visit = row.visits as unknown as { factories: { name: string | null; factory_code: string | null } | null } | null;
    return {
      id: row.id,
      type: "inspection" as const,
      label: row.inspection_no ?? row.id.slice(0, 8),
      detail: [visit?.factories?.name, visit?.factories?.factory_code, row.status].filter(Boolean).join(" · "),
      href: `/field/inspection/${row.id}`,
    };
  });

  const failed = [factoryName.error, factoryCode.error, visitRead.error, inspectionRead.error].filter(Boolean).length;
  return NextResponse.json({ results: [...factories, ...visits, ...inspections].slice(0, 12), degraded: failed > 0 });
}
