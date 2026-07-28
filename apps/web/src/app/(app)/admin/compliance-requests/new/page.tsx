import Link from "next/link";
import Shell from "@/app/(app)/admin/_components/AdminShell";
import ActionForm from "../ActionForm";
import { createComplianceRequest } from "../actions";

export default async function NewComplianceRequest({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const requestedType = sp.request_type === "modify" ? "modify" : "create";
  const requestedTitle = typeof sp.title === "string" ? sp.title.slice(0, 180) : "";
  const requestedDescription = typeof sp.description === "string" ? sp.description.slice(0, 2000) : "";
  return (
    <Shell current="/admin/compliance-requests" title="Create Compliance Configuration Request"
      context={<span className="badge badge-info">Draft · Revision 1</span>}>
      <p className="t-caption"><Link className="sq-link" href="/admin/compliance-requests">← Request register</Link></p>
      <section className="panel ccr-form-card" aria-labelledby="ccr-create-heading">
        <h3 id="ccr-create-heading">Request foundation</h3>
        <p className="t-caption">Create the governed envelope first. Components and dependencies are added in the request workspace.</p>
        <ActionForm action={createComplianceRequest} className="ccr-form" redirectOnCreate>
          <label className="sq-field"><span className="sq-field__label">Request type</span><select className="sq-select" name="request_type" required defaultValue={requestedType}><option value="create">Create</option><option value="modify">Modify</option></select></label>
          <label className="sq-field"><span className="sq-field__label">Title</span><input className="sq-input" name="title" required maxLength={180} defaultValue={requestedTitle} /></label>
          <label className="sq-field ccr-span"><span className="sq-field__label">Description</span><textarea className="sq-textarea" name="description" rows={4} defaultValue={requestedDescription} /></label>
          <label className="sq-field ccr-span"><span className="sq-field__label">Initial comments</span><textarea className="sq-textarea" name="comments" rows={3} /></label>
          <div className="ccr-span ccr-actions"><button className="btn btn-primary btn-lg btn-touch" type="submit">Create draft request</button><Link className="btn btn-secondary btn-touch" href="/admin/compliance-requests">Cancel</Link></div>
        </ActionForm>
      </section>
    </Shell>
  );
}
