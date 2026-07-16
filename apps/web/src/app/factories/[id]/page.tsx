import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import {
  AddDocumentForm, AddMaterialForm, AddProductForm, AddRepresentativeForm, ToggleRepActive,
  type AddDocumentStrings, type AddMaterialStrings, type AddProductStrings,
  type AddRepresentativeStrings, type ToggleRepStrings,
} from "./Controls";
import { logFactoryError, mapFactoryError } from "./neutral";

export const dynamic = "force-dynamic";

const DOC_TYPE_LABEL: Record<string, string> = {
  license: "Industrial license", cr: "Commercial registration",
  safety_cert: "Safety certificate", layout: "Site layout", other: "Other",
};

// CD-031 / SCR-WEB-400 / P12 — Factory 360 provenance-led dossier.
// Signature: Spatial Case Timeline — a source-labelled, list-equivalent,
// keyboard-operable narrative linking registered location context, inspection
// events, evidence/document availability, findings/actions, review decisions
// and risk-version observations. Built only from facts this route reads; it
// never draws a fabricated spatial path, boundary, risk event or causal link —
// unavailable spatial/risk-driver/risk-history/evidence elements are explicit
// unavailable rows (HANDOFF_BLOCKED_MAP/_BOUNDARY/_RISK_DRIVERS/_RISK_HISTORY/
// _EVIDENCE_TIMELINE), never omitted or coerced into "none".
// Document preview is metadata-only (HANDOFF_BLOCKED_DOCUMENT_VIEWER) — no
// signed URL/viewer/custody retrieval. Representative contact fields are
// masked for the leadership role only (HANDOFF_BLOCKED_ROLE — contact privacy
// unproven for that persona); every other role sees them as before.
export default async function Factory360({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t, locale } = await useT();
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  const [
    { data: f, error: fErr },
    { data: docs, error: dErr },
    { data: reps, error: rErr },
    { data: products, error: pErr },
    { data: materials, error: mErr },
    { data: roleRows },
  ] = await Promise.all([
    sb.from("factories")
      .select(`id, factory_code, name, cr_number, license_number, region, city, activity_class,
        official_lat, official_lng, source, source_synced_at, geofence_radius_m,
        risk_score, risk_band, risk_version,
        employees_total, employees_saudi, capital_invested, production_capacity_note,
        visits(id, visit_type, planning_status, operational_state, window_start,
          inspections(id, status, submission_versions(version_number),
            violations(mapping_version, violation_codes(code, title, level)),
            action_forms(status, owner_name, due_at),
            reviews(decision, status)))`)
      .eq("id", id).single(),
    sb.from("factory_documents")
      .select("id, doc_type, title, reference_no, valid_from, valid_to, storage_path, created_at")
      .eq("factory_id", id).order("created_at", { ascending: false }),
    sb.from("factory_representatives")
      .select("id, full_name, role_title, phone, email, is_primary, active, created_at")
      .eq("factory_id", id).order("is_primary", { ascending: false }).order("created_at", { ascending: true }),
    sb.from("factory_products")
      .select("id, name, hs_code, unit, annual_capacity, is_primary, created_at")
      .eq("factory_id", id).order("is_primary", { ascending: false }).order("created_at", { ascending: true }),
    sb.from("factory_materials")
      .select("id, name, source, hs_code, created_at")
      .eq("factory_id", id).order("created_at", { ascending: true }),
    user
      ? sb.from("user_roles").select("role_key").eq("user_id", user.id)
      : Promise.resolve({ data: null as { role_key: string }[] | null }),
  ]);
  logFactoryError("factory-read", fErr);
  logFactoryError("documents-read", dErr);
  logFactoryError("representatives-read", rErr);
  logFactoryError("products-read", pErr);
  logFactoryError("materials-read", mErr);
  if (!f) return (
    <Shell current="/factories" title={t("f360.notFound.title", "Factory not found")}>
      <div className="ax-surface"><div className="ax-state"><span className="ax-state__glyph">∅</span>
        <h4>{t("f360.notFound.desc", "Not in your scope or does not exist")}</h4>
        {fErr && <p className="ax-caption">{mapFactoryError(fErr, "load")}</p>}
      </div></div>
    </Shell>
  );
  const roles = (roleRows ?? []).map(r => r.role_key);
  // HANDOFF_BLOCKED_ROLE — contact privacy for representatives is unproven
  // specifically for the leadership persona; every other role is unaffected.
  const maskContacts = roles.length > 0 && roles.every(r => r === "leadership");
  const visits = f.visits as unknown as {
    id: string; visit_type: string; planning_status: string; operational_state: string; window_start: string;
    // visits->inspections is to-one (unique visit_id): object or null, NOT an array
    inspections: { id: string; status: string; submission_versions: { version_number: number }[];
      violations: { mapping_version: string; violation_codes: { code: string; title: string; level: string } }[];
      action_forms: { status: string; owner_name: string; due_at: string | null }[];
      reviews: { decision: string | null; status: string }[] } | null;
  }[];
  const sortedVisits = [...visits].sort((a, b) => b.window_start.localeCompare(a.window_start));
  const bandTone = f.risk_band === "high" ? "ax-lozenge--critical" : f.risk_band === "medium" ? "ax-lozenge--warning" : "ax-lozenge--success";
  const riskTone = f.risk_band === "high" ? "cd-risk-high" : f.risk_band === "medium" ? "cd-risk-medium" : "cd-risk-low";
  const today = new Date().toISOString().slice(0, 10);
  const soon = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
  const enumLabel = (value: string) => t(`enum.${value}`, value.replace(/_/g, " "));
  const docTypeLabel = (value: string) => t(`enum.${value}`, DOC_TYPE_LABEL[value] ?? value);
  const retry = t("f360.err.retry", "retry");
  const num = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US");
  // Source-owned identity fields are nullable in the canonical factory table.
  // Render an explicit unavailable marker instead of an empty inline/bdi node;
  // blank identity values are indistinguishable from a missing direction-isolated
  // identifier in Arabic/RTL and are not an honest dossier state.
  const identity = (value: string | number | null | undefined) => value == null || value === "" ? "—" : String(value);
  const docsEmpty = (docs ?? []).length === 0;
  const repsEmpty = (reps ?? []).length === 0;
  const productsEmpty = (products ?? []).length === 0;
  const materialsEmpty = (materials ?? []).length === 0;
  // Saudization % derived from source-owned workforce numbers (M07-008).
  const saudization = f.employees_total && f.employees_saudi != null && f.employees_total > 0
    ? Math.round((f.employees_saudi / f.employees_total) * 1000) / 10 : null;
  // Validity is precomputed so JSX stays free of inline comparisons.
  const docValidity = (valid_to: string | null): "none" | "expired" | "expiring" | "valid" => {
    if (valid_to == null) return "none";
    if (valid_to < today) return "expired";
    if (valid_to < soon) return "expiring";
    return "valid";
  };
  const VALIDITY_BADGE: Record<"none" | "expired" | "expiring" | "valid", { cls: string; label: string }> = {
    none: { cls: "ax-caption", label: t("f360.docs.noExpiry", "no expiry") },
    expired: { cls: "ax-lozenge ax-lozenge--critical", label: t("f360.docs.expired", "expired") },
    expiring: { cls: "ax-lozenge ax-lozenge--warning", label: t("f360.docs.expiringSoon", "expiring soon") },
    valid: { cls: "ax-lozenge ax-lozenge--success", label: t("f360.docs.valid", "valid") },
  };

  const SECTIONS: { id: string; label: string }[] = [
    { id: "timeline", label: t("f360.tab.timeline", "Case timeline") },
    { id: "history", label: t("f360.tab.history", "Inspection history") },
    { id: "documents", label: t("f360.tab.documents", "Documents") },
    { id: "representatives", label: t("f360.tab.representatives", "Representatives") },
    { id: "products", label: t("f360.tab.products", "Products") },
    { id: "materials", label: t("f360.tab.materials", "Materials") },
    { id: "workforce", label: t("f360.tab.workforce", "Workforce & Indicators") },
  ];

  const docStrings: AddDocumentStrings = {
    typeLabel: t("f360.docs.form.type", "Type"),
    typeOptions: {
      license: docTypeLabel("license"),
      cr: docTypeLabel("cr"),
      safety_cert: docTypeLabel("safety_cert"),
      layout: docTypeLabel("layout"),
      other: docTypeLabel("other"),
    },
    titleLabel: t("f360.docs.form.title", "Title"),
    titlePlaceholder: t("f360.docs.form.titlePh", "Document title"),
    refLabel: t("f360.docs.form.ref", "Reference №"),
    refPlaceholder: "IL-9101",
    validFrom: t("f360.docs.form.validFrom", "Valid from"),
    validTo: t("f360.docs.form.validTo", "Valid to"),
    adding: t("f360.form.adding", "Adding…"),
    add: t("f360.docs.form.add", "Add document"),
    added: t("f360.form.added", "added"),
  };
  const repStrings: AddRepresentativeStrings = {
    fullNameLabel: t("f360.reps.form.fullName", "Full name"),
    fullNamePlaceholder: t("f360.reps.form.fullNamePh", "Ahmed Al-Saleh"),
    roleLabel: t("f360.reps.form.role", "Role"),
    rolePlaceholder: t("f360.reps.form.rolePh", "HSE Manager"),
    phoneLabel: t("f360.reps.form.phone", "Phone"),
    phonePlaceholder: "+966-5x-xxxxxxx",
    emailLabel: t("f360.reps.form.email", "Email"),
    primaryContact: t("f360.reps.form.primaryContact", "primary contact"),
    adding: t("f360.form.adding", "Adding…"),
    add: t("f360.reps.form.add", "Add representative"),
    added: t("f360.form.added", "added"),
  };
  const toggleStrings: ToggleRepStrings = {
    saving: t("f360.form.saving", "Saving…"),
    deactivate: t("f360.reps.deactivate", "Deactivate"),
    reactivate: t("f360.reps.reactivate", "Reactivate"),
  };
  const productStrings: AddProductStrings = {
    nameLabel: t("f360.prod.form.name", "Product"),
    namePlaceholder: t("f360.prod.form.namePh", "Polyethylene film rolls"),
    hsLabel: t("f360.hsCode", "HS code"),
    unitLabel: t("f360.prod.form.unit", "Unit"),
    unitPlaceholder: t("f360.prod.form.unitPh", "tonne"),
    capacityLabel: t("f360.prod.form.capacity", "Annual capacity"),
    primaryProduct: t("f360.prod.form.primary", "primary product"),
    adding: t("f360.form.adding", "Adding…"),
    add: t("f360.prod.form.add", "Add product"),
    added: t("f360.form.added", "added"),
  };
  const materialStrings: AddMaterialStrings = {
    nameLabel: t("f360.mat.form.name", "Material"),
    namePlaceholder: t("f360.mat.form.namePh", "Polyethylene resin"),
    sourceLabel: t("f360.mat.form.source", "Source"),
    sourceOptions: {
      local: t("f360.mat.local", "local"),
      imported: t("f360.mat.imported", "imported"),
    },
    hsLabel: t("f360.hsCode", "HS code"),
    adding: t("f360.form.adding", "Adding…"),
    add: t("f360.mat.form.add", "Add material"),
    added: t("f360.form.added", "added"),
  };

  return (
    <Shell current="/factories" title={`${f.name} — ${identity(f.factory_code)}`}
      context={<>
        <span className="ax-lozenge ax-lozenge--info">SB11</span>
        <span className={`ax-lozenge ${bandTone}`}>{f.risk_band ? enumLabel(f.risk_band) : "—"} · {f.risk_score}</span>
        <span className="ax-freshness">{t("f360.meta.source", "source")} {f.source} · {t("f360.meta.synced", "synced")} {f.source_synced_at ? new Date(f.source_synced_at).toISOString().slice(0, 16).replace("T", " ") : "—"}</span>
      </>}>

      <div className="cd-w3">
        {/* Provenance-led aside — persistent identity, freshness, risk summary, location facts */}
        <aside className="cd-side3">
          <div className="ax-surface cd-idcard">
            <h4>{t("f360.id.heading", "Identity — read-only from source (M07-002)")}</h4>
            <span className="cd-idcard__code"><bdi>{identity(f.factory_code)}</bdi></span>
            <p className="cd-idrow"><span className="cd-idk">{t("f360.id.cr", "CR")}</span> <span className="cd-idv"><bdi>{identity(f.cr_number)}</bdi></span></p>
            <p className="cd-idrow"><span className="cd-idk">{t("f360.id.license", "license")}</span> <span className="cd-idv"><bdi>{identity(f.license_number)}</bdi></span></p>
            <p className="cd-idrow">{f.activity_class} · {f.region} · {f.city}</p>
          </div>

          <div className="ax-surface cd-fresh">
            <span className="cd-fresh__g" aria-hidden="true">⏱</span>
            <span>{t("f360.meta.source", "source")} <strong>{f.source}</strong> · {t("f360.meta.synced", "synced")} <bdi className="cd-idv">{f.source_synced_at ? new Date(f.source_synced_at).toISOString().slice(0, 16).replace("T", " ") : "—"}</bdi></span>
          </div>

          <div className="ax-surface cd-riskcard">
            <h4>{t("f360.risk.heading", "Risk — reproducible (EV-004)")}</h4>
            <span className={`cd-riskscore ${riskTone}`}>{f.risk_score}</span>
            <p>{t("f360.risk.band", "band")} <strong>{f.risk_band ? enumLabel(f.risk_band) : "—"}</strong> · <span className="ax-version">{f.risk_version}</span></p>
            <p className="ax-caption">{t("f360.risk.desc", "Recomputable from stored inputs + this version; drivers per engine_settings.risk.")}</p>
            <p className="ax-caption cd-warn">{t("f360.risk.driversUnavail", "Risk-driver breakdown and recalculation are unavailable from this route (HANDOFF_BLOCKED_RISK_DRIVERS).")}</p>
          </div>

          <div className="ax-surface cd-maplens">
            <h4>{t("f360.geo.heading", "Location")}</h4>
            <p className="cd-coords"><bdi>{f.official_lat}, {f.official_lng}</bdi> <span className="ax-caption">{t("f360.id.gisOwned", "(GIS-Admin-owned, FND-007)")}</span></p>
            <p className="ax-caption">{t("f360.geo.label", "Geofence (G-MAP):")} {f.geofence_radius_m != null
              ? <><span className="ax-numeric">{f.geofence_radius_m} {t("f360.geo.unitM", "m")}</span> — {t("f360.geo.override", "per-factory override")}</>
              : t("f360.geo.engineDefault", "engine default (engine_settings gis.geofence_default_radius_m)")}</p>
            <div className="cd-mapph"><span className="cd-mapph__t">{t("f360.geo.mapUnavail", "Map and boundary are unavailable — no map provider or authoritative boundary polygon is proven for this route (HANDOFF_BLOCKED_MAP / HANDOFF_BLOCKED_BOUNDARY).")}</span></div>
          </div>
        </aside>

        <div className="cd-main3">
          {/* Sticky section strip — plain anchor links, no scroll-spy; each pill is
              a real focusable link so keyboard/AT users can jump sections directly. */}
          <nav className="cd-secstrip" aria-label={t("f360.nav.sections", "Factory 360 sections")}>
            {SECTIONS.map(s => <a key={s.id} className="cd-secitem" href={`#${s.id}`}>{s.label}</a>)}
          </nav>

          {/* Spatial Case Timeline — signature interaction. Built only from
              already-fetched route facts; risk-version history and the
              evidence timeline are explicit unavailable rows, never inferred. */}
          <section id="timeline" className="ax-surface" style={{ padding: "var(--ax-space-300)" }} aria-labelledby="cd-tl-h">
            <h4 id="cd-tl-h">{t("f360.tl.heading", "Spatial Case Timeline")}</h4>
            <p className="ax-caption">{t("f360.tl.desc", "Source-labelled facts linking location context, inspections, findings, actions, reviews and the current risk version. Connective, not causal.")}</p>
            {sortedVisits.length === 0 ? (
              <div className="ax-state ax-state--inline"><span className="ax-state__glyph">🗺</span>
                <h4>{t("f360.tl.empty.title", "No case events recorded")}</h4>
                <p className="ax-caption">{t("f360.tl.empty.desc", "The timeline populates once visits are planned and executed.")}</p></div>
            ) : (
              <ol className="cd-timeline">
                {sortedVisits.map(v => {
                  const ins = v.inspections;
                  return (
                    <li key={v.id} className="cd-tl">
                      <span className="cd-tl__when ax-numeric">{new Date(v.window_start).toISOString().slice(0, 10)}</span>
                      <span className="cd-tl__spine" aria-hidden="true"><span className="cd-tl__dot is-visit">◉</span><span className="cd-tl__line" /></span>
                      <div className="cd-tl__card">
                        <div className="cd-tl__head"><span className="cd-tl__kind">{enumLabel(v.visit_type)}</span><span className="cd-tl__title">{t("f360.hist.th.visit", "Visit")} <a className="ax-link" href={`/visits/${v.id}`}>{v.id.slice(0, 8)}</a></span></div>
                        <p className="cd-tl__src">{t("f360.tl.planning", "planning")} {enumLabel(v.planning_status)} · {t("f360.tl.operational", "operational")} {enumLabel(v.operational_state)}</p>
                        {ins && (
                          <>
                            <p className="cd-tl__src">{t("f360.hist.th.inspection", "Inspection")} {enumLabel(ins.status)}
                              {ins.submission_versions.map(s => <span key={s.version_number} className="ax-version" style={{ marginInlineStart: 4 }}>v{s.version_number}</span>)}
                              {ins.submission_versions.length > 0 && <> · <a className="ax-link" href={`/reports/inspection/${ins.id}`}>{t("f360.hist.report", "report")}</a></>}
                            </p>
                            {ins.violations.length > 0 && (
                              <p className="cd-tl__src">{t("f360.tl.violations", "findings")} {ins.violations.map(x => <span key={x.violation_codes.code} className="ax-lozenge ax-lozenge--critical" style={{ marginInlineEnd: 4 }}>{x.violation_codes.code}</span>)}</p>
                            )}
                            {ins.action_forms.length > 0 && (
                              <p className="cd-tl__src">{t("f360.hist.th.actions", "Actions")} {ins.action_forms.map(a => `${enumLabel(a.status)} · ${a.owner_name} · ${t("f360.hist.due", "due")} ${a.due_at ? new Date(a.due_at).toISOString().slice(0, 10) : "—"}`).join("; ")}</p>
                            )}
                            {ins.reviews.filter(r => r.decision).length > 0 && (
                              <p className="cd-tl__src">{t("f360.hist.th.review", "Review")} {ins.reviews.filter(r => r.decision).map((r, i) => <span key={i} className={`ax-lozenge ${r.decision === "approve" ? "ax-lozenge--success" : "ax-lozenge--warning"}`} style={{ marginInlineEnd: 4 }}>{r.decision ? enumLabel(r.decision) : null}</span>)}</p>
                            )}
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
            <ol className="cd-timeline" style={{ marginBlockStart: sortedVisits.length === 0 ? 0 : "var(--ax-space-100)" }}>
              <li className="cd-tl">
                <span className="cd-tl__when ax-caption">—</span>
                <span className="cd-tl__spine" aria-hidden="true"><span className="cd-tl__dot is-risk">?</span></span>
                <div className="cd-tl__card is-unavail" role="status"><span className="cd-tl__kind">{t("f360.tl.riskHistory.kind", "Risk-version history")}</span><span>{t("f360.tl.riskHistory.body", "Unavailable — only the current risk version is read on this route (HANDOFF_BLOCKED_RISK_HISTORY).")}</span></div>
              </li>
              <li className="cd-tl">
                <span className="cd-tl__when ax-caption">—</span>
                <span className="cd-tl__spine" aria-hidden="true"><span className="cd-tl__dot is-location">?</span></span>
                <div className="cd-tl__card is-unavail" role="status"><span className="cd-tl__kind">{t("f360.tl.evidence.kind", "Evidence timeline")}</span><span>{t("f360.tl.evidence.body", "Unavailable — no inspection-evidence query is proven on this route (HANDOFF_BLOCKED_EVIDENCE_TIMELINE).")}</span></div>
              </li>
            </ol>
          </section>

          {/* Inspection history — tabular record, distinct from the narrative timeline above. */}
          <section id="history" className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
            <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{t("f360.hist.heading", "Inspection history — official records only (M07-011/012)")}</h4>
            {sortedVisits.length === 0 ? (
              <div className="ax-state ax-state--inline"><span className="ax-state__glyph">🗓</span>
                <h4>{t("f360.hist.empty.title", "No visits recorded for this factory")}</h4>
                <p className="ax-caption">{t("f360.hist.empty.desc", "History appears once visits are planned and executed.")}</p></div>
            ) : (
              <div className="ax-tablewrap"><table className="ax-table">
                <thead><tr><th>{t("f360.hist.th.visit", "Visit")}</th><th className="ax-td-num">{t("f360.hist.th.window", "Window")}</th><th>{t("f360.hist.th.planning", "Planning")}</th><th>{t("f360.hist.th.operational", "Operational")}</th><th>{t("f360.hist.th.inspection", "Inspection")}</th><th>{t("f360.hist.th.versions", "Versions")}</th><th>{t("f360.hist.th.violations", "Violations")}</th><th>{t("f360.hist.th.actions", "Actions")}</th><th>{t("f360.hist.th.review", "Review")}</th></tr></thead>
                <tbody>
                  {sortedVisits.map(v => {
                    const ins = v.inspections;
                    return (
                      <tr key={v.id}>
                        <td><a className="ax-link" href={`/visits/${v.id}`}>{v.id.slice(0, 8)}</a> <span className="ax-caption">{enumLabel(v.visit_type)}</span></td>
                        <td className="ax-td-num ax-numeric">{new Date(v.window_start).toISOString().slice(0, 10)}</td>
                        <td><span className="ax-lozenge ax-lozenge--plan">{enumLabel(v.planning_status)}</span></td>
                        <td><span className="ax-lozenge ax-lozenge--ops">{enumLabel(v.operational_state)}</span></td>
                        <td>{ins ? <span className="ax-lozenge ax-lozenge--info">{enumLabel(ins.status)}</span> : <span className="ax-caption">—</span>}</td>
                        <td>
                          {ins?.submission_versions.map(s => <span key={s.version_number} className="ax-version" style={{ marginInlineEnd: 4 }}>v{s.version_number}</span>)}
                          {ins && ins.submission_versions.length > 0 && <a className="ax-link" href={`/reports/inspection/${ins.id}`}>{t("f360.hist.report", "report")}</a>}
                        </td>
                        <td>{ins?.violations.map(x => <span key={x.violation_codes.code} className="ax-lozenge ax-lozenge--critical" style={{ marginInlineEnd: 4 }}>{x.violation_codes.code}</span>)}</td>
                        <td className="ax-caption">{ins?.action_forms.map(a => `${enumLabel(a.status)} · ${a.owner_name} · ${t("f360.hist.due", "due")} ${a.due_at ? new Date(a.due_at).toISOString().slice(0, 10) : "—"}`).join("; ")}</td>
                        <td>{ins?.reviews.filter(r => r.decision).map((r, i) => <span key={i} className={`ax-lozenge ${r.decision === "approve" ? "ax-lozenge--success" : "ax-lozenge--warning"}`} style={{ marginInlineEnd: 4 }}>{r.decision ? enumLabel(r.decision) : null}</span>)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table></div>
            )}
          </section>

          {/* Documents — metadata registry; per-section failure isolation (SB11) */}
          <section id="documents" className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
            <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{t("f360.docs.heading", "Documents — metadata registry (SB11)")}</h4>
            {dErr && <div className="ax-banner ax-banner--critical"><div><strong>{t("f360.docs.err", "Couldn’t load documents.")}</strong> {mapFactoryError(dErr, "load")} — {retry}.</div></div>}
            {!dErr && docsEmpty && (
              <div className="ax-state ax-state--inline"><span className="ax-state__glyph">📄</span>
                <h4>{t("f360.docs.empty.title", "No documents recorded")}</h4>
                <p className="ax-caption">{t("f360.docs.empty.desc", "Register license, CR, safety certificates and layouts below.")}</p></div>
            )}
            {!dErr && !docsEmpty && (
              <>
                <div className="ax-tablewrap"><table className="ax-table">
                  <thead><tr><th>{t("f360.docs.th.type", "Type")}</th><th>{t("f360.docs.th.title", "Title")}</th><th>{t("f360.docs.th.ref", "Reference")}</th><th className="ax-td-num">{t("f360.docs.th.validFrom", "Valid from")}</th><th className="ax-td-num">{t("f360.docs.th.validTo", "Valid to")}</th><th>{t("f360.docs.th.status", "Status")}</th></tr></thead>
                  <tbody>{(docs ?? []).map(d => {
                    const badge = VALIDITY_BADGE[docValidity(d.valid_to)];
                    return (
                      <tr key={d.id}>
                        <td><span className="ax-lozenge ax-lozenge--info">{docTypeLabel(d.doc_type)}</span></td>
                        <td><strong>{d.title}</strong></td>
                        <td className="ax-numeric">{d.reference_no ?? "—"}</td>
                        <td className="ax-td-num ax-numeric">{d.valid_from ?? "—"}</td>
                        <td className="ax-td-num ax-numeric">{d.valid_to ?? "—"}</td>
                        <td><span className={badge.cls}>{badge.label}</span></td>
                      </tr>
                    );
                  })}</tbody>
                </table></div>
                <div className="cd-docrow is-unavail" role="status">
                  <span className="cd-docrow__icon" aria-hidden="true">📄</span>
                  <span>{t("f360.docs.previewUnavail", "Document preview is unavailable — this surface exposes metadata and storage path only, with no signed URL, viewer or custody retrieval (HANDOFF_BLOCKED_DOCUMENT_VIEWER).")}</span>
                </div>
              </>
            )}
            <AddDocumentForm factoryId={f.id} strings={docStrings} />
          </section>

          {/* Representatives — contact fields masked for leadership only (HANDOFF_BLOCKED_ROLE) */}
          <section id="representatives" className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
            <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{t("f360.reps.heading", "Representatives (SB11)")}</h4>
            {rErr && <div className="ax-banner ax-banner--critical"><div><strong>{t("f360.reps.err", "Couldn’t load representatives.")}</strong> {mapFactoryError(rErr, "load")} — {retry}.</div></div>}
            {!rErr && repsEmpty && (
              <div className="ax-state ax-state--inline"><span className="ax-state__glyph">👤</span>
                <h4>{t("f360.reps.empty.title", "No representatives on record")}</h4>
                <p className="ax-caption">{t("f360.reps.empty.desc", "Add the factory’s contact roster below.")}</p></div>
            )}
            {!rErr && maskContacts && !repsEmpty && (
              <div className="cd-masked" role="status"><span aria-hidden="true">🔒</span>{t("f360.reps.masked", "Contact details are role-restricted for this persona (HANDOFF_BLOCKED_ROLE).")}</div>
            )}
            {!rErr && !repsEmpty && (
              <div className="ax-tablewrap"><table className="ax-table">
                <thead><tr><th>{t("f360.reps.th.name", "Name")}</th><th>{t("f360.reps.th.role", "Role")}</th>{!maskContacts && <><th>{t("f360.reps.th.phone", "Phone")}</th><th>{t("f360.reps.th.email", "Email")}</th></>}<th>{t("f360.reps.th.flags", "Flags")}</th><th></th></tr></thead>
                <tbody>{(reps ?? []).map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.full_name}</strong></td>
                    <td>{r.role_title ?? "—"}</td>
                    {!maskContacts && <><td className="ax-numeric">{r.phone ?? "—"}</td><td>{r.email ?? "—"}</td></>}
                    <td>
                      {r.is_primary && <span className="ax-lozenge ax-lozenge--info" style={{ marginInlineEnd: 4 }}>{t("f360.reps.primary", "primary")}</span>}
                      <span className={`ax-lozenge ${r.active ? "ax-lozenge--success" : "ax-lozenge--warning"}`}>{r.active ? t("f360.reps.active", "active") : t("f360.reps.inactive", "inactive")}</span>
                    </td>
                    <td><ToggleRepActive repId={r.id} factoryId={f.id} active={r.active} strings={toggleStrings} /></td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
            <AddRepresentativeForm factoryId={f.id} strings={repStrings} />
          </section>

          {/* Products & HS codes (maintainable, W3 / M07-006) */}
          <section id="products" className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
            <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{t("f360.prod.heading", "Products & HS codes (M07-006)")}</h4>
            {pErr && <div className="ax-banner ax-banner--critical"><div><strong>{t("f360.prod.err", "Couldn’t load products.")}</strong> {mapFactoryError(pErr, "load")} — {retry}.</div></div>}
            {!pErr && productsEmpty && (
              <div className="ax-state ax-state--inline"><span className="ax-state__glyph">📦</span>
                <h4>{t("f360.prod.empty.title", "No products recorded")}</h4>
                <p className="ax-caption">{t("f360.prod.empty.desc", "Register the factory’s product list with HS codes below.")}</p></div>
            )}
            {!pErr && !productsEmpty && (
              <div className="ax-tablewrap"><table className="ax-table">
                <thead><tr><th>{t("f360.prod.th.name", "Product")}</th><th className="ax-td-num">{t("f360.hsCode", "HS code")}</th><th>{t("f360.prod.th.unit", "Unit")}</th><th className="ax-td-num">{t("f360.prod.th.capacity", "Annual capacity")}</th><th>{t("f360.prod.th.flags", "Flags")}</th></tr></thead>
                <tbody>{(products ?? []).map(p => (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong></td>
                    <td className="ax-td-num ax-numeric">{p.hs_code ?? "—"}</td>
                    <td>{p.unit ?? "—"}</td>
                    <td className="ax-td-num ax-numeric">{p.annual_capacity != null ? num.format(p.annual_capacity) : "—"}</td>
                    <td>{p.is_primary && <span className="ax-lozenge ax-lozenge--info">{t("f360.prod.primary", "primary")}</span>}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
            <AddProductForm factoryId={f.id} strings={productStrings} />
          </section>

          {/* Raw materials (maintainable, W3 / M07-007) */}
          <section id="materials" className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
            <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{t("f360.mat.heading", "Raw materials (M07-007)")}</h4>
            {mErr && <div className="ax-banner ax-banner--critical"><div><strong>{t("f360.mat.err", "Couldn’t load materials.")}</strong> {mapFactoryError(mErr, "load")} — {retry}.</div></div>}
            {!mErr && materialsEmpty && (
              <div className="ax-state ax-state--inline"><span className="ax-state__glyph">🧱</span>
                <h4>{t("f360.mat.empty.title", "No raw materials recorded")}</h4>
                <p className="ax-caption">{t("f360.mat.empty.desc", "Register the factory’s raw-material inputs below.")}</p></div>
            )}
            {!mErr && !materialsEmpty && (
              <div className="ax-tablewrap"><table className="ax-table">
                <thead><tr><th>{t("f360.mat.th.name", "Material")}</th><th>{t("f360.mat.th.source", "Source")}</th><th className="ax-td-num">{t("f360.hsCode", "HS code")}</th></tr></thead>
                <tbody>{(materials ?? []).map(m => (
                  <tr key={m.id}>
                    <td><strong>{m.name}</strong></td>
                    <td><span className={`ax-lozenge ${m.source === "local" ? "ax-lozenge--success" : "ax-lozenge--info"}`}>{m.source === "local" ? t("f360.mat.local", "local") : t("f360.mat.imported", "imported")}</span></td>
                    <td className="ax-td-num ax-numeric">{m.hs_code ?? "—"}</td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
            <AddMaterialForm factoryId={f.id} strings={materialStrings} />
          </section>

          {/* Workforce & industrial indicators — source-owned, display-only (W3 / M07-008/009) */}
          <section id="workforce" className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
            <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{t("f360.wf.heading", "Workforce & indicators — read-only from source (M07-008/009)")}</h4>
            {f.employees_total == null && f.capital_invested == null && f.production_capacity_note == null ? (
              <div className="ax-state ax-state--inline"><span className="ax-state__glyph">🏭</span>
                <h4>{t("f360.wf.empty.title", "No workforce or indicator data synced")}</h4>
                <p className="ax-caption">{t("f360.wf.empty.desc", "These figures arrive from the source registry sync; they are not editable here.")}</p></div>
            ) : (
              <>
                <div className="ax-kpi-row">
                  <div className="ax-surface ax-kpi">
                    <span className="ax-caption">{t("f360.wf.employeesTotal", "Employees — total")}</span>
                    <span className="ax-kpi__value">{f.employees_total != null ? num.format(f.employees_total) : "—"}</span>
                  </div>
                  <div className="ax-surface ax-kpi">
                    <span className="ax-caption">{t("f360.wf.employeesSaudi", "Employees — Saudi")}</span>
                    <span className="ax-kpi__value">{f.employees_saudi != null ? num.format(f.employees_saudi) : "—"}</span>
                    {saudization != null && <span className="ax-kpi__delta">{t("f360.wf.saudization", "Saudization")} {num.format(saudization)}%</span>}
                  </div>
                  <div className="ax-surface ax-kpi">
                    <span className="ax-caption">{t("f360.wf.capital", "Capital invested (SAR)")}</span>
                    <span className="ax-kpi__value">{f.capital_invested != null ? num.format(f.capital_invested) : "—"}</span>
                  </div>
                </div>
                {f.production_capacity_note && (
                  <p style={{ marginBlockStart: "var(--ax-space-200)" }}>
                    <strong>{t("f360.wf.capacityNote", "Production capacity")}</strong> — {f.production_capacity_note}
                  </p>
                )}
              </>
            )}
            <p className="ax-caption" style={{ marginBlockStart: "var(--ax-space-200)" }}>
              {t("f360.wf.sourceOwned", "Source-owned figures (registry sync), like identity — displayed only, never edited here.")} {t("f360.meta.synced", "synced")} {f.source_synced_at ? new Date(f.source_synced_at).toISOString().slice(0, 16).replace("T", " ") : "—"}
            </p>
          </section>
        </div>
      </div>
    </Shell>
  );
}
