import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import Startup from "./Startup";

export const dynamic = "force-dynamic";

export default async function FieldVisit({ params }: { params: Promise<{ visitId: string }> }) {
  const { visitId } = await params;
  const sb = await supabaseServer();
  const { data: v } = await sb.from("visits")
    .select("id, window_start, window_end, execution_mode, factories(name, factory_code, official_lat, official_lng), package_versions(id, version_label, definition, packages(code)), inspections(id, status)")
    .eq("id", visitId).single();
  const { data: gis } = await sb.from("engine_settings").select("settings").eq("engine", "gis").single();
  if (!v) return <Shell current="/field" title="Not found"><div /></Shell>;
  return (
    <Shell current="/field" title={`Startup — ${(v.factories as unknown as { name: string }).name}`}
      context={<span className="ax-lozenge ax-lozenge--info">SCR-IPAD-610/620</span>}>
      <Startup visit={v as never} gis={(gis?.settings ?? {}) as never} />
    </Shell>
  );
}
