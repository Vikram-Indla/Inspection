/* @retiring 2026-08-09 · replaced-by components/sections/regulations/regulation-workspace (T-038 rebuild) · pending overview/items/violations/penalties/versions/audit panels on SAQEEL primitives · delete-when 0-imports */
import LibraryTabs, { type LibraryTabDef } from "@/app/(app)/compliance/LibraryTabs";
import { readRegulationWorkspace } from "@/features/regulations/workspace-source";

export default async function RegulationWorkspace({ selectedId }: { selectedId: string }) {
  const workspace = await readRegulationWorkspace(selectedId);
  if (!workspace) return null;

  const {
    regulation, clauseCount, itemCount, items, violations, penalties, versions, auditEvents,
    violationsUnavailable, penaltiesUnavailable, versionsUnavailable, auditUnavailable,
  } = workspace;

  const tabs: LibraryTabDef[] = [
    { key: "overview", label: "Overview", count: 1 },
    { key: "items", label: "Inspection Items", count: itemCount },
    { key: "violations", label: "Violations", count: violationsUnavailable ? null : violations.length },
    { key: "penalties", label: "Penalties", count: penaltiesUnavailable ? null : penalties.length },
    { key: "versions", label: "Versions", count: versionsUnavailable ? null : versions.length },
    { key: "audit", label: "Audit History", count: auditUnavailable ? null : auditEvents.length },
  ];

  const panels = [
    <dl className="desc" key="overview">
      <dt>Authority</dt><dd>{regulation.issuing_authority ?? "Authority not recorded"}</dd>
      <dt>Status</dt><dd>{regulation.operational_status}</dd>
      <dt>Version</dt><dd>{regulation.version_label ?? "—"}</dd>
      <dt>Effective from</dt><dd>{regulation.release_date?.slice(0, 10) ?? "Not recorded"}</dd>
      <dt>Clauses</dt><dd>{clauseCount ?? "Unavailable"}</dd>
    </dl>,
    itemCount === null ? <p className="desc" key="items">Inspection items unavailable — no zero count is claimed.</p>
      : items.length === 0 ? <p className="desc" key="items">No records.</p> : (
      <div className="stack" key="items">{items.map(item => (
        <div className="panel-row" key={item.id}>
          <span><span className="id-code">{item.code}</span> · {item.title}</span>
          <span className="desc">{item.clauseRef}</span>
        </div>
      ))}</div>
    ),
    violationsUnavailable ? <p className="desc" key="violations">Violations unavailable — no empty result is claimed.</p>
      : violations.length === 0 ? <p className="desc" key="violations">No records.</p> : (
      <div className="stack" key="violations">{violations.map(violation => (
        <div className="panel-row" key={violation.id}>
          <span><span className="id-code">{violation.code}</span> · {violation.title}</span>
          <span className={`badge ${violation.level === "L1" ? "badge-critical" : violation.level === "L2" ? "badge-major" : "badge-warning"}`}>{violation.level}</span>
        </div>
      ))}</div>
    ),
    penaltiesUnavailable ? <p className="desc" key="penalties">Penalties unavailable — no empty result is claimed.</p>
      : penalties.length === 0 ? <p className="desc" key="penalties">No records.</p> : (
      <div className="stack" key="penalties">{penalties.map(penalty => (
        <div className="panel-row" key={penalty.id}>
          <span>{penalty.penalty_ref}</span><span className="badge">{penalty.mapping_version}</span>
        </div>
      ))}</div>
    ),
    versionsUnavailable ? <p className="desc" key="versions">Version history unavailable — no current-only claim is made.</p>
      : versions.length === 0 ? <p className="desc" key="versions">No records.</p> : (
      <div className="stack" key="versions">{versions.map(version => (
        <div className="panel-row" key={version.id}>
          <span>
            <span className="id-code">Version {version.version_number}</span>
            {version.id === (regulation.current_version_id ?? regulation.entity_id) ? " · current" : ""}
          </span>
          <span className="badge">{version.published_at?.slice(0, 10) ?? "Not recorded"}</span>
        </div>
      ))}</div>
    ),
    auditUnavailable ? <p className="desc" key="audit">Audit history unavailable — no empty history is claimed.</p>
      : auditEvents.length === 0 ? <p className="desc" key="audit">No records.</p> : (
      <ul className="timeline" key="audit">{auditEvents.map(event => (
        <li key={event.id}>
          <p className="tl-title">{event.action}</p>
          <p className="tl-meta">{event.occurred_at}{event.actor ? ` · ${event.actor}` : ""}</p>
        </li>
      ))}</ul>
    ),
  ];

  return (
    <main className="stack">
      <header className="panel">
        <div className="panel-row">
          <div className="grow">
            <p className="sq-overline">{regulation.code} · {regulation.issuing_authority ?? "Authority not recorded"}</p>
            <h2><bdi dir="auto">{regulation.title}</bdi></h2>
            <p>Version {regulation.version_label} · {regulation.operational_status}</p>
          </div>
          <a className="btn btn-secondary" href={`/admin/regulations?id=${regulation.entity_id}`}>Open Full Record</a>
        </div>
      </header>
      <section className="kpi-grid" aria-label="Regulation facts">
        <article className="panel kpi"><span className="kpi-label">Clauses</span><strong className="kpi-value">{clauseCount ?? "Unavailable"}</strong></article>
        <article className="panel kpi"><span className="kpi-label">Inspection items</span><strong className="kpi-value">{itemCount ?? "Unavailable"}</strong></article>
        <article className="panel kpi"><span className="kpi-label">Effective from</span><strong>{regulation.release_date?.slice(0, 10) ?? "Not recorded"}</strong></article>
      </section>
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="sq-overline">Source-controlled compliance</p>
            <h2 className="panel-title">Regulation detail</h2>
          </div>
          <div className="row">
            {regulation.request_id ? <a className="btn btn-secondary btn-sm" href={`/admin/compliance-requests/${regulation.request_id}`}>View request</a> : null}
            <a className="btn btn-secondary btn-sm" href={`/admin/compliance-requests/new?request_type=modify&target_entity_id=${regulation.entity_id}`}>Modify through request</a>
          </div>
        </div>
        <div className="panel-body stack">
          <div className="alert alert-immutable"><strong>Approved content — locked and cannot be edited here.</strong> To create or change it, open a configuration request.</div>
          <LibraryTabs tabs={tabs} panels={panels} />
          <div className="alert alert-immutable"><strong>Read-only view.</strong> Authoring and maker-checker approval stay in the full record and its database checks.</div>
        </div>
      </section>
    </main>
  );
}
