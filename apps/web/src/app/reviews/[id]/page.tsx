import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import DecisionPanel, { type WorkspaceDecisionStrings } from "./DecisionPanel";
import { fetchFactoryChecks, updatedCount, FACTORY_FIELD_EN } from "@/lib/factory-verification";

export const dynamic = "force-dynamic";

export default async function ReviewWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;  // inspection id
  const { t } = await useT();
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  const { data: ins } = await sb.from("inspections")
    .select(`id, status, visits(factories(name, factory_code)), package_versions(version_label, definition),
      submission_versions(id, version_number, snapshot, acknowledgement, submitted_at),
      violations(mapping_version, violation_codes(code, title, level)),
      action_forms(owner_name, due_at, status, required_correction),
      evidence(storage_path, evidence_type, content_sha256, captured_at, linked_type, linked_id),
      reviews(id, status, decision, decision_reason, returned_sections, decided_at, submission_version_id)`)
    .eq("id", id).single();
  if (!ins) {
    return <Shell current="/reviews" title={t("review.ws.notFound", "Not found")}><div /></Shell>;
  }
  const subs = (ins.submission_versions as unknown as { id: string; version_number: number; snapshot: { answers?: Record<string, string> }; acknowledgement: unknown; submitted_at: string }[]).sort((a, b) => b.version_number - a.version_number);
  const latest = subs[0];
  const reviews = ins.reviews as unknown as { id: string; status: string; decision: string | null; decision_reason: string | null; returned_sections: string[] | null; decided_at: string | null; submission_version_id: string }[];
  let open = reviews.find(r => { return r.submission_version_id === latest?.id && !r.decided_at; });
  if (!open && latest && ins.status === "submitted") {
    const { data: created } = await sb.from("reviews").insert({
      inspection_id: ins.id, submission_version_id: latest.id, reviewer_id: user!.id, status: "under_review",
    }).select().single();
    if (created) { open = created as never; await sb.from("inspections").update({ status: "under_review" }).eq("id", ins.id); }
  }
  const sections = (ins.package_versions as unknown as { definition: { sections: { key: string; title: string; items?: string[] }[] } }).definition.sections.filter(s => { return !!s.items?.length; });
  const f = (ins.visits as unknown as { factories: { name: string; factory_code: string } }).factories;
  // M06-023/046/053 — real diff of the resubmitted snapshot against the prior
  // version: union of answer keys, changed cells flagged.
  const prev = subs[1];
  const diffRows = prev ? Array.from(new Set([
    ...Object.keys(prev.snapshot?.answers ?? {}),
    ...Object.keys(latest?.snapshot?.answers ?? {}),
  ])).sort().map(k => {
    const a = (prev.snapshot?.answers ?? {})[k];
    const b = (latest?.snapshot?.answers ?? {})[k];
    return { key: k, prev: a, latest: b, changed: a !== b };
  }) : [];
  const changedCount = diffRows.filter(d => { return d.changed; }).length;
  // M04-190 / M06-017 / M06-034 — factory-data verification checks for the
  // reviewer: Source (Senaei) vs Observed, Verified/Updated, before/after,
  // linked evidence. Tolerant fetch: 0020 pending → verbatim error, no crash.
  const fv = await fetchFactoryChecks(sb, ins.id);
  const fvUpdated = updatedCount(fv.checks);
  const fvEvidence = (ins.evidence as unknown as { storage_path: string; linked_type?: string; linked_id?: string }[]).filter(e => e.linked_type === "factory_field");
  const fvEvCount = (checkId: string) => fvEvidence.filter(e => e.linked_id === checkId).length;
  // M06-010/022/039/051 — chronological audit timeline for this inspection's
  // review chain (immutable audit_events rows; audit_read grants reviewer).
  const timelineIds = [ins.id, ...subs.map(s => { return s.id; }), ...reviews.map(r => { return r.id; })];
  const { data: trail } = await sb.from("audit_events")
    .select("id, action, object_type, occurred_at, actor")
    .in("object_id", timelineIds)
    .order("occurred_at", { ascending: false })
    .limit(25);
