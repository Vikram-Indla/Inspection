import Link from "next/link";
import { redirect } from "next/navigation";
import FieldHeader from "@/components/field/FieldHeader";
import { formatDate } from "@/lib/dates";
import { useT } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import styles from "./reports.module.css";

// CR-327 / WA-AC-0327, CR-328 / WA-AC-0328, CR-334 / WA-AC-0334:
// submitted inspection history is a read-only surface over the same immutable
// submission_versions consumed by the canonical official report reader.
// The 24 clean factories. The database holds 1,964 rows, the rest being legacy
// and clutter that must never surface in the field channel.
// Verified against the live factories table: this is exactly the set matching
// ^F-[0-9]{4}$ — 24 of 1,964. Listed explicitly rather than by pattern so a
// future legacy row that happens to match the shape cannot leak in.
// An earlier revision of this list held only 12 codes, which silently hid half
// of an inspector's own submitted reports.
const CLEAN_FACTORY_CODES = [
  "F-1101", "F-1102", "F-1103", "F-1104", "F-1105",
  "F-2201", "F-2202", "F-2203", "F-2204",
  "F-2214", "F-2215", "F-2216", "F-2217",
  "F-3301", "F-3302", "F-3303", "F-3304", "F-3305",
  "F-4401", "F-4402",
  "F-5501", "F-5502",
  "F-6601", "F-6602",
] as const;

type Submission = {
  id: string;
  version_number: number;
  submitted_at: string;
  acknowledgement: { name?: string; signed?: boolean; signed_at?: string; signature_data_url?: string } | null;
  profiles: { full_name: string } | null;
};
type Visit = {
  id: string;
  visit_type: string;
  factories: { name: string; factory_code: string | null } | null;
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
    .select("visit_id, visits(id, visit_type, factories(name, factory_code), inspections(id, status, submission_versions(id, version_number, submitted_at, acknowledgement, profiles(full_name))))")
    .eq("inspector_id", user.id)
    .order("created_at", { ascending: false });

  if (error) console.error("[field reports] load", error.message);

  const reports = (data ?? [])
    .map(row => row.visits as unknown as Visit | null)
    .filter((visit): visit is Visit => Boolean(visit?.factories && visit.inspections))
    .filter(visit => CLEAN_FACTORY_CODES.includes(visit.factories!.factory_code as typeof CLEAN_FACTORY_CODES[number]))
    .flatMap(visit => {
      const versions = [...(visit.inspections!.submission_versions ?? [])]
        .sort((a, b) => b.version_number - a.version_number);
      const latest = versions[0];
      return latest ? [{ visit, latest, versionCount: versions.length }] : [];
    })
    .sort((a, b) => b.latest.submitted_at.localeCompare(a.latest.submitted_at));

  const lang = locale === "ar" ? "ar" : "en";
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
          <div className="alert alert-critical" role="alert">
            {tr("field.reports.error", "Reports are temporarily unavailable. Nothing was changed. Try again.", "التقارير غير متاحة مؤقتًا. لم يتم تغيير أي شيء. حاول مرة أخرى.")}
          </div>
        ) : reports.length === 0 ? (
          <div className={styles.empty} role="status">
            <strong>{tr("field.reports.emptyTitle", "No submitted reports", "لا توجد تقارير مقدمة")}</strong>
            <span>{tr("field.reports.emptyBody", "A report appears here only after an immutable submission exists.", "يظهر التقرير هنا فقط بعد وجود نسخة مقدمة غير قابلة للتغيير.")}</span>
          </div>
        ) : (
          <section className={styles.card} aria-label={tr("field.reports.list", "Submitted reports", "التقارير المقدمة")}>
            {reports.map(({ visit, latest, versionCount }) => {
              const acknowledged = Boolean(
                latest.acknowledgement?.signed ||
                latest.acknowledgement?.signed_at ||
                latest.acknowledgement?.signature_data_url,
              );
              return (
                <Link key={visit.inspections!.id} className={styles.row}
                  href={`/field/reports/${visit.inspections!.id}`} prefetch={false}>
                  <span className={styles.icon} aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M8 2h6l4 4v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
                      <path d="M14 2v4h4" />
                    </svg>
                  </span>
                  <span className={styles.copy}>
                    <strong>{visit.factories!.name}</strong>
                    <span>
                      <bdi>{visit.factories!.factory_code}</bdi>
                      {" · "}
                      {formatDate(latest.submitted_at, lang)}
                      {" · "}
                      {tr("field.reports.version", "Version", "الإصدار")} <bdi>{latest.version_number}</bdi>
                      {versionCount > 1 ? ` / ${versionCount}` : ""}
                    </span>
                    {latest.profiles?.full_name ? <span>{latest.profiles.full_name}</span> : null}
                  </span>
                  <span className={`badge ${acknowledged ? "badge-completed" : "badge-warning"}`}>
                    {acknowledged
                      ? tr("field.reports.signed", "Signed", "موقّع")
                      : tr("field.reports.submittedBadge", "Submitted", "مقدم")}
                  </span>
                  <span className={styles.open}>
                    {tr("field.reports.open", "Open document", "عرض المستند")}
                    <span aria-hidden="true">›</span>
                  </span>
                </Link>
              );
            })}
          </section>
        )}
      </main>
      <div aria-hidden="true" className={styles.navSpace} />
    </>
  );
}
