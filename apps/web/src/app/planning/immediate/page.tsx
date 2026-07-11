import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import ImmediateForm from "./ImmediateForm";

export const dynamic = "force-dynamic";

export default async function Immediate() {
  const sb = await supabaseServer();
  const [{ data: factories }, { data: pkgs }, { data: inspRows }] = await Promise.all([
    sb.from("factories").select("id, name, factory_code, cr_number").eq("is_temporary", false).order("name"),
    sb.from("package_versions").select("id, version_label, packages(code)").in("status", ["published", "locked"]),
    sb.from("user_roles").select("user_id, profiles(full_name)").eq("role_key", "inspector"),
  ]);
  const inspectors = (inspRows ?? []).map(r => ({ user_id: r.user_id, full_name: (r.profiles as unknown as { full_name: string }).full_name }));
  return (
    <Shell current="/planning" title="Immediate visit — urgent dispatch"
      context={<span className="ax-lozenge ax-lozenge--warning">SCR-WEB-130 · bypasses Visit Plans (M01-050)</span>}>
      <ImmediateForm factories={(factories ?? []) as never} packages={(pkgs ?? []) as never} inspectors={inspectors} />
    </Shell>
  );
}
