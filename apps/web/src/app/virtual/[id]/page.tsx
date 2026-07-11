import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import Room from "./Room";

export const dynamic = "force-dynamic";

export default async function VirtualRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await supabaseServer();
  const { data: s } = await sb.from("virtual_sessions")
    .select("id, state, appointment_at, visit_id, visits(factories(name), package_versions(id), inspections(id, status)), virtual_participants(id, display_name, role, joined_at, verified_at)")
    .eq("id", id).single();
  if (!s) return <Shell current="/virtual" title="Session not found"><div className="ax-surface"><div className="ax-state"><span className="ax-state__glyph">🛡</span><h4>Wrong appointment or out of scope</h4><p className="ax-caption">Access denied safely; attempt audited (SCR-VIR-700 failure state).</p></div></div></Shell>;
  return (
    <Shell current="/virtual" title={`Virtual room — ${(s.visits as unknown as { factories: { name: string } }).factories.name}`}
      context={<span className={`ax-lozenge ax-lozenge--virtual ${s.state === "verified" ? "ax-lozenge--success" : "ax-lozenge--info"}`}>{s.state}</span>}>
      <Room session={s as never} />
    </Shell>
  );
}
