import "../../report.css";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import PrintReport from "@/components/PrintReport";

export const dynamic = "force-dynamic";

// M04-215 / M06-018 — official inspection report assembled from governed records:
// factory identity, visit configuration, locked package version, per-item
// responses (from the immutable submission snapshot), violations + penalties,
// action forms, evidence manifest, version history, review decisions and the
// representative acknowledgement signature. Browser print-to-PDF (A4) is the
// production PDF path; RLS decides who can read every embedded row.

type PenaltyRow = { penalty_ref: string; legal_basis: string | null };
type Snapshot = {
  answers?: Record<string, string>;
  notes?: Record<string, string>;
  dates?: Record<string, string>;
  context?: Record<string, string>;
  violations?: { item: string; code: string; title?: string | null; level: string | null; penalty_ref: string | null; legal_basis?: string | null; mapping_version: string | null }[];
  action_forms?: { item: string; form_type: string; owner_name?: string; owner_role?: string; due_at?: string; required_correction?: string; status: string }[];
  evidence?: { total: number; by_item: Record<string, number> };
  submitted_offline?: boolean;
};
type Ack = { name?: string; signed?: boolean; ts?: string; signed_at?: string; signature_data_url?: string };
type Sub = { id: string; version_number: number; snapshot: Snapshot; acknowledgement: Ack | null; submitted_at: string; profiles: { full_name: string } | null };
type Rev = { status: string; decision: string | null; decision_reason: string | null; returned_sections: string[] | null; decided_at: string | null; submission_version_id: string; profiles: { full_name: string } | null };

const dt = (s: string | null | undefined) => s ? new Date(s).toISOString().slice(0, 16).replace("T", " ") : "—";
const d10 = (s: string | null | undefined) => s ? new Date(s).toISOString().slice(0, 10) : "—";

