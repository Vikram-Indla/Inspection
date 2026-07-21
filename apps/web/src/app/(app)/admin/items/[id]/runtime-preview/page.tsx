import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import type { ReactNode } from "react";

type Json = Record<string, unknown>;
type Clause = {
  clause_ref: string;
  title: string | null;
  legal_source: string | null;
  regulations: { code: string; title: string; version_label: string; status: string; effective_from: string | null } | null;
};
type Item = {
  id: string; code: string; title: string; active: boolean; configuration_version: number;
  guidance_en: string | null; guidance_ar: string | null; response_model: Json;
  evidence_rule: Json | null; regulation_clauses: Clause | null;
};
type PackageUse = {
  package_version_id: string; snapshot: Json;
  package_versions: {
    version_label: string; status: string; effective_from: string | null; definition: Json;
    packages: { code: string; title: string } | null;
  } | null;
};
type Violation = {
  code: string; title: string; level: string; status: string | null; configuration_version: number | null;
  penalty_mappings: Array<{ penalty_ref: string; penalty_type: string | null; amount: number | null; mapping_version: string; legal_basis: string | null; status: string | null }> | null;
};

const textValue = (value: unknown) => typeof value === "string" && value.trim() ? value : null;
const boolLabel = (value: unknown) => value === true ? "Yes" : value === false ? "No" : "Not configured";
const show = (value: unknown) => value === null || value === undefined || value === "" ? "Not configured" : String(value);
const objectValue = (value: unknown): Json => value && typeof value === "object" && !Array.isArray(value) ? value as Json : {};
const arrayValue = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

function findSection(definition: Json, code: string) {
  return arrayValue(definition.sections).map(objectValue).find(section => arrayValue(section.items).includes(code)) ?? null;
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return <div><dt>{label}</dt><dd>{children}</dd></div>;
}

