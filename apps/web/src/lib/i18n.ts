// Localization runtime (SB19 · Arabic scope) — server-first, cookie-driven.
// English lives in code as the source string; Arabic comes from ui_strings
// (managed in /admin/localization). Missing Arabic falls back to English so
// the app never breaks while translation review is in flight.
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export type Locale = "en" | "ar";
export type Dict = Record<string, string>;

export async function getLocale(): Promise<Locale> {
  const c = await cookies();
  return c.get("locale")?.value === "en" ? "en" : "ar";
}

// Module-level cache: one dictionary fetch per server process per TTL window.
// /admin/localization saves bust it by calling revalidate on next read (TTL).
let cache: { at: number; dict: Dict } | null = null;
const TTL_MS = 30_000;

const PAGE = 1000; // PostgREST caps a single response at 1000 rows (db max-rows).

export async function getDict(locale: Locale): Promise<Dict> {
  if (locale === "en") return {};
  if (cache && Date.now() - cache.at < TTL_MS) return cache.dict;
  // anon client: ui_strings is world-readable; avoids per-request cookie plumbing
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  // Page through ALL rows. A single unbounded select is capped at 1000 by
  // PostgREST, which once the table grew past 1000 translated rows silently
  // dropped every later key back to its English fallback (whole-app Arabic
  // truncation, not screen-specific). Range-paginate on a stable key order so
  // the full dictionary always loads.
  const dict: Dict = {};
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb.from("ui_strings")
      .select("key, ar").not("ar", "is", null).order("key").range(from, from + PAGE - 1);
    if (error || !data || data.length === 0) break;
    for (const r of data) dict[r.key] = r.ar as string;
    if (data.length < PAGE) break;
  }
  cache = { at: Date.now(), dict };
  return dict;
}

/** tr(dict, 'nav.planning', 'Planning') — Arabic when known, English otherwise. */
export function tr(dict: Dict, key: string, en: string): string {
  return dict[key] ?? en;
}

/** Convenience for server components: locale + dict + bound t() in one call. */
export async function useT() {
  const locale = await getLocale();
  const dict = await getDict(locale);
  return { locale, dict, t: (key: string, en: string) => tr(dict, key, en), dir: locale === "ar" ? "rtl" : "ltr" as "rtl" | "ltr" };
}
