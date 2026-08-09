import { NextResponse } from "next/server";
import { riyadhToday } from "@/lib/dates";
import { getVerifiedUser } from "@/lib/verified-user";
import { supabaseServer } from "@/lib/supabase-server";
import { isTestFixtureEstablishment } from "@/lib/field/fixtures";
import { getLocale } from "@/lib/i18n";

const csv = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

export async function GET(request: Request) {
  const sb = await supabaseServer();
  const [{ data: { user }, error: authError }, locale] = await Promise.all([
    getVerifiedUser(sb),
    getLocale(),
  ]);
  if (authError || !user) return NextResponse.json({ error: "auth_required" }, { status: 401 });
  const copy = (en: string, ar: string) => locale === "ar" ? ar : en;

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const status = url.searchParams.get("status") ?? "";
  const range = Number(url.searchParams.get("range") ?? 0);
  const region = url.searchParams.get("region") ?? "";
  const { data, error } = await sb.from("violations")
    .select("id,invalidated_at,inspections(submitted_at,visits(factories(name,factory_code,license_number,region))),violation_codes(title,code),action_forms(form_type,status,due_at)")
    .order("id", { ascending: false })
    .limit(1000);
  if (error) return NextResponse.json({ error: "read_unavailable" }, { status: 503 });

  type Row = {
    id: string;
    invalidated_at: string | null;
    inspections: { submitted_at: string | null; visits: { factories: { name: string; factory_code: string | null; license_number: string | null; region: string | null } | null } | null } | null;
    violation_codes: { title: string; code: string } | null;
    action_forms: Array<{ form_type: string; status: string; due_at: string | null }> | null;
  };
  const cutoff = range ? Date.now() - range * 86_400_000 : 0;
  const rows = ((data ?? []) as unknown as Row[]).filter(row => {
    const factory = row.inspections?.visits?.factories;
    if (isTestFixtureEstablishment(factory)) return false;
    const action = row.action_forms?.[0];
    const closed = !!row.invalidated_at || action?.status === "closed";
    const haystack = `${factory?.name ?? ""} ${factory?.license_number ?? ""} ${row.violation_codes?.title ?? ""} ${row.violation_codes?.code ?? ""}`.toLowerCase();
    return (!q || haystack.includes(q))
      && (!status || (status === "closed" ? closed : !closed))
      && (!region || factory?.region === region)
      && (!cutoff || !!row.inspections?.submitted_at && new Date(row.inspections.submitted_at).getTime() >= cutoff);
  });
  const lines = [
    [
      copy("Violation ID", "معرّف المخالفة"),
      copy("Violation", "المخالفة"),
      copy("Code", "الرمز"),
      copy("Factory", "المصنع"),
      copy("Licence", "الترخيص"),
      copy("Region", "المنطقة"),
      copy("Issue date", "تاريخ الإصدار"),
      copy("Status", "الحالة"),
      copy("Action form", "نموذج الإجراء"),
      copy("Action due", "استحقاق الإجراء"),
    ].map(csv).join(","),
    ...rows.map(row => {
      const factory = row.inspections?.visits?.factories;
      const action = row.action_forms?.[0];
      const closed = !!row.invalidated_at || action?.status === "closed";
      return [row.id, row.violation_codes?.title, row.violation_codes?.code, factory?.name, factory?.license_number, factory?.region, row.inspections?.submitted_at, closed ? copy("Closed", "مغلق") : copy("Open", "مفتوح"), action?.form_type, action?.due_at].map(csv).join(",");
    }),
  ];
  return new NextResponse(lines.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="saqeel-enforcement-${riyadhToday()}.csv"`,
      "cache-control": "no-store",
    },
  });
}
