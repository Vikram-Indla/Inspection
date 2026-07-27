import Shell from "@/components/Shell";
import { getServerUser, supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type RequestRow = {
  id: string;
  request_number: string;
  title: string;
  request_type: string;
  owner_id: string;
  submitted_at: string | null;
  current_revision: number;
  status: string;
};
type ComponentRow = { request_id: string; revision_number: number; entity_kind: string; component_status: string };

export default async function ApprovalQueue() {
  const sb = await supabaseServer();
  const { data: { user } } = await getServerUser();
  const [{ data, error }, componentRead] = await Promise.all([
    sb.from("compliance_configuration_requests")
      .select("id,request_number,title,request_type,owner_id,submitted_at,current_revision,status")
      .in("status", ["pending_review", "partially_approved", "approved"])
      .order("submitted_at", { ascending: true }),
    sb.from("compliance_request_components")
      .select("request_id,revision_number,entity_kind,component_status"),
  ]);
  const allRows = (data ?? []) as RequestRow[];
  const rows = allRows.filter(row => row.owner_id !== user?.id);
  const components = (componentRead.data ?? []) as ComponentRow[];

  return (
    <Shell current="/compliance/approvals" title="">
      <div className="rv-approval">
        {error || componentRead.error ? <div className="sq-banner sq-banner--critical" role="alert"><strong>Approval Queue unavailable.</strong> No workload claim is made.</div> : null}
        <header className="rv-approval__heading">
          <div><p className="sq-overline">Compliance configuration</p><h1>Approval Queue</h1><p>Object-level maker-checker decisions and governed publication readiness.</p></div>
          <span className="sq-lozenge sq-lozenge--warning">{rows.length} pending</span>
        </header>
        <div className="rv-approval__cards">
          {rows.map((row, index) => {
            const current = components.filter(item => item.request_id === row.id && item.revision_number === row.current_revision);
            const decided = current.filter(item => ["approved", "rejected"].includes(item.component_status)).length;
            const kinds = ["regulation", "inspection_item", "violation", "penalty"];
            return (
              <article className={`rv-approval__card ${index === 0 ? "is-selected" : ""}`} key={row.id}>
                <div>
                  <p className="sq-overline">{row.request_type === "create" ? "Create" : "Modify"} regulation</p>
                  <h2>{row.title}</h2>
                  <p>{row.request_number} · Version {row.current_revision}</p>
                  <div className="rv-approval__chips">
                    {kinds.map(kind => <span key={kind}>◇ {current.filter(item => item.entity_kind === kind).length} {kind.replace("_", " ")}</span>)}
                  </div>
                  <small>{row.submitted_at ? new Date(row.submitted_at).toLocaleString("en-SA") : "Submission time not recorded"}</small>
                </div>
                <span className="sq-lozenge sq-lozenge--warning">• {row.status.replaceAll("_", " ")}</span>
                <a aria-label={`Review ${row.title}`} href={`/admin/compliance-requests/${row.id}?from=approval-queue`}>Open review</a>
              </article>
            );
          })}
          {!error && !componentRead.error && rows.length === 0 ? (
            <section className="sq-state" role="status">
              <h2>No eligible requests in your scope</h2>
              <p>The RLS-scoped maker-checker read succeeded and returned zero requests. Requests owned by you remain excluded from your decision queue.</p>
            </section>
          ) : null}
        </div>
        <nav className="rv-approval__steps" aria-label="Review object sequence">
          {[
            ["Overview", "Read"],
            ["Regulation", `${components.filter(item => item.entity_kind === "regulation" && ["approved", "rejected"].includes(item.component_status)).length} decided`],
            ["Inspection items", `${components.filter(item => item.entity_kind === "inspection_item" && ["approved", "rejected"].includes(item.component_status)).length} decided`],
            ["Violations", `${components.filter(item => item.entity_kind === "violation" && ["approved", "rejected"].includes(item.component_status)).length} decided`],
            ["Penalties", `${components.filter(item => item.entity_kind === "penalty" && ["approved", "rejected"].includes(item.component_status)).length} decided`],
            ["Summary", "Blocked"],
          ].map(([label, meta], index) => <span className={index === 0 ? "is-current" : ""} key={label}><strong>{label}</strong><small>{meta}</small></span>)}
        </nav>
      </div>
    </Shell>
  );
}
