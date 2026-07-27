import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { isTestFixtureEstablishment } from "@/lib/field/fixtures";

export const dynamic = "force-dynamic";

type ViolationRow = {
  id: string;
  invalidated_at: string | null;
  inspections: {
    submitted_at: string | null;
    visits: { factories: { name: string; factory_code: string | null; license_number: string | null; region: string | null } | null } | null;
  } | null;
  violation_codes: { title: string; code: string; corrective_action: string | null } | null;
  action_forms: Array<{ id: string; form_type: string; status: string; due_at: string | null }> | null;
};
type PenaltyRow = { violation_id: string; status: string; mapping_snapshot: { penalty_type?: string; amount?: number } | null };

export default async function EnforcementLibrary({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sb = await supabaseServer();
  const sp = await searchParams;
  const current = sp.__shellRoute === "/admin/violations" ? "/admin/violations" : "/enforcement-library";
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const range = typeof sp.range === "string" ? Number(sp.range) : 0;
  const region = typeof sp.region === "string" ? sp.region : "";
  const [violationRead, penaltyRead] = await Promise.all([
    sb.from("violations")
      .select("id,invalidated_at,inspections(submitted_at,visits(factories(name,factory_code,license_number,region))),violation_codes(title,code,corrective_action),action_forms(id,form_type,status,due_at)")
      .order("id", { ascending: false })
      .limit(100),
    sb.from("inspection_penalties").select("violation_id,status,mapping_snapshot").limit(100),
  ]);
  const allRows = ((violationRead.data ?? []) as unknown as ViolationRow[])
    .filter(row => !isTestFixtureEstablishment(row.inspections?.visits?.factories));
  const regions = Array.from(new Set(allRows.map(row => row.inspections?.visits?.factories?.region).filter((value): value is string => !!value))).sort();
  const cutoff = range ? Date.now() - range * 86_400_000 : 0;
  const rows = allRows.filter(row => {
    const factory = row.inspections?.visits?.factories;
    const action = row.action_forms?.[0];
    const closed = !!row.invalidated_at || action?.status === "closed";
    const haystack = `${factory?.name ?? ""} ${factory?.license_number ?? ""} ${row.violation_codes?.title ?? ""} ${row.violation_codes?.code ?? ""}`.toLowerCase();
    return (!q || haystack.includes(q))
      && (!status || (status === "closed" ? closed : !closed))
      && (!region || factory?.region === region)
      && (!cutoff || !!row.inspections?.submitted_at && new Date(row.inspections.submitted_at).getTime() >= cutoff);
  });
  const penalties = (penaltyRead.data ?? []) as unknown as PenaltyRow[];

  return (
    <Shell current={current} title="">
      <div className="rv-enforcement">
        <form className="rv-enforcement__toolbar" method="get" action={current}>
          <label><span aria-hidden="true">⌕</span><input name="q" defaultValue={typeof sp.q === "string" ? sp.q : ""} placeholder="Search factory, licence…" aria-label="Search enforcement library" /></label>
          <select name="status" defaultValue={status} aria-label="Status"><option value="">Status</option><option value="open">Open</option><option value="closed">Closed</option></select>
          <select name="range" defaultValue={range || ""} aria-label="Date range"><option value="">Date range</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last year</option></select>
          <select name="region" defaultValue={region} aria-label="Region"><option value="">Region</option>{regions.map(value => <option value={value} key={value}>{value}</option>)}</select>
          <button type="submit">Apply</button>
          <a href={`/enforcement-library/export?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}&range=${range || ""}&region=${encodeURIComponent(region)}`}>Export</a>
        </form>
        {violationRead.error || penaltyRead.error ? <div className="sq-banner sq-banner--critical" role="alert"><strong>Enforcement Library unavailable.</strong> No case count is claimed.</div> : null}
        <section className="rv-enforcement__list">
          {rows.map(row => {
            const factory = row.inspections?.visits?.factories;
            const action = row.action_forms?.[0] ?? null;
            const penalty = penalties.find(item => item.violation_id === row.id);
            const closed = !!row.invalidated_at || action?.status === "closed";
            return (
              <article key={row.id}>
                <header>
                  <div><h2>{row.violation_codes?.title ?? "Violation"}</h2><p>{factory?.name ?? "Factory unavailable"} · {row.violation_codes?.code ?? row.id.slice(0, 8)}</p></div>
                  <span className={`sq-lozenge ${closed ? "sq-lozenge--success" : "sq-lozenge--critical"}`}>• {closed ? "Closed" : "Open"}</span>
                </header>
                <dl>
                  <div><dt>Licence</dt><dd>{factory?.license_number ?? "—"}</dd></div>
                  <div><dt>Penalty</dt><dd>{penalty?.mapping_snapshot?.penalty_type ?? penalty?.status ?? "Not issued"}</dd></div>
                  <div><dt>Issue date</dt><dd>{row.inspections?.submitted_at?.slice(0, 10) ?? "—"}</dd></div>
                  <div><dt>Action form</dt><dd>{action?.form_type?.replaceAll("_", " ") ?? "—"}</dd></div>
                </dl>
                <a href={`/enforcement?violation=${row.id}`}>Open case</a>
              </article>
            );
          })}
          {!violationRead.error && rows.length === 0 ? <section className="sq-state"><h2>No RLS-visible enforcement records</h2><p>The read succeeded and returned zero records.</p></section> : null}
        </section>
      </div>
    </Shell>
  );
}
