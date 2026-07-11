import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function Field() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  const { data: asg } = await sb.from("assignments")
    .select("visit_id, status, visits(id, visit_type, execution_mode, planning_status, window_start, window_end, factories(name, factory_code, city), inspections(id, status))")
    .eq("inspector_id", user!.id).order("created_at", { ascending: false });
  return (
    <Shell current="/field" title="My visits — field"
      context={<span className="ax-lozenge ax-lozenge--info">SCR-IPAD-600 · assigned-only (RBAC-009, RLS-enforced)</span>}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "var(--ax-space-200)" }}>
        {(asg ?? []).map(a => {
          const v = a.visits as unknown as { id: string; visit_type: string; execution_mode: string; planning_status: string; window_start: string; factories: { name: string; factory_code: string; city: string }; inspections: { id: string; status: string }[] };
          if (!v || v.planning_status !== "published") return null;
          const ins = v.inspections[0];
          return (
            <a key={v.id} href={ins && ins.status !== "not_started" ? `/field/inspection/${ins.id}` : `/field/${v.id}`}
               className="ax-surface ax-panel" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-150)", textDecoration: "none", color: "inherit", borderInlineStart: "4px solid var(--ax-color-primary)" }}>
              <div className="ax-row" style={{ justifyContent: "space-between" }}>
                <strong style={{ font: "var(--ax-text-field)", fontWeight: 600 }}>{v.factories.name}</strong>
                <span className="ax-lozenge ax-lozenge--ops">{ins ? ins.status.replace(/_/g, " ") : "prepared"}</span>
              </div>
              <span className="ax-caption ax-numeric">{new Date(v.window_start).toISOString().slice(0, 16).replace("T", " ")} · {v.visit_type} · {v.execution_mode} · {v.factories.city}</span>
            </a>
          );
        })}
      </div>
    </Shell>
  );
}
