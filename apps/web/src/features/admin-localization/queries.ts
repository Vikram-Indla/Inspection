import { getUserRoles } from "@/lib/persona";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import {
  countRunsLong,
  countStates,
  coverage,
  isMissingArabic,
  matchesQuery,
  PAGE_SIZE,
  type LocalizationQuery,
  type StateCounts,
  type UiString,
} from "./view";

const PAGE_READ_SIZE = 1000;

const MANAGE_ROLES = ["admin", "compliance_admin", "security_admin", "workflow_admin"] as const;

export type LocalizationData = {
  readonly rows: readonly UiString[];
  readonly counts: StateCounts;
  readonly total: number;
  readonly translated: number;
  readonly reviewed: number;
  readonly coveragePercent: number;
  readonly reviewedPercent: number;
  readonly runsLong: number;
  readonly matched: number;
  readonly pageCount: number;
  readonly page: number;
};

export type LocalizationResult =
  | { readonly kind: "unauthorized" }
  | { readonly kind: "error" }
  | { readonly kind: "ok"; readonly data: LocalizationData };

export async function canManageLocalization(): Promise<boolean> {
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) return false;
  const { data, error } = await getUserRoles(user.id);
  if (error) return false;
  const roles = new Set((data ?? []).map(row => row.role_key));
  return MANAGE_ROLES.some(role => roles.has(role));
}

export async function loadLocalization(query: LocalizationQuery): Promise<LocalizationResult> {
  if (!await canManageLocalization()) return { kind: "unauthorized" };

  const sb = await supabaseServer();
  const rows: UiString[] = [];
  for (let from = 0; ; from += PAGE_READ_SIZE) {
    const result = await sb.from("ui_strings")
      .select("key, en, ar, status, context, orphaned, updated_at")
      .order("key")
      .range(from, from + PAGE_READ_SIZE - 1);
    if (result.error) {
      console.error("[localization] dictionary read failed", result.error);
      return { kind: "error" };
    }
    const page = (result.data ?? []) as UiString[];
    rows.push(...page);
    if (page.length < PAGE_READ_SIZE) break;
  }

  const total = rows.length;
  const translated = rows.filter(row => !isMissingArabic(row)).length;
  const reviewed = rows.filter(row => row.status === "reviewed" && !row.orphaned).length;
  const matched = rows.filter(row => matchesQuery(row, query));
  const pageCount = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));
  const page = Math.min(query.page, pageCount);

  return {
    kind: "ok",
    data: {
      rows: matched.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      counts: countStates(rows),
      total,
      translated,
      reviewed,
      coveragePercent: coverage(translated, total),
      reviewedPercent: coverage(reviewed, translated),
      runsLong: countRunsLong(rows),
      matched: matched.length,
      pageCount,
      page,
    },
  };
}
