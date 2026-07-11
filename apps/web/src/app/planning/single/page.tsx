import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import Wizard from "./Wizard";

export const dynamic = "force-dynamic";

export default async function SinglePlanning() {
  const sb = await supabaseServer();
  const [{ data: factories }, { data: pkgs }, { data: inspRoles }] = await Promise.all([
    sb.from("factories").select("id, factory_code, name, cr_number, region, city, risk_band, risk_score").order("name"),
    sb.from("package_versions").select("id, version_label, packages(code, title)").in("status", ["published", "locked"]).order("published_at", { ascending: false }),
    sb.from("user_roles").select("user_id, profiles(full_name)").eq("role_key", "inspector"),
  ]);
  const inspectors = (inspRoles ?? []).map(r => ({ user_id: r.user_id, full_name: (r.profiles as unknown as { full_name: string }).full_name }));
  return (
    <Shell current="/planning" title="Single visit planning"
      context={<span className="ax-lozenge ax-lozenge--info">SCR-WEB-120/140/150 · golden #2 as product</span>}>
      <Wizard factories={(factories ?? []) as never} packages={(pkgs ?? []) as never} inspectors={inspectors} />
    </Shell>
  );
}
