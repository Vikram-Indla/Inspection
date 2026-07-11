import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import {
  AddDocumentForm, AddRepresentativeForm, ToggleRepActive,
  type AddDocumentStrings, type AddRepresentativeStrings, type ToggleRepStrings,
} from "./Controls";

export const dynamic = "force-dynamic";

const DOC_TYPE_LABEL: Record<string, string> = {
  license: "Industrial license", cr: "Commercial registration",
  safety_cert: "Safety certificate", layout: "Site layout", other: "Other",
};

// SB11 / M07 — Factory 360 dossier: identity, risk, documents, representatives, history.
export default async function Factory360({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t } = await useT();
  const sb = await supabaseServer();
  const [{ data: f, error: fErr }, { data: docs, error: dErr }, { data: reps, error: rErr }] = await Promise.all([
    sb.from("factories")
      .select(`id, factory_code, name, cr_number, license_number, region, city, activity_class,
        official_lat, official_lng, source, source_synced_at, geofence_radius_m,
        risk_score, risk_band, risk_version,
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
  ]);
  if (!f) return (
    <Shell current="/factories" title={t("f360.notFound.title", "Factory not found")}>
      <div className="ax-surface"><div className="ax-state"><span className="ax-state__glyph">∅</span>
        <h4>{t("f360.notFound.desc", "Not in your scope or does not exist")}</h4>
        {fErr && <p className="ax-caption">{fErr.message}</p>}
      </div></div>
    </Shell>
  );
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
  const today = new Date().toISOString().slice(0, 10);
  const soon = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
  const enumLabel = (value: string) => t(`enum.${value}`, value.replace(/_/g, " "));
  const docTypeLabel = (value: string) => t(`enum.${value}`, DOC_TYPE_LABEL[value] ?? value);
  const retry = t("f360.err.retry", "retry");
  const docsEmpty = (docs ?? []).length === 0;
  const repsEmpty = (reps ?? []).length === 0;
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

  return (
    <Shell current="/factories" title={`${f.name} — ${f.factory_code}`}
      context={<>
        <span className="ax-lozenge ax-lozenge--info">SB11</span>
        <span className={`ax-lozenge ${bandTone}`}>{f.risk_band ? enumLabel(f.risk_band) : "—"} · {f.risk_score}</span>
        <span className="ax-freshness">{t("f360.meta.source", "source")} {f.source} · {t("f360.meta.synced", "synced")} {f.source_synced_at ? new Date(f.source_synced_at).toISOString().slice(0, 16).replace("T", " ") : "—"}</span>
      </>}>
      <div className="ax-grid-2">
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{t("f360.id.heading", "Identity — read-only from source (M07-002)")}</h4>
          <p>{t("f360.id.cr", "CR")} <span className="ax-numeric">{f.cr_number}</span> · {t("f360.id.license", "license")} <span className="ax-numeric">{f.license_number}</span> · {f.activity_class}</p>
          <p>{f.region} · {f.city} · {t("f360.id.official", "official")} <span className="ax-numeric">{f.official_lat}, {f.official_lng}</span> {t("f360.id.gisOwned", "(GIS-Admin-owned, FND-007)")}</p>
          <p className="ax-caption">{t("f360.geo.label", "Geofence (G-MAP):")} {f.geofence_radius_m != null
            ? <><span className="ax-numeric">{f.geofence_radius_m} {t("f360.geo.unitM", "m")}</span> — {t("f360.geo.override", "per-factory override")}</>
            : t("f360.geo.engineDefault", "engine default (engine_settings gis.geofence_default_radius_m)")}</p>
        </div>
        <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
          <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{t("f360.risk.heading", "Risk — reproducible (EV-004)")}</h4>
          <p>{t("f360.risk.score", "Score")} <strong className="ax-numeric">{f.risk_score}</strong> · {t("f360.risk.band", "band")} <strong>{f.risk_band ? enumLabel(f.risk_band) : "—"}</strong> · <span className="ax-version">{f.risk_version}</span></p>
          <p className="ax-caption">{t("f360.risk.desc", "Recomputable from stored inputs + this version; drivers per engine_settings.risk.")}</p>
        </div>
      </div>

      {/* SB11 — Documents (metadata registry; file custody via evidence pipeline) */}
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{t("f360.docs.heading", "Documents — metadata registry (SB11)")}</h4>
        {dErr && <div className="ax-banner ax-banner--critical"><div><strong>{t("f360.docs.err", "Couldn’t load documents.")}</strong> {dErr.message} — {retry}.</div></div>}
        {!dErr && docsEmpty && (
          <div className="ax-state ax-state--inline"><span className="ax-state__glyph">📄</span>
            <h4>{t("f360.docs.empty.title", "No documents recorded")}</h4>
            <p className="ax-caption">{t("f360.docs.empty.desc", "Register license, CR, safety certificates and layouts below.")}</p></div>
        )}
        {!dErr && !docsEmpty && (
          <div className="ax-tablewrap"><table className="ax-table">
            <thead><tr><th>{t("f360.docs.th.type", "Type")}</th><th>{t("f360.docs.th.title", "Title")}</th><th>{t("f360.docs.th.ref", "Reference")}</th><th className="ax-td-num">{t("f360.docs.th.validFrom", "Valid from")}</th><th className="ax-td-num">{t("f360.docs.th.validTo", "Valid to")}</th><th>{t("f360.docs.th.status", "Status")}</th><th>{t("f360.docs.th.file", "File")}</th></tr></thead>
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
                  <td className="ax-caption">{d.storage_path ?? t("f360.docs.custody", "file custody via evidence pipeline")}</td>
                </tr>
              );
            })}</tbody>
          </table></div>
        )}
        <AddDocumentForm factoryId={f.id} strings={docStrings} />
      </div>

      {/* SB11 — Representatives roster */}
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
        <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{t("f360.reps.heading", "Representatives (SB11)")}</h4>
        {rErr && <div className="ax-banner ax-banner--critical"><div><strong>{t("f360.reps.err", "Couldn’t load representatives.")}</strong> {rErr.message} — {retry}.</div></div>}
        {!rErr && repsEmpty && (
          <div className="ax-state ax-state--inline"><span className="ax-state__glyph">👤</span>
            <h4>{t("f360.reps.empty.title", "No representatives on record")}</h4>
            <p className="ax-caption">{t("f360.reps.empty.desc", "Add the factory’s contact roster below.")}</p></div>
        )}
        {!rErr && !repsEmpty && (
          <div className="ax-tablewrap"><table className="ax-table">
            <thead><tr><th>{t("f360.reps.th.name", "Name")}</th><th>{t("f360.reps.th.role", "Role")}</th><th>{t("f360.reps.th.phone", "Phone")}</th><th>{t("f360.reps.th.email", "Email")}</th><th>{t("f360.reps.th.flags", "Flags")}</th><th></th></tr></thead>
            <tbody>{(reps ?? []).map(r => (
              <tr key={r.id}>
                <td><strong>{r.full_name}</strong></td>
                <td>{r.role_title ?? "—"}</td>
                <td className="ax-numeric">{r.phone ?? "—"}</td>
                <td>{r.email ?? "—"}</td>
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
      </div>

      {/* M07-011/012 — official inspection history */}
      <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
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
                    <td>{ins?.submission_versions.map(s => <span key={s.version_number} className="ax-version" style={{ marginInlineEnd: 4 }}>v{s.version_number}</span>)}</td>
                    <td>{ins?.violations.map(x => <span key={x.violation_codes.code} className="ax-lozenge ax-lozenge--critical" style={{ marginInlineEnd: 4 }}>{x.violation_codes.code}</span>)}</td>
                    <td className="ax-caption">{ins?.action_forms.map(a => `${enumLabel(a.status)} · ${a.owner_name} · ${t("f360.hist.due", "due")} ${a.due_at ? new Date(a.due_at).toISOString().slice(0, 10) : "—"}`).join("; ")}</td>
                    <td>{ins?.reviews.filter(r => r.decision).map((r, i) => <span key={i} className={`ax-lozenge ${r.decision === "approve" ? "ax-lozenge--success" : "ax-lozenge--warning"}`} style={{ marginInlineEnd: 4 }}>{r.decision ? enumLabel(r.decision) : null}</span>)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        )}
      </div>
    </Shell>
  );
}
