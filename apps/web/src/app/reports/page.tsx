import Link from "next/link";
import { StateSurface } from "@/components/saqeel";
import { formatDate } from "@/lib/dates";
import { useT } from "@/lib/i18n";
import { supabaseServer } from "@/lib/supabase-server";
import { statusBadgeClass } from "./catalogue";

export const dynamic = "force-dynamic";

type InspectionRow = {
  id: string;
  inspection_no: string | null;
  status: string;
  started_at: string | null;
  visits: {
    factories: { name: string; factory_code: string | null } | null;
  } | null;
};

export default async function ReportsPage() {
  const { locale, t } = await useT();
  const sb = await supabaseServer();
  const { data, error } = await sb
    .from("inspections")
    .select("id, inspection_no, status, started_at, visits(factories(name, factory_code))")
    .order("started_at", { ascending: false, nullsFirst: false });
  const reports = (data as unknown as InspectionRow[] | null) ?? [];
  const date = (value: string | null) => value ? formatDate(value, locale) : "—";
  const label = (value: string) => t(`enum.${value}`, value.replaceAll("_", " "));

  return (
    <main className="sq-content" aria-labelledby="reports-title">
      <header className="page-header">
        <div>
          <h1 id="reports-title">{t("reports.title", "Reports")}</h1>
          <p className="desc">{t("reports.desc", "Governed inspection reports visible to your role and data scope.")}</p>
        </div>
        <div className="row">
          <span className={`badge ${error ? "badge-warning" : "badge-compliant"}`}>
            {error ? t("reports.source.degraded", "Source degraded") : t("reports.source.available", "Source available")}
          </span>
          <Link className="btn btn-secondary btn-sm" href="/analytics">{t("reports.analytics", "Analytics")}</Link>
          <Link className="btn btn-secondary btn-sm" href="/reviews">{t("reports.reviews", "Review queue")}</Link>
        </div>
      </header>

      {error ? (
        <StateSurface kind="degraded" locale={locale} body={t("reports.source.degraded.body", "Inspection reports could not be loaded. No records are inferred; other governed surfaces remain available.")} />
      ) : reports.length === 0 ? (
        <StateSurface kind="empty" locale={locale} title={t("reports.inspections.title", "Inspection reports")} body={t("reports.inspections.empty", "No inspection reports are visible in your scope.")} />
      ) : (
        <section aria-labelledby="inspection-reports-title">
          <h2 id="inspection-reports-title">{t("reports.inspections.title", "Inspection reports")}</h2>
          <p className="desc">{t("reports.inspections.desc", "Open the official inspection record and trace its status and source.")}</p>
          <div className="sq-tablewrap">
            <table className="sq-table">
              <thead><tr>
                <th scope="col">{t("reports.table.inspection", "Inspection")}</th>
                <th scope="col">{t("reports.table.establishment", "Establishment")}</th>
                <th scope="col">{t("reports.table.started", "Started")}</th>
                <th scope="col">{t("reports.table.status", "Status")}</th>
                <th scope="col">{t("reports.table.action", "Action")}</th>
              </tr></thead>
              <tbody>{reports.map(report => {
                const factory = report.visits?.factories;
                return <tr key={report.id}>
                  <td><bdi>{report.inspection_no ?? report.id.slice(0, 8)}</bdi></td>
                  <td>{factory?.name ?? "—"}{factory?.factory_code ? <div className="sq-caption"><bdi>{factory.factory_code}</bdi></div> : null}</td>
                  <td className="sq-numeric">{date(report.started_at)}</td>
                  <td><span className={`badge ${statusBadgeClass(report.status)}`}>{label(report.status)}</span></td>
                  <td><Link className="btn btn-ghost btn-sm" href={`/reports/inspection/${report.id}`}>{t("reports.open", "Open report")}</Link></td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
