import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { NewDraftForm, ApprovePublish, type PublishStrings } from "./PublishControls";
import DraftEditor, { type DraftEditorStrings } from "./DraftEditor";

export const dynamic = "force-dynamic";

type Section = { key: string; title: string; items?: string[]; mandatory?: boolean };

export default async function Packages() {
  const { t } = await useT();
  const sb = await supabaseServer();
  const [{ data: pkgs }, { data: items }] = await Promise.all([
    sb.from("packages").select("id, code, title, scope, package_versions(id, version_label, status, published_at, definition)").order("code"),
    sb.from("inspection_items").select("code, title, response_model, evidence_rule, score_weight"),
  ]);
  const itemMap = new Map((items ?? []).map(i => { return [i.code, i] as const; }));
  const publishStrings: PublishStrings = {
    newDraftLabel: t("admin.pkg.newDraft.label", "New draft version (M09-030)"),
    creating: t("admin.pkg.newDraft.creating", "Creating…"),
    createDraft: t("admin.pkg.newDraft.create", "Create draft"),
    draftCreated: t("admin.pkg.newDraft.created", "draft created"),
    publishing: t("admin.pkg.publish.publishing", "Publishing…"),
    approvePublish: t("admin.pkg.publish.approve", "Approve & publish (maker-checker — RBAC-002)"),
  };
  const editorStrings: DraftEditorStrings = {
    heading: t("admin.pkg.editor.heading", "Draft editor — sections & items (M09-019/025)"),
    editableWhileDraft: t("admin.pkg.editor.editable", "editable while draft"),
    mandatory: t("admin.pkg.editor.mandatory", "mandatory"),
    sectionTitleAria: t("admin.pkg.editor.sectionTitleAria", "Section title"),
    removeAria: t("admin.pkg.editor.removeAria", "Remove"),
    addItem: t("admin.pkg.editor.addItem", "+ add item…"),
    addItemAria: t("admin.pkg.editor.addItemAria", "Add item"),
    newSectionTitle: t("admin.pkg.editor.newSectionTitle", "New section title"),
    addSection: t("admin.pkg.editor.addSection", "Add section"),
    draftSaved: t("admin.pkg.editor.draftSaved", "draft saved"),
    saving: t("admin.pkg.editor.saving", "Saving…"),
    save: t("admin.pkg.editor.save", "Save draft definition"),
  };
  return (
    <Shell current="/admin" title={t("admin.pkg.title", "Package & Form Designer")}
      context={<span className="ax-lozenge ax-lozenge--info">SCR-ADM-030/031 · ENG-02</span>}>
      {(pkgs ?? []).map(p => (<div key={p.id} className="ax-stack" style={{ display: "flex", flexDirection: "column", gap: "var(--ax-space-300)" }}>
      {(p.package_versions ?? []).map(v => {
        const def = v.definition as { sections?: Section[]; action_forms?: { key: string; title: string; blocking: boolean }[] };
        const published = v.status === "published" || v.status === "locked";
        return (
          <div key={v.id} className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
            <div className="ax-row" style={{ justifyContent: "space-between" }}>
              <h3>{p.code} — {p.title}</h3>
              <div className="ax-row">
                <span className="ax-version">{v.version_label}</span>
                <span className={`ax-lozenge ${published ? "ax-lozenge--success" : "ax-lozenge--warning"}`}>{t(`enum.${v.status}`, String(v.status).replace(/_/g, " "))}</span>
              </div>
            </div>
            {published && (
              <div className="ax-banner ax-banner--immutable"><div>
                <strong>{t("admin.pkg.immutable.title", "Published version — immutable.")}</strong> {t("admin.pkg.immutable.before", "Edits are rejected by the database itself (trigger")} <code>trg_guard_pkg</code>{t("admin.pkg.immutable.after", ", proven in B1-EV-001). Changes require a new draft version.")}
              </div></div>
            )}
            {(def.sections ?? []).map(s => (
              <div key={s.key} className="adm-designer-section" style={{ border: "1px solid var(--ax-color-border)", borderRadius: "var(--ax-radius-standard)", overflow: "hidden" }}>
                <div style={{ padding: "var(--ax-space-150) var(--ax-space-200)", background: "var(--ax-color-surface-sunken)", borderBlockEnd: "1px solid var(--ax-color-border)", font: "var(--ax-text-body-strong)" }}>
                  {s.title} {s.mandatory && <span className="ax-lozenge ax-lozenge--critical" style={{ marginInlineStart: 8 }}>{t("admin.pkg.mandatory", "mandatory")}</span>}
                </div>
                {(s.items ?? []).map(code => {
                  const it = itemMap.get(code);
                  const rm = it?.response_model as { mapping?: Record<string, { violation?: string; action_form?: string }>; conditional?: object } | undefined;
                  const nc = rm?.mapping?.["non_compliant"];
                  return (
                    <div key={code} style={{ padding: "var(--ax-space-150) var(--ax-space-200)", borderBlockEnd: "1px solid var(--ax-color-border)", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <strong>{code}</strong> <span>{it?.title}</span>
                      {nc?.violation && <span className="ax-lozenge ax-lozenge--warning">{t("admin.pkg.ncArrow", "NC →")} {nc.violation}</span>}
                      {nc?.action_form && <span className="ax-lozenge ax-lozenge--critical">{t("admin.pkg.blockingActionForm", "blocking action form")}</span>}
                      {rm?.conditional && <span className="ax-lozenge ax-lozenge--info">{t("admin.pkg.conditional", "conditional")}</span>}
                      {it?.evidence_rule != null && <span className="ax-lozenge ax-lozenge--info">{t("admin.pkg.evidenceRule", "evidence rule")}</span>}
                      <span className="ax-caption" style={{ marginInlineStart: "auto" }}>{t("admin.pkg.weight", "weight")} {it?.score_weight ?? "—"}</span>
                    </div>
                  );
                })}
                {(s.items ?? []).length === 0 && <p className="ax-caption" style={{ padding: "var(--ax-space-150) var(--ax-space-200)" }}>{t("admin.pkg.reportHead", "report-head fields")}</p>}
              </div>
            ))}
            <p className="ax-caption">
              {t("admin.pkg.actionForms", "Action forms:")} {(def.action_forms ?? []).map(a => `${a.title}${a.blocking ? ` (${t("admin.pkg.blocking", "blocking")})` : ""}`).join(", ") || "—"} {t("admin.pkg.actionFormsNote", "· consumed at runtime exactly as configured (M09-019/030).")}
            </p>
            {!published && v.status === "draft" && (
              <>
                <DraftEditor versionId={v.id} definition={def} catalog={(items ?? []).map(i => ({ code: i.code, title: i.title }))} strings={editorStrings} />
                <ApprovePublish versionId={v.id} strings={publishStrings} />
              </>
            )}
          </div>
        );
      })}
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <NewDraftForm packageId={p.id} strings={publishStrings} />
      </div>
      </div>))}
    </Shell>
  );
}
