import Link from "next/link";
import { redirect } from "next/navigation";
import FieldHeader from "@/components/field/FieldHeader";
import { useT } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import ConflictResolutionClient, { type ConflictStrings } from "./ConflictResolutionClient";

// SAQEEL Field Conflict Resolution.dc.html — surfaces the REAL offline
// `conflicts` IndexedDB store (lib/offline.ts) as a per-record local-vs-server
// compare-and-choose UI. Chrome ported from the design (back-arrow header, no
// bottom nav). No fabricated conflicts, no direct server mutation: every choice
// runs through the existing offline store (resolveConflict / enqueue) only.
export default async function FieldConflictsPage() {
  const [sb, { t, locale }] = await Promise.all([supabaseServer(), useT()]);
  const { data: { user }, error } = await getVerifiedUser(sb);
  if (error || !user) redirect("/login");
  const tr = (key: string, en: string, ar: string) => (locale === "ar" ? ar : t(key, en));

  const backBtn = (
    <Link href="/field/settings" prefetch={false} className="btn btn-icon btn-ghost" aria-label={tr("common.back", "Back", "رجوع")}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" data-directional><path d="M15 6l-6 6 6 6" /></svg>
    </Link>
  );

  const strings: ConflictStrings = {
    intro: tr(
      "field.conflicts.intro",
      "This only happens when a locally-saved checklist-item response syncs while someone else updated the same item on the server after your last local copy. Nothing is overwritten without your decision.",
      "يحدث هذا فقط عندما تُزامَن إجابة بند تفتيش محفوظة محلياً بينما حدّث طرف آخر نفس البند على الخادم بعد آخر نسخة محلية لديك. لا يتم استبدال أي بيانات دون قرارك.",
    ),
    pending: tr("field.conflicts.pending", "pending", "قيد الحل"),
    itemLabel: tr("field.conflicts.item", "Checklist item", "بند التفتيش"),
    detected: tr("field.conflicts.detected", "Detected", "اكتُشف"),
    key: tr("field.conflicts.key", "Key", "المفتاح"),
    localValue: tr("field.conflicts.local", "Your Local Response", "إجابتك المحلية"),
    serverValue: tr("field.conflicts.server", "Current Server Value", "قيمة الخادم الحالية"),
    keepServer: tr("field.conflicts.keepServer", "Keep server", "إبقاء قيمة الخادم"),
    keepServerHint: tr("field.conflicts.keepServerHint", "discard my response", "تجاهل إجابتي"),
    keepMine: tr("field.conflicts.keepMine", "Keep mine", "إبقاء إجابتي"),
    keepMineHint: tr("field.conflicts.keepMineHint", "re-queue my response", "إعادة إرسال إجابتي"),
    applicable: tr("field.conflicts.field.applicable", "Applicable", "قابل للتطبيق"),
    compliant: tr("field.conflicts.field.compliant", "Compliant", "مطابق"),
    notes: tr("field.conflicts.field.notes", "Notes", "الملاحظات"),
    yes: tr("common.yes", "Yes", "نعم"),
    no: tr("common.no", "No", "لا"),
    none: tr("common.none", "None", "لا يوجد"),
    empty: tr("field.conflicts.empty", "No conflicts", "لا توجد تعارضات"),
    emptySub: tr("field.conflicts.emptySub", "All changes reconciled — no conflicts.", "تمت تسوية جميع التغييرات — لا توجد تعارضات."),
    resolving: tr("field.conflicts.resolving", "Resolving…", "جارٍ الحل…"),
    resolveFailed: tr("field.conflicts.resolveFailed", "Could not resolve — try again.", "تعذّر الحل — حاول مرة أخرى."),
    groundingNote: tr(
      "field.conflicts.grounding",
      "Backed by the real offline conflicts store. “Keep mine” re-queues your local response through the existing outbox so it wins on next sync; “Keep server” discards your local copy. Neither mutates server state directly.",
      "مبني على مخزن التعارضات الفعلي بدون اتصال. «إبقاء إجابتي» يعيد إدراج إجابتك المحلية في قائمة الانتظار الحالية لتفوز عند المزامنة التالية؛ «إبقاء قيمة الخادم» يتجاهل نسختك المحلية. لا يغيّر أيٌّ منهما حالة الخادم مباشرةً.",
    ),
  };

  return (
    <>
      <FieldHeader
        leading={backBtn}
        title={tr("field.conflicts.title", "Sync Conflict Resolution", "حل تعارضات المزامنة")}
        langHref={locale === "ar" ? "/locale?set=en" : "/locale?set=ar"}
        langLabel={locale === "ar" ? "EN" : "AR"}
        themeLabels={{
          toLight: tr("field.theme.toLight", "Light mode", "الوضع الفاتح"),
          toDark: tr("field.theme.toDark", "Dark mode", "الوضع الداكن"),
        }}
      />
      <ConflictResolutionClient locale={locale} userId={user.id} strings={strings} />
    </>
  );
}
