import Link from "next/link";
import Shell from "@/components/Shell";
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
  const canCreate = !roleRead.error && (roleRead.data ?? []).some(row => ["compliance_admin", "form_admin"].includes(row.role_key));
  return (
    <Shell current="/admin/compliance-requests" title={t("admin.ccr.register.title", "Compliance Configuration Requests")}
      context={<><span className="ax-lozenge ax-lozenge--info">CMP-REQ-CCR-001..010</span><span className="ax-caption">Governed request register · RLS-scoped</span></>}>
      <div className="ccr-toolbar">
        <div><h3>{t("admin.ccr.register.heading", "Request register")}</h3><p className="ax-caption">Create and modify Regulations, Inspection Items, Violations and Penalties through immutable revisions and maker-checker review.</p></div>
        {canCreate ? <Link className="ax-btn ax-btn--prominent" href="/admin/compliance-requests/new">Create Request</Link>
          : <span className="ax-caption" role="note">Request creation requires Compliance or Form Admin authority.</span>}
      </div>
      {error ? (
        <div className="ax-surface"><div className="ax-state" role="alert"><span className="ax-state__glyph" aria-hidden="true">⚠</span><h4>Request register unavailable</h4><p className="ax-caption">The read failed. Counts and status have not been inferred.</p><a className="ax-link" href="/admin/compliance-requests">Retry</a></div></div>
      ) : rows.length === 0 ? (
        <div className="ax-surface"><div className="ax-state" role="status"><span className="ax-state__glyph" aria-hidden="true">◇</span><h4>No configuration requests</h4><p className="ax-caption">The RLS-scoped read succeeded and returned zero requests. Create the first governed request when authorized.</p>{canCreate ? <Link className="ax-btn ax-btn--secondary" href="/admin/compliance-requests/new">Create Request</Link> : null}</div></div>
      ) : (
        <div className="ax-tablewrap"><table className="ax-table"><caption className="sr-only">Compliance Configuration Request register</caption><thead><tr><th scope="col">Request</th><th scope="col">Type</th><th scope="col">Status</th><th scope="col">Revision</th><th scope="col">Created</th><th scope="col">Open</th></tr></thead><tbody>
          {rows.map(row => <tr key={row.id}><th scope="row"><strong>{row.request_number}</strong><div className="ax-caption">{row.title}</div></th><td>{row.request_type === "create" ? "Create" : "Modify"}</td><td><span className={`ax-lozenge ccr-status ccr-status--${row.status}`}>{statusLabel[row.status] ?? row.status}</span></td><td className="ax-numeric">R{row.current_revision}</td><td className="ax-numeric">{new Date(row.created_at).toISOString().slice(0, 10)}</td><td><Link className="ax-link" href={`/admin/compliance-requests/${row.id}`}>Open workspace</Link></td></tr>)}
        </tbody></table></div>
      )}
    </Shell>
  );
}
