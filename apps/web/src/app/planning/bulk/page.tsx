import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import BulkForm from "./BulkForm";

export const dynamic = "force-dynamic";

export default async function BulkPlanning({ searchParams }: { searchParams: Promise<{ region?: string; band?: string }> }) {
  const { region, band } = await searchParams;
  const sb = await supabaseServer();
  let q = sb.from("factories").select("id, factory_code, name, cr_number, city, region, risk_band, risk_score, visits(planning_status, visit_type)").order("risk_score", { ascending: false });
  if (region) q = q.eq("region", region);
  if (band) q = q.eq("risk_band", band);
  const { data: factories } = await q;
  const { data: pkgs } = await sb.from("package_versions").select("id, version_label, packages(code)").in("status", ["published", "locked"]);
  return (
    <Shell current="/planning" title="Bulk planning — criteria & targeting"
      context={<span className="ax-lozenge ax-lozenge--info">SCR-WEB-110 · AND criteria via filters</span>}>
      <form method="get" className="ax-commandbar">
        <select className="ax-select" name="region" defaultValue={region ?? ""} style={{ maxInlineSize: 200 }}>
          <option value="">Region: any</option><option value="Riyadh">Riyadh</option>
        </select>
        <select className="ax-select" name="band" defaultValue={band ?? ""} style={{ maxInlineSize: 200 }}>
          <option value="">Risk band: any</option><option value="high">high</option><option value="medium">medium</option><option value="low">low</option>
        </select>
        <button className="ax-btn ax-btn--secondary">Search</button>
        <span className="ax-caption ax-numeric">{(factories ?? []).length} matching factories (M01-004: all matching returned)</span>
      </form>
      <BulkForm factories={(factories ?? []) as never} packages={(pkgs ?? []) as never} />
    </Shell>
  );
}
