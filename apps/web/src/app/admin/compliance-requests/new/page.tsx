import Link from "next/link";
import Shell from "@/components/Shell";
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
      context={<span className="ax-lozenge ax-lozenge--info">Draft · Revision 1</span>}>
      <p className="ax-caption"><Link className="ax-link" href="/admin/compliance-requests">← Request register</Link></p>
      <section className="ax-surface ccr-form-card" aria-labelledby="ccr-create-heading">
        <h3 id="ccr-create-heading">Request foundation</h3>
        <p className="ax-caption">Create the governed envelope first. Components and dependencies are added in the request workspace.</p>
        <ActionForm action={createComplianceRequest} className="ccr-form" redirectOnCreate>
          <label className="ax-field"><span className="ax-field__label">Request type</span><select className="ax-select" name="request_type" required defaultValue={requestedType}><option value="create">Create</option><option value="modify">Modify</option></select></label>
          <label className="ax-field"><span className="ax-field__label">Title</span><input className="ax-input" name="title" required maxLength={180} defaultValue={requestedTitle} /></label>
          <label className="ax-field ccr-span"><span className="ax-field__label">Description</span><textarea className="ax-textarea" name="description" rows={4} defaultValue={requestedDescription} /></label>
          <label className="ax-field ccr-span"><span className="ax-field__label">Initial comments</span><textarea className="ax-textarea" name="comments" rows={3} /></label>
          <div className="ccr-span ccr-actions"><button className="ax-btn ax-btn--prominent" type="submit">Create draft request</button><Link className="ax-btn ax-btn--secondary" href="/admin/compliance-requests">Cancel</Link></div>
        </ActionForm>
      </section>
    </Shell>
  );
}
