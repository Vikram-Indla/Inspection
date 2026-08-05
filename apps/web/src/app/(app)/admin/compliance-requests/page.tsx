import Link from "next/link";
import Shell from "@/app/(app)/admin/_components/AdminShell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type RequestRow = {
  id: string; request_number: string; title: string; description: string | null;
  request_type: string; owner_id: string; created_at: string; submitted_at: string | null;
  current_revision: number; status: string; correlation_id: string;
};

const statusLabel: Record<string, string> = {
  draft: "Draft", pending_review: "Pending Review", returned: "Returned",
  partially_approved: "Partially Approved", approved: "Approved", rejected: "Rejected", cancelled: "Cancelled",
};

export default async function ComplianceRequestRegister() {
  const { t } = await useT();
  const sb = await supabaseServer();
  const [{ data, error }, roleRead] = await Promise.all([
    sb.from("compliance_configuration_requests")
      .select("id,request_number,title,description,request_type,owner_id,created_at,submitted_at,current_revision,status,correlation_id")
      .order("created_at", { ascending: false }),
    sb.from("user_roles").select("role_key"),
  ]);
  const rows = (data ?? []) as RequestRow[];
  const canCreate = !roleRead.error && (roleRead.data ?? []).some(row => row.role_key === "admin");
  return (
    <Shell current="/admin/compliance-requests" title={t("admin.ccr.register.title", "Compliance Configuration Requests")}
      context={<span className="t-caption">Request list</span>}>
      <div className="ccr-toolbar">
        <div><h3>{t("admin.ccr.register.heading", "Request list")}</h3><p className="t-caption">Create and change Regulations, Inspection Items, Violations and Penalties through final submitted versions and two-person review.</p></div>
        {canCreate ? <Link className="btn btn-primary btn-lg btn-touch" href="/admin/compliance-requests/new">Create Request</Link>
          : <span className="t-caption" role="note">Creating a request needs a Compliance or Form Admin role.</span>}
      </div>
      {error ? (
        <div className="panel"><div className="saqeel-state" role="alert"><span className="saqeel-state__glyph" aria-hidden="true">⚠</span><h4>Request list can&apos;t load</h4><p className="t-caption">The read failed. Counts and status are not shown.</p><a className="sq-link" href="/admin/compliance-requests">Retry</a></div></div>
      ) : rows.length === 0 ? (
        // The toolbar's "Create Request" button above stays visible in every
        // state, including this one — a second copy here duplicated it.
        <div className="panel"><div className="saqeel-state" role="status"><span className="saqeel-state__glyph" aria-hidden="true">◇</span><h4>No configuration requests</h4><p className="t-caption">The read worked and returned zero requests. Create the first request when you're allowed to.</p></div></div>
      ) : (
        <div className="table-wrap"><table className="table"><caption className="sr-only">Compliance Configuration Request list</caption><thead><tr><th scope="col">Request</th><th scope="col">Type</th><th scope="col">Status</th><th scope="col">Revision</th><th scope="col">Created</th><th scope="col">Open</th></tr></thead><tbody>
          {rows.map(row => <tr key={row.id}><th scope="row"><strong>{row.request_number}</strong><div className="t-caption">{row.title}</div></th><td>{row.request_type === "create" ? "Create" : "Modify"}</td><td><span className={`badge ccr-status ccr-status--${row.status}`}>{statusLabel[row.status] ?? row.status}</span></td><td className="numeric">R{row.current_revision}</td><td className="numeric">{new Date(row.created_at).toISOString().slice(0, 10)}</td><td><Link className="sq-link" href={`/admin/compliance-requests/${row.id}`}>Open request</Link></td></tr>)}
        </tbody></table></div>
      )}
    </Shell>
  );
}
