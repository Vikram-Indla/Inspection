import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import Workspace from "./Workspace";

export const dynamic = "force-dynamic";

export default async function FieldInspection({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await supabaseServer();
  const [{ data: ins }, { data: items }, { data: resp }] = await Promise.all([
    sb.from("inspections").select("id, status, visit_id, package_versions(version_label, definition, packages(code)), visits(factories(name))").eq("id", id).single(),
    sb.from("inspection_items").select("id, code, title, response_model, evidence_rule"),
    sb.from("checklist_responses").select("item_id, response, updated_at").eq("inspection_id", id),
  ]);
  if (!ins) return <Shell current="/field" title="Not found"><div /></Shell>;
  return (
    <Shell current="/field" title={`Inspection — ${(ins.visits as unknown as { factories: { name: string } }).factories.name}`}
      context={<span className="ax-version">{(ins.package_versions as unknown as { packages: { code: string }; version_label: string }).packages.code} · {(ins.package_versions as unknown as { version_label: string }).version_label} · locked</span>}>
      <Workspace inspection={ins as never} items={(items ?? []) as never} serverResponses={(resp ?? []) as never} />
    </Shell>
  );
}
