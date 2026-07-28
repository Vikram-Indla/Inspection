import Link from "next/link";
import { redirect } from "next/navigation";
import FieldHeader from "@/components/field/FieldHeader";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import { completionReference, summarizeSnapshot, type CompletedHistoryRecord } from "@/lib/field/completed-history";
import styles from "../completed.module.css";

export const dynamic = "force-dynamic";

export default async function CompletedInspectionDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await supabaseServer();
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login");

  // The assignment join makes ownership part of the query contract; RLS is
  // still authoritative. The view is backed solely by the latest immutable
  // version and never falls through to mutable live response/evidence tables.
  const read = await sb.from("assignments")
    .select("visits(id, visit_type, factories(name, factory_code), inspections!inner(id, status, submission_versions!inner(id, version_number, snapshot, acknowledgement, submitted_at, submitted_by)))")
    .eq("inspector_id", user.id)
    .eq("visits.inspections.id", id)
    .maybeSingle();
  const visit = read.data?.visits as unknown as {
    id: string;
    visit_type: string | null;
    factories: { name: string; factory_code: string | null } | null;
    inspections: Array<{
      id: string;
      status: string;
      submission_versions: Array<{
        id: string; version_number: number; snapshot: CompletedHistoryRecord["snapshot"];
        acknowledgement: CompletedHistoryRecord["acknowledgement"]; submitted_at: string; submitted_by: string;
      }>;
    }>;
  } | null;
  const inspection = visit?.inspections?.find(row => row.id === id);
  const version = [...(inspection?.submission_versions ?? [])].sort((a, b) => b.version_number - a.version_number)[0];
  const back = <Link href="/field/completed" prefetch={false} className="btn btn-icon btn-ghost" aria-label={tr("common.back", "Back", "رجوع")}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" data-directional><path d="m15 18-6-6 6-6" /></svg></Link>;
  const langHref = locale === "ar" ? "/locale?set=en" : "/locale?set=ar";

  if (read.error || !visit?.factories || !inspection || !version) {
    return (
      <>
        <FieldHeader leading={back} title={tr("field.completed.notFound", "Receipt unavailable", "الإيصال غير متاح")} langHref={langHref} langLabel={locale === "ar" ? "EN" : "AR"} />
        <main className={styles.page}><div className="alert alert-critical" role="alert">{tr("field.completed.integrity", "This inspection is unavailable, outside your assignment scope, or has no immutable submitted version. No mutable record was substituted.", "عملية التفتيش غير متاحة أو خارج نطاق إسنادك أو لا تحتوي على إصدار مُقدّم غير قابل للتعديل. لم يتم استبدالها بسجل قابل للتعديل.")}</div></main>
      </>
    );
  }

  const record: CompletedHistoryRecord = {
    inspectionId: inspection.id, visitId: visit.id, factoryName: visit.factories.name,
    factoryCode: visit.factories.factory_code, visitType: visit.visit_type, status: inspection.status,
    versionId: version.id, versionNumber: version.version_number, submittedAt: version.submitted_at,
    submittedBy: version.submitted_by, snapshot: version.snapshot ?? {}, acknowledgement: version.acknowledgement,
  };
  const summary = summarizeSnapshot(record.snapshot);
  const dt = (value?: string) => value ? new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh" }).format(new Date(value)) : "—";
  const violations = record.snapshot.violations ?? [];
  const evidence = record.snapshot.evidence?.manifest ?? [];

  return (
    <>
      <FieldHeader leading={back} title={tr("field.completed.receipt", "Completion receipt", "إيصال الإكمال")} subtitle={completionReference(record)} langHref={langHref} langLabel={locale === "ar" ? "EN" : "AR"} />
      <main className={styles.page}>
        <div className={styles.locked} role="status"><span aria-hidden="true">🔒</span><strong>{tr("field.completed.readOnly", "Locked immutable version — read-only", "إصدار مقفل غير قابل للتعديل — للقراءة فقط")}</strong></div>
        <section className="card" style={{ padding: 16 }}>
          <h1 style={{ margin: 0, fontSize: 19 }}><bdi>{record.factoryName}</bdi></h1>
          <dl style={{ display: "grid", gridTemplateColumns: "minmax(130px, .7fr) 1fr", gap: "9px 14px", marginBlockEnd: 0 }}>
            <dt className="t-caption">{tr("field.completed.reference", "Completion reference", "مرجع الإكمال")}</dt><dd className="id-code" style={{ margin: 0 }}>{completionReference(record)}</dd>
            <dt className="t-caption">{tr("field.completed.version", "Version", "الإصدار")}</dt><dd style={{ margin: 0 }}>v{record.versionNumber}</dd>
            <dt className="t-caption">{tr("field.completed.submitted", "Submitted", "تم التسليم")}</dt><dd className="id-code" style={{ margin: 0 }}>{dt(record.submittedAt)}</dd>
            <dt className="t-caption">{tr("field.completed.signed", "Acknowledged / signed", "الإقرار / التوقيع")}</dt><dd className="id-code" style={{ margin: 0 }}>{dt(record.acknowledgement?.signed_at ?? record.acknowledgement?.ts)}</dd>
          </dl>
        </section>
        <section className="card" style={{ padding: 16 }}>
          <h2 style={{ marginBlockStart: 0, fontSize: 16 }}>{tr("field.completed.summary", "Read-only summary", "ملخص للقراءة فقط")}</h2>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            <span>{tr("field.completed.answered", "Answered", "المجاب")}: <strong>{summary.answered}</strong></span>
            <span>{tr("field.completed.findings", "Findings", "النتائج")}: <strong>{summary.findings}</strong></span>
            <span>{tr("field.completed.evidence", "Evidence", "الأدلة")}: <strong>{summary.evidence}</strong></span>
          </div>
        </section>
        <section className="card" style={{ padding: 16 }}>
          <h2 style={{ marginBlockStart: 0, fontSize: 16 }}>{tr("field.completed.findingsEvidence", "Findings and evidence", "النتائج والأدلة")}</h2>
          {violations.length ? <ul>{violations.map((item, index) => <li key={`${item.code ?? "finding"}-${index}`}><strong>{item.code ?? tr("field.completed.finding", "Finding", "نتيجة")}</strong>{item.title ? ` — ${item.title}` : ""}{item.level ? ` · ${item.level}` : ""}</li>)}</ul> : <p className="t-caption">{tr("field.completed.noFindings", "No findings recorded in this submitted snapshot.", "لا توجد نتائج مسجلة في لقطة التسليم هذه.")}</p>}
          {evidence.length ? <ul>{evidence.map((item, index) => <li key={`${item.id ?? "evidence"}-${index}`}><bdi>{item.name ?? item.type ?? tr("field.completed.evidenceItem", "Evidence item", "عنصر دليل")}</bdi>{item.captured_at ? ` · ${dt(item.captured_at)}` : ""}{item.sha256 ? <div className="t-caption id-code">SHA-256 {item.sha256}</div> : null}</li>)}</ul> : <p className="t-caption">{tr("field.completed.noEvidenceManifest", "No evidence manifest entries are present in this submitted snapshot.", "لا توجد عناصر بيان أدلة في لقطة التسليم هذه.")}</p>}
        </section>
        <p className="t-caption">{tr("field.completed.lineage", "immutable submission snapshot", "لقطة تسليم غير قابلة للتعديل")}</p>
      </main>
    </>
  );
}