export default async function InspectionReport({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t } = await useT();
  const sb = await supabaseServer();
  const [{ data: ins, error }, { data: itemRows }] = await Promise.all([
    sb.from("inspections").select(`id, status, context,
      visits(id, visit_type, execution_mode, planning_status, operational_state, window_start, window_end,
        assignments(status, profiles(full_name)),
        factories(name, factory_code, cr_number, license_number, region, city, activity_class, risk_band, risk_score)),
      package_versions(version_label, definition, packages(code, title)),
      submission_versions(id, version_number, snapshot, acknowledgement, submitted_at, profiles(full_name)),
      violations(mapping_version, violation_codes(code, title, level, penalty_mappings(penalty_ref, legal_basis))),
      inspection_penalties(status, mapping_snapshot),
      action_forms(form_type, owner_name, owner_role, due_at, status, required_correction),
      evidence(storage_path, evidence_type, content_sha256, captured_at),
      reviews(status, decision, decision_reason, returned_sections, decided_at, submission_version_id, profiles(full_name))`)
      .eq("id", id).maybeSingle(),
    sb.from("inspection_items").select("code, title"),
  ]);
  if (error || !ins) {
    if (error) console.error("[inspection report] load failed", error);
    return (
      <div className="rp-page"><div className="rp-doc">
        <p className="ax-caption">{error ? t("report.loadError", "The inspection report is temporarily unavailable. Nothing was changed. Try again.") : t("report.notFound", "Report unavailable — inspection not in your scope or does not exist (RLS).")}</p>
      </div></div>
    );
  }
  const v = ins.visits as unknown as {
    id: string; visit_type: string; execution_mode: string; planning_status: string; operational_state: string;
    window_start: string; window_end: string;
    assignments: { status: string; profiles: { full_name: string } | null }[];
    factories: { name: string; factory_code: string; cr_number: string | null; license_number: string | null; region: string | null; city: string | null; activity_class: string | null; risk_band: string | null; risk_score: number | null };
  };
  const f = v.factories;
  const pkg = ins.package_versions as unknown as { version_label: string; definition: { sections: { key: string; title: string; items?: string[] }[] }; packages: { code: string; title: string } };
  const subs = ((ins.submission_versions as unknown as Sub[]) ?? []).sort((a, b) => b.version_number - a.version_number);
  const latest = subs[0] as Sub | undefined;
  const snap: Snapshot = latest?.snapshot ?? {};
  const ack: Ack | null = latest?.acknowledgement ?? null;
  const reviews = ((ins.reviews as unknown as Rev[]) ?? []).filter(r => !!r.decided_at)
    .sort((a, b) => String(a.decided_at).localeCompare(String(b.decided_at)));
  const vios = (ins.violations as unknown as { mapping_version: string; violation_codes: { code: string; title: string; level: string; penalty_mappings: PenaltyRow | PenaltyRow[] | null } }[]) ?? [];
  const penaltyNotices = (ins.inspection_penalties as unknown as { status: string; mapping_snapshot: { mapping_version?: string } }[]) ?? [];
  const forms = (ins.action_forms as unknown as { form_type: string; owner_name: string | null; owner_role: string | null; due_at: string | null; status: string; required_correction: string | null }[]) ?? [];
  const evd = (ins.evidence as unknown as { storage_path: string; evidence_type: string; content_sha256: string | null; captured_at: string | null }[]) ?? [];
  const titleByCode = Object.fromEntries((itemRows ?? []).map(r => [r.code as string, r.title as string]));
  const inspector = v.assignments?.[0]?.profiles?.full_name ?? "—";
  const sections = (pkg.definition.sections ?? []).filter(s => !!s.items?.length);
  const vioByItem: Record<string, { code: string; level: string | null }[]> = {};
  for (const sv of snap.violations ?? []) (vioByItem[sv.item] ??= []).push({ code: sv.code, level: sv.level });
  const enumL = (x: string | null | undefined) => x ? t(`enum.${x}`, x.replace(/_/g, " ")) : "—";
  const versionByReview = (rid: string) => subs.find(s => s.id === rid)?.version_number;
  // DEF-WF-006 — an inspection must never be represented as approved without an
  // immutable submitted version backing it (M04-215/M06-018 integrity invariant,
  // now also enforced at the DB layer by trg_guard_approved_requires_submission).
  const approvedWithoutVersion = ins.status === "approved" && !latest;
  const displayStatus = approvedWithoutVersion
    ? t("report.integrityBlocked.status", "approval invalid — no immutable version")
    : enumL(ins.status);
  const strings = {
    print: t("report.print", "Print / Save as PDF"),
    hint: t("report.print.hint", "A4 print layout — the browser's Save-as-PDF is the official PDF path"),
    back: t("report.back", "Back to inspection records"),
  };

  return (
    <div className="rp-page">
      <PrintReport strings={strings} backHref={`/visits/${v.id}`} />
      <div className="rp-doc">
        {/* Ministry header — bilingual (official document identity) */}
        <header className="rp-head">
          <div className="rp-head__col">
            <strong>{t("report.head.kingdom", "Kingdom of Saudi Arabia")}</strong>
            <strong>{t("report.head.ministry", "Ministry of Industry and Mineral Resources")}</strong>
            <span className="ax-caption">{t("report.head.platform", "Saqeel Inspection Platform — official inspection report")}</span>
          </div>
          <div className="rp-head__mark" aria-hidden="true"><span lang="ar">صقيل</span></div>
          <div className="rp-head__col rp-head__ar">
            <strong>المملكة العربية السعودية</strong>
            <strong>وزارة الصناعة والثروة المعدنية</strong>
            <span className="ax-caption">منصة التفتيش — تقرير التفتيش الرسمي</span>
          </div>
        </header>

        <div className="ax-row" style={{ justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "var(--ax-space-200)" }}>
          <h2 className="rp-title">{t("report.title", "Inspection report — {factory}").replace("{factory}", f.name)}</h2>
          <span className="ax-caption ax-numeric">{t("report.ref", "Inspection")} {ins.id.slice(0, 8)} · {latest ? `v${latest.version_number}` : t("report.noVersion", "no submitted version")} · {displayStatus}</span>
        </div>

        {approvedWithoutVersion ? (
          <div className="ax-banner ax-banner--critical no-print" role="alert"><div>
            <strong>{t("report.integrityBlocked.title", "Data-integrity defect — invalid approval")}</strong> {t("report.integrityBlocked.body", "This inspection is recorded as approved but has no immutable submitted version on file. The approval is not valid and must not be relied on as an official decision until an immutable submission exists (DEF-WF-006).")}
          </div></div>
        ) : !latest && (
          <div className="ax-banner ax-banner--warning no-print"><div>
            <strong>{t("report.notSubmitted.title", "No immutable submission yet.")}</strong> {t("report.notSubmitted.body", "The official report is generated from the submitted version snapshot; identity and configuration below are live records (M04-215).")}
          </div></div>
        )}

        {/* 1 · Factory identity */}
        <section className="rp-section">
          <h3>{t("report.factory.heading", "Factory identity")}</h3>
          <dl className="rp-kv">
            <div><dt>{t("report.factory.name", "Establishment")}</dt><dd>{f.name}</dd></div>
            <div><dt>{t("report.factory.code", "Factory code")}</dt><dd className="ax-numeric">{f.factory_code ?? "—"}</dd></div>
            <div><dt>{t("report.factory.cr", "Commercial registration")}</dt><dd className="ax-numeric">{f.cr_number ?? "—"}</dd></div>
            <div><dt>{t("report.factory.license", "Industrial license")}</dt><dd className="ax-numeric">{f.license_number ?? "—"}</dd></div>
            <div><dt>{t("report.factory.location", "Region / city")}</dt><dd>{f.region ?? "—"} · {f.city ?? "—"}</dd></div>
            <div><dt>{t("report.factory.activity", "Activity class")}</dt><dd>{f.activity_class ?? "—"}</dd></div>
            <div><dt>{t("report.factory.risk", "Risk band")}</dt><dd>{enumL(f.risk_band)} · <span className="ax-numeric">{f.risk_score ?? "—"}</span></dd></div>
          </dl>
        </section>

        {/* 2 · Visit configuration + locked package version */}
        <section className="rp-section">
          <h3>{t("report.visit.heading", "Visit configuration")}</h3>
          <dl className="rp-kv">
            <div><dt>{t("report.visit.id", "Visit")}</dt><dd className="ax-numeric">{v.id.slice(0, 8)}</dd></div>
            <div><dt>{t("report.visit.type", "Type / mode")}</dt><dd>{enumL(v.visit_type)} · {enumL(v.execution_mode)}</dd></div>
            <div><dt>{t("report.visit.window", "Window")}</dt><dd className="ax-numeric">{dt(v.window_start)} → {dt(v.window_end)}</dd></div>
            <div><dt>{t("report.visit.state", "Lifecycle")}</dt><dd>{enumL(v.planning_status)} · {enumL(v.operational_state)}</dd></div>
            <div><dt>{t("report.visit.inspector", "Assigned inspector")}</dt><dd>{inspector}</dd></div>
            <div><dt>{t("report.visit.package", "Checklist package (locked)")}</dt><dd>{pkg.packages.code} · {pkg.packages.title} <span className="ax-version">{pkg.version_label}</span></dd></div>
          </dl>
        </section>

        {/* 3 · Per-item responses from the immutable snapshot */}
        {latest && (
          <section className="rp-section">
            <h3>{t("report.items.heading", "Checklist responses — immutable v{n}").replace("{n}", String(latest.version_number))}</h3>
            {sections.map(s => (
              <div key={s.key} className="rp-section">
                <strong>{s.title}</strong>
                <table className="rp-table">
                  <thead><tr>
                    <th>{t("report.items.th.item", "Item")}</th>
                    <th>{t("report.items.th.response", "Response")}</th>
                    <th>{t("report.items.th.note", "Inspector note")}</th>
                    <th>{t("report.items.th.violation", "Violation")}</th>
                    <th className="ax-td-num">{t("report.items.th.evidence", "Evidence")}</th>
                  </tr></thead>
                  <tbody>
                    {(s.items ?? []).map(code => {
                      const ans = snap.answers?.[code];
                      const itemVios = vioByItem[code] ?? [];
                      return (
                        <tr key={code}>
                          <td><strong className="ax-numeric">{code}</strong> {titleByCode[code] ?? ""}</td>
                          <td>{ans ? <span className={`ax-lozenge ${ans === "non_compliant" ? "ax-lozenge--critical" : "ax-lozenge--success"}`}>{enumL(ans)}</span> : <span className="ax-caption">{t("report.items.notApplicable", "not answered / not applicable")}</span>}</td>
                          <td>{snap.notes?.[code] ?? "—"}{snap.dates?.[code] ? <span className="ax-caption ax-numeric"> · {snap.dates[code]}</span> : null}</td>
                          <td>{itemVios.length ? itemVios.map(x => <span key={x.code} className="ax-lozenge ax-lozenge--critical" style={{ marginInlineEnd: 4 }}>{x.code}{x.level ? ` · ${enumL(x.level)}` : ""}</span>) : "—"}</td>
                          <td className="ax-td-num ax-numeric">{snap.evidence?.by_item?.[code] ?? 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </section>
        )}

        {/* 4 · Violations & penalties (immutable submission/config snapshots) */}
        <section className="rp-section">
          <h3>{t("report.vio.heading", "Violations and penalty references")}</h3>
          {(snap.violations?.length ?? vios.length) === 0 ? <p className="ax-caption">{t("report.vio.none", "No violations recorded for this inspection.")}</p> : (
            <table className="rp-table">
              <thead><tr><th>{t("report.vio.th.code", "Code")}</th><th>{t("report.vio.th.title", "Title")}</th><th>{t("report.vio.th.level", "Severity")}</th><th>{t("report.vio.th.penalty", "Penalty ref · legal basis")}</th><th>{t("report.vio.th.mapping", "Mapping version")}</th></tr></thead>
              <tbody>
                {(snap.violations ?? vios.map(x => {
                  const pm = Array.isArray(x.violation_codes.penalty_mappings) ? x.violation_codes.penalty_mappings[0] : x.violation_codes.penalty_mappings;
                  return { item: "", code: x.violation_codes.code, title: x.violation_codes.title, level: x.violation_codes.level, penalty_ref: pm?.penalty_ref ?? null, legal_basis: pm?.legal_basis ?? null, mapping_version: x.mapping_version };
                })).map((x, i) => {
                  const notice = penaltyNotices.find(p => p.mapping_snapshot?.mapping_version === x.mapping_version);
                  return (
                    <tr key={i}>
                      <td><strong>{x.code}</strong></td>
                      <td>{x.title ?? "—"}</td>
                      <td>{enumL(x.level)}</td>
                      <td>{x.penalty_ref ? `${x.penalty_ref} · ${x.legal_basis ?? "—"} · ${enumL(notice?.status ?? "informational")}` : "—"}</td>
                      <td className="ax-numeric">{x.mapping_version}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        {/* 5 · Corrective action forms */}
        <section className="rp-section">
          <h3>{t("report.af.heading", "Corrective action forms")}</h3>
          {forms.length === 0 ? <p className="ax-caption">{t("report.af.none", "No action forms required.")}</p> : (
            <table className="rp-table">
              <thead><tr><th>{t("report.af.th.type", "Form")}</th><th>{t("report.af.th.correction", "Required correction")}</th><th>{t("report.af.th.owner", "Owner")}</th><th className="ax-td-num">{t("report.af.th.due", "Due")}</th><th>{t("report.af.th.status", "Status")}</th></tr></thead>
              <tbody>
                {forms.map((a, i) => (
                  <tr key={i}>
                    <td>{a.form_type}</td>
                    <td>{a.required_correction ?? "—"}</td>
                    <td>{a.owner_name ?? "—"}{a.owner_role ? ` · ${a.owner_role}` : ""}</td>
                    <td className="ax-td-num ax-numeric">{d10(a.due_at)}</td>
                    <td><span className={`ax-lozenge ${a.status === "complete" ? "ax-lozenge--success" : "ax-lozenge--warning"}`}>{enumL(a.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* 6 · Evidence manifest (custody: sha256 at sync, ENG-07) */}
        <section className="rp-section">
          <h3>{t("report.ev.heading", "Evidence manifest")}</h3>
          {evd.length === 0 ? <p className="ax-caption">{t("report.ev.none", "No evidence attached.")}</p> : (
            <table className="rp-table">
              <thead><tr><th>{t("report.ev.th.file", "Stored file")}</th><th>{t("report.ev.th.type", "Type")}</th><th className="ax-td-num">{t("report.ev.th.captured", "Captured")}</th><th>{t("report.ev.th.sha", "Integrity (sha256)")}</th></tr></thead>
              <tbody>
                {evd.map((e, i) => (
                  <tr key={i}>
                    <td className="ax-numeric">{e.storage_path}</td>
                    <td>{enumL(e.evidence_type)}</td>
                    <td className="ax-td-num ax-numeric">{dt(e.captured_at)}</td>
                    <td className="ax-numeric">{e.content_sha256 ? `${e.content_sha256.slice(0, 16)}…` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* 7 · Submission versions + review decisions */}
        <section className="rp-section">
          <h3>{t("report.hist.heading", "Submission versions and review decisions")}</h3>
          <table className="rp-table">
            <thead><tr><th>{t("report.hist.th.version", "Version")}</th><th className="ax-td-num">{t("report.hist.th.submitted", "Submitted")}</th><th>{t("report.hist.th.by", "By")}</th><th>{t("report.hist.th.ack", "Acknowledgement")}</th></tr></thead>
            <tbody>
              {subs.length === 0 && <tr><td colSpan={4} className="ax-caption">{t("report.hist.none", "No submitted versions yet.")}</td></tr>}
              {subs.map(s => (
                <tr key={s.id}>
                  <td><span className="ax-version">v{s.version_number}</span> {t("report.hist.immutable", "immutable")}</td>
                  <td className="ax-td-num ax-numeric">{dt(s.submitted_at)}</td>
                  <td>{s.profiles?.full_name ?? "—"}</td>
                  <td>{s.acknowledgement?.name ?? "—"}{s.acknowledgement?.signature_data_url ? ` · ${t("report.hist.signed", "signed")}` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {reviews.length === 0 ? <p className="ax-caption">{t("report.rev.none", "No review decision recorded yet.")}</p> : reviews.map((r, i) => (
            <p key={i}>
              <span className={`ax-lozenge ${r.decision === "approve" ? "ax-lozenge--success" : r.decision === "reject" ? "ax-lozenge--critical" : "ax-lozenge--warning"}`}>{enumL(r.decision)}</span>{" "}
              <span className="ax-version">v{versionByReview(r.submission_version_id) ?? "—"}</span>{" "}
              {r.profiles?.full_name ?? "—"} · <span className="ax-numeric">{dt(r.decided_at)}</span>
              {r.decision_reason ? <> — {r.decision_reason}</> : null}
              {r.returned_sections?.length ? <span className="ax-caption"> · {t("report.rev.sections", "returned sections:")} {r.returned_sections.join(", ")}</span> : null}
            </p>
          ))}
        </section>

        {/* 8 · Signatures (DEC-009) */}
        <section className="rp-section">
          <h3>{t("report.sig.heading", "Acknowledgement and signatures")}</h3>
          <div className="rp-sig">
            <div>
              <dl className="rp-kv"><div><dt>{t("report.sig.rep", "Factory representative")}</dt><dd>{ack?.name ?? "—"}</dd></div></dl>
              {ack?.signature_data_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img className="rp-sig__img" src={ack.signature_data_url} alt={t("report.sig.alt", "Representative signature")} />
                : <div className="rp-sig__line" aria-hidden="true" />}
              <p className="ax-caption ax-numeric">{dt(ack?.signed_at ?? ack?.ts)}</p>
            </div>
            <div>
              <dl className="rp-kv"><div><dt>{t("report.sig.inspector", "Inspector")}</dt><dd>{inspector}</dd></div></dl>
              <div className="rp-sig__line" aria-hidden="true" />
              <p className="ax-caption ax-numeric">{dt(latest?.submitted_at)}</p>
            </div>
          </div>
        </section>

        <footer className="rp-foot">
          <span>{t("report.foot.generated", "Generated from live records")} · <span className="ax-numeric">{dt(new Date().toISOString())}</span></span>
          <span>M04-215 · M06-018 · DEC-009 · ENG-12</span>
        </footer>
      </div>
    </div>
  );
}
