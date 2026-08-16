import { canManageLocalization } from "@/features/admin-localization/queries";
import { supabaseServer } from "@/lib/supabase-server";
import { matchesQuery, parseLocalizationQuery, type UiString } from "@/features/admin-localization/view";

const PAGE_READ_SIZE = 1000;
const HEADER = "key,en,ar,status,context";
const EXCEL_UTF8_MARKER = "\uFEFF";

const escape = (value: string | null) => `"${(value ?? "").replace(/"/g, '""')}"`;

export async function GET(request: Request) {
  if (!await canManageLocalization()) return new Response(null, { status: 404 });

  const params = Object.fromEntries(new URL(request.url).searchParams);
  const query = parseLocalizationQuery(params);
  const sb = await supabaseServer();
  const rows: UiString[] = [];

  for (let from = 0; ; from += PAGE_READ_SIZE) {
    const result = await sb.from("ui_strings")
      .select("key, en, ar, status, context, orphaned, updated_at")
      .order("key")
      .range(from, from + PAGE_READ_SIZE - 1);
    if (result.error) return new Response(null, { status: 503 });
    const page = (result.data ?? []) as UiString[];
    rows.push(...page);
    if (page.length < PAGE_READ_SIZE) break;
  }

  const lines = [
    HEADER,
    ...rows
      .filter(row => matchesQuery(row, query))
      .map(row => [row.key, row.en, row.ar, row.status, row.context].map(escape).join(",")),
  ];

  return new Response(`${EXCEL_UTF8_MARKER}${lines.join("\n")}`, {
    headers: {
      "content-type": "text/csv;charset=utf-8",
      "content-disposition": 'attachment; filename="ui-strings.csv"',
      "cache-control": "no-store",
    },
  });
}
