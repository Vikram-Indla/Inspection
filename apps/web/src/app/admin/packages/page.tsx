import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type Section = { key: string; title: string; items?: string[]; mandatory?: boolean };

export default async function Packages() {
  const sb = await supabaseServer();
  const [{ data: pkgs }, { data: items }] = await Promise.all([
    sb.from("packages").select("id, code, title, scope, package_versions(id, version_label, status, published_at, definition)").order("code"),
    sb.from("inspection_items").select("code, title, response_model, evidence_rule, score_weight"),
  ]);
  const itemMap = new Map((items ?? []).map(i => [i.code, i]));
  return (
    <Shell current="/admin" title="Package & Form Designer"
      context={<span className="ax-lozenge ax-lozenge--info">SCR-ADM-030/031 · ENG-02</span>}>
      {(pkgs ?? []).map(p => (p.package_versions ?? []).map(v => {
        const def = v.definition as { sections?: Section[]; action_forms?: { key: string; title: string; blocking: boolean }[] };
        const published = v.status === "published" || v.status === "locked";
        return (
          <div key={v.id} className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
            <div className="ax-row" style={{ justifyContent: "space-between" }}>
              <h3>{p.code} — {p.title}</h3>
              <div className="ax-row">
                <span className="ax-version">{v.version_label}</span>
                <span className={`ax-lozenge ${published ? "ax-lozenge--success" : "ax-lozenge--warning"}`}>{v.status}</span>
              </div>
            </div>
            {published && (
              <div className="ax-banner ax-banner--immutable"><div>
                <strong>Published version — immutable.</strong> Edits are rejected by the database itself
                (trigger <code>trg_guard_pkg</code>, proven in B1-EV-001). Changes require a new draft version.
              </div></div>
            )}
            {(def.sections ?? []).map(s => (
              <div key={s.key} className="adm-designer-section" style={{ border: "1px solid var(--ax-color-border)", borderRadius: "var(--ax-radius-standard)", overflow: "hidden" }}>
                <div style={{ padding: "var(--ax-space-150) var(--ax-space-200)", background: "var(--ax-color-surface-sunken)", borderBlockEnd: "1px solid var(--ax-color-border)", font: "var(--ax-text-body-strong)" }}>
                  {s.title} {s.mandatory && <span className="ax-lozenge ax-lozenge--critical" style={{ marginInlineStart: 8 }}>mandatory</span>}
                </div>
                {(s.items ?? []).map(code => {
                  const it = itemMap.get(code);
                  const rm = it?.response_model as { mapping?: Record<string, { violation?: string; action_form?: string }>; conditional?: object } | undefined;
                  const nc = rm?.mapping?.["non_compliant"];
                  return (
                    <div key={code} style={{ padding: "var(--ax-space-150) var(--ax-space-200)", borderBlockEnd: "1px solid var(--ax-color-border)", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <strong>{code}</strong> <span>{it?.title}</span>
                      {nc?.violation && <span className="ax-lozenge ax-lozenge--warning">NC → {nc.violation}</span>}
                      {nc?.action_form && <span className="ax-lozenge ax-lozenge--critical">blocking action form</span>}
                      {rm?.conditional && <span className="ax-lozenge ax-lozenge--info">conditional</span>}
                      {it?.evidence_rule != null && <span className="ax-lozenge ax-lozenge--info">evidence rule</span>}
                      <span className="ax-caption" style={{ marginInlineStart: "auto" }}>weight {it?.score_weight ?? "—"}</span>
                    </div>
                  );
                })}
                {(s.items ?? []).length === 0 && <p className="ax-caption" style={{ padding: "var(--ax-space-150) var(--ax-space-200)" }}>report-head fields</p>}
              </div>
            ))}
            <p className="ax-caption">
              Action forms: {(def.action_forms ?? []).map(a => `${a.title}${a.blocking ? " (blocking)" : ""}`).join(", ") || "—"} ·
              consumed at runtime exactly as configured (M09-019/030).
            </p>
          </div>
        );
      }))}
    </Shell>
  );
}
