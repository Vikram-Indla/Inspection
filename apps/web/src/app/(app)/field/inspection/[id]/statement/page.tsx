import Link from "next/link";
import { redirect } from "next/navigation";
import FieldHeader from "@/components/field/FieldHeader";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import styles from "../workspace.module.css";

export default async function VisitStatement({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => locale === "ar" ? ar : t(key, en);
  const sb = await supabaseServer();
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login");

  const [{ data: inspection }, { data: profile }] = await Promise.all([
    sb.from("inspections")
      .select("id, status, started_at, visit_id, submission_versions(version_number, submitted_at), visits(visit_type, notes, factories(name))")
      .eq("id", id)
      .maybeSingle(),
    sb.from("profiles").select("full_name").eq("user_id", user.id).maybeSingle(),
  ]);
  if (!inspection) redirect("/field/my-tasks");
  if (inspection.status !== "submitted") redirect(`/field/inspection/${id}`);

  const visit = inspection.visits as unknown as {
    visit_type: string;
    notes: string | null;
    factories: { name: string } | null;
  } | null;
  const versions = inspection.submission_versions as unknown as { version_number: number; submitted_at: string }[];
  const latest = [...(versions ?? [])].sort((a, b) => b.version_number - a.version_number)[0];
  const submittedAt = latest?.submitted_at ?? inspection.started_at;
  const back = (
    <Link href={`/field/inspection/${id}`} prefetch={false} className="btn btn-icon btn-ghost"
      aria-label={tr("common.back", "Back", "رجوع")}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" data-directional>
        <path d="m15 18-6-6 6-6" />
      </svg>
    </Link>
  );

  const rows = [
    [tr("field.statement.visitDate", "Visit date", "تاريخ الزيارة"), submittedAt ? submittedAt.slice(0, 10) : tr("common.notConfigured", "N/A", "لا ينطبق")],
    [tr("field.statement.visitor", "Visitor name", "اسم الزائر"), profile?.full_name ?? tr("common.notConfigured", "N/A", "لا ينطبق")],
    [tr("field.statement.reason", "Visit reason", "سبب الزيارة"), visit?.visit_type ? t(`enum.${visit.visit_type}`, visit.visit_type.replace(/_/g, " ")) : tr("common.notConfigured", "N/A", "لا ينطبق")],
    [tr("field.statement.notes", "Notes", "ملاحظات"), visit?.notes || tr("common.notConfigured", "N/A", "لا ينطبق")],
    [tr("field.statement.actions", "Actions", "الإجراءات"), tr("common.notConfigured", "N/A", "لا ينطبق")],
    [tr("field.statement.attachments", "Attachments", "المرفقات"), tr("common.notConfigured", "N/A", "لا ينطبق")],
  ];

  return (
    <>
      <FieldHeader
        leading={back}
        title={tr("field.statement.title", "Visit Statement report", "تقرير إفادة الزيارة")}
        subtitle={<>{visit?.factories?.name ?? "—"} · <span className="id-code">{id.slice(0, 8)}</span></>}
        langHref={locale === "ar" ? "/locale?set=en" : "/locale?set=ar"}
        langLabel={locale === "ar" ? "EN" : "AR"}
      />
      <main className={`${styles.page} ${styles.statementPage}`} data-screen-id="EXE-S17">
        <div className="alert alert-immutable" role="status">
          <div>
            <strong>{tr("field.statement.final", "Final version — not editable.", "النسخة النهائية غير قابلة للتعديل.")}</strong>{" "}
            {tr("field.statement.returnOnly", "Corrections require a reviewer return; this statement has no editing controls.", "يتطلب التصحيح إرجاعاً من المراجع؛ ولا تتضمن هذه الإفادة أدوات تعديل.")}
          </div>
        </div>
        <section className={styles.card}>
          <div className={styles.statementHead}>
            <h2>{tr("field.statement.data", "Statement data", "بيانات الإفادة")}</h2>
            <span className="badge badge-compliant">
              {tr("field.statement.retrieved", "Retrieved", "مُسترجع")}
            </span>
          </div>
          <dl className={styles.statementGrid}>
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <div className={styles.completionFooter}>
          <span className="badge badge-compliant">
            <span className="dot" />
            {tr("field.statement.locked", "Submitted (locked)", "مُرسَل (مقفل)")}
          </span>
          <Link className="btn btn-primary" href={`/field/inspection/${id}`}>
            {tr("field.statement.completion", "Back to completion", "العودة إلى الإنهاء")}
          </Link>
        </div>
      </main>
    </>
  );
}
