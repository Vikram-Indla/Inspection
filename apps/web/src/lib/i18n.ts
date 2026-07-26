// Localization runtime (SB19 · Arabic scope) — server-first, cookie-driven.
// English lives in code as the source string; Arabic comes from ui_strings
// (managed in /admin/localization). Missing Arabic falls back to English so
// the app never breaks while translation review is in flight.
import { cookies, headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";

export type Locale = "en" | "ar";
export type Dict = Record<string, string>;

// MVP3 additive control-plane copy remains available in Arabic even before the
// governed ui_strings catalogue is promoted in a target environment. Live
// catalogue values still override these reviewed fallbacks.
const MVP3_AR_FALLBACK: Dict = {
  "mvp3.schema.pending": "لم يُطبّق عقد قاعدة بيانات MVP3 في هذه البيئة. لا يتم استنتاج أي بيانات.",
  "mvp3.integrations.title": "وحدة تحكم موثوقية التكامل",
  "mvp3.integrations.truth": "التهيئة لا تعني الاتصال.",
  "mvp3.integrations.truthBody": "لا تصبح نقطة التكامل مهيأة إلا بعقد معتمد وعنوان تشغيل. لا تُعرض الأسرار هنا مطلقاً.",
  "mvp3.integrations.registry": "سجل نقاط التكامل المحكوم",
  "mvp3.integrations.registryHelp": "إصدار العقد وحالة التشغيل وحقيقة التبعية — دون مواد سرية.",
  "mvp3.integrations.empty": "لا توجد نقاط تكامل مسجلة. هذه قراءة فارغة تم التحقق منها.",
  "mvp3.integrations.events": "أحداث واجهة البرمجة والقواعد",
  "mvp3.integrations.eventsHelp": "نتائج غير قابلة للتعديل مرتبطة بمعرّف الترابط.",
  "mvp3.integrations.noEvents": "لا توجد أحداث مرئية وفق سياسات الوصول.",
  "mvp3.integrations.exports": "صادرات مشاركة البيانات",
  "mvp3.integrations.exportsHelp": "الحالة «مُعدّ» لا تعني «تم التسليم». يتطلب التسليم بصمة للعنصر وإيصالاً.",
  "mvp3.integrations.noExports": "لا توجد وظائف تصدير مرئية وفق سياسات الوصول.",
  "mvp3.operations.title": "عمليات المنصة والمرونة",
  "mvp3.operations.endpoints": "عقود نقاط التكامل",
  "mvp3.operations.configured": "مهيأة",
  "mvp3.operations.openErrors": "سجلات الأخطاء المفتوحة",
  "mvp3.operations.noThroughput": "لا يُستنتج من هذا العدد أي ادعاء عن معدل المعالجة.",
  "mvp3.operations.publishedFlags": "إصدارات مؤشرات الميزات المنشورة",
  "mvp3.operations.sod": "فصل مهام المُنشئ والمراجع مفروض.",
  "mvp3.operations.errors": "قائمة انتظار الأخطاء",
  "mvp3.operations.attempts": "المحاولات",
  "mvp3.operations.retry": "طلب إعادة محاولة متكررة آمنة",
  "mvp3.operations.noErrors": "لا توجد سجلات أخطاء مرئية وفق سياسات الوصول. هذا ليس تأكيداً لصحة المنصة.",
  "mvp3.operations.flags": "إصدارات مؤشرات الميزات",
  "mvp3.operations.value": "القيمة",
  "mvp3.operations.publish": "الموافقة والنشر",
  "mvp3.operations.noFlags": "لا توجد إصدارات لمؤشرات الميزات.",
  "mvp3.operations.policyHold": "تظل سياسات الاحتفاظ ووجهة النسخ الاحتياطي وأهداف الاستعادة معلّقة.",
  "mvp3.operations.policyHoldBody": "لا يُفعّل الحذف ولا يُدّعى نجاح الاستعادة حتى اعتماد القيم ووجود دليل تنفيذ.",
  "mvp3.security.title": "الوضع الأمني ومراجعة الوصول",
  "mvp3.security.boundary": "التنقل ليس تفويضاً.",
  "mvp3.security.boundaryBody": "تفرض منح قاعدة البيانات وسياسات RLS كل قراءة وإجراء. تعرض هذه الشاشة فقط النطاق المقروء للمستخدم المسجل.",
  "mvp3.security.roleHoldings": "إسنادات الأدوار المرئية وفق RLS",
  "mvp3.security.notPermission": "إسنادات الأدوار ليست دليلاً على الصلاحيات الفعلية.",
  "mvp3.security.openReviews": "المراجعات المفتوحة",
  "mvp3.security.overdue": "متأخرة",
  "mvp3.security.activeEvidence": "منح الأدلة النشطة",
  "mvp3.security.expiry": "لكل منحة غرض وتاريخ انتهاء.",
  "mvp3.security.reviews": "قائمة اعتماد الوصول",
  "mvp3.security.subject": "المستخدم محل المراجعة",
  "mvp3.security.scope": "النطاق والغرض",
  "mvp3.security.decision": "القرار",
  "mvp3.security.record": "تسجيل القرار",
  "mvp3.security.retain": "الإبقاء",
  "mvp3.security.revoke": "الإلغاء",
  "mvp3.security.noReviews": "لا توجد مراجعات وصول مرئية وفق سياسات الوصول.",
  "mvp3.security.grants": "منح الأدلة المرتبطة بالغرض",
  "mvp3.security.active": "نشطة",
  "mvp3.security.expired": "منتهية",
  "mvp3.security.revoked": "ملغاة",
  "mvp3.security.noGrants": "لا توجد منح أدلة مرئية وفق سياسات الوصول.",
  "mvp3.devices.title": "إدارة الأجهزة الموثوقة والعمل دون اتصال",
  "mvp3.devices.rule": "لا يجوز فتح حزم التفتيش الرسمية إلا على أجهزة موثوقة ومسجلة.",
  "mvp3.devices.ruleBody": "الأمر المدرج في قائمة الانتظار لا يعني اكتمال المسح؛ إقرار الجهاز حقيقة مستقلة.",
  "mvp3.devices.register": "سجل موثوقية الأجهزة",
  "mvp3.devices.trusted": "موثوقة",
  "mvp3.devices.device": "الجهاز",
  "mvp3.devices.assignee": "المفتش المعيّن",
  "mvp3.devices.lastSeen": "آخر ظهور",
  "mvp3.devices.command": "الأمر",
  "mvp3.devices.queue": "إدراج الأمر في قائمة الانتظار",
  "mvp3.devices.suspend": "تعليق",
  "mvp3.devices.resume": "استئناف",
  "mvp3.devices.expire": "إنهاء صلاحية الحزم",
  "mvp3.devices.wipe": "مسح عن بُعد",
  "mvp3.devices.empty": "لا توجد أجهزة مسجلة مرئية وفق سياسات الوصول.",
  "mvp3.devices.commands": "دليل الأوامر",
  "mvp3.devices.noCommands": "لا توجد أوامر مرئية وفق سياسات الوصول.",
  // Added by TASK-I18N-RTL-AUDIT-001 — DRAFT, not yet reviewed like the
  // entries above. See product-contract/evidence/TASK-I18N-RTL-AUDIT-001.md.
  "mvp3.devices.badge": "14 صفًا محكومًا",
  "mvp3.integrations.badge": "14 صفًا محكومًا",
  "mvp3.operations.badge": "عمليات مغلقة عند الفشل",
  "mvp3.security.badge": "وصول للأدلة مقيّد بالغرض",
  "mvp3.enforcement.badge": "حالات مرتبطة بالمصدر",
};

/**
 * Highest-priority language the browser actually asked for, by q-value.
 * `*` is a wildcard, not a preference, so it never decides the answer.
 */
function prefersArabic(acceptLanguage: string): boolean {
  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      const weight = q ? Number.parseFloat(q.split("=")[1]) : 1;
      return { tag: tag.trim().toLowerCase(), weight };
    })
    .filter((e) => e.tag && e.tag !== "*" && Number.isFinite(e.weight) && e.weight > 0)
    .sort((a, b) => b.weight - a.weight);
  const top = ranked[0];
  return !!top && (top.tag === "ar" || top.tag.startsWith("ar-"));
}

