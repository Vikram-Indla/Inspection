import Shell from "@/components/Shell";
import { getUserRoles } from "@/lib/persona";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import { logFactoryError, mapFactoryError } from "./neutral";
import FactorySpatialMap, { type FactoryLocationEvent } from "./FactorySpatialMap";
import ContextualAiPanel from "@/components/ContextualAiPanel";
import EmptyState from "@/components/EmptyState";
import StatusPill, { type StatusTone } from "@/components/saqeel/status-pill/status-pill";
import FactoryIdentity from "@/components/sections/factories/factory-identity/factory-identity";
import FactoryActions from "@/components/sections/factories/factory-actions/factory-actions";
import FactoryRisk from "@/components/sections/factories/factory-risk/factory-risk";
import FactoryLocation from "@/components/sections/factories/factory-location/factory-location";
import FactoryLocationLog, { type LocationLogRow } from "@/components/sections/factories/factory-location-log/factory-location-log";
import FactoryRiskHistory, { type RiskSnapshotRow, type RelatedViolation } from "@/components/sections/factories/factory-risk-history/factory-risk-history";
import FactoryCaseTimeline, { type CaseVisit, type CaseLogItem } from "@/components/sections/factories/factory-case-timeline/factory-case-timeline";
import FactoryInspectionHistory, { type InspectionHistoryRow } from "@/components/sections/factories/factory-inspection-history/factory-inspection-history";
import FactoryDocuments, { type DocumentRow } from "@/components/sections/factories/factory-documents/factory-documents";
import FactoryRepresentatives, { type RepresentativeRow } from "@/components/sections/factories/factory-representatives/factory-representatives";
import FactoryProducts, { type ProductRow } from "@/components/sections/factories/factory-products/factory-products";
import FactoryMaterials, { type MaterialRow } from "@/components/sections/factories/factory-materials/factory-materials";
import FactoryWorkforce, { type WorkforceKpi } from "@/components/sections/factories/factory-workforce/factory-workforce";
import FactoryDossier from "@/components/sections/factories/factory-dossier/factory-dossier";
import FactorySectionNav from "@/components/sections/factories/factory-section-nav/factory-section-nav";
import { redirect } from "next/navigation";
import { resolveFactory360Permissions } from "@/lib/factory360/dossier";
import { titleCase } from "@/features/factories/portfolio";

const DOC_TYPE_LABEL: Record<string, string> = {
  license: "Industrial license", cr: "Commercial registration",
  safety_cert: "Safety certificate", layout: "Site layout", other: "Other",
};

