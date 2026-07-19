import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import EmptyState from "@/components/EmptyState";
import { IncidentReportForm } from "./IncidentReportForm";

// Incident Report record — Figma FNS-033 / J-12 ("رصد حادث" / "Report an
// Incident"), screen "Incident fields" (node 1068:123721). Additive route:
// records an incident observation into incident_reports (migration
// 20260720010000). Does NOT touch the Workspace / offline engine.
//
// Every label resolves through the already-seeded ui_strings keys
// figma.establishmentmanagement.em046..em059 (20260719000000 seed, DEC-H),
// each traceable to TRANSLATION_REVIEW_REGISTER.csv EM-046..EM-059.
export const dynamic = "force-dynamic";

export default async function IncidentReportsPage() {
  const { t } = await useT();
  const sb = await supabaseServer();

  // Read-back list is RLS-scoped; loads/empties/errors are handled explicitly.
  const { data: rows, error } = await sb
    .from("incident_reports")
    .select("id, establishment_code, incident_type, report_source, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) console.error("[incident-reports] load", error);

  return (
    <Shell
      current="/incident-reports"
      title={t("figma.establishmentmanagement.em029", "Report an Incident")}
      context={<span className="ax-lozenge ax-lozenge--info">FNS-033 · J-12</span>}
    >
      <div className="ax-banner">
        <div>
          <strong>{t("figma.establishmentmanagement.em028", "Incident Observation Details")}</strong>{" "}
          {t("incident.report.help", "Record a field incident observation. Report Source and Incident Type option lists are not yet defined, so they are captured as free text.")}
        </div>
      </div>

      <IncidentReportForm
        strings={{
          establishmentCode: t("figma.establishmentmanagement.em046", "Establishment Code"),                             // EM-046
          commercialRegistrationNumber: t("figma.establishmentmanagement.em047", "Commercial Registration Number"),      // EM-047
          reportSource: t("figma.establishmentmanagement.em048", "Report Source"),                                       // EM-048
          reporterName: t("figma.establishmentmanagement.em049", "Reporter Name"),                                       // EM-049
          reporterContactNumber: t("figma.establishmentmanagement.em050", "Reporter Contact Number"),                    // EM-050
          reportTime: t("figma.establishmentmanagement.em051", "Report Time"),                                           // EM-051
          numberOfCases: t("figma.establishmentmanagement.em052", "Number of Cases"),                                    // EM-052
          resultingDamage: t("figma.establishmentmanagement.em054", "Resulting Damage"),                                 // EM-054
          incidentType: t("figma.establishmentmanagement.em057", "Incident Type"),                                       // EM-057
          preliminaryIncidentDescription: t("figma.establishmentmanagement.em059", "Preliminary Incident Description"),  // EM-059
          // App-chrome copy below is UNCAPTURED for this screen (no incident-form
          // submit CTA or success toast exists in the register EM-046..EM-059).
          // English defaults only; not borrowed from a mismatched Figma node.
          submit: t("incident.report.submit", "Submit"),
          submitting: t("common.submitting", "Submitting…"),
          created: t("incident.report.created", "Incident report submitted."),
        }}
      />

      {error && (
        <div className="ax-banner ax-banner--critical" role="alert">
          <div><strong>{t("incident.report.error", "Couldn’t load incident reports. Nothing changed.")}</strong></div>
        </div>
      )}
      {!error && (rows ?? []).length === 0 && (
        <EmptyState
          glyph="⚠️"
          title={t("incident.report.empty.title", "No incident reports in scope")}
          body={t("incident.report.empty.body", "Recorded incidents appear here. Empty may also mean none are in your scope (RLS).")}
        />
      )}
      {(rows ?? []).map((r) => (
        <div key={r.id} className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <div className="ax-row" style={{ justifyContent: "space-between" }}>
            <h3>
              {r.establishment_code ?? "—"}{" "}
              <span className="ax-caption">{r.incident_type ?? ""}</span>
            </h3>
            <span className="ax-lozenge ax-lozenge--info">{r.report_source ?? "—"}</span>
          </div>
        </div>
      ))}
    </Shell>
  );
}
