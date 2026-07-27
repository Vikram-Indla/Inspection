import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import LibraryTabs, { type LibraryTabDef } from "./LibraryTabs";

export const dynamic = "force-dynamic";

type RegulationRow = {
  id: string;
  code: string;
  title: string;
  issuing_authority: string | null;
  status: string;
  version_label: string;
  effective_from: string | null;
  regulation_clauses: Array<{ id: string; clause_ref: string; inspection_items: Array<{ id: string; code: string; title: string }> | null }> | null;
};
type ViolationCodeRow = { id: string; code: string; title: string; level: string; clause_id: string | null };
type PenaltyMappingRow = { id: string; violation_code_id: string; penalty_ref: string; mapping_version: string };
type AuditEventRow = { id: number; action: string; occurred_at: string; actor: string | null };

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
  const { data, error } = await sb.from("regulations")
    .select("id,code,title,issuing_authority,status,version_label,effective_from,regulation_clauses(id,clause_ref,inspection_items(id,code,title))")
    .order("title");
  const rows = (data ?? []) as unknown as RegulationRow[];
  const authorities = Array.from(new Set(rows.map(row => row.issuing_authority ?? "Other"))).sort();
  const statuses = Array.from(new Set(rows.map(row => row.status))).sort();
  const filtered = rows.filter(row => {
    const matchesAuthority = !authority || (row.issuing_authority ?? "Other") === authority;
    const matchesStatus = !status || row.status === status;
    const haystack = `${row.code} ${row.title} ${row.issuing_authority ?? ""}`.toLowerCase();
    return matchesAuthority && matchesStatus && (!query || haystack.includes(query));
  });
  const selected = rows.find(row => row.id === selectedId) ?? filtered[0] ?? null;
  const itemCount = selected?.regulation_clauses?.reduce(
    (total, clause) => total + (clause.inspection_items?.length ?? 0),
    0,
  ) ?? 0;

  // Six-tab workspace data — scoped to the selected regulation only.
  // CLASS-CONTRACT.md § Compliance Library: Overview · Inspection Items ·
  // Violations · Penalties · Versions · Audit History. Real reads; empty
  // tabs render "No records", never fabricated rows.
  const clauseIds = (selected?.regulation_clauses ?? []).map(clause => clause.id);
  const [violationRead, auditRead] = selected ? await Promise.all([
    clauseIds.length
      ? sb.from("violation_codes").select("id,code,title,level,clause_id").in("clause_id", clauseIds)
      : Promise.resolve({ data: [] as ViolationCodeRow[], error: null }),
    sb.from("audit_events").select("id,action,occurred_at,actor").eq("object_type", "regulation").eq("object_id", selected.id).order("occurred_at", { ascending: false }).limit(50),
  ]) : [{ data: [] as ViolationCodeRow[], error: null }, { data: [] as AuditEventRow[], error: null }];
  const violationCodes = (violationRead.data ?? []) as unknown as ViolationCodeRow[];
  const violationCodeIds = violationCodes.map(v => v.id);
  const penaltyRead = violationCodeIds.length
    ? await sb.from("penalty_mappings").select("id,violation_code_id,penalty_ref,mapping_version").in("violation_code_id", violationCodeIds)
    : { data: [] as PenaltyMappingRow[], error: null };
  const penalties = (penaltyRead.data ?? []) as unknown as PenaltyMappingRow[];
  const auditEvents = (auditRead.data ?? []) as unknown as AuditEventRow[];
  const inspectionItems = (selected?.regulation_clauses ?? []).flatMap(clause =>
    (clause.inspection_items ?? []).map(item => ({ ...item, clauseRef: clause.clause_ref })));

  const libraryTabs: LibraryTabDef[] = [
    { key: "overview", label: "Overview", count: 1 },
    { key: "items", label: "Inspection Items", count: inspectionItems.length },
    { key: "violations", label: "Violations", count: violationCodes.length },
    { key: "penalties", label: "Penalties", count: penalties.length },
    { key: "versions", label: "Versions", count: selected ? 1 : 0 },
    { key: "audit", label: "Audit History", count: auditEvents.length },
  ];
  const libraryPanels = [
    <dl className="desc" key="overview">
      <dt>Authority</dt><dd>{selected?.issuing_authority ?? "Authority not recorded"}</dd>
      <dt>Status</dt><dd>{selected?.status ?? "—"}</dd>
      <dt>Version</dt><dd>{selected?.version_label ?? "—"}</dd>
      <dt>Effective from</dt><dd>{selected?.effective_from?.slice(0, 10) ?? "Not recorded"}</dd>
      <dt>Clauses</dt><dd>{selected?.regulation_clauses?.length ?? 0}</dd>
    </dl>,
    inspectionItems.length === 0 ? <p className="desc" key="items">No records.</p> : (
      <div className="stack" key="items">{inspectionItems.map(item => (
        <div className="row" key={item.id} style={{ justifyContent: "space-between" }}>
          <span><span className="id-code">{item.code}</span> · {item.title}</span><span className="desc">{item.clauseRef}</span>
        </div>
      ))}</div>
    ),
    violationCodes.length === 0 ? <p className="desc" key="violations">No records.</p> : (
      <div className="stack" key="violations">{violationCodes.map(v => (
        <div className="row" key={v.id} style={{ justifyContent: "space-between" }}>
          <span><span className="id-code">{v.code}</span> · {v.title}</span><span className={`badge ${v.level === "L1" ? "badge-critical" : v.level === "L2" ? "badge-major" : "badge-warning"}`}>{v.level}</span>
        </div>
      ))}</div>
    ),
    penalties.length === 0 ? <p className="desc" key="penalties">No records.</p> : (
      <div className="stack" key="penalties">{penalties.map(p => (
        <div className="row" key={p.id} style={{ justifyContent: "space-between" }}>
          <span>{p.penalty_ref}</span><span className="badge">{p.mapping_version}</span>
        </div>
      ))}</div>
    ),
    !selected ? <p className="desc" key="versions">No records.</p> : (
      <div className="stack" key="versions">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <span><span className="id-code">{selected.version_label}</span> · current</span><span className="badge">{selected.effective_from?.slice(0, 10) ?? "Not recorded"}</span>
        </div>
        <p className="desc">Only the current version is on record — no version-history contract is available.</p>
      </div>
    ),
    auditEvents.length === 0 ? <p className="desc" key="audit">No records.</p> : (
      <ul className="timeline" key="audit">{auditEvents.map(event => (
        <li key={event.id}><p className="tl-title">{event.action}</p><p className="tl-meta">{new Date(event.occurred_at).toISOString()}{event.actor ? ` · ${event.actor}` : ""}</p></li>
      ))}</ul>
    ),
  ];

  return (
    <Shell current={routeBase} title="">
      <div className="rv-library">
        <aside className="rv-library__rail" aria-label="Compliance library navigation">
          <form className="rv-library__search">
            <span aria-hidden="true">⌕</span>
            <input name="q" defaultValue={typeof sp.q === "string" ? sp.q : ""} placeholder="Search library…" aria-label="Search library" />
          </form>
          {/* CLASS-CONTRACT.md § Compliance Library — authority counts render
              as span.badge. */}
          <a className={!authority ? "is-active" : ""} href={routeBase}>
            <span>All regulations</span><span className="badge">{rows.length}</span>
          </a>
          {authorities.map(name => (
            <a key={name} className={authority === name ? "is-active" : ""} href={`${routeBase}?authority=${encodeURIComponent(name)}`}>
              <span>{name}</span><span className="badge">{rows.filter(row => (row.issuing_authority ?? "Other") === name).length}</span>
            </a>
          ))}
          <p className="rv-library__eyebrow">Recently opened</p>
          {rows.slice(0, 2).map(row => <a className="rv-library__recent" key={row.id} href={`${routeBase}?libraryId=${row.id}`}>{row.title}</a>)}
        </aside>

        <main className="rv-library__workspace">
          {error ? (
            <div className="sq-banner sq-banner--critical" role="alert"><strong>Compliance Library unavailable.</strong> The read failed; no empty result is claimed.</div>
          ) : !selected ? (
            <section className="sq-state"><h2>No regulations in scope</h2><p>The RLS-scoped read succeeded and returned no regulations.</p></section>
          ) : (
            <>
              <header className="rv-library__header">
                <div>
                  <p className="sq-overline">{selected.code} · {selected.issuing_authority ?? "Authority not recorded"}</p>
                  <h1>{selected.title}</h1>
                  <p>Version {selected.version_label} · {selected.status}</p>
                </div>
                <a className="sq-btn sq-btn--secondary" href={`/admin/regulations?id=${selected.id}`}>Open governed dossier</a>
              </header>
              <section className="rv-library__facts">
                <div><span>Clauses</span><strong>{selected.regulation_clauses?.length ?? 0}</strong></div>
                <div><span>Inspection items</span><strong>{itemCount}</strong></div>
                <div><span>Effective from</span><strong>{selected.effective_from?.slice(0, 10) ?? "Not recorded"}</strong></div>
              </section>
              <div className="rv-library__split">
                <section className="rv-library__list">
                  <h2>Regulations</h2>
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
                    <a className="btn btn-primary btn-sm" href="/admin/compliance-requests/new" style={{ marginInlineStart: "auto" }}>Create</a>
                  </form>
                  {filtered.map(row => (
                    // CLASS-CONTRACT.md § Compliance Library — regulation rows
                    // carry id-code (the regulation code) + a status badge. The
                    // contract names badge-plan, which is NOT defined in either
                    // stylesheet, so the defined base .badge is used instead.
                    // Reported as a design-system gap, not worked around here.
                    <a className={row.id === selected.id ? "is-selected" : ""} key={row.id} href={`${routeBase}?libraryId=${row.id}${authority ? `&authority=${encodeURIComponent(authority)}` : ""}`}>
                      <div><strong>{row.title}</strong><span><span className="id-code">{row.code}</span> · <span className="badge">{row.version_label}</span></span></div><span aria-hidden="true">›</span>
                    </a>
                  ))}
                </section>
                <section className="rv-library__detail">
                  <p className="rv-library__eyebrow">Source-controlled compliance</p>
                  <h2>Regulation workspace</h2>
                  <LibraryTabs tabs={libraryTabs} panels={libraryPanels} />
                  <div className="sq-banner"><strong>Read-only presentation.</strong> Authoring and maker-checker publication remain in the governed dossier and its database guards.</div>
                </section>
              </div>
            </>
          )}
        </main>
      </div>
    </Shell>
  );
}