export default async function Factory360({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ compat?: string }> }) {
  const [{ id }, { compat }] = await Promise.all([params, searchParams]);
  const { t, locale } = await useT();
  const sb = await supabaseServer();
  const permissions = await resolveFactory360Permissions(sb);
  if (!permissions["view_factory_360"]) {
    return (
      <Shell current="/factories" title={t("f360.title", "Factory 360")}>
        <EmptyState glyph="⛔" title={t("f360.permission.title", "Factory 360 access required")}
          body={t("f360.permission.body", "You do not have access to this factory profile.")} />
      </Shell>
    );
  }
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
  const visits = f.visits as unknown as {
    id: string; visit_type: string; planning_status: string; operational_state: string; window_start: string;
    inspections: { id: string; status: string; submission_versions: { version_number: number }[];
      violations: { mapping_version: string; violation_codes: { code: string; title: string; level: string } }[];
      action_forms: { status: string; owner_name: string; due_at: string | null }[];
      reviews: { decision: string | null; status: string }[] } | null;
  }[];
  const sortedVisits = [...visits].sort((a, b) => b.window_start.localeCompare(a.window_start));
  const visitIds = visits.map(v => v.id);
  const inspectionIds = visits.flatMap(v => v.inspections ? [v.inspections.id] : []);
  const canSeeSensitiveHistory = roles.some(r => ["supervisor", "admin"].includes(r));
  const canSeeDocuments = roles.some(r => ["planner", "inspector", "supervisor", "admin"].includes(r));
  const canSeeContacts = roles.some(r => ["planner", "inspector", "supervisor", "admin"].includes(r));
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
  const today = new Date().toISOString().slice(0, 10);
  const enumLabel = (value: string) => titleCase(t(`enum.${value}`, value));
  const docTypeLabel = (value: string) => t(`enum.${value}`, DOC_TYPE_LABEL[value] ?? value);
  const retry = t("f360.err.retry", "retry");
  const num = new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US");
  const identity = (value: string | number | null | undefined) => value == null || value === "" ? "—" : String(value);
  const isTestSource = f.source != null && (f.source === "saqeel_test_data" || f.source.includes("test"));
  const sourceLabel = isTestSource
    ? t("f360.provenance.test", "Test data · not production")
    : f.source === "senaei"
      ? t("f360.provenance.registered", "Registered · Senaei source")
      : t("f360.provenance.unavailable", "Source provenance unavailable");
  const currentDrivers = (f.risk_drivers ?? {}) as Record<string, { value?: number; weight?: number; contribution?: number } | string>;
  const driverEntries = Object.entries(currentDrivers).filter(([key]) => !key.startsWith("_"));
  const saudization = f.employees_total && f.employees_saudi != null && f.employees_total > 0
    ? Math.round((f.employees_saudi / f.employees_total) * 1000) / 10 : null;
  const docValidity = (valid_to: string | null): "none" | "expired" | "valid" => {
    if (valid_to == null) return "none";
    if (valid_to < today) return "expired";
    return "valid";
  };
  const DOC_STATUS: Record<"none" | "expired" | "valid", { tone: StatusTone; label: string }> = {
    none: { tone: "neutral", label: t("f360.docs.noExpiry", "No expiry") },
    expired: { tone: "danger", label: t("f360.docs.expired", "Expired") },
    valid: { tone: "success", label: t("f360.docs.valid", "Valid") },
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

  const syncedText = f.source_synced_at ? new Date(f.source_synced_at).toISOString().slice(0, 16).replace("T", " ") : "—";
  const riskPillTone: StatusTone = f.risk_band === "high" ? "danger" : f.risk_band === "medium" ? "warning" : f.risk_band === "low" ? "success" : "neutral";
  const riskPillLabel = f.risk_band
    ? `${enumLabel(f.risk_band)}${f.risk_score != null ? ` · ${f.risk_score}` : ""}`
    : t("f360.risk.noScore", "No risk score");
  const provenanceTone: StatusTone = isTestSource ? "warning" : f.source === "senaei" ? "success" : "danger";
  const identityFacts = [
    { label: t("f360.id.cr", "CR"), value: <bdi>{identity(f.cr_number)}</bdi> },
    { label: t("f360.id.license", "license"), value: <bdi>{identity(f.license_number)}</bdi> },
    { label: t("f360.id.licenseStatus", "license status / stage"), value: `${identity(f.license_status)} · ${identity(f.license_stage)}` },
    { label: t("f360.id.licenseDates", "issued / expires"), value: `${identity(f.license_issue_date)} → ${identity(f.license_expiry_date)}` },
    { label: t("f360.id.licenseHolder", "license holder"), value: identity(f.license_holder) },
    { label: t("f360.id.legalName", "CR legal name"), value: identity(f.legal_name) },
    { label: t("f360.id.crStatus", "CR status / owner"), value: `${identity(f.cr_status)} · ${identity(f.cr_owner_details)}` },
  ];
  const contextLine = [f.activity_class, f.region, f.city].filter(Boolean).join(" · ");
  const riskScoreText = identity(f.risk_score);
  const riskBand = f.risk_band ? { label: enumLabel(f.risk_band), tone: riskPillTone } : null;
  const riskFacts = [
    { label: t("f360.risk.versionLabel", "version"), value: identity(f.risk_version) },
    { label: t("f360.risk.recalculated", "last recalculated"), value: f.risk_calculated_at ? new Date(f.risk_calculated_at).toISOString().slice(0, 16).replace("T", " ") : "—" },
  ];
  const driverLines = driverEntries.map(([key, raw]) => {
    const d = typeof raw === "object" ? raw : null;
    return { key, text: `${key.replace(/_/g, " ")}: ${d?.value ?? "—"} × ${d?.weight ?? "—"} = ${d?.contribution ?? "—"}` };
  });
  const hasCoords = f.official_lat != null && f.official_lng != null;
  const coords = `${identity(f.official_lat)}, ${identity(f.official_lng)}`;
  const geofenceValue = f.geofence_radius_m != null
    ? `${f.geofence_radius_m} ${t("f360.geo.unitM", "m")} — ${t("f360.geo.override", "per-factory override")}`
    : t("f360.geo.engineDefault", "engine default");
  const stamp = (value: string) => new Date(value).toISOString().slice(0, 16).replace("T", " ");
  const day = (value: string) => new Date(value).toISOString().slice(0, 10);
  const actionsLine = (forms: readonly { status: string; owner_name: string; due_at: string | null }[]) =>
    forms.map(a => `${enumLabel(a.status)} · ${a.owner_name} · ${t("f360.hist.due", "due")} ${a.due_at ? day(a.due_at) : "—"}`).join("; ");
  const reviewTone = (decision: string): StatusTone => decision === "approve" ? "success" : "warning";
  const locationLogRows: LocationLogRow[] = locationEvents.map(e => ({
    id: e.id, when: stamp(e.occurredAt), whenIso: e.occurredAt,
    kindLabel: enumLabel(e.kind), kindTone: e.kind === "override" ? "danger" : "info",
    coords: `${e.lat.toFixed(6)}, ${e.lng.toFixed(6)}`,
    reason: e.kind === "override" ? (e.overrideReason ?? t("f360.geo.overrideNoReason", "override reason unavailable")) : "—",
    visitHref: `/visits/${e.visitId}`, visitShort: e.visitId.slice(0, 8),
  }));
  const riskHistoryRows: RiskSnapshotRow[] = (riskHistory ?? []).map(s => {
    const drivers = s.drivers as Record<string, { value?: number; contribution?: number } | string>;
    const entries = Object.entries(drivers).filter(([key]) => !key.startsWith("_"));
    return {
      id: s.id, when: stamp(s.calculated_at), whenIso: s.calculated_at,
      score: String(s.score), band: enumLabel(s.band), model: s.model_version,
      drivers: entries.length
        ? entries.map(([key, raw]) => { const d = typeof raw === "object" ? raw : null; return `${key.replace(/_/g, " ")} ${d?.value ?? "—"} (${d?.contribution ?? "—"})`; }).join(" · ")
        : t("f360.risk.legacyDrivers", "Legacy score — driver snapshot unavailable"),
    };
  });
  const relatedViolations: RelatedViolation[] = canSeeSensitiveHistory
    ? sortedVisits.flatMap(v => v.inspections?.violations ?? []).map((x, i) => ({ key: `${x.violation_codes.code}-${i}`, label: `${x.violation_codes.code} · ${x.violation_codes.title}` }))
    : [];
  const relatedEmptyNote = canSeeSensitiveHistory
    ? t("f360.risk.noRelatedViolations", "No related violations are recorded.")
    : t("f360.risk.violationsRestricted", "Violation detail is restricted for this role.");
  const caseVisits: CaseVisit[] = sortedVisits.map(v => {
    const ins = v.inspections;
    return {
      id: v.id, day: day(v.window_start), dayIso: v.window_start,
      kindLabel: enumLabel(v.visit_type), visitShort: v.id.slice(0, 8), visitHref: `/visits/${v.id}`,
      planningLabel: enumLabel(v.planning_status), operationalLabel: enumLabel(v.operational_state),
      inspection: ins ? { statusLabel: enumLabel(ins.status), versions: ins.submission_versions.map(s => s.version_number), reportHref: ins.submission_versions.length > 0 ? `/reports/inspection/${ins.id}` : null } : null,
      findings: canSeeSensitiveHistory && ins ? ins.violations.map((x, i) => ({ key: `${x.violation_codes.code}-${i}`, code: x.violation_codes.code })) : [],
      actions: canSeeSensitiveHistory && ins && ins.action_forms.length > 0 ? actionsLine(ins.action_forms) : null,
      reviews: canSeeSensitiveHistory && ins ? ins.reviews.filter(r => r.decision).map((r, i) => ({ key: `${v.id}-rev-${i}`, label: r.decision ? enumLabel(r.decision) : "—", tone: reviewTone(r.decision ?? "") })) : [],
    };
  });
  const caseLog: CaseLogItem[] = [
    ...(f.source_synced_at ? [{ id: "source-sync", day: day(f.source_synced_at), dayIso: f.source_synced_at, title: t("f360.tl.sourceSync", "Factory list synced"), detail: sourceLabel }] : []),
    ...(riskHistory ?? []).map(s => ({ id: `risk-${s.id}`, day: day(s.calculated_at), dayIso: s.calculated_at, title: t("f360.tl.riskUpdated", "Score updated"), detail: `${s.score} · ${enumLabel(s.band)} · ${s.model_version}` })),
    ...(penaltyRows ?? []).map(p => ({ id: `penalty-${p.id}`, day: day(p.issued_at), dayIso: p.issued_at, title: t("f360.tl.penaltyIssued", "Penalty issued"), detail: `${p.notice_number} · ${enumLabel(p.status)}` })),
    ...(evidenceRows ?? []).map(e => ({ id: `evidence-${e.id}`, day: day(e.captured_at), dayIso: e.captured_at, title: t("f360.tl.evidenceCaptured", "Evidence captured"), detail: `${enumLabel(e.evidence_type)} · ${enumLabel(e.linked_type)}` })),
  ];
  const inspectionRows: InspectionHistoryRow[] = sortedVisits.map(v => {
    const ins = v.inspections;
    return {
      id: v.id, visitHref: `/visits/${v.id}`, visitShort: v.id.slice(0, 8), visitType: enumLabel(v.visit_type),
      window: day(v.window_start), windowIso: v.window_start,
      planningLabel: enumLabel(v.planning_status), operationalLabel: enumLabel(v.operational_state),
      inspectionLabel: ins ? enumLabel(ins.status) : null,
      versions: ins ? ins.submission_versions.map(s => s.version_number) : [],
      reportHref: ins && ins.submission_versions.length > 0 ? `/reports/inspection/${ins.id}` : null,
      violations: ins ? ins.violations.map((x, i) => ({ key: `${x.violation_codes.code}-${i}`, code: x.violation_codes.code })) : [],
      actions: ins && ins.action_forms.length > 0 ? actionsLine(ins.action_forms) : null,
      reviews: ins ? ins.reviews.filter(r => r.decision).map((r, i) => ({ key: `${v.id}-r-${i}`, label: r.decision ? enumLabel(r.decision) : "—", tone: reviewTone(r.decision ?? "") })) : [],
    };
  });

  const docError = dErr ? `${mapFactoryError(dErr, "load")} — ${retry}` : null;
  const repError = rErr ? `${mapFactoryError(rErr, "load")} — ${retry}` : null;
  const productError = pErr ? `${mapFactoryError(pErr, "load")} — ${retry}` : null;
  const materialError = mErr ? `${mapFactoryError(mErr, "load")} — ${retry}` : null;
  const documentRows: DocumentRow[] = (docs ?? []).map(d => {
    const status = DOC_STATUS[docValidity(d.valid_to)];
    return { id: d.id, typeLabel: docTypeLabel(d.doc_type), title: d.title, reference: d.reference_no ?? "—", validFrom: d.valid_from ?? "—", validTo: d.valid_to ?? "—", statusLabel: status.label, statusTone: status.tone };
  });
  const representativeRows: RepresentativeRow[] = (reps ?? []).map(r => ({
    id: r.id, name: r.full_name, role: r.role_title ?? "—", phone: r.phone ?? "—", email: r.email ?? "—",
    isPrimary: r.is_primary, activeLabel: r.active ? t("f360.reps.active", "Active") : t("f360.reps.inactive", "Inactive"), activeTone: r.active ? "success" : "warning",
  }));
  const productRows: ProductRow[] = (products ?? []).map(p => ({
    id: p.id, name: p.name, hsCode: p.hs_code ?? "—", unit: p.unit ?? "—",
    capacity: p.annual_capacity != null ? num.format(p.annual_capacity) : "—", isPrimary: p.is_primary,
  }));
  const materialRows: MaterialRow[] = (materials ?? []).map(m => ({
    id: m.id, name: m.name,
    sourceLabel: m.source === "local" ? t("f360.mat.local", "Local") : t("f360.mat.imported", "Imported"),
    sourceTone: m.source === "local" ? "success" : "info", hsCode: m.hs_code ?? "—",
  }));
  const workforceEmpty = f.employees_total == null && f.capital_invested == null && f.production_capacity_note == null;
  const workforceKpis: WorkforceKpi[] = [
    { key: "total", label: t("f360.wf.employeesTotal", "Employees — total"), value: f.employees_total != null ? num.format(f.employees_total) : "—", sub: null },
    { key: "saudi", label: t("f360.wf.employeesSaudi", "Employees — Saudi"), value: f.employees_saudi != null ? num.format(f.employees_saudi) : "—", sub: saudization != null ? `${t("f360.wf.saudization", "Saudization")} ${num.format(saudization)}%` : null },
    { key: "capital", label: t("f360.wf.capital", "Capital invested (SAR)"), value: f.capital_invested != null ? num.format(f.capital_invested) : "—", sub: null },
  ];
  const workforceSourceOwned = `${t("f360.wf.sourceOwned", "Source-owned figures (Factory list sync), like identity — displayed only, never edited here.")} ${t("f360.meta.synced", "synced")} ${f.source_synced_at ? stamp(f.source_synced_at) : "—"}`;

  return (
    <Shell current="/factories" title={`${f.name} — ${identity(f.factory_code)}`}
      context={<StatusPill tone={riskPillTone}>{riskPillLabel}</StatusPill>}>

      {permissions["create_inspection"] ? (
        <FactoryActions
          planSingleHref={`/planning/single?factory=${f.id}&cr=${encodeURIComponent(f.cr_number ?? "")}&license=${encodeURIComponent(f.license_number ?? "")}&source=factory360`}
          immediateHref={`/planning/immediate?factory=${f.id}`}
          strings={{
            planSingle: t("f360.actions.planSingle", "Plan one visit"),
            startPlan: t("f360.actions.startPlan", "Start inspection plan"),
            supervisionNote: t("f360.actions.supervisionRequired", "Every plan is submitted to a Supervisor, who confirms the final Inspector before release."),
          }}
        />
      ) : null}

      <FactoryDossier
        screenId="F360-S03"
        aside={
          <>
          <FactoryIdentity
            code={identity(f.factory_code)}
            contextLine={contextLine}
            facts={identityFacts}
            provenance={{ label: sourceLabel, tone: provenanceTone }}
            synced={syncedText}
            strings={{
              heading: t("f360.id.heading", "Identity — read-only from source"),
              syncedLabel: t("f360.meta.synced", "synced"),
            }}
          />

          <FactoryRisk
            heading={t("f360.risk.heading", "Risk — reproducible")}
            score={riskScoreText}
            band={riskBand}
            noScoreLabel={t("f360.risk.noScore", "No risk score")}
            facts={riskFacts}
            description={t("f360.risk.desc", "Recomputable from stored normalized inputs + this version; every calculation is retained.")}
            drivers={driverLines}
            driversUnavailable={t("f360.risk.driversUnavailable", "No driver snapshot exists for this legacy score; the absence is preserved, not reconstructed.")}
          />

          <FactoryLocation
            heading={t("f360.geo.heading", "Location")}
            coords={coords}
            coordsOwner={t("f360.id.gisOwned", "— owned by the GIS administrator")}
            geofenceLabel={t("f360.geo.label", "Geofence (G-MAP):")}
            geofenceValue={geofenceValue}
            hasCoords={hasCoords}
            noOfficial={t("f360.geo.noOfficial", "Official coordinates are unavailable from the source.")}
          >
            {hasCoords
              ? <FactorySpatialMap officialLat={Number(f.official_lat)} officialLng={Number(f.official_lng)} geofenceRadius={f.geofence_radius_m} events={locationEvents} strings={{
                  officialPin: t("f360.geo.legend.official", "Official / planned pin"),
                  observedArrival: t("f360.geo.legend.arrival", "Observed arrival"),
                  gpsOverride: t("f360.geo.legend.override", "GPS override"),
                  noLocations: t("f360.geo.legend.empty", "No observed inspection locations are recorded in your authorized scope."),
                }} locale={locale === "ar" ? "ar" : "en"} />
              : null}
          </FactoryLocation>
          </>
        }
      >
        <FactorySectionNav sections={SECTIONS} label={t("f360.nav.sections", "Factory 360 sections")} />

          <FactoryLocationLog
            rows={locationLogRows}
            strings={{
              title: t("f360.geo.historyHeading", "Official, planned and observed locations"),
              description: t("f360.geo.historyCaption", "Official coordinates remain source-owned. Arrival, check-in and override coordinates are locked inspection observations and never overwrite the Factory list."),
              when: t("common.when", "When"),
              kind: t("common.kind", "Kind"),
              coordinates: t("f360.geo.actual", "Observed coordinates"),
              mismatch: t("f360.geo.mismatch", "Mismatch / reason"),
              visit: t("common.visit", "Visit"),
              emptyTitle: t("f360.geo.noObserved", "No observed locations are visible in your authorized scope."),
            }}
          />

          <FactoryRiskHistory
            rows={riskHistoryRows}
            violations={relatedViolations}
            relatedEmptyNote={relatedEmptyNote}
            ai={
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
            }
            strings={{
              title: t("f360.risk.historyHeading", "Factory health score and risk history"),
              description: t("f360.risk.historyCaption", "Each row freezes the scoring model version, normalized driver values, weights and contributions used at recalculation time."),
              when: t("common.when", "Calculated"),
              score: t("f360.risk.score", "Score"),
              band: t("f360.risk.band", "Band"),
              model: t("f360.risk.model", "Model"),
              drivers: t("f360.risk.drivers", "Drivers"),
              emptyTitle: t("f360.risk.noHistory", "No risk calculation history is available."),
              relatedTitle: t("f360.risk.relatedViolations", "Related violations"),
            }}
          />

          <FactoryCaseTimeline
            visits={caseVisits}
            log={caseLog}
            strings={{
              title: t("f360.tl.heading", "Spatial Case Timeline"),
              description: t("f360.tl.desc", "Source-labelled facts linking location context, inspections, findings, actions, reviews and the current risk version. Connective, not causal."),
              emptyTitle: t("f360.tl.empty.title", "No case events recorded"),
              emptyDescription: t("f360.tl.empty.desc", "The timeline populates once visits are planned and executed."),
              visit: t("f360.hist.th.visit", "Visit"),
              planning: t("f360.tl.planning", "planning"),
              operational: t("f360.tl.operational", "visit status"),
              inspection: t("f360.hist.th.inspection", "Inspection"),
              report: t("f360.hist.report", "report"),
              findings: t("f360.tl.violations", "findings"),
              actions: t("f360.hist.th.actions", "Actions"),
              review: t("f360.hist.th.review", "Review"),
              logLabel: t("f360.tl.logLabel", "Recorded case events"),
            }}
          />

          <FactoryInspectionHistory
            rows={inspectionRows}
            sensitive={canSeeSensitiveHistory}
            strings={{
              title: t("f360.hist.heading", "Inspection history — official records only"),
              visit: t("f360.hist.th.visit", "Visit"),
              window: t("f360.hist.th.window", "Window"),
              planning: t("f360.hist.th.planning", "Planning"),
              operational: t("f360.hist.th.operational", "Visit status"),
              inspection: t("f360.hist.th.inspection", "Inspection"),
              versions: t("f360.hist.th.versions", "Versions"),
              violations: t("f360.hist.th.violations", "Violations"),
              actions: t("f360.hist.th.actions", "Actions"),
              review: t("f360.hist.th.review", "Review"),
              report: t("f360.hist.report", "report"),
              restricted: t("f360.hist.restricted", "restricted"),
              emptyTitle: t("f360.hist.empty.title", "No visits recorded for this factory"),
            }}
          />

          {canSeeDocuments && <FactoryDocuments
            rows={documentRows}
            error={docError}
            strings={{
              title: t("f360.docs.heading", "Documents — metadata registry"),
              type: t("f360.docs.th.type", "Type"),
              docTitle: t("f360.docs.th.title", "Title"),
              reference: t("f360.docs.th.ref", "Reference"),
              validFrom: t("f360.docs.th.validFrom", "Valid from"),
              validTo: t("f360.docs.th.validTo", "Valid to"),
              status: t("f360.docs.th.status", "Status"),
              emptyTitle: t("f360.docs.empty.title", "No documents recorded"),
              emptyDescription: t("f360.docs.empty.desc", "No source-backed document metadata is available."),
              errorTitle: t("f360.docs.err", "Couldn’t load documents."),
              previewNote: t("f360.docs.previewUnavail", "Document preview is unavailable — this screen shows metadata and storage path only. No document can be opened or downloaded from here."),
            }}
          />}

          {canSeeContacts && <FactoryRepresentatives
            rows={representativeRows}
            error={repError}
            strings={{
              title: t("f360.reps.heading", "Representatives"),
              name: t("f360.reps.th.name", "Name"),
              role: t("f360.reps.th.role", "Role"),
              phone: t("f360.reps.th.phone", "Phone"),
              email: t("f360.reps.th.email", "Email"),
              flags: t("f360.reps.th.flags", "Flags"),
              primary: t("f360.reps.primary", "Primary"),
              emptyTitle: t("f360.reps.empty.title", "No representatives on record"),
              emptyDescription: t("f360.reps.empty.desc", "No source-backed factory contacts are available."),
              errorTitle: t("f360.reps.err", "Couldn’t load representatives."),
            }}
          />}

          <FactoryProducts
            rows={productRows}
            error={productError}
            strings={{
              title: t("f360.prod.heading", "Products & HS codes"),
              name: t("f360.prod.th.name", "Product"),
              hsCode: t("f360.hsCode", "HS code"),
              unit: t("f360.prod.th.unit", "Unit"),
              capacity: t("f360.prod.th.capacity", "Annual capacity"),
              flags: t("f360.prod.th.flags", "Flags"),
              primary: t("f360.prod.primary", "Primary"),
              emptyTitle: t("f360.prod.empty.title", "No products recorded"),
              emptyDescription: t("f360.prod.empty.desc", "No source-backed products are available."),
              errorTitle: t("f360.prod.err", "Couldn’t load products."),
            }}
          />

          <FactoryMaterials
            rows={materialRows}
            error={materialError}
            strings={{
              title: t("f360.mat.heading", "Raw materials"),
              name: t("f360.mat.th.name", "Material"),
              source: t("f360.mat.th.source", "Source"),
              hsCode: t("f360.hsCode", "HS code"),
              emptyTitle: t("f360.mat.empty.title", "No raw materials recorded"),
              emptyDescription: t("f360.mat.empty.desc", "No source-backed raw materials are available."),
              errorTitle: t("f360.mat.err", "Couldn’t load materials."),
            }}
          />

          <FactoryWorkforce
            kpis={workforceKpis}
            capacityNote={f.production_capacity_note}
            empty={workforceEmpty}
            sourceOwned={workforceSourceOwned}
            strings={{
              title: t("f360.wf.heading", "Workforce & indicators — read-only from source"),
              capacityNoteLabel: t("f360.wf.capacityNote", "Production capacity"),
              emptyTitle: t("f360.wf.empty.title", "No workforce or indicator data synced"),
              emptyDescription: t("f360.wf.empty.desc", "These figures arrive from the Factory list sync; they are not editable here."),
            }}
          />
      </FactoryDossier>
    </Shell>
  );
}
