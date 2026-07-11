import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const TONE: Record<string, string> = { approved: "ax-lozenge--success", returned: "ax-lozenge--warning", rejected: "ax-lozenge--critical", under_review: "ax-lozenge--info" };

export default async function Reviews() {
  const sb = await supabaseServer();
  const { data: reviews } = await sb.from("reviews")
    .select("id, status, decision, decision_reason, returned_sections, decided_at, submission_versions(version_number, submitted_at, acknowledgement), inspections(id, status, visits(factories(name, factory_code)))")
    .order("decided_at", { ascending: false, nullsFirst: true });
  return (
    <Shell current="/reviews" title="Level 2 review"
      context={<span className="ax-lozenge ax-lozenge--info">SCR-WEB-300/310 · live data from golden slice</span>}>
      {(reviews ?? []).length === 0 ? (
        <div className="ax-surface"><div className="ax-state"><span className="ax-state__glyph">✅</span><h4>Queue clear</h4></div></div>
      ) : (
        <div className="ax-tablewrap"><table className="ax-table">
          <thead><tr><th>Factory</th><th>Version</th><th className="ax-td-num">Submitted</th><th>Status</th><th>Decision</th><th>Return scope</th><th>Reason</th></tr></thead>
          <tbody>
            {(reviews ?? []).map(r => {
              const sv = r.submission_versions as unknown as { version_number: number; submitted_at: string } | null;
              const insp = r.inspections as unknown as { visits: { factories: { name: string; factory_code: string } } } | null;
              return (
                <tr key={r.id}>
                  <td><strong>{insp?.visits?.factories?.name}</strong> <span className="ax-caption">{insp?.visits?.factories?.factory_code}</span></td>
                  <td><span className="ax-version">v{sv?.version_number}</span></td>
                  <td className="ax-td-num ax-numeric">{sv ? new Date(sv.submitted_at).toISOString().slice(0, 16).replace("T", " ") : "—"}</td>
                  <td><span className={`ax-lozenge ax-lozenge--review ${TONE[r.status] ?? ""}`}>{r.status.replace(/_/g, " ")}</span></td>
                  <td>{r.decision ?? "—"}</td>
                  <td>{r.returned_sections ? (r.returned_sections as string[]).join(", ") : "—"}</td>
                  <td className="ax-caption">{r.decision_reason ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      )}
      <div className="ax-banner ax-banner--immutable"><div><strong>Decisions are immutable</strong> — the database rejects edits to decided reviews (proven live: B3-EV-001 P10-NEG). Every resubmission creates a new version; v1 remains locked forever.</div></div>
    </Shell>
  );
}
