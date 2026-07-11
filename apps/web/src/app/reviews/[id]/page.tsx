import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import DecisionPanel from "./DecisionPanel";

export const dynamic = "force-dynamic";

export default async function ReviewWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;  // inspection id
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  const { data: ins } = await sb.from("inspections")
    .select(`id, status, visits(factories(name, factory_code)), package_versions(version_label, definition),
      submission_versions(id, version_number, snapshot, acknowledgement, submitted_at),
      violations(mapping_version, violation_codes(code, title, level)),
      action_forms(owner_name, due_at, status, required_correction),
      evidence(storage_path, evidence_type, content_sha256, captured_at),
      reviews(id, status, decision, decision_reason, returned_sections, decided_at, submission_version_id)`)
    .eq("id", id).single();
  if (!ins) return <Shell current="/reviews" title="Not found"><div /></Shell>;
  const subs = (ins.submission_versions as unknown as { id: string; version_number: number; snapshot: { answers?: Record<string, string> }; acknowledgement: unknown; submitted_at: string }[]).sort((a, b) => b.version_number - a.version_number);
  const latest = subs[0];
  const reviews = ins.reviews as unknown as { id: string; status: string; decision: string | null; decision_reason: string | null; returned_sections: string[] | null; decided_at: string | null; submission_version_id: string }[];
  let open = reviews.find(r => r.submission_version_id === latest?.id && !r.decided_at);
  if (!open && latest && ins.status === "submitted") {
    const { data: created } = await sb.from("reviews").insert({
      inspection_id: ins.id, submission_version_id: latest.id, reviewer_id: user!.id, status: "under_review",
    }).select().single();
    if (created) { open = created as never; await sb.from("inspections").update({ status: "under_review" }).eq("id", ins.id); }
  }
  const sections = (ins.package_versions as unknown as { definition: { sections: { key: string; title: string; items?: string[] }[] } }).definition.sections.filter(s => s.items?.length);
  const f = (ins.visits as unknown as { factories: { name: string; factory_code: string } }).factories;
  return (
    <Shell current="/reviews" title={`Review — ${f.name}`}
      context={<><span className="ax-version">v{latest?.version_number} · latest</span><span className="ax-lozenge ax-lozenge--review ax-lozenge--info">{ins.status.replace(/_/g, " ")}</span></>}>
      <div className="ax-banner ax-banner--immutable"><div><strong>Read-only submitted version (M06-012).</strong> Content edits are impossible — the database rejects them (proven B3). Corrections happen only via Return with exact scope.</div></div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(0,1fr)", gap: "var(--ax-space-300)", alignItems: "start" }}>
        <div className="ax-stack">
          <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
            <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>Checklist — v{latest?.version_number}</h4>
            <div className="ax-tablewrap"><table className="ax-table">
              <thead><tr><th>Item</th><th>Response</th></tr></thead>
              <tbody>{Object.entries(latest?.snapshot?.answers ?? {}).map(([k, v]) => (
                <tr key={k}><td><strong>{k}</strong></td><td><span className={`ax-lozenge ${v === "non_compliant" ? "ax-lozenge--critical" : "ax-lozenge--success"}`}>{String(v).replace(/_/g, " ")}</span></td></tr>
              ))}</tbody>
            </table></div>
          </div>
          <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
            <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>Violations · actions · evidence (read-only)</h4>
            {(ins.violations as unknown as { violation_codes: { code: string; title: string; level: string }; mapping_version: string }[]).map((v, i) => (
              <p key={i}><span className="ax-lozenge ax-lozenge--critical">{v.violation_codes.code} · {v.violation_codes.level}</span> {v.violation_codes.title} <span className="ax-version">mapping {v.mapping_version}</span></p>
            ))}
            {(ins.action_forms as unknown as { owner_name: string; due_at: string; status: string; required_correction: string }[]).map((a, i) => (
              <p key={i} className="ax-caption" style={{ marginBlockStart: 8 }}>action: {a.required_correction} — {a.owner_name}, due {new Date(a.due_at).toISOString().slice(0, 10)} · {a.status}</p>
            ))}
            {(ins.evidence as unknown as { storage_path: string; content_sha256: string | null }[]).map((e, i) => (
              <p key={i} className="ax-caption ax-numeric" style={{ marginBlockStart: 8 }}>📎 {e.storage_path} · sha256 {e.content_sha256?.slice(0, 12)}…</p>
            ))}
          </div>
          {reviews.filter(r => r.decided_at).map(r => (
            <div key={r.id} className="ax-banner ax-banner--warning"><div><strong>Prior decision:</strong> {r.decision} · {r.decision_reason} {r.returned_sections && `· sections ${r.returned_sections.join(", ")}`} <span className="ax-caption">(immutable)</span></div></div>
          ))}
        </div>
        {open && ins.status === "under_review"
          ? <DecisionPanel reviewId={open.id} sections={sections.map(s => ({ key: s.key, title: s.title }))} />
          : <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}><p className="ax-caption">No open decision — status {ins.status}.</p></div>}
      </div>
    </Shell>
  );
}
