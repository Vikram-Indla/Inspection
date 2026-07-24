import Link from "next/link";
import Shell from "@/components/Shell";
import { getServerUser, supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type RequestRow = {
  id: string; request_number: string; title: string; request_type: string; owner_id: string;
  submitted_at: string | null; current_revision: number; status: string; correlation_id: string;
};
type ComponentRow = { request_id: string; revision_number: number; component_status: string; entity_kind: string };
type DependencyRow = { request_id: string; revision_number: number };

const FILTERS = {
  pending: { label: "Pending Review", statuses: ["pending_review"] },
  partial: { label: "Partially Approved", statuses: ["partially_approved"] },
  publish: { label: "Ready to Publish", statuses: ["approved"] },
} as const;

const statusLabel = (value: string) => value.split("_").map(part => part[0]?.toUpperCase() + part.slice(1)).join(" ");

export default async function ComplianceApprovalQueue({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filterKey = typeof sp.view === "string" && sp.view in FILTERS ? sp.view as keyof typeof FILTERS : "pending";
  const filter = FILTERS[filterKey];
  const sb = await supabaseServer();
  const { data: { user } } = await getServerUser();
  const requestRead = await sb.from("compliance_configuration_requests")
    .select("id,request_number,title,request_type,owner_id,submitted_at,current_revision,status,correlation_id")
    .in("status", [...filter.statuses]).order("submitted_at", { ascending: true });
  const scopedRows = (requestRead.data ?? []) as RequestRow[];
  const ownRows = scopedRows.filter(row => row.owner_id === user?.id);
  const rows = scopedRows.filter(row => row.owner_id !== user?.id);
  const ids = rows.map(row => row.id);
  const [componentRead, dependencyRead] = ids.length ? await Promise.all([
    sb.from("compliance_request_components").select("request_id,revision_number,component_status,entity_kind").in("request_id", ids),
    sb.from("compliance_request_component_dependencies").select("request_id,revision_number").in("request_id", ids),
  ]) : [{ data: [], error: null }, { data: [], error: null }];
  const readFailed = !!requestRead.error || !!componentRead.error || !!dependencyRead.error;
  const components = (componentRead.data ?? []) as ComponentRow[];
  const dependencies = (dependencyRead.data ?? []) as DependencyRow[];

  return (
    <Shell current="/admin/compliance-approvals" title="Compliance Approval Queue" context={<><span className="badge badge-info">CCR maker-checker</span><span className="t-caption">Distinct from Inspection Review &amp; Approval</span></>}>
      <div className="sq-banner" role="note"><strong>Compliance configuration decisions only.</strong> This queue reviews CCR components and publication readiness. It does not contain inspection reports or Level 2 inspection reviews.</div>
      <div className="ccr-register-head"><div><h3>Review workload</h3><p className="t-caption">RLS-scoped requests are ordered by submitted time. Age is shown as a fact; no unapproved SLA or priority is inferred.</p></div><Link className="btn btn-secondary btn-touch" href="/admin/compliance-requests">Request register</Link></div>
      <nav className="cmp-approval-filters" aria-label="Approval queue status">
        {Object.entries(FILTERS).map(([key, entry]) => <Link key={key} className={`btn btn-touch ${filterKey === key ? "btn-primary btn-lg" : "btn-secondary"}`} aria-current={filterKey === key ? "page" : undefined} href={`/admin/compliance-approvals?view=${key}`}>{entry.label}</Link>)}
      </nav>
      {ownRows.length ? <div className="sq-banner sq-banner--warning" role="status"><strong>{ownRows.length} own request{ownRows.length === 1 ? "" : "s"} excluded.</strong> Makers cannot decide or publish their own requests. The database RPC enforces the same rule.</div> : null}
      {readFailed ? <div className="panel"><div className="sq-state" role="alert"><span className="sq-state__glyph" aria-hidden="true">⚠</span><h4>Approval Queue unavailable</h4><p className="t-caption">One or more governed reads failed. Workload, progress, and readiness have not been inferred.</p><a className="sq-link" href={`/admin/compliance-approvals?view=${filterKey}`}>Retry queue</a></div></div> : rows.length === 0 ? <div className="panel"><div className="sq-state" role="status"><span className="sq-state__glyph" aria-hidden="true">✓</span><h4>No {filter.label.toLowerCase()} requests in your scope</h4><p className="t-caption">The RLS-scoped read succeeded and returned zero eligible maker-checker assignments for this view.</p></div></div> : <div className="cmp-approval-list">{rows.map(row => {
        const current = components.filter(component => component.request_id === row.id && component.revision_number === row.current_revision);
        const counts = current.reduce<Record<string, number>>((acc, component) => ({ ...acc, [component.component_status]: (acc[component.component_status] ?? 0) + 1 }), {});
        const dependencyCount = dependencies.filter(dependency => dependency.request_id === row.id && dependency.revision_number === row.current_revision).length;
        return <article className="panel cmp-approval-card" key={row.id}><header><div><p className="sq-overline"><bdi>{row.request_number}</bdi> · {row.request_type === "create" ? "Create" : "Modify"} · Revision {row.current_revision}</p><h3>{row.title}</h3></div><span className={`sq-lozenge ccr-status ccr-status--${row.status}`}>{statusLabel(row.status)}</span></header><dl className="cmp-approval-facts"><div><dt>Submitted</dt><dd className="numeric">{row.submitted_at ? new Date(row.submitted_at).toISOString() : "Not recorded"}</dd></div><div><dt>Components</dt><dd>{current.length}</dd></div><div><dt>Decision progress</dt><dd>{Object.entries(counts).map(([status, count]) => `${statusLabel(status)} ${count}`).join(" · ") || "No current components"}</dd></div><div><dt>Dependencies</dt><dd>{dependencyCount}</dd></div></dl><footer><span className="t-caption">Correlation <bdi>{row.correlation_id}</bdi></span><Link className="btn btn-primary btn-lg btn-touch" href={`/admin/compliance-requests/${row.id}?from=approval-queue`}>Open review workspace</Link></footer></article>;
      })}</div>}
    </Shell>
  );
}
