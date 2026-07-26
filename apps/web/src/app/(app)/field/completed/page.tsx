import Link from "next/link";
import { redirect } from "next/navigation";
import FieldHeader from "@/components/field/FieldHeader";
import FieldNav from "@/components/field/FieldNav";
import CompletedHistoryCache from "@/components/field/CompletedHistoryCache";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import { latestSubmittedVersions, type CompletedHistoryRecord } from "@/lib/field/completed-history";
import styles from "./completed.module.css";

export const dynamic = "force-dynamic";

type AssignmentRow = {
  visits: {
    id: string;
    visit_type: string | null;
    factories: { name: string; factory_code: string | null } | null;
    inspections: Array<{
      id: string;
      status: string;
      submission_versions: Array<{
        id: string;
        version_number: number;
        snapshot: CompletedHistoryRecord["snapshot"];
        acknowledgement: CompletedHistoryRecord["acknowledgement"];
        submitted_at: string;
        submitted_by: string;
      }>;
    }> | null;
  } | null;
};

export default async function CompletedInspectionsPage() {
  const sb = await supabaseServer();
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login");

  // Assignment ownership is explicit in addition to table RLS. Only immutable
  // submission_versions are projected; inspection live response/evidence rows
  // are deliberately excluded from history.
  const read = await sb.from("assignments")
    .select("visits(id, visit_type, factories(name, factory_code), inspections(id, status, submission_versions(id, version_number, snapshot, acknowledgement, submitted_at, submitted_by)))")
    .eq("inspector_id", user.id)
    .order("created_at", { ascending: false });

  if (read.error) console.error("[field completed history]", read.error.message);
  const flattened: CompletedHistoryRecord[] = ((read.data ?? []) as unknown as AssignmentRow[]).flatMap(assignment => {
    const visit = assignment.visits;
    if (!visit?.factories) return [];
    return (visit.inspections ?? []).flatMap(inspection =>
      (inspection.submission_versions ?? []).map(version => ({
        inspectionId: inspection.id,
        visitId: visit.id,
        factoryName: visit.factories!.name,
        factoryCode: visit.factories!.factory_code,
        visitType: visit.visit_type,
        status: inspection.status,
        versionId: version.id,
        versionNumber: version.version_number,
        submittedAt: version.submitted_at,
        submittedBy: version.submitted_by,
        snapshot: version.snapshot ?? {},
        acknowledgement: version.acknowledgement,
      })));
  });
  const records = latestSubmittedVersions(flattened);
  const langHref = locale === "ar" ? "/locale?set=en" : "/locale?set=ar";

  return (
    <>
      <FieldHeader
        leading={<Link href="/field" prefetch={false} className="btn btn-icon btn-ghost" aria-label={tr("common.back", "Back", "رجوع")}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" data-directional><path d="m15 18-6-6 6-6" /></svg></Link>}
        title={tr("field.completed.title", "Completed inspections", "عمليات التفتيش المكتملة")}
        subtitle={tr("field.completed.subtitle", "Immutable submission history", "سجل التسليمات غير القابل للتعديل")}
        langHref={langHref}
        langLabel={locale === "ar" ? "EN" : "AR"}
      />
      <main className={styles.page}>
        <div className={styles.locked} role="status">
          <span aria-hidden="true">🔒</span>
          <span>{tr("field.completed.locked", "Submitted records are locked. Corrections require a governed return and a new version.", "السجلات المقدمة مقفلة. تتطلب التصحيحات إعادة محكومة وإصداراً جديداً.")}</span>
        </div>
        <CompletedHistoryCache
          userId={user.id}
          records={records}
          liveReadFailed={!!read.error}
          locale={locale}
          labels={{
            cached: tr("field.completed.cached", "Offline copy — read-only. Connect to refresh.", "نسخة دون اتصال — للقراءة فقط. اتصل للتحديث."),
            empty: tr("field.completed.empty", "No completed inspections yet", "لا توجد عمليات تفتيش مكتملة بعد"),
            unavailable: tr("field.completed.unavailable", "Completed history is unavailable and no safe cached copy exists.", "سجل العمليات المكتملة غير متاح ولا توجد نسخة مخبأة آمنة."),
            version: tr("field.completed.version", "Version", "الإصدار"),
            submitted: tr("field.completed.submitted", "Submitted", "تم التسليم"),
            findings: tr("field.completed.findings", "Findings", "النتائج"),
            evidence: tr("field.completed.evidence", "Evidence", "الأدلة"),
            open: tr("field.completed.open", "View receipt", "عرض الإيصال"),
          }}
        />
      </main>
      <div aria-hidden="true" style={{ height: 58, flex: "none" }} />
      <FieldNav active="home" labels={{
        home: tr("field.tabs.home", "Home", "الرئيسية"),
        myTasks: tr("field.tabs.myTasks", "My Tasks", "مهامي"),
        establishments: tr("field.tabs.establishments", "Establishments", "المنشآت"),
        notifications: tr("field.tabs.notifications", "Notifications", "الإشعارات"),
        account: tr("field.tabs.account", "Account", "الحساب"),
      }} />
    </>
  );
}
