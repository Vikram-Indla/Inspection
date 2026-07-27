import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

type RegulationRow = {
  id: string;
  code: string;
  title: string;
  issuing_authority: string | null;
  status: string;
  version_label: string;
  effective_from: string | null;
  regulation_clauses: Array<{ id: string; inspection_items: Array<{ id: string }> | null }> | null;
};

export default async function ComplianceLibrary({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sb = await supabaseServer();
  const sp = await searchParams;
  const query = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";
  const authority = typeof sp.authority === "string" ? sp.authority : "";
  const selectedId = typeof sp.id === "string" ? sp.id : "";
  const { data, error } = await sb.from("regulations")
    .select("id,code,title,issuing_authority,status,version_label,effective_from,regulation_clauses(id,inspection_items(id))")
    .order("title");
  const rows = (data ?? []) as unknown as RegulationRow[];
  const authorities = Array.from(new Set(rows.map(row => row.issuing_authority ?? "Other"))).sort();
  const filtered = rows.filter(row => {
    const matchesAuthority = !authority || (row.issuing_authority ?? "Other") === authority;
    const haystack = `${row.code} ${row.title} ${row.issuing_authority ?? ""}`.toLowerCase();
    return matchesAuthority && (!query || haystack.includes(query));
  });
  const selected = rows.find(row => row.id === selectedId) ?? filtered[0] ?? null;
  const itemCount = selected?.regulation_clauses?.reduce(
    (total, clause) => total + (clause.inspection_items?.length ?? 0),
    0,
  ) ?? 0;

  return (
    <Shell current="/compliance" title="">
      <div className="rv-library">
        <aside className="rv-library__rail" aria-label="Compliance library navigation">
          <form className="rv-library__search">
            <span aria-hidden="true">⌕</span>
            <input name="q" defaultValue={typeof sp.q === "string" ? sp.q : ""} placeholder="Search library…" aria-label="Search library" />
          </form>
          <a className={!authority ? "is-active" : ""} href="/compliance">
            <span>All regulations</span><b>{rows.length}</b>
          </a>
          {authorities.map(name => (
            <a key={name} className={authority === name ? "is-active" : ""} href={`/compliance?authority=${encodeURIComponent(name)}`}>
              <span>{name}</span><b>{rows.filter(row => (row.issuing_authority ?? "Other") === name).length}</b>
            </a>
          ))}
          <p className="rv-library__eyebrow">Recently opened</p>
          {rows.slice(0, 2).map(row => <a className="rv-library__recent" key={row.id} href={`/compliance?id=${row.id}`}>{row.title}</a>)}
        </aside>

        <main className="rv-library__workspace">
          {error ? (
            <div className="sq-banner sq-banner--critical" role="alert"><strong>Compliance Library unavailable.</strong> The read failed; no empty result is claimed.</div>
          ) : !selected ? (
            <section className="sq-state"><h2>No regulations in scope</h2><p>The RLS-scoped read succeeded and returned no regulations.</p></section>
          ) : (
            <>
              <header className="rv-library__header">
                <div>
                  <p className="sq-overline">{selected.code} · {selected.issuing_authority ?? "Authority not recorded"}</p>
                  <h1>{selected.title}</h1>
                  <p>Version {selected.version_label} · {selected.status}</p>
                </div>
                <a className="sq-btn sq-btn--secondary" href={`/admin/regulations?id=${selected.id}`}>Open governed dossier</a>
              </header>
              <section className="rv-library__facts">
                <div><span>Clauses</span><strong>{selected.regulation_clauses?.length ?? 0}</strong></div>
                <div><span>Inspection items</span><strong>{itemCount}</strong></div>
                <div><span>Effective from</span><strong>{selected.effective_from?.slice(0, 10) ?? "Not recorded"}</strong></div>
              </section>
              <div className="rv-library__split">
                <section className="rv-library__list">
                  <h2>Regulations</h2>
                  {filtered.map(row => (
                    <a className={row.id === selected.id ? "is-selected" : ""} key={row.id} href={`/compliance?id=${row.id}${authority ? `&authority=${encodeURIComponent(authority)}` : ""}`}>
                      <div><strong>{row.title}</strong><span>{row.code} · {row.version_label}</span></div><span aria-hidden="true">›</span>
                    </a>
                  ))}
                </section>
                <section className="rv-library__detail">
                  <p className="rv-library__eyebrow">Source-controlled compliance</p>
                  <h2>Regulation workspace</h2>
                  <p>Browse the published source, its clauses, mapped inspection items, version lineage, attachments, and immutable audit history.</p>
                  <div className="sq-banner"><strong>Read-only presentation.</strong> Authoring and maker-checker publication remain in the governed dossier and its database guards.</div>
                </section>
              </div>
            </>
          )}
        </main>
      </div>
    </Shell>
  );
}
