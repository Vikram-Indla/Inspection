import Link from "next/link";
import { redirect } from "next/navigation";
import FieldHeader from "@/components/field/FieldHeader";
import { useT } from "@/lib/i18n";
import type { CachedSubmittedReport } from "@/lib/offline";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import ReportsConnectivity from "./ReportsConnectivity";
import ReportsLibrary from "./ReportsLibrary";
import styles from "./reports.module.css";

// CR-327 / WA-AC-0327, CR-328 / WA-AC-0328, CR-334 / WA-AC-0334:
// submitted inspection history is a read-only surface over the same immutable
// submission_versions consumed by the canonical official report reader.
// Visibility is decided by assignments/submission_versions RLS. The library
// must not add a presentation-layer factory allowlist: doing so hides valid,
// assigned reports and is not an authorization control.

type Submission = {
  id: string;
  version_number: number;
  submitted_at: string;
  snapshot: unknown;
  acknowledgement: { name?: string; signed?: boolean; signed_at?: string; signature_data_url?: string } | null;
  profiles: { full_name: string } | null;
};
type Visit = {
  id: string;
  factories: { name: string | null; factory_code: string | null } | null;
  inspections: { id: string; status: string; submission_versions: Submission[] | null } | null;
};

export const dynamic = "force-dynamic";