const panelStrings: WorkspaceDecisionStrings = {
    heading: t("review.ws.panelHeading", "Decision — irreversible once confirmed"),
    decisions: { approve: t("enum.approve", "approve"), return: t("enum.return", "return"), reject: t("enum.reject", "reject") },
    returnScopeTitle: t("review.ws.returnScopeTitle", "Exact return scope (STM-REV-003)"),
    returnScopeHint: t("review.ws.returnScopeHint", "Only selected sections unlock; the rest stays locked (M06-006/043)."),
    reason: t("review.ws.reason", "Reason"),
    reasonPlaceholder: t("review.ws.reasonPlaceholder", "mandatory for return/reject — recorded immutably"),
    approveWarnTitle: t("review.ws.approveWarnTitle", "Irreversible (M06-002):"),
    approveWarnBody: t("review.ws.approveWarnBody", "locks the version, triggers compliance chain."),
    rejectWarnTitle: t("review.ws.rejectWarnTitle", "Final (M06-007/008):"),
    rejectWarnBody: t("review.ws.rejectWarnBody", "no compliance trigger; new inspection needs a new visit."),
    confirm: t("review.ws.confirm", "Confirm {decision}"),
    recording: t("review.ws.recording", "Recording…"),
    audited: t("review.ws.audited", "Audited: reviewer, reason, sections, prior/new status, version, timestamp (M06-009/027)."),
  };
  return (
    <Shell current="/reviews" title={t("review.ws.title", "Review — {factory}").replace("{factory}", f.name)}
      context={<><span className="ax-version">v{latest?.version_number} · {t("review.ws.latest", "latest")}</span><span className="ax-lozenge ax-lozenge--review ax-lozenge--info">{t(`enum.${ins.status}`, ins.status.replace(/_/g, " "))}</span><a className="ax-btn ax-btn--secondary" href={`/reports/inspection/${ins.id}`}>{t("review.ws.reportLink", "Official report →")}</a></>}>
      <div className="ax-banner ax-banner--immutable"><div><strong>{t("review.ws.readOnlyTitle", "Read-only submitted version (M06-012).")}</strong> {t("review.ws.readOnlyBody", "Content edits are impossible — the database rejects them (proven B3). Corrections happen only via Return with exact scope.")}</div></div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.5fr) minmax(0,1fr)", gap: "var(--ax-space-300)", alignItems: "start" }}>
        <div className="ax-stack">
          <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
            <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{t("review.ws.checklist", "Checklist — v{n}").replace("{n}", String(latest?.version_number))}</h4>
            <div className="ax-tablewrap"><table className="ax-table">
              <thead><tr><th>{t("review.ws.colItem", "Item")}</th><th>{t("review.ws.colResponse", "Response")}</th></tr></thead>
              <tbody>{Object.entries(latest?.snapshot?.answers ?? {}).map(([k, v]) => (
                <tr key={k}><td><strong>{k}</strong></td><td><span className={`ax-lozenge ${v === "non_compliant" ? "ax-lozenge--critical" : "ax-lozenge--success"}`}>{t(`enum.${v}`, String(v).replace(/_/g, " "))}</span></td></tr>
              ))}</tbody>
            </table></div>
          </div>
          <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
            <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{t("review.ws.evidenceHeading", "Violations · actions · evidence (read-only)")}</h4>
            {(ins.violations as unknown as { violation_codes: { code: string; title: string; level: string }; mapping_version: string }[]).map((v, i) => (
              <p key={i}><span className="ax-lozenge ax-lozenge--critical">{v.violation_codes.code} · {t(`enum.${v.violation_codes.level}`, v.violation_codes.level)}</span> {v.violation_codes.title} <span className="ax-version">{t("review.ws.mapping", "mapping")} {v.mapping_version}</span></p>
            ))}
            {(ins.action_forms as unknown as { owner_name: string; due_at: string; status: string; required_correction: string }[]).map((a, i) => (
              <p key={i} className="ax-caption" style={{ marginBlockStart: 8 }}>{t("review.ws.actionPrefix", "action:")} {a.required_correction} — {a.owner_name}, {t("review.ws.due", "due")} {new Date(a.due_at).toISOString().slice(0, 10)} · {t(`enum.${a.status}`, a.status.replace(/_/g, " "))}</p>
            ))}
            {(ins.evidence as unknown as { storage_path: string; content_sha256: string | null }[]).map((e, i) => (
              <p key={i} className="ax-caption ax-numeric" style={{ marginBlockStart: 8 }}>📎 {e.storage_path} · sha256 {e.content_sha256?.slice(0, 12)}…</p>
            ))}
          </div>
          {/* M04-190 / M06-017 / M06-034 — factory data verification: Source vs Observed, before/after, updated highlighting */}
          <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
            <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>
              {t("review.ws.fvHeading", "Factory data verification (Senaei source vs observed)")}{" "}
              <span className={`ax-lozenge ${fvUpdated ? "ax-lozenge--warning" : "ax-lozenge--success"}`}>
                {fvUpdated
                  ? t("review.ws.fvChanged", "{n} field(s) updated").replace("{n}", String(fvUpdated))
                  : t("review.ws.fvNoChanges", "no changes vs source")}
              </span>
            </h4>
            {fv.error ? (
              <p className="ax-caption">{t("review.ws.fvError", "Verification data unavailable: {error}").replace("{error}", fv.error)}</p>
            ) : fv.checks.length === 0 ? (
              <p className="ax-caption">{t("review.ws.fvEmpty", "No factory-field checks recorded for this inspection.")}</p>
            ) : (
              <div className="ax-tablewrap"><table className="ax-table">
                <thead><tr>
                  <th>{t("review.ws.fvColField", "Field")}</th>
                  <th>{t("review.ws.fvColBefore", "Before — source (Senaei)")}</th>
                  <th>{t("review.ws.fvColAfter", "After — observed")}</th>
                  <th>{t("review.ws.fvColStatus", "Status")}</th>
                  <th>{t("review.ws.fvColEvidence", "Evidence")}</th>
                </tr></thead>
                <tbody>{fv.checks.map(c => (
                  <tr key={c.id} style={c.status === "updated" ? { background: "var(--ax-color-surface-sunken)" } : undefined}>
                    <td style={c.status === "updated" ? { borderInlineStart: "4px solid var(--ax-color-warning)" } : undefined}>
                      <strong>{t(`field.fv.f.${c.field_key}`, FACTORY_FIELD_EN[c.field_key] ?? c.field_key.replace(/_/g, " "))}</strong>
                    </td>
                    <td>{c.source_value ?? "—"}</td>
                    <td>{c.observed_value ?? "—"}</td>
                    <td><span className={`ax-lozenge ${c.status === "verified" ? "ax-lozenge--success" : "ax-lozenge--warning"}`}>{t(`enum.fv.${c.status}`, c.status)}</span></td>
                    <td className="ax-numeric">
                      {fvEvCount(c.id) || "—"}
                      {c.evidence_note && <div className="ax-caption">{c.evidence_note}</div>}
                    </td>
                  </tr>
                ))}</tbody>
              </table></div>
            )}
            <p className="ax-caption" style={{ marginBlockStart: "var(--ax-space-150)" }}>{t("review.ws.fvNote", "Observations never modify the Senaei source record (FND-007/M04-112); checks are audit-logged with before/after values (M04-113).")}</p>
          </div>
          {/* M04-197 / M06-021 — acknowledgement signature made visible to the reviewer */}
          {latest?.acknowledgement != null && (() => {
            const ack = latest.acknowledgement as { name?: string; ts?: string; signed_at?: string; signature_data_url?: string };
            return (
              <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
                <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{t("review.ws.sigHeading", "Acknowledgement signature (DEC-009)")}</h4>
                <p>
                  <strong>{ack.name ?? "—"}</strong> · <span className="ax-numeric">{(ack.signed_at ?? ack.ts) ? new Date(ack.signed_at ?? ack.ts!).toISOString().slice(0, 16).replace("T", " ") : "—"}</span>
                  {" "}<span className="ax-version">v{latest.version_number}</span>
                </p>
                {ack.signature_data_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={ack.signature_data_url} alt={t("review.ws.sigAlt", "Representative signature")} style={{ maxInlineSize: 280, maxBlockSize: 120, background: "var(--ax-color-surface-sunken)", border: "1px solid var(--ax-color-border)", borderRadius: "var(--ax-radius-standard)" }} />
                  : <p className="ax-caption">{t("review.ws.sigNone", "No drawn signature stored with this version (acknowledged by name only).")}</p>}
              </div>
            );
          })()}
          {prev && (
            <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
              <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>
                {t("review.ws.compareHeading", "Version comparison — v{a} vs v{b}").replace("{a}", String(prev.version_number)).replace("{b}", String(latest.version_number))}{" "}
                <span className="ax-lozenge ax-lozenge--info">{t("review.ws.changedCount", "{n} changed").replace("{n}", String(changedCount))}</span>
              </h4>
              <div className="ax-tablewrap"><table className="ax-table">
                <thead><tr>
                  <th>{t("review.ws.colItem", "Item")}</th>
                  <th>v{prev.version_number}</th>
                  <th>v{latest.version_number}</th>
                  <th>{t("review.ws.colChange", "Change")}</th>
                </tr></thead>
                <tbody>{diffRows.map(d => (
                  <tr key={d.key}>
                    <td><strong>{d.key}</strong></td>
                    <td>{d.prev != null ? <span className={`ax-lozenge ${d.prev === "non_compliant" ? "ax-lozenge--critical" : "ax-lozenge--success"}`}>{t(`enum.${d.prev}`, String(d.prev).replace(/_/g, " "))}</span> : "—"}</td>
                    <td>{d.latest != null ? <span className={`ax-lozenge ${d.latest === "non_compliant" ? "ax-lozenge--critical" : "ax-lozenge--success"}`}>{t(`enum.${d.latest}`, String(d.latest).replace(/_/g, " "))}</span> : "—"}</td>
                    <td>{d.changed
                      ? <span className="ax-lozenge ax-lozenge--warning">{t("review.ws.changed", "changed")}</span>
                      : <span className="ax-caption">{t("review.ws.unchanged", "unchanged")}</span>}</td>
                  </tr>
                ))}</tbody>
              </table></div>
              <p className="ax-caption" style={{ marginBlockStart: "var(--ax-space-150)" }}>{t("review.ws.compareNote", "Both versions are immutable snapshots (M06-011/023); the diff is computed from the stored answers, never re-derived.")}</p>
            </div>
          )}
          {(trail ?? []).length > 0 && (
            <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}>
              <h4 style={{ marginBlockEnd: "var(--ax-space-150)" }}>{t("review.ws.timelineHeading", "Timeline — audit trail (ENG-12)")}</h4>
              {(trail ?? []).map(ev => (
                <p key={ev.id} className="ax-caption" style={{ marginBlockStart: 4 }}>
                  <span className="ax-numeric">{new Date(ev.occurred_at).toISOString().slice(0, 16).replace("T", " ")}</span>
                  {" · "}<strong>{t(`enum.audit.${ev.object_type}`, ev.object_type.replace(/_/g, " "))}</strong>
                  {" · "}{t(`enum.audit.${ev.action}`, ev.action.replace(/_/g, " ").toLowerCase())}
                </p>
              ))}
              <p className="ax-caption" style={{ marginBlockStart: "var(--ax-space-150)" }}>{t("review.ws.timelineNote", "Append-only rows from audit_events; the database rejects edits and deletes (FND-003).")}</p>
            </div>
          )}
          {reviews.filter(r => { return !!r.decided_at; }).map(r => (
            <div key={r.id} className="ax-banner ax-banner--warning"><div><strong>{t("review.ws.priorDecision", "Prior decision:")}</strong> {r.decision ? t(`enum.${r.decision}`, r.decision) : "—"} · {r.decision_reason} {r.returned_sections && `· ${t("review.ws.sections", "sections")} ${r.returned_sections.join(", ")}`} <span className="ax-caption">({t("review.ws.immutable", "immutable")})</span></div></div>
          ))}
        </div>
        {open && ins.status === "under_review"
          ? <DecisionPanel reviewId={open.id} sections={sections.map(s => ({ key: s.key, title: s.title }))} strings={panelStrings} />
          : <div className="ax-surface" style={{ padding: "var(--ax-space-300)" }}><p className="ax-caption">{t("review.ws.noOpenDecision", "No open decision — status {status}.").replace("{status}", t(`enum.${ins.status}`, ins.status.replace(/_/g, " ")))}</p></div>}
      </div>
    </Shell>
  );
}
