import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import LibraryTabs, { type LibraryTabDef } from "./LibraryTabs";

export const dynamic = "force-dynamic";

type RegulationRow = {
  entity_id: string;
  target_legacy_id: string | null;
  current_version_id: string | null;
  version_number: number | null;
  request_id: string | null;
  code: string;
  title: string;
  issuing_authority: string | null;
  operational_status: string;
  version_label: string;
  release_date: string | null;
  published_at: string | null;
  clauses_status: "verified" | "verified_unknown";
  clauses: Array<{ id: string; clause_ref: string; inspection_items: Array<{ id: string; code: string; title: string }> | null }> | null;
};
type ViolationCodeRow = { id: string; code: string; title: string; level: string; clause_id: string | null };
type PenaltyMappingRow = { id: string; violation_code_id: string; penalty_ref: string; mapping_version: string };
type AuditEventRow = { id: number; action: string; occurred_at: string; actor: string | null };
type VersionRow = { id: string; version_number: number; published_at: string | null; request_id: string | null };

export default async function ComplianceLibrary({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sb = await supabaseServer();
  const sp = await searchParams;
  const query = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";
  const routeBase = sp.__shellRoute === "/admin/regulations" ? "/admin/regulations" : "/compliance";
  const authority = typeof sp.authority === "string" ? sp.authority : "";
  const selectedId = typeof sp.libraryId === "string" ? sp.libraryId : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const hasFilters = !!query || !!authority || !!status;
  const { data, error } = await sb.from("compliance_regulation_library")
    .select("entity_id,target_legacy_id,current_version_id,version_number,request_id,code,title,issuing_authority,operational_status,version_label,release_date,published_at,clauses,clauses_status")
    .order("title");
  const correlationId = error ? crypto.randomUUID() : null;
  if (error) console.error(`[compliance-library:${correlationId}]`, error.message, error.code);
  const rows = (data ?? []) as unknown as RegulationRow[];
  const authorities = Array.from(new Set(rows.map(row => row.issuing_authority ?? "Other"))).sort();
  const statuses = Array.from(new Set(rows.map(row => row.operational_status))).sort();
  const filtered = rows.filter(row => {
    const matchesAuthority = !authority || (row.issuing_authority ?? "Other") === authority;
    const matchesStatus = !status || row.operational_status === status;
    const haystack = `${row.code} ${row.title} ${row.issuing_authority ?? ""}`.toLowerCase();
    return matchesAuthority && matchesStatus && (!query || haystack.includes(query));
  });
  const selected = rows.find(row => row.entity_id === selectedId) ?? filtered[0] ?? null;
  const clausesVerified = selected?.clauses_status === "verified" && Array.isArray(selected.clauses);
  const clauseCount = clausesVerified ? selected.clauses!.length : null;
  const itemCount = clausesVerified && selected.clauses!.every(clause => Array.isArray(clause.inspection_items))
    ? selected.clauses!.reduce((total, clause) => total + clause.inspection_items!.length, 0)
    : null;

  // Six-tab workspace data — scoped to the selected regulation only.
  // CLASS-CONTRACT.md § Compliance Library: Overview · Inspection Items ·
  // Violations · Penalties · Versions · Audit History. Real reads; empty
  // tabs render "No records", never fabricated rows.
  const clauseIds = clausesVerified ? selected.clauses!.map(clause => clause.id) : [];
  const [violationRead, auditRead, versionRead] = selected ? await Promise.all([
    clausesVerified && clauseIds.length
      ? sb.from("violation_codes").select("id,code,title,level,clause_id").in("clause_id", clauseIds)
      : Promise.resolve({ data: [] as ViolationCodeRow[], error: clausesVerified ? null : { message: "CLAUSES_UNAVAILABLE" } }),
    sb.rpc("compliance_regulation_audit", { p_entity_id: selected.entity_id }),
    sb.from("compliance_entity_versions")
      .select("id,version_number,published_at,request_id")
      .eq("entity_kind", "regulation")
      .eq("entity_id", selected.entity_id)
      .order("version_number", { ascending: false }),
  ]) : [
    { data: [] as ViolationCodeRow[], error: null },
    { data: [] as AuditEventRow[], error: null },
    { data: [] as VersionRow[], error: null },
  ];
  const violationCodes = (violationRead.data ?? []) as unknown as ViolationCodeRow[];
  const violationCodeIds = violationCodes.map(v => v.id);
  const penaltyRead = violationCodeIds.length
    ? await sb.from("penalty_mappings").select("id,violation_code_id,penalty_ref,mapping_version").in("violation_code_id", violationCodeIds)
    : { data: [] as PenaltyMappingRow[], error: null };
  const penalties = (penaltyRead.data ?? []) as unknown as PenaltyMappingRow[];
  const auditEvents = (auditRead.data ?? []) as unknown as AuditEventRow[];
  const canonicalVersions = (versionRead.data ?? []) as unknown as VersionRow[];
  const versions = !versionRead.error && canonicalVersions.length === 0 && selected?.version_number
    ? [{
      id: selected.current_version_id ?? selected.entity_id,
      version_number: selected.version_number,
      published_at: selected.published_at,
      request_id: selected.request_id,
    }]
    : canonicalVersions;
  const inspectionItems = (clausesVerified ? selected.clauses! : []).flatMap(clause =>
    (clause.inspection_items ?? []).map(item => ({ ...item, clauseRef: clause.clause_ref })));
  const violationsUnavailable = !!violationRead.error;
  const penaltiesUnavailable = violationsUnavailable || !!penaltyRead.error;
  const auditUnavailable = !!auditRead.error;
  const versionsUnavailable = !!versionRead.error;

  const libraryTabs: LibraryTabDef[] = [
    { key: "overview", label: "Overview", count: 1 },
    { key: "items", label: "Inspection Items", count: itemCount },
    { key: "violations", label: "Violations", count: violationsUnavailable ? null : violationCodes.length },
    { key: "penalties", label: "Penalties", count: penaltiesUnavailable ? null : penalties.length },
    { key: "versions", label: "Versions", count: versionsUnavailable ? null : versions.length },
    { key: "audit", label: "Audit History", count: auditUnavailable ? null : auditEvents.length },
  ];
  const libraryPanels = [
    <dl className="desc" key="overview">
      <dt>Authority</dt><dd>{selected?.issuing_authority ?? "Authority not recorded"}</dd>
      <dt>Status</dt><dd>{selected?.operational_status ?? "—"}</dd>
      <dt>Version</dt><dd>{selected?.version_label ?? "—"}</dd>
      <dt>Effective from</dt><dd>{selected?.release_date?.slice(0, 10) ?? "Not recorded"}</dd>
      <dt>Clauses</dt><dd>{clauseCount ?? "Unavailable"}</dd>
    </dl>,
    itemCount === null ? <p className="desc" key="items">Inspection items unavailable — no zero count is claimed.</p>
      : inspectionItems.length === 0 ? <p className="desc" key="items">No records.</p> : (
      <div className="stack" key="items">{inspectionItems.map(item => (
        <div className="panel-row" key={item.id}>
          <span><span className="id-code">{item.code}</span> · {item.title}</span><span className="desc">{item.clauseRef}</span>
        </div>
      ))}</div>
    ),
    violationsUnavailable ? <p className="desc" key="violations">Violations unavailable — no empty result is claimed.</p>
      : violationCodes.length === 0 ? <p className="desc" key="violations">No records.</p> : (
      <div className="stack" key="violations">{violationCodes.map(v => (
        <div className="panel-row" key={v.id}>
          <span><span className="id-code">{v.code}</span> · {v.title}</span><span className={`badge ${v.level === "L1" ? "badge-critical" : v.level === "L2" ? "badge-major" : "badge-warning"}`}>{v.level}</span>
        </div>
      ))}</div>
    ),
    penaltiesUnavailable ? <p className="desc" key="penalties">Penalties unavailable — no empty result is claimed.</p>
      : penalties.length === 0 ? <p className="desc" key="penalties">No records.</p> : (
      <div className="stack" key="penalties">{penalties.map(p => (
        <div className="panel-row" key={p.id}>
          <span>{p.penalty_ref}</span><span className="badge">{p.mapping_version}</span>
        </div>
      ))}</div>
    ),
    versionsUnavailable ? <p className="desc" key="versions">Version history unavailable — no current-only claim is made.</p>
      : versions.length === 0 ? <p className="desc" key="versions">No records.</p> : (
      <div className="stack" key="versions">
        {versions.map(version => <div className="panel-row" key={version.id}>
          <span><span className="id-code">Version {version.version_number}</span>{version.id === (selected?.current_version_id ?? selected?.entity_id) ? " · current" : ""}</span>
          <span className="badge">{version.published_at?.slice(0, 10) ?? "Not recorded"}</span>
        </div>)}
      </div>
    ),
    auditUnavailable ? <p className="desc" key="audit">Audit history unavailable — no empty history is claimed.</p>
      : auditEvents.length === 0 ? <p className="desc" key="audit">No records.</p> : (
      <ul className="timeline" key="audit">{auditEvents.map(event => (
        <li key={event.id}><p className="tl-title">{event.action}</p><p className="tl-meta">{new Date(event.occurred_at).toISOString()}{event.actor ? ` · ${event.actor}` : ""}</p></li>
      ))}</ul>
    ),
  ];

  return (
    <Shell current={routeBase} title="">
      <div className="stack">
        <section className="panel" aria-label="Compliance library navigation">
          <div className="panel-header">
            <strong className="panel-title">Compliance Library</strong>
            <span className="badge">{rows.length} regulations</span>
          </div>
          <div className="panel-body stack">
            <form className="input-affix">
              <input className="input" name="q" defaultValue={typeof sp.q === "string" ? sp.q : ""} placeholder="Search library…" aria-label="Search library" />
            </form>
          {/* CLASS-CONTRACT.md § Compliance Library — authority counts render
              as span.badge. */}
            <div className="row">
              <a className={`btn btn-sm ${!authority ? "btn-primary" : "btn-secondary"}`} href={routeBase}>
                All regulations <span className="badge">{rows.length}</span>
              </a>
              {authorities.map(name => (
                <a key={name} className={`btn btn-sm ${authority === name ? "btn-primary" : "btn-secondary"}`} href={`${routeBase}?authority=${encodeURIComponent(name)}`}>
                  <bdi dir="auto">{name}</bdi> <span className="badge">{rows.filter(row => (row.issuing_authority ?? "Other") === name).length}</span>
                </a>
              ))}
            </div>
            <div className="row">
              <span className="sq-overline">Recently opened</span>
              {rows.slice(0, 2).map(row => (
                <a className="btn btn-ghost btn-sm" key={row.entity_id} href={`${routeBase}?libraryId=${row.entity_id}`}>
                  <bdi dir="auto">{row.title}</bdi>
                </a>
              ))}
            </div>
          </div>
        </section>

        <main className="stack">
          {error ? (
            <div className="sq-banner sq-banner--critical" role="alert"><strong>Compliance Library unavailable.</strong> The read failed; no empty result is claimed. Reference {correlationId}.</div>
          ) : !selected ? (
            <section className="sq-state"><h2>{hasFilters && rows.length > 0 ? "No regulations match the filters" : "No regulations in scope"}</h2><p>{hasFilters && rows.length > 0 ? "The regulation register is not empty. Clear or change the current filters." : "The RLS-scoped read succeeded and returned no regulations."}</p></section>
          ) : (
            <>
              <header className="panel">
                <div className="panel-row">
                  <div className="grow">
                  <p className="sq-overline">{selected.code} · {selected.issuing_authority ?? "Authority not recorded"}</p>
                    <h1><bdi dir="auto">{selected.title}</bdi></h1>
                  <p>Version {selected.version_label} · {selected.operational_status}</p>
                </div>
                  <a className="btn btn-secondary" href={`/admin/regulations?id=${selected.entity_id}`}>Open governed dossier</a>
                </div>
              </header>
              <section className="kpi-grid" aria-label="Regulation facts">
                <article className="panel kpi"><span className="kpi-label">Clauses</span><strong className="kpi-value">{clauseCount ?? "Unavailable"}</strong></article>
                <article className="panel kpi"><span className="kpi-label">Inspection items</span><strong className="kpi-value">{itemCount ?? "Unavailable"}</strong></article>
                <article className="panel kpi"><span className="kpi-label">Effective from</span><strong>{selected.release_date?.slice(0, 10) ?? "Not recorded"}</strong></article>
              </section>
              <section className="panel">
                <div className="panel-header"><h2 className="panel-title">Regulations</h2></div>
                  {/* CLASS-CONTRACT.md § Compliance Library — catalogue toolbar:
                      search, Status and Inspection-type filter-chips, Create.
                      "Inspection type" has no governed field on `regulations`
                      or `inspection_items` (checked the schema) — the chip is
                      structurally present but inert rather than fabricating a
                      filter over a field that does not exist. */}
                  <form className="grid-toolbar" method="get" action={routeBase}>
                    {authority ? <input type="hidden" name="authority" value={authority} /> : null}
                    <div className="input-affix"><input className="input" type="search" name="q" defaultValue={typeof sp.q === "string" ? sp.q : ""} placeholder="Search catalogue…" aria-label="Search catalogue" /></div>
                    <select className="select" name="status" defaultValue={status} aria-label="Status">
                      <option value="">Status</option>
                      {statuses.map(value => <option value={value} key={value}>{value}</option>)}
                    </select>
                    <button type="button" className="filter-chip" disabled title="No governed inspection-type field exists on this data yet">Inspection type</button>
                    <button type="submit" className="btn btn-secondary btn-sm">Apply</button>
                    <span className="sq-toolbar__spacer" />
                    <a className="btn btn-primary btn-sm" href="/admin/compliance-requests/new">Create</a>
                  </form>
                  <div className="panel-body stack">
                  {filtered.map(row => (
                    // CLASS-CONTRACT.md § Compliance Library — regulation rows
                    // carry id-code (the regulation code) + a status badge. The
                    // contract names badge-plan, which is NOT defined in either
                    // stylesheet, so the defined base .badge is used instead.
                    // Reported as a design-system gap, not worked around here.
                      <a className="panel" key={row.entity_id} href={`${routeBase}?libraryId=${row.entity_id}${authority ? `&authority=${encodeURIComponent(authority)}` : ""}`} aria-current={row.entity_id === selected.entity_id ? "true" : undefined}>
                        <span className="panel-row">
                          <span className="grow"><strong><bdi dir="auto">{row.title}</bdi></strong><br /><span className="id-code">{row.code}</span></span>
                          <span className="row"><span className="badge">{row.operational_status}</span><span className="badge">{row.version_label}</span><span aria-hidden="true">›</span></span>
                        </span>
                    </a>
                  ))}
                  </div>
                </section>
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <p className="sq-overline">Source-controlled compliance</p>
                    <h2 className="panel-title">Regulation workspace</h2>
                  </div>
                  <div className="row">
                    {selected.request_id ? <a className="btn btn-secondary btn-sm" href={`/admin/compliance-requests/${selected.request_id}`}>View request</a> : null}
                    <a className="btn btn-secondary btn-sm" href={`/admin/compliance-requests/new?request_type=modify&target_entity_id=${selected.entity_id}`}>Modify through request</a>
                  </div>
                </div>
                <div className="panel-body stack">
                  <div className="alert alert-immutable"><strong>Approved content — read only.</strong> Create and modify actions open a governed configuration request.</div>
                  <LibraryTabs tabs={libraryTabs} panels={libraryPanels} />
                  <div className="alert alert-immutable"><strong>Read-only presentation.</strong> Authoring and maker-checker publication remain in the governed dossier and its database guards.</div>
                </div>
                </section>
            </>
          )}
        </main>
      </div>
    </Shell>
  );
}