export default async function FieldReportsPage() {
  const sb = await supabaseServer();
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login");

  const { data, error } = await sb.from("assignments")
    .select("visit_id, visits(id, visit_type, factories(name, factory_code), inspections(id, status, submission_versions(id, version_number, submitted_at, snapshot, acknowledgement, profiles(full_name))))")
    .eq("inspector_id", user.id)
    .order("created_at", { ascending: false });

  if (error) console.error("[field reports] load", error.message);

  const reports = (data ?? [])
    .map(row => row.visits as unknown as Visit | null)
    .filter((visit): visit is Visit => Boolean(visit?.factories && visit.inspections))
    .flatMap(visit => {
      const versions = [...(visit.inspections!.submission_versions ?? [])]
        .sort((a, b) => b.version_number - a.version_number);
      const latest = versions[0];
      return latest ? [{ visit, latest, versionCount: versions.length }] : [];
    })
    .sort((a, b) => b.latest.submitted_at.localeCompare(a.latest.submitted_at));

  const lang = locale === "ar" ? "ar" : "en";
  const cachedReports: CachedSubmittedReport[] = reports.map(({ visit, latest }) => ({
    schema: "saqeel-submitted-report-v1",
    inspectionId: visit.inspections!.id,
    submissionVersionId: latest.id,
    versionNumber: latest.version_number,
    submittedAt: latest.submitted_at,
    snapshot: latest.snapshot,
    acknowledgement: latest.acknowledgement,
    factoryName: visit.factories?.name ?? null,
    factoryCode: visit.factories?.factory_code ?? null,
    inspectorName: latest.profiles?.full_name ?? null,
    cachedAt: new Date().toISOString(),
  }));
  const langHref = locale === "ar" ? "/locale?set=en" : "/locale?set=ar";
  const back = (
    <Link href="/field" prefetch={false} className="btn btn-icon btn-ghost"
      aria-label={tr("common.back", "Back", "رجوع")}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" data-directional>
        <path d="m15 18-6-6 6-6" />
      </svg>
    </Link>
  );

  return (
    <>
      <FieldHeader
        leading={back}
        title={tr("field.reports.title", "Reports library", "مكتبة التقارير")}
        subtitle={tr("field.reports.subtitle", "Submitted inspection history", "سجل عمليات التفتيش المقدمة")}
        langHref={langHref}
        langLabel={locale === "ar" ? "EN" : "AR"}
      />
      <main className={styles.wrap}>
        <ReportsConnectivity
          offline={tr(
            "field.reports.offline",
            "Offline — showing submitted reports cached on this device. No submitted version can be changed here.",
            "غير متصل — يتم عرض التقارير المقدمة المحفوظة على هذا الجهاز. لا يمكن تغيير أي نسخة مقدمة هنا.",
          )}
          weak={tr(
            "field.reports.weak",
            "Connection is weak — this server-backed report list may take longer to refresh.",
            "الاتصال ضعيف — قد يستغرق تحديث قائمة التقارير المرتبطة بالخادم وقتًا أطول.",
          )}
        />
        {/* Reports Library draws a two-option segmented control (visit records /
            prior establishment visits). Only the submitted-history view is built,
            so this renders as a plain label: a role="tablist" holding one tab that
            controls no tabpanel announces "tab 1 of 1" and promises a switch that
            does not exist. */}
        <div className={styles.segment}>
          <span>{tr("field.reports.submitted", "Submitted reports", "التقارير المقدمة")}</span>
        </div>
        <p className={styles.hint}>
          {tr(
            "field.reports.hint",
            "Immutable reports from inspections assigned to you. Open a report to view its official submitted record.",
            "تقارير غير قابلة للتغيير لعمليات التفتيش المسندة إليك. افتح التقرير لعرض السجل الرسمي المقدم.",
          )}
        </p>

        {error ? (
          <>
            <div className="alert alert-critical" role="alert">
              {tr("field.reports.error", "The server report list is temporarily unavailable. Cached submitted reports remain available below.", "قائمة تقارير الخادم غير متاحة مؤقتًا. تظل التقارير المقدمة المحفوظة متاحة أدناه.")}
            </div>
            <ReportsLibrary userId={user.id} initialReports={[]} locale={lang} strings={{
              version: tr("field.reports.version", "Version", "الإصدار"),
              signed: tr("field.reports.signed", "Signed", "موقّع"),
              submitted: tr("field.reports.submittedBadge", "Submitted", "مقدم"),
              open: tr("field.reports.open", "Open document", "عرض المستند"),
              unavailableTitle: tr("field.reports.cacheMissingTitle", "Document unavailable offline", "المستند غير متاح دون اتصال"),
              unavailableBody: tr("field.reports.cacheMissingBody", "This submitted document is not cached on this device. Reconnect and open the reports library to cache it.", "هذا المستند المقدم غير محفوظ على هذا الجهاز. أعد الاتصال وافتح مكتبة التقارير لحفظه."),
              close: tr("common.close", "Close", "إغلاق"),
              documentTitle: tr("field.reports.documentTitle", "Submitted report", "التقرير المقدم"),
              submittedAt: tr("field.reports.submittedAt", "Submitted", "تاريخ التقديم"),
              inspector: tr("field.reports.inspector", "Inspector", "المفتش"),
              answers: tr("field.reports.answers", "Checklist responses", "إجابات قائمة التحقق"),
              notes: tr("field.reports.notes", "Inspector notes", "ملاحظات المفتش"),
              noValue: "—",
            }} />
          </>
        ) : reports.length === 0 ? (
          <div className={styles.empty} role="status">
            <strong>{tr("field.reports.emptyTitle", "No submitted reports", "لا توجد تقارير مقدمة")}</strong>
            <span>{tr("field.reports.emptyBody", "A report appears here only after an immutable submission exists.", "يظهر التقرير هنا فقط بعد وجود نسخة مقدمة غير قابلة للتغيير.")}</span>
          </div>
        ) : (
          <ReportsLibrary userId={user.id} initialReports={cachedReports} locale={lang} strings={{
            version: tr("field.reports.version", "Version", "الإصدار"),
            signed: tr("field.reports.signed", "Signed", "موقّع"),
            submitted: tr("field.reports.submittedBadge", "Submitted", "مقدم"),
            open: tr("field.reports.open", "Open document", "عرض المستند"),
            unavailableTitle: tr("field.reports.cacheMissingTitle", "Document unavailable offline", "المستند غير متاح دون اتصال"),
            unavailableBody: tr("field.reports.cacheMissingBody", "This submitted document is not cached on this device. Reconnect and open the reports library to cache it.", "هذا المستند المقدم غير محفوظ على هذا الجهاز. أعد الاتصال وافتح مكتبة التقارير لحفظه."),
            close: tr("common.close", "Close", "إغلاق"),
            documentTitle: tr("field.reports.documentTitle", "Submitted report", "التقرير المقدم"),
            submittedAt: tr("field.reports.submittedAt", "Submitted", "تاريخ التقديم"),
            inspector: tr("field.reports.inspector", "Inspector", "المفتش"),
            answers: tr("field.reports.answers", "Checklist responses", "إجابات قائمة التحقق"),
            notes: tr("field.reports.notes", "Inspector notes", "ملاحظات المفتش"),
            noValue: "—",
          }} />
        )}
      </main>
      <div aria-hidden="true" className={styles.navSpace} />
    </>
  );
}