export async function getLocale(): Promise<Locale> {
  const c = await cookies();
  const chosen = c.get("locale")?.value;
  // An explicit choice on the AR/EN switch always wins and persists (1-year cookie).
  if (chosen === "en" || chosen === "ar") return chosen;
  // No choice made yet — follow the browser rather than forcing a language on it.
  // This previously returned "ar" for every non-"en" state, so a first load on an
  // English browser (or incognito, or a cleared cookie) was served Arabic.
  const accept = (await headers()).get("accept-language") ?? "";
  return prefersArabic(accept) ? "ar" : "en";
}

// Module-level cache: one dictionary fetch per server process per TTL window.
// /admin/localization saves bust it by calling revalidate on next read (TTL).
let cache: { at: number; dict: Dict } | null = null;
const TTL_MS = 30_000;

const PAGE = 1000; // PostgREST caps a single response at 1000 rows (db max-rows).

export async function getDict(locale: Locale): Promise<Dict> {
  if (locale === "en") return {};
  if (cache && Date.now() - cache.at < TTL_MS) return cache.dict;
  // Supabase env may be absent (fresh checkout with no .env.local, or a
  // partial-service environment). English is always a valid fallback and tr()
  // resolves every key to its English source string, so degrade gracefully to
  // the reviewed fallback rather than crashing the whole page render.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return MVP3_AR_FALLBACK;
  // anon client: ui_strings is world-readable; avoids per-request cookie plumbing
  const sb = createClient(supabaseUrl, supabaseAnonKey);
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
  const complete = { ...MVP3_AR_FALLBACK, ...dict };
  cache = { at: Date.now(), dict: complete };
  return complete;
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
