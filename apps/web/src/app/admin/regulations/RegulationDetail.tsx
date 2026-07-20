import { supabaseServer } from "@/lib/supabase-server";
import { logConfigurationReadFailure } from "@/lib/admin-configuration";
import { PublishRegulation, type RegStrings } from "./Controls";
import EmptyState from "@/components/EmptyState";

// SCR-ADM-011 — regulation detail dossier: a logical mode of /admin/regulations
// (?regulation=<id>), not a dedicated route (no route guard is proven — CD-006
// truth). Metadata + maker-checker evidence + clause navigator + clause→item
// dependency rail. Downstream unproven legs render "Not evaluated", never "0".

type DetailStrings = RegStrings & {
  backToList: string;
  notFoundTitle: string;
  notFoundBody: string;
  degradedTitle: string;
  degradedBody: string;
  metaCreated: string;
  metaCreatedBy: string;
  metaApprovedBy: string;
  metaPublishedAt: string;
  unknownActor: string;
  neverApproved: string;
  unmappedBanner: string;
  publishedImmutable: string;
  clauseNav: string;
  dependencyRail: string;
  mappedCount: string;
  unmappedTag: string;
  auditTitle: string;
  auditBody: string;
  routeGuardTitle: string;
  routeGuardBody: string;
  lineageTitle: string;
  lineageBody: string;
  dependencyEngineTitle: string;
  dependencyEngineBody: string;
};

export default async function RegulationDetail({
  regulationId, strings: s, t,
}: {
  regulationId: string;
  strings: DetailStrings;
  t: (key: string, en: string) => string;
}) {
  const sb = await supabaseServer();
  const { data: reg, error } = await sb.from("regulations")
    .select("id, code, title, issuing_authority, status, created_at, created_by, approved_by, published_at, regulation_clauses(id, clause_ref, title, applicability, legal_source, inspection_items(id, code, title))")
    .eq("id", regulationId)
    .maybeSingle();
  if (error) logConfigurationReadFailure("read regulation detail", error);

  if (error) {
    return (
      <div className="ax-banner ax-banner--critical" role="alert"><div>
        <strong>{s.degradedTitle}</strong> {s.degradedBody}
      </div></div>
    );
  }
  if (!reg) {
    return (
      <EmptyState glyph="📜" title={s.notFoundTitle} body={s.notFoundBody}>
        <a className="ax-btn ax-btn--subtle" href="/admin/regulations">{s.backToList}</a>
      </EmptyState>
    );
  }

  // Actor names: profiles RLS (profiles_self) only exposes self + security_admin/ops/planner
  // viewers. A hidden row is unknown, never rendered as absent/zero (truth-over-completion).
  const actorIds = [reg.created_by, reg.approved_by].filter((x): x is string => !!x);
  const { data: profs } = actorIds.length
    ? await sb.from("profiles").select("user_id, full_name").in("user_id", actorIds)
    : { data: [] as { user_id: string; full_name: string }[] };
  const nameOf = (id: string | null) =>
    id ? ((profs ?? []).find(p => p.user_id === id)?.full_name ?? `${id.slice(0, 8)}…`) : s.unknownActor;

  const clauses = reg.regulation_clauses ?? [];
  const unmapped = clauses.filter(c => !(c.inspection_items ?? []).length);

  return (
    <div className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h3>{reg.code} — {reg.title}</h3>
        <div className="row" style={{ gap: "var(--ax-space-150)" }}>
          <span className={`ax-lozenge ${reg.status === "published" ? "ax-lozenge--success" : "ax-lozenge--warning"}`}>{t(`enum.${reg.status}`, String(reg.status).replace(/_/g, " "))}</span>
          {reg.status === "draft" && <PublishRegulation regulationId={reg.id} strings={s} />}
        </div>
      </div>

      {reg.status === "published" && (
        <div className="ax-banner" role="status"><div>{s.publishedImmutable}</div></div>
      )}

      {reg.status === "draft" && unmapped.length > 0 && (
        <div className="ax-banner ax-banner--warning" role="status"><div>
          {s.unmappedBanner.replace("{n}", String(unmapped.length))}
        </div></div>
      )}

      {/* Metadata + maker-checker evidence */}
      <dl className="ax-grid-2" style={{ rowGap: "var(--ax-space-100)" }}>
        <div><dt className="t-caption">{s.issuingAuthority}</dt><dd><bdi>{reg.issuing_authority || "—"}</bdi></dd></div>
        <div><dt className="t-caption">{s.metaCreated}</dt><dd><bdi>{new Date(reg.created_at).toISOString().slice(0, 10)}</bdi></dd></div>
        <div><dt className="t-caption">{s.metaCreatedBy}</dt><dd><bdi>{nameOf(reg.created_by)}</bdi></dd></div>
        <div><dt className="t-caption">{s.metaApprovedBy}</dt><dd><bdi>{reg.approved_by ? nameOf(reg.approved_by) : s.neverApproved}</bdi></dd></div>
        {reg.published_at && (
          <div><dt className="t-caption">{s.metaPublishedAt}</dt><dd><bdi>{new Date(reg.published_at).toISOString().slice(0, 10)}</bdi></dd></div>
        )}
      </dl>

      {/* Clause navigator + clause→item dependency rail */}
      <div>
        <h4>{s.clauseNav}</h4>
        <div className="ax-tablewrap" style={{ marginBlockStart: "var(--ax-space-150)" }}><table className="ax-table">
          <thead><tr>
            <th scope="col">{s.clauseRef}</th><th scope="col">{s.title}</th><th scope="col">{s.legalSource}</th><th scope="col">{s.dependencyRail}</th>
          </tr></thead>
          <tbody>
            {clauses.map(c => {
              const items = c.inspection_items ?? [];
              return (
                <tr key={c.id}>
                  <td className="ax-numeric"><strong>§{c.clause_ref}</strong></td>
                  <td>{c.title}</td>
                  <td><bdi>{c.legal_source || "—"}</bdi></td>
                  <td>
                    {items.length > 0 ? (
                      <span className="t-caption ax-numeric">{s.mappedCount.replace("{n}", String(items.length))}: {items.map(i => (
                        <span key={i.id} className="ax-lozenge ax-lozenge--info" style={{ marginInlineEnd: 6 }}>{i.code}</span>
                      ))}</span>
                    ) : (
                      <span className="ax-lozenge ax-lozenge--warning">{s.unmappedTag}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </div>

      {/* Downstream unproven legs — disclosed, not faked as working controls */}
      <div className="ax-surface" style={{ padding: "var(--ax-space-200)", display: "flex", flexDirection: "column", gap: "var(--ax-space-100)" }}>
        <div><strong className="t-caption">{s.auditTitle}</strong><p className="t-caption">{s.auditBody}</p></div>
        <div><strong className="t-caption">{s.lineageTitle}</strong><p className="t-caption">{s.lineageBody}</p></div>
        <div><strong className="t-caption">{s.dependencyEngineTitle}</strong><p className="t-caption">{s.dependencyEngineBody}</p></div>
        <div><strong className="t-caption">{s.routeGuardTitle}</strong><p className="t-caption">{s.routeGuardBody}</p></div>
      </div>

      <a className="ax-btn ax-btn--subtle" href="/admin/regulations">{s.backToList}</a>
    </div>
  );
}
