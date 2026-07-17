import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";
import { NotYetBoundary } from "@/components/NotYetBoundary";

// TASK-MVP2-M2-10-CASE-SPINE-001 · MVP2-REQ-0114..0119 · CD-046 (case_spine_v1).
export const dynamic = "force-dynamic";
const MODES = ["off", "on"] as const;

export default async function CasesPage() {
  const { t } = await useT();
  if (resolveFeatureFlag(process.env.FEATURE_CASE_SPINE, MODES, "off") !== "on") {
    return (
      <Shell current="/cases" title={t("cases.title", "Cases")} context={<span className="ax-lozenge ax-lozenge--warning">CD-046 · REQ-0114</span>}>
        <NotYetBoundary title={t("cases.title", "Cases")} consequence={t("cases.off", "The correction/reinspection/appeal case spine is not enabled here.")}
          seam="FEATURE_CASE_SPINE=off" notAvailableLabel={t("tasks.notYet", "Not available yet")} detailLabel={t("common.whyPrereq", "Why / prerequisites")} />
      </Shell>
    );
  }
  const sb = await supabaseServer();
  const { data: rows, error } = await sb.from("cases")
    .select("id, case_type, status, origin_type, opened_at").order("opened_at", { ascending: false });
  if (error) console.error("[cases] load", error);
  return (
    <Shell current="/cases" title={t("cases.title", "Cases")} context={<span className="ax-lozenge ax-lozenge--info">CD-046 · REQ-0114..0119</span>}>
      <div className="ax-banner"><div><strong>{t("cases.banner.title", "Correction / reinspection / appeal.")}</strong> {t("cases.banner.body", "One open case per origin object is enforced by the database. You see only cases in your scope (RLS).")}</div></div>
      {error && <div className="ax-banner ax-banner--critical" role="alert"><div><strong>{t("cases.error", "Couldn’t load cases. Nothing changed.")}</strong></div></div>}
      {!error && (rows ?? []).length === 0 && (
        <div className="ax-surface"><div className="ax-state"><span className="ax-state__glyph">🗂️</span>
          <h4>{t("cases.empty.title", "No cases in your scope")}</h4>
          <p className="ax-caption">{t("cases.empty.body", "Cases open from a review, violation or inspection. Empty may also mean none are in your scope (RLS).")}</p></div></div>
      )}
      {(rows ?? []).map((c) => (
        <div key={c.id} className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <div className="ax-row" style={{ justifyContent: "space-between" }}>
            <h3>{c.case_type} <span className="ax-caption">· {c.origin_type ?? "—"}</span></h3>
            <span className="ax-lozenge ax-lozenge--info">{c.status}</span>
          </div>
        </div>
      ))}
    </Shell>
  );
}