export default async function InspectorRuntimePreview({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const selectedPackageVersion = typeof sp.package_version === "string" ? sp.package_version : null;
  const sb = await supabaseServer();

  const { data: rawItem, error: itemError } = await sb.from("inspection_items")
    .select("id,code,title,active,configuration_version,guidance_en,guidance_ar,response_model,evidence_rule,regulation_clauses(clause_ref,title,legal_source,regulations(code,title,version_label,status,effective_from))")
    .eq("id", id).maybeSingle();
  const item = rawItem as unknown as Item | null;

  if (itemError || !item) {
    return <Shell current="/admin/items" title="Inspector Runtime Preview"><div className="ax-surface"><div className="ax-state" role="alert"><span className="ax-state__glyph" aria-hidden="true">🔎</span><h4>{itemError ? "Preview unavailable" : "Inspection item not found"}</h4><p className="ax-caption">{itemError ? "The configuration read failed. Retry without assuming the item is absent." : "The read succeeded, but no item has this identifier."}</p><a className="ax-link" href="/admin/items">Back to Inspection Rules</a></div></div></Shell>;
  }

  const [{ data: rawUses, error: useError }, { data: legacyVersions }, { data: governedVersions }] = await Promise.all([
    sb.from("package_version_item_snapshots")
      .select("package_version_id,snapshot,package_versions(version_label,status,effective_from,definition,packages(code,title))")
      .eq("item_code", item.code),
    sb.from("inspection_item_versions").select("configuration_version,recorded_at").eq("item_id", item.id).order("configuration_version", { ascending: false }),
    sb.from("compliance_entity_versions").select("id,version_number,published_at,request_id,correlation_id").eq("entity_kind", "inspection_item").eq("target_legacy_id", item.id).order("version_number", { ascending: false }),
  ]);
  const uses = (rawUses ?? []) as unknown as PackageUse[];
  const selectedUse = uses.find(use => use.package_version_id === selectedPackageVersion) ?? uses.find(use => ["published", "locked"].includes(use.package_versions?.status ?? "")) ?? uses[0] ?? null;
  const frozen = selectedUse?.snapshot ?? null;
  const source = frozen ?? item as unknown as Json;
  const responseModel = objectValue(source.response_model);
  const evidenceRule = objectValue(source.evidence_rule);
  const responses = arrayValue(responseModel.responses).map(show);
  const mapping = objectValue(responseModel.mapping);
  const nonCompliant = objectValue(mapping.non_compliant);
  const violationRef = textValue(nonCompliant.violation) ?? textValue(nonCompliant.result);

  let violation: Violation | null = null;
  if (violationRef) {
    const base = sb.from("violation_codes").select("code,title,level,status,configuration_version,penalty_mappings(penalty_ref,penalty_type,amount,mapping_version,legal_basis,status)");
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(violationRef);
    const { data } = await (isUuid ? base.eq("id", violationRef) : base.eq("code", violationRef)).maybeSingle();
    violation = data as unknown as Violation | null;
  }

  const definition = selectedUse?.package_versions?.definition ?? {};
  const section = findSection(definition, item.code);
  const packageInfo = selectedUse?.package_versions?.packages;
  const requirement = textValue(responseModel.requirement);
  const mandatory = requirement ? requirement === "required" : null;
  const evidenceTypes = arrayValue(evidenceRule.accepted_types ?? evidenceRule.types ?? evidenceRule.type).map(show);
  if (!evidenceTypes.length && textValue(evidenceRule.type)) evidenceTypes.push(textValue(evidenceRule.type)!);
  const reportType = textValue(section?.report_type) ?? textValue(definition.report_type);
  const selfAssessment = section?.self_assessment_visible ?? responseModel.self_assessment_visible;
  const gaps = [
    !selectedUse && "No immutable published package-version snapshot is available; exact execution context cannot be proven.",
    !textValue(section?.name) && !textValue(section?.title) && "Inspection Section is not explicitly named in the selected package definition.",
    !textValue(responseModel.type) && "Response Type is not explicitly configured; only response values are available.",
    selfAssessment === undefined && "Self-Assessment visibility is not explicitly configured.",
    !reportType && "Report Type/package placement is not explicitly configured.",
    violationRef && !violation && `The configured trigger '${violationRef}' does not resolve to an accessible Violation.`,
  ].filter(Boolean) as string[];

  return (
    <Shell current="/admin/items" title="Inspector Runtime Preview" context={<span className="ax-lozenge ax-lozenge--info">Read-only · configuration verification</span>}>
      <nav className="cmp-library-tabs" aria-label="Inspection Rules"><a className="ax-btn ax-btn--secondary ax-link" href="/admin/regulations">Regulations</a><a className="ax-btn ax-btn--prominent" href="/admin/items" aria-current="page">Inspection Items</a></nav>
      <div className="ax-banner" role="note"><strong>Control-plane preview only.</strong> This page reads approved Compliance configuration and immutable package snapshots. It does not author, publish, or change the Inspector application.</div>
      {useError ? <div className="ax-banner ax-banner--warning" role="alert"><strong>Package usage unavailable.</strong> Exact runtime placement is unknown; the item itself is shown from the live library.</div> : null}

      <section className="ax-surface cmp-runtime-head" aria-labelledby="runtime-item-heading">
        <div><p className="ax-caption ax-numeric"><bdi dir="ltr">{item.code}</bdi></p><h2 id="runtime-item-heading">{item.title}</h2><p>{textValue(source.guidance_en) ?? item.guidance_en ?? "No inspector guidance configured."}</p></div>
        <span className={`ax-lozenge ${item.active ? "ax-lozenge--success" : "ax-lozenge--critical"}`}>{item.active ? "Operational" : "Inactive"}</span>
      </section>

      {uses.length > 0 ? <form className="ax-surface cmp-runtime-selector" method="get"><label className="ax-field"><span className="ax-field__label">Published package/version context</span><select className="ax-select" name="package_version" defaultValue={selectedUse?.package_version_id}>{uses.map(use => <option key={use.package_version_id} value={use.package_version_id}>{use.package_versions?.packages?.code ?? "Package"} · {use.package_versions?.version_label ?? "version unknown"} · {use.package_versions?.status ?? "status unknown"}</option>)}</select></label><button className="ax-btn ax-btn--secondary" type="submit">Preview exact version</button></form> : null}

      <section className="ax-surface cmp-runtime-card" aria-labelledby="runtime-config-heading"><h3 id="runtime-config-heading">Published execution configuration</h3><dl className="cmp-runtime-facts">
        <Fact label="Regulation">{item.regulation_clauses?.regulations ? `${item.regulation_clauses.regulations.code} — ${item.regulation_clauses.regulations.title}` : "Not configured"}</Fact>
        <Fact label="Regulation version">{show(item.regulation_clauses?.regulations?.version_label)}</Fact>
        <Fact label="Inspection Section">{show(textValue(section?.name) ?? textValue(section?.title))}</Fact>
        <Fact label="Clause">{show(item.regulation_clauses?.clause_ref)}</Fact>
        <Fact label="Response Type">{show(responseModel.type)}</Fact>
        <Fact label="Response Values and evaluation mapping"><span className="cmp-runtime-values">{responses.length ? responses.map(value => <span className="ax-lozenge" key={value}>{value} → {show(objectValue(mapping[value.toLowerCase().replaceAll(" ", "_")]).result)}</span>) : "Not configured"}</span></Fact>
        <Fact label="Mandatory status">{mandatory === null ? "Not configured" : boolLabel(mandatory)}</Fact>
        <Fact label="Evidence requirement">{boolLabel(evidenceRule.mandatory)}</Fact>
        <Fact label="Acceptable Evidence Types">{evidenceTypes.length ? evidenceTypes.join(", ") : "Not configured"}</Fact>
        <Fact label="Self-Assessment visibility">{boolLabel(selfAssessment)}</Fact>
        <Fact label="Package / report usage">{packageInfo ? `${packageInfo.code} — ${packageInfo.title}` : "Not configured"}{reportType ? ` · ${reportType}` : ""}</Fact>
        <Fact label="Exact effective version">{selectedUse ? `${selectedUse.package_versions?.version_label ?? "unknown"} · item configuration ${show(source.configuration_version)} · effective ${show(selectedUse.package_versions?.effective_from)}` : `Live item configuration ${item.configuration_version} (not a frozen execution snapshot)`}</Fact>
      </dl></section>

      <section className="ax-surface cmp-runtime-card" aria-labelledby="runtime-enforcement-heading"><h3 id="runtime-enforcement-heading">Downstream enforcement context</h3><dl className="cmp-runtime-facts">
        <Fact label="Non-Compliant Trigger Response">{violationRef ? `Non-Compliant → ${violationRef}` : "Not configured"}</Fact>
        <Fact label="Linked Violation">{violation ? `${violation.code} — ${violation.title} · ${violation.level}` : "Not resolved"}</Fact>
        <Fact label="Linked Penalty configuration (read-only)">{violation?.penalty_mappings?.length ? violation.penalty_mappings.map(p => `${p.penalty_ref} · ${p.penalty_type ?? "type not configured"} · version ${p.mapping_version}`).join("; ") : "Not configured"}</Fact>
        <Fact label="Application timing">Penalty is context only at response selection; final application follows Inspection Review and Enforcement.</Fact>
      </dl></section>

      <section className="ax-surface cmp-runtime-card" aria-labelledby="runtime-history-heading"><h3 id="runtime-history-heading">Immutable version lineage</h3>{(legacyVersions?.length ?? 0) + (governedVersions?.length ?? 0) === 0 ? <p className="ax-caption">No historical version rows are available. Current configuration is not represented as historical evidence.</p> : <ul className="ccr-history">{(governedVersions ?? []).map(v => <li key={v.id}><strong>Governed version {v.version_number}</strong><span>{v.published_at} · correlation {v.correlation_id}</span></li>)}{(legacyVersions ?? []).map(v => <li key={`${v.configuration_version}-${v.recorded_at}`}><strong>Legacy configuration {v.configuration_version}</strong><span>{v.recorded_at}</span></li>)}</ul>}</section>

      {gaps.length ? <section className="ax-surface cmp-runtime-card cmp-runtime-gaps" aria-labelledby="runtime-gaps-heading"><h3 id="runtime-gaps-heading">INSPECTOR_RUNTIME_INTEGRATION_GAP</h3><p className="ax-caption">These gaps require separate controlled change only if runtime consumption must be extended. No Inspector change is made here.</p><ol>{gaps.map((gap, index) => <li key={gap}><strong>CMP-REQ-LIB-{String(index + 1).padStart(3, "0")}</strong> — {gap}<br /><span className="ax-caption">Affected runtime route/component: existing Inspection Execution item renderer · Required integration: consume the missing published field · Regression risk: execution rendering/evaluation · Separate slice: Yes</span></li>)}</ol></section> : <div className="ax-banner ax-banner--success" role="status"><strong>No visible runtime-consumption gap detected</strong> for this selected published package snapshot.</div>}
    </Shell>
  );
}
