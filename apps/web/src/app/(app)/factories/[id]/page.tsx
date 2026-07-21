import Shell from "@/components/Shell";
import { getUserRoles } from "@/lib/persona";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import {
  AddDocumentForm, AddMaterialForm, AddProductForm, AddRepresentativeForm, ToggleRepActive,
  type AddDocumentStrings, type AddMaterialStrings, type AddProductStrings,
  type AddRepresentativeStrings, type ToggleRepStrings,
} from "./Controls";
import { logFactoryError, mapFactoryError } from "./neutral";
import FactorySpatialMap, { type FactoryLocationEvent } from "./FactorySpatialMap";
import ContextualAiPanel from "@/components/ContextualAiPanel";
import EmptyState from "@/components/EmptyState";
import { redirect } from "next/navigation";

const DOC_TYPE_LABEL: Record<string, string> = {
  license: "Industrial license", cr: "Commercial registration",
  safety_cert: "Safety certificate", layout: "Site layout", other: "Other",
};

// CD-031 / SCR-WEB-400 / P12 — Factory 360 provenance-led dossier.
// Signature: Spatial Case Timeline — a source-labelled, list-equivalent,
// keyboard-operable narrative linking registered location context, inspection
// events, evidence/document availability, findings/actions, review decisions
// and risk-version observations. Built only from facts this route reads; it
// never draws a fabricated spatial path, boundary polygon, risk event or causal
// link. Official/observed pins, risk snapshots and authorized evidence events
// now come from their governed live tables; unavailable values stay explicit.
// Document preview is metadata-only (HANDOFF_BLOCKED_DOCUMENT_VIEWER) — no
// signed URL/viewer/custody retrieval. Representative contact fields are
// masked for the leadership role only (HANDOFF_BLOCKED_ROLE — contact privacy
// unproven for that persona); every other role sees them as before.
export default async function Factory360({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ compat?: string }> }) {
  const [{ id }, { compat }] = await Promise.all([params, searchParams]);
  const { t, locale } = await useT();
  const sb = await supabaseServer();
  // Keep every existing factory link valid while preferring the governed
  // CR-centred dossier whenever this legacy factory identity has a normalized
  // Industrial License mapping.
  const { data: normalizedLicense } = await sb.from("industrial_licenses")
    .select("id, commercial_registration_id")
    .eq("factory_id", id)
    .maybeSingle();
  if (compat !== "legacy" && normalizedLicense?.commercial_registration_id) {
    redirect(`/factories/cr/${normalizedLicense.commercial_registration_id}?license=${normalizedLicense.id}`);
  }
  const { data: { user } } = await getVerifiedUser(sb);
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
        license_status, license_stage, license_issue_date, license_expiry_date, license_holder,
        legal_name, cr_status, cr_owner_details,
        official_lat, official_lng, source, source_synced_at, geofence_radius_m,
        risk_score, risk_band, risk_version, risk_drivers, risk_calculated_at,
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
      ? getUserRoles(user.id)
      : Promise.resolve({ data: null as { role_key: string }[] | null }),
  ]);
  logFactoryError("factory-read", fErr);
  logFactoryError("documents-read", dErr);
  logFactoryError("representatives-read", rErr);
  logFactoryError("products-read", pErr);
  logFactoryError("materials-read", mErr);
  if (!f) return (
    <Shell current="/factories" title={t("f360.notFound.title", "Factory not found")}>
      <EmptyState glyph="∅" title={t("f360.notFound.desc", "Factory registration not found or not available to you.")}
        body={fErr ? mapFactoryError(fErr, "load") : undefined} />
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
  const visitIds = visits.map(v => v.id);
  const inspectionIds = visits.flatMap(v => v.inspections ? [v.inspections.id] : []);
  const canSeeSensitiveHistory = roles.some(r => ["reviewer", "ops", "auditor", "compliance_admin"].includes(r));
  const canSeeDocuments = roles.some(r => ["planner", "inspector", "reviewer", "ops", "auditor", "compliance_admin", "gis_admin"].includes(r));
  const canSeeContacts = !maskContacts && roles.some(r => ["planner", "inspector", "reviewer", "ops", "auditor", "compliance_admin"].includes(r));
  const [{ data: riskHistory }, { data: geoRows }, { data: evidenceRows }, { data: penaltyRows }] = await Promise.all([
    sb.from("factory_risk_snapshots").select("id, score, band, model_version, drivers, calculated_at").eq("factory_id", id).order("calculated_at", { ascending: false }).limit(20),
    visitIds.length ? sb.from("geo_events").select("id, visit_id, kind, observed_lat, observed_lng, override_reason, occurred_at").in("visit_id", visitIds).order("occurred_at", { ascending: false }).limit(100) : Promise.resolve({ data: [] }),
    inspectionIds.length && canSeeSensitiveHistory ? sb.from("evidence").select("id, inspection_id, evidence_type, linked_type, captured_at").in("inspection_id", inspectionIds).order("captured_at", { ascending: false }).limit(100) : Promise.resolve({ data: [] }),
    canSeeSensitiveHistory ? sb.from("penalty_notices").select("id, inspection_id, notice_number, status, issued_at").eq("factory_id", id).order("issued_at", { ascending: false }).limit(50) : Promise.resolve({ data: [] }),
  ]);
  const locationEvents: FactoryLocationEvent[] = (geoRows ?? []).map(g => ({
    id: g.id, visitId: g.visit_id, kind: g.kind, lat: Number(g.observed_lat), lng: Number(g.observed_lng),
    occurredAt: g.occurred_at, overrideReason: g.override_reason,
  }));
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
  const currentDrivers = (f.risk_drivers ?? {}) as Record<string, { value?: number; weight?: number; contribution?: number } | string>;
  const driverEntries = Object.entries(currentDrivers).filter(([key]) => !key.startsWith("_"));
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
    { id: "location", label: t("f360.tab.location", "Location & map") },
    { id: "risk", label: t("f360.tab.risk", "Health & risk") },
    { id: "timeline", label: t("f360.tab.timeline", "Case timeline") },
    { id: "history", label: t("f360.tab.history", "Inspection history") },
    ...(canSeeDocuments ? [{ id: "documents", label: t("f360.tab.documents", "Documents") }] : []),
    ...(canSeeContacts ? [{ id: "representatives", label: t("f360.tab.representatives", "Representatives") }] : []),
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

      {/* الاجراءات quick action (Figma J-21) — the other three (إنشاء رصد حادث /
          عرض مرفقات المحاضر / عرض تقرير التحديات) have no built feature to link to
          yet (incident/challenge concepts don't exist — see reconciliation J-12/J-19);
          only wiring the one real, existing action rather than fabricating dead links. */}
      <div className="ax-row" style={{ justifyContent: "flex-end", marginBlockEnd: "var(--ax-space-200)", gap: "var(--ax-space-100)" }}>
        <a className="ax-btn ax-btn--secondary" href={`/planning/single?factory=${f.id}&cr=${encodeURIComponent(f.cr_number ?? "")}&license=${encodeURIComponent(f.license_number ?? "")}&source=factory360`}>{t("f360.actions.planSingle", "Plan single visit")}</a>
        <a className="ax-btn ax-btn--secondary" href={`/planning/immediate?factory=${f.id}`}>{t("f360.actions.startPlan", "Start inspection plan")}</a>
      </div>

      <div className="cd-w3">
        {/* Provenance-led aside — persistent identity, freshness, risk summary, location facts */}
        <aside className="cd-side3">
          <div className="ax-surface cd-idcard">
            <h4>{t("f360.id.heading", "Identity — read-only from source (M07-002)")}</h4>
            <span className="cd-idcard__code"><bdi>{identity(f.factory_code)}</bdi></span>
            <p className="cd-idrow"><span className="cd-idk">{t("f360.id.cr", "CR")}</span> <span className="cd-idv"><bdi>{identity(f.cr_number)}</bdi></span></p>
            <p className="cd-idrow"><span className="cd-idk">{t("f360.id.license", "license")}</span> <span className="cd-idv"><bdi>{identity(f.license_number)}</bdi></span></p>
            <p className="cd-idrow"><span className="cd-idk">{t("f360.id.licenseStatus", "license status / stage")}</span> <span className="cd-idv">{identity(f.license_status)} · {identity(f.license_stage)}</span></p>
            <p className="cd-idrow"><span className="cd-idk">{t("f360.id.licenseDates", "issued / expires")}</span> <span className="cd-idv ax-numeric">{identity(f.license_issue_date)} → {identity(f.license_expiry_date)}</span></p>
            <p className="cd-idrow"><span className="cd-idk">{t("f360.id.licenseHolder", "license holder")}</span> <span className="cd-idv">{identity(f.license_holder)}</span></p>
            <p className="cd-idrow"><span className="cd-idk">{t("f360.id.legalName", "CR legal name")}</span> <span className="cd-idv">{identity(f.legal_name)}</span></p>
            <p className="cd-idrow"><span className="cd-idk">{t("f360.id.crStatus", "CR status / owner")}</span> <span className="cd-idv">{identity(f.cr_status)} · {identity(f.cr_owner_details)}</span></p>
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
            <p className="ax-caption">{t("f360.risk.desc", "Recomputable from stored normalized inputs + this version; every calculation is retained.")}</p>
            <p className="ax-caption ax-numeric">{t("f360.risk.recalculated", "last recalculated")} {f.risk_calculated_at ? new Date(f.risk_calculated_at).toISOString().slice(0, 16).replace("T", " ") : "—"}</p>
            {driverEntries.length ? <ul className="ax-caption">{driverEntries.map(([key, raw]) => {
              const d = typeof raw === "object" ? raw : {};
              return <li key={key}>{key.replace(/_/g, " ")}: {d.value ?? "—"} × {d.weight ?? "—"} = {d.contribution ?? "—"}</li>;
            })}</ul> : <p className="ax-caption cd-warn">{t("f360.risk.driversUnavailable", "No driver snapshot exists for this legacy score; the absence is preserved, not reconstructed.")}</p>}
          </div>

          <div className="ax-surface cd-maplens">
            <h4>{t("f360.geo.heading", "Location")}</h4>
            <p className="cd-coords"><bdi>{f.official_lat}, {f.official_lng}</bdi> <span className="ax-caption">{t("f360.id.gisOwned", "(GIS-Admin-owned, FND-007)")}</span></p>
            <p className="ax-caption">{t("f360.geo.label", "Geofence (G-MAP):")} {f.geofence_radius_m != null
              ? <><span className="ax-numeric">{f.geofence_radius_m} {t("f360.geo.unitM", "m")}</span> — {t("f360.geo.override", "per-factory override")}</>
              : t("f360.geo.engineDefault", "engine default (engine_settings gis.geofence_default_radius_m)")}</p>
            {f.official_lat != null && f.official_lng != null
              ? <FactorySpatialMap officialLat={Number(f.official_lat)} officialLng={Number(f.official_lng)} geofenceRadius={f.geofence_radius_m} events={locationEvents} strings={{
                  officialPin: t("f360.geo.legend.official", "official / planned pin"),
                  observedArrival: t("f360.geo.legend.arrival", "observed arrival"),
                  gpsOverride: t("f360.geo.legend.override", "GPS override"),
                  noLocations: t("f360.geo.legend.empty", "No observed inspection locations are recorded in your authorized scope."),
                }} locale={locale === "ar" ? "ar" : "en"} />
              : <div className="cd-mapph"><span className="cd-mapph__t">{t("f360.geo.noOfficial", "Official coordinates are unavailable from the source.")}</span></div>}
          </div>
        </aside>

        <div className="cd-main3">
          {/* Sticky section strip — plain anchor links, no scroll-spy; each pill is
              a real focusable link so keyboard/AT users can jump sections directly. */}
          <nav className="cd-secstrip" aria-label={t("f360.nav.sections", "Factory 360 sections")}>
            {SECTIONS.map(s => <a key={s.id} className="cd-secitem" href={`#${s.id}`}>{s.label}</a>)}
          </nav>

          <section id="location" className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
            <h4>{t("f360.geo.historyHeading", "Official, planned and observed locations (M07-005)")}</h4>
            <p className="ax-caption">{t("f360.geo.historyCaption", "Official coordinates remain source-owned. Arrival, check-in and override coordinates are locked inspection observations and never overwrite the Factory list.")}</p>
            {locationEvents.length ? <div className="ax-tablewrap"><table className="ax-table">
              <thead><tr><th scope="col">{t("common.when", "When")}</th><th scope="col">{t("common.kind", "Kind")}</th><th scope="col">{t("f360.geo.actual", "Observed coordinates")}</th><th scope="col">{t("f360.geo.mismatch", "Mismatch / reason")}</th><th scope="col">{t("common.visit", "Visit")}</th></tr></thead>
              <tbody>{locationEvents.map(e => <tr key={e.id}>
                <td className="ax-numeric">{new Date(e.occurredAt).toISOString().slice(0, 16).replace("T", " ")}</td>
                <td><span className={`ax-lozenge ${e.kind === "override" ? "ax-lozenge--critical" : "ax-lozenge--info"}`}>{enumLabel(e.kind)}</span></td>
                <td className="ax-numeric"><bdi>{e.lat.toFixed(6)}, {e.lng.toFixed(6)}</bdi></td>
                <td>{e.kind === "override" ? <strong>{e.overrideReason ?? t("f360.geo.overrideNoReason", "override reason unavailable")}</strong> : "—"}</td>
                <td><a className="ax-link" href={`/visits/${e.visitId}`}>{e.visitId.slice(0, 8)}</a></td>
              </tr>)}</tbody>
            </table></div> : <p className="ax-caption">{t("f360.geo.noObserved", "No observed locations are visible in your authorized scope.")}</p>}
          </section>

          <section id="risk" className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
            <h4>{t("f360.risk.historyHeading", "Factory health score and risk history (M07-014/015)")}</h4>
            <p className="ax-caption">{t("f360.risk.historyCaption", "Each row freezes the DEC-001 model version, normalized driver values, weights and contributions used at recalculation time.")}</p>
            <ContextualAiPanel
              surface="factory_risk_explanation"
              title={t("f360.risk.ai.title", "Explain health score and risk drivers")}
              description={t("f360.risk.ai.description", "Advisory only. Explains the saved score, band, model version and driver snapshot; it cannot recalculate or change risk.")}
              context={JSON.stringify({ factory_id: f.id })}
              evidenceRefs={["MVP1-M07-014", "MVP1-M07-015", "DEC-001", f.risk_version ?? "risk_version_unavailable"]}
              targetRef={f.id}
              locale={locale === "ar" ? "ar" : "en"}
              generateLabel={t("f360.risk.ai.generate", "Explain recorded drivers")}
              unavailableLabel={t("f360.risk.ai.unavailable", "AI explanation unavailable")}
              evidenceLabel={t("f360.risk.ai.evidence", "Source references")}
              advisoryLabel={t("f360.risk.ai.advisory", "Human decision required")}
            />
            {(riskHistory ?? []).length ? <div className="ax-tablewrap"><table className="ax-table">
              <thead><tr><th scope="col">{t("common.when", "Calculated")}</th><th scope="col">{t("f360.risk.score", "Score")}</th><th scope="col">{t("f360.risk.band", "Band")}</th><th scope="col">{t("f360.risk.model", "Model")}</th><th scope="col">{t("f360.risk.drivers", "Drivers")}</th></tr></thead>
              <tbody>{(riskHistory ?? []).map(s => {
                const drivers = s.drivers as Record<string, { value?: number; contribution?: number } | string>;
                const entries = Object.entries(drivers).filter(([key]) => !key.startsWith("_"));
                return <tr key={s.id}>
                  <td className="ax-numeric">{new Date(s.calculated_at).toISOString().slice(0, 16).replace("T", " ")}</td>
                  <td className="ax-numeric"><strong>{s.score}</strong></td><td>{enumLabel(s.band)}</td><td><span className="ax-version">{s.model_version}</span></td>
                  <td className="ax-caption">{entries.length ? entries.map(([key, raw]) => {
                    const d = typeof raw === "object" ? raw : {};
                    return `${key.replace(/_/g, " ")} ${d.value ?? "—"} (${d.contribution ?? "—"})`;
                  }).join(" · ") : t("f360.risk.legacyDrivers", "Legacy score — driver snapshot unavailable")}</td>
                </tr>;
              })}</tbody>
            </table></div> : <p className="ax-caption">{t("f360.risk.noHistory", "No risk calculation history is available.")}</p>}
            <h5 style={{ marginBlockStart: "var(--ax-space-200)" }}>{t("f360.risk.relatedViolations", "Related violations")}</h5>
            {canSeeSensitiveHistory && sortedVisits.some(v => (v.inspections?.violations.length ?? 0) > 0)
              ? <div className="ax-row" style={{ gap: 8, flexWrap: "wrap" }}>{sortedVisits.flatMap(v => v.inspections?.violations ?? []).map((x, i) => <span key={`${x.violation_codes.code}-${i}`} className="ax-lozenge ax-lozenge--critical">{x.violation_codes.code} · {x.violation_codes.title}</span>)}</div>
              : <p className="ax-caption">{canSeeSensitiveHistory ? t("f360.risk.noRelatedViolations", "No related violations are recorded.") : t("f360.risk.violationsRestricted", "Violation detail is restricted for this role.")}</p>}
          </section>

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
                            {canSeeSensitiveHistory && ins.violations.length > 0 && (
                              <p className="cd-tl__src">{t("f360.tl.violations", "findings")} {ins.violations.map(x => <span key={x.violation_codes.code} className="ax-lozenge ax-lozenge--critical" style={{ marginInlineEnd: 4 }}>{x.violation_codes.code}</span>)}</p>
                            )}
                            {canSeeSensitiveHistory && ins.action_forms.length > 0 && (
                              <p className="cd-tl__src">{t("f360.hist.th.actions", "Actions")} {ins.action_forms.map(a => `${enumLabel(a.status)} · ${a.owner_name} · ${t("f360.hist.due", "due")} ${a.due_at ? new Date(a.due_at).toISOString().slice(0, 10) : "—"}`).join("; ")}</p>
                            )}
                            {canSeeSensitiveHistory && ins.reviews.filter(r => r.decision).length > 0 && (
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
              {f.source_synced_at && <li className="cd-tl" key="source-sync">
                <span className="cd-tl__when ax-numeric">{new Date(f.source_synced_at).toISOString().slice(0, 10)}</span>
                <span className="cd-tl__spine" aria-hidden="true"><span className="cd-tl__dot is-location">↻</span></span>
                <div className="cd-tl__card"><span className="cd-tl__kind">{t("f360.tl.sourceSync", "Factory list synced")}</span><span>{f.source}</span></div>
              </li>}
              {(riskHistory ?? []).map(s => <li className="cd-tl" key={`risk-${s.id}`}>
                <span className="cd-tl__when ax-numeric">{new Date(s.calculated_at).toISOString().slice(0, 10)}</span>
                <span className="cd-tl__spine" aria-hidden="true"><span className="cd-tl__dot is-risk">◆</span></span>
                <div className="cd-tl__card"><span className="cd-tl__kind">{t("f360.tl.riskUpdated", "Score updated")}</span>
                  <span>{s.score} · {enumLabel(s.band)} · <span className="ax-version">{s.model_version}</span></span></div>
              </li>)}
              {(penaltyRows ?? []).map(p => <li className="cd-tl" key={`penalty-${p.id}`}>
                <span className="cd-tl__when ax-numeric">{new Date(p.issued_at).toISOString().slice(0, 10)}</span>
                <span className="cd-tl__spine" aria-hidden="true"><span className="cd-tl__dot is-risk">§</span></span>
                <div className="cd-tl__card"><span className="cd-tl__kind">{t("f360.tl.penaltyIssued", "Penalty issued")}</span>
                  <span>{p.notice_number} · {enumLabel(p.status)}</span></div>
              </li>)}
              {(evidenceRows ?? []).map(e => <li className="cd-tl" key={`evidence-${e.id}`}>
                <span className="cd-tl__when ax-numeric">{new Date(e.captured_at).toISOString().slice(0, 10)}</span>
                <span className="cd-tl__spine" aria-hidden="true"><span className="cd-tl__dot is-location">●</span></span>
                <div className="cd-tl__card"><span className="cd-tl__kind">{t("f360.tl.evidenceCaptured", "Evidence captured")}</span>
                  <span>{enumLabel(e.evidence_type)} · {enumLabel(e.linked_type)}</span></div>
              </li>)}
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
                <thead><tr><th scope="col">{t("f360.hist.th.visit", "Visit")}</th><th scope="col" className="ax-td-num">{t("f360.hist.th.window", "Window")}</th><th scope="col">{t("f360.hist.th.planning", "Planning")}</th><th scope="col">{t("f360.hist.th.operational", "Operational")}</th><th scope="col">{t("f360.hist.th.inspection", "Inspection")}</th><th scope="col">{t("f360.hist.th.versions", "Versions")}</th><th scope="col">{t("f360.hist.th.violations", "Violations")}</th><th scope="col">{t("f360.hist.th.actions", "Actions")}</th><th scope="col">{t("f360.hist.th.review", "Review")}</th></tr></thead>
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
                        <td>{canSeeSensitiveHistory ? ins?.violations.map(x => <span key={x.violation_codes.code} className="ax-lozenge ax-lozenge--critical" style={{ marginInlineEnd: 4 }}>{x.violation_codes.code}</span>) : <span className="ax-caption">restricted</span>}</td>
                        <td className="ax-caption">{canSeeSensitiveHistory ? ins?.action_forms.map(a => `${enumLabel(a.status)} · ${a.owner_name} · ${t("f360.hist.due", "due")} ${a.due_at ? new Date(a.due_at).toISOString().slice(0, 10) : "—"}`).join("; ") : "restricted"}</td>
                        <td>{canSeeSensitiveHistory ? ins?.reviews.filter(r => r.decision).map((r, i) => <span key={i} className={`ax-lozenge ${r.decision === "approve" ? "ax-lozenge--success" : "ax-lozenge--warning"}`} style={{ marginInlineEnd: 4 }}>{r.decision ? enumLabel(r.decision) : null}</span>) : <span className="ax-caption">restricted</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table></div>
            )}
          </section>

          {/* Documents — metadata registry; per-section failure isolation (SB11) */}
          {canSeeDocuments && <section id="documents" className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
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
                  <thead><tr><th scope="col">{t("f360.docs.th.type", "Type")}</th><th scope="col">{t("f360.docs.th.title", "Title")}</th><th scope="col">{t("f360.docs.th.ref", "Reference")}</th><th scope="col" className="ax-td-num">{t("f360.docs.th.validFrom", "Valid from")}</th><th scope="col" className="ax-td-num">{t("f360.docs.th.validTo", "Valid to")}</th><th scope="col">{t("f360.docs.th.status", "Status")}</th></tr></thead>
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
          </section>}

          {/* Representatives — contact fields masked for leadership only (HANDOFF_BLOCKED_ROLE) */}
          {canSeeContacts && <section id="representatives" className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
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
                <thead><tr><th scope="col">{t("f360.reps.th.name", "Name")}</th><th scope="col">{t("f360.reps.th.role", "Role")}</th>{!maskContacts && <><th scope="col">{t("f360.reps.th.phone", "Phone")}</th><th scope="col">{t("f360.reps.th.email", "Email")}</th></>}<th scope="col">{t("f360.reps.th.flags", "Flags")}</th><th scope="col"></th></tr></thead>
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
          </section>}

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
                <thead><tr><th scope="col">{t("f360.prod.th.name", "Product")}</th><th scope="col" className="ax-td-num">{t("f360.hsCode", "HS code")}</th><th scope="col">{t("f360.prod.th.unit", "Unit")}</th><th scope="col" className="ax-td-num">{t("f360.prod.th.capacity", "Annual capacity")}</th><th scope="col">{t("f360.prod.th.flags", "Flags")}</th></tr></thead>
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
                <thead><tr><th scope="col">{t("f360.mat.th.name", "Material")}</th><th scope="col">{t("f360.mat.th.source", "Source")}</th><th scope="col" className="ax-td-num">{t("f360.hsCode", "HS code")}</th></tr></thead>
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
                <p className="ax-caption">{t("f360.wf.empty.desc", "These figures arrive from the Factory list sync; they are not editable here.")}</p></div>
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
              {t("f360.wf.sourceOwned", "Source-owned figures (Factory list sync), like identity — displayed only, never edited here.")} {t("f360.meta.synced", "synced")} {f.source_synced_at ? new Date(f.source_synced_at).toISOString().slice(0, 16).replace("T", " ") : "—"}
            </p>
          </section>
        </div>
      </div>
    </Shell>
  );
}
