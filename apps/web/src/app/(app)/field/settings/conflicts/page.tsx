import Link from "next/link";
import { redirect } from "next/navigation";
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
    // Design copy verbatim (SAQEEL PWA-Field Conflict Resolution.dc.html): each
    // action states its consequence inline, so no second hint line is needed.
    keepServer: tr("field.conflicts.keepServer", "Keep Server Value (discard my response)", "إبقاء قيمة الخادم (تجاهل إجابتي)"),
    keepMine: tr("field.conflicts.keepMine", "Resubmit My Local Response", "إعادة إرسال إجابتي المحلية"),
    applicable: tr("field.conflicts.field.applicable", "Applicable", "قابل للتطبيق"),
    compliant: tr("field.conflicts.field.compliant", "Compliant", "مطابق"),
    notes: tr("field.conflicts.field.notes", "Notes", "الملاحظات"),
    yes: tr("common.yes", "Yes", "نعم"),
    no: tr("common.no", "No", "لا"),
    none: tr("common.none", "None", "لا يوجد"),
    empty: tr("field.conflicts.empty", "No conflicts", "لا توجد تعارضات"),
    emptySub: tr("field.conflicts.emptySub", "All checklist-item responses are in sync.", "جميع إجابات بنود التفتيش متزامنة."),
    resolving: tr("field.conflicts.resolving", "Resolving…", "جارٍ الحل…"),
    resolveFailed: tr("field.conflicts.resolveFailed", "Could not resolve — try again.", "تعذّر الحل — حاول مرة أخرى."),
    // Keeping the server value discards the inspector's own answer and is the
    // one branch with no domain write, so the decision record IS the resolution
    // (design policy note: the choice "is applied immediately and logged in the
    // decision record"). That record is a server-side append, so the choice
    // cannot be completed offline — said plainly rather than retried forever.
    resolveNeedsConnection: tr(
      "field.conflicts.resolveNeedsConnection",
      "Keeping the server value must be recorded in the decision record before your response is discarded. Reconnect and try again.",
      "يجب تسجيل خيار إبقاء قيمة الخادم ضمن سجل القرار قبل تجاهل إجابتك. أعد الاتصال ثم حاول مرة أخرى.",
    ),
    policyNote: tr(
      "field.conflicts.policy",
      "Resolution policy: the inspector is asked every time — no side wins automatically. Your choice (keep server value or resubmit your response) is applied immediately and logged in the decision record.",
      "سياسة الحل: يُسأل المفتش في كل مرة — لا يوجد فوز تلقائي لأي طرف. اختيارك (إبقاء قيمة الخادم أو إعادة إرسال إجابتك) يُنفَّذ فوراً ويُسجَّل ضمن سجل القرار.",
    ),
    groundingNote: tr(
      "field.conflicts.grounding",
      "Backed by the real offline conflicts store (mim-field-v1) — covers checklist-item response conflicts only.",
      "مبني على مخزن التعارضات الفعلي بدون اتصال (mim-field-v1) — يغطي تعارضات إجابات بنود التفتيش فقط.",
    ),
  };

  // The header is rendered by the client component so the design's pending-count
  // badge can carry the REAL conflict count, which only the client (IndexedDB)
  // knows. Its chrome — back control, title, language toggle — is still decided
  // here on the server and passed down.
  return (
    <ConflictResolutionClient
      locale={locale}
      userId={user.id}
      strings={strings}
      leading={backBtn}
      title={tr("field.conflicts.title", "Sync Conflict Resolution", "حل تعارضات المزامنة")}
      langHref={locale === "ar" ? "/locale?set=en" : "/locale?set=ar"}
      langLabel={locale === "ar" ? "EN" : "AR"}
    />
  );
}
