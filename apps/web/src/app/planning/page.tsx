import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function PlanningHome() {
  const sb = await supabaseServer();
  const { data: pkg } = await sb.from("package_versions").select("id").eq("status", "published").limit(1);
  const { count: drafts } = await sb.from("visit_plans").select("id", { count: "exact", head: true }).eq("status", "draft");
  const noPackage = (pkg ?? []).length === 0;
  const methods = [
    ["▦", "Bulk planning", "AND/OR criteria over the factory master; many visits under one plan (M01-002).", "/planning/bulk"],
    ["▣", "Single visit", "One registered factory via CR / Industrial License; one plan, one visit (M01-034/042).", "/planning/single"],
    ["⚡", "Immediate visit", "Urgent dispatch; unregistered factory allowed with mandatory location (M01-045/046).", "/planning/immediate"],
  ] as const;
  return (
    <Shell current="/planning" title="Visit planning"
      context={<span className="ax-caption ax-numeric">{drafts ?? 0} drafts</span>}>
      {noPackage && (
        <div className="ax-banner ax-banner--critical"><div>
          <strong>No published inspection package.</strong> Planning cannot publish without one (ERR-PUB-001). <a className="ax-link" href="/admin">Open Admin</a>.
        </div></div>
      )}
      <div className="web-methods" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "var(--ax-space-300)" }}>
        {methods.map(([glyph, title, desc, href]) => (
          <a key={href} href={href} className="ax-surface ax-panel" style={{ padding: "var(--ax-space-400)", display: "flex", flexDirection: "column", gap: "var(--ax-space-150)", textDecoration: "none", color: "inherit", opacity: noPackage ? .55 : 1, pointerEvents: noPackage ? "none" : "auto" }}>
            <span style={{ fontSize: 22 }}>{glyph}</span>
            <h3>{title}</h3>
            <p className="ax-caption">{desc}</p>
          </a>
        ))}
      </div>
      <p className="ax-caption">One planning method per creation session (M01-011 · REF-001).</p>
    </Shell>
  );
}
