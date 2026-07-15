import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { logConfigurationReadFailure } from "@/lib/admin-configuration";
import { NewViolationForm, AddMappingForm, type ClauseOption, type VioStrings } from "./Controls";

export const dynamic = "force-dynamic";

export default async function Violations() {
  const { t } = await useT();
  const sb = await supabaseServer();
  const [{ data: codes, error }, { data: clauses, error: clauseError }] = await Promise.all([
    sb.from("violation_codes")
      .select("id, code, title, level, active_from, regulation_clauses(clause_ref, regulations(code)), penalty_mappings(penalty_ref, mapping_version, legal_basis, repeat_rule)")
      .order("code"),
    sb.from("regulation_clauses")
      .select("id, clause_ref, title, regulations(code)")
      .order("clause_ref"),
  ]);
  const clauseOptions: ClauseOption[] = (clauses ?? []).map(c => {
    const reg = c.regulations as unknown as { code: string } | null;
    return { id: c.id, label: `${reg?.code ?? "?"} §${c.clause_ref} — ${c.title ?? ""}` };
  });
  if (error) logConfigurationReadFailure("read violation codes", error);
  if (clauseError) logConfigurationReadFailure("read regulation clauses for violations", clauseError);
  const strings: VioStrings = {
    code: t("admin.viol.form.code", "Code"),
    title: t("admin.viol.form.title", "Title"),
    titlePlaceholder: t("admin.viol.form.titlePlaceholder", "Violation title"),
    level: t("admin.viol.form.level", "Level"),
    levelPlaceholder: t("admin.viol.form.levelPlaceholder", "Level…"),
    clause: t("admin.viol.form.clause", "Clause"),
    selectClause: t("admin.viol.form.selectClause", "Select clause…"),
    activeFrom: t("admin.viol.form.activeFrom", "Active from"),
    creating: t("admin.viol.form.creating", "Creating…"),
    create: t("admin.viol.form.create", "Create violation code"),
    created: t("admin.viol.form.created", "created"),
    penaltyRef: t("admin.viol.map.penaltyRef", "Penalty ref"),
    legalBasis: t("admin.viol.map.legalBasis", "Legal basis"),
    legalBasisPlaceholder: t("admin.viol.map.legalBasisPlaceholder", "SBC-801 §5.1 / M-43"),
    mappingVersion: t("admin.viol.map.mappingVersion", "Mapping version"),
    penaltyRange: t("admin.viol.map.penaltyRange", "Penalty range"),
    rangeApproved: t("admin.viol.map.rangeApproved", "Approved schedule"),
    rangeNone: t("admin.viol.map.rangeNone", "None"),
    repeatRule: t("admin.viol.map.repeatRule", "Repeat rule"),
    repeatEscalate: t("admin.viol.map.repeatEscalate", "Repeat in 12mo → escalate one level"),
    repeatNone: t("admin.viol.map.repeatNone", "None"),
    mapping: t("admin.viol.map.mapping", "Mapping…"),
    mapTo: t("admin.viol.map.mapTo", "Map penalty to"),
    mapped: t("admin.viol.map.done", "mapped"),
  };
  return (
    <Shell current="/admin" title={t("admin.viol.title", "Violation Catalogue & Penalty Mapping")}
      context={<span className="ax-lozenge ax-lozenge--info">SCR-ADM-040/041 · ENG-08</span>}>
      {(error || clauseError) && (
        <div className="ax-banner ax-banner--critical"><div>
          <strong>{t("admin.viol.error.title", "Couldn’t load the violation catalogue.")}</strong> {t("admin.viol.error.retry", "Try again.")}
        </div></div>
      )}
      <NewViolationForm clauses={clauseOptions} strings={strings} />
      {!error && (codes ?? []).length === 0 && (
        <div className="ax-surface"><div className="ax-state">
          <span className="ax-state__glyph">⚖️</span><h4>{t("admin.viol.empty.title", "No violation codes configured")}</h4>
          <p className="ax-caption">{t("admin.viol.empty.body", "Violations generate automatically from configured responses (M09-003).")}</p>
        </div></div>
      )}
      {(codes ?? []).map(v => {
        const rc = v.regulation_clauses as unknown as { clause_ref: string; regulations: { code: string } } | null;
        const pm = (v.penalty_mappings as unknown as { penalty_ref: string; mapping_version: string; legal_basis: string; repeat_rule: { repeat_12mo?: string } | null }[] | null)?.[0];
        return (
          <div key={v.id} className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
            <div className="ax-row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "var(--ax-space-150)" }}>
              <h3><span className="ax-numeric">{v.code}</span> — {v.title}</h3>
              <div className="ax-row" style={{ gap: "var(--ax-space-150)" }}>
                <span className={`ax-lozenge ${v.level === "L1" ? "ax-lozenge--critical" : "ax-lozenge--warning"}`}>{v.level}</span>
                {pm ? <span className="ax-lozenge ax-lozenge--success">{t("admin.viol.mapped", "mapped")}</span> : <span className="ax-lozenge ax-lozenge--warning">{t("admin.viol.unmapped", "unmapped")}</span>}
              </div>
            </div>
            <p className="ax-caption">
              {rc ? `${rc.regulations.code} §${rc.clause_ref}` : t("admin.viol.noAnchor", "No clause anchor")} · {t("admin.viol.activeFrom", "active from")} {v.active_from ?? "—"}
            </p>
            {pm ? (
              <div className="ax-row" style={{ gap: "var(--ax-space-200)", flexWrap: "wrap", alignItems: "center" }}>
                <span>{t("admin.viol.penalty", "Penalty")} <strong className="ax-numeric">{pm.penalty_ref}</strong></span>
                <span className="ax-caption">{pm.legal_basis}</span>
                <span className="ax-version">{pm.mapping_version}</span>
                {pm.repeat_rule?.repeat_12mo && <span className="ax-caption">{t("admin.viol.repeat12mo", "repeat 12mo →")} {pm.repeat_rule.repeat_12mo}</span>}
              </div>
            ) : (
              <AddMappingForm violationId={v.id} violationCode={v.code} strings={strings} />
            )}
          </div>
        );
      })}
      <p className="ax-caption">{t("admin.viol.footer", "Violations generate automatically from configured responses; the inspector can never type or override one (M09-003/026). One violation = one penalty (M09-004) — the database rejects a second mapping. Inspection results reference the exact mapping version forever (FLD-PEN-001).")}</p>
    </Shell>
  );
}
