import Shell from "@/components/Shell";
import { getServerUser, supabaseServer } from "@/lib/supabase-server";
import ActionForm from "@/app/(app)/admin/compliance-requests/ActionForm";
import { publishComplianceRequest, returnComplianceRequest, rejectComplianceRequest } from "@/app/(app)/admin/compliance-requests/actions";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type RequestRow = {
  id: string;
  request_number: string;
  title: string;
  request_type: string;
  owner_id: string;
  submitted_at: string | null;
  current_revision: number;
  status: string;
};
type ComponentRow = { request_id: string; revision_number: number; entity_kind: string; component_status: string };
type ComponentDetailRow = {
  id: string;
  entity_kind: string;
  component_status: string;
  target_entity_id: string | null;
  proposed_value_snapshot: Record<string, unknown>;
  decision_comments: string | null;
};

export default async function ApprovalQueue({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sb = await supabaseServer();
  const [sp, locale] = await Promise.all([searchParams, getLocale()]);
  const copy = (en: string, ar: string) => locale === "ar" ? ar : en;
  const current = sp.__shellRoute === "/admin/compliance-approvals" ? "/admin/compliance-approvals" : "/compliance/approvals";
  const { data: { user } } = await getServerUser();
  const [{ data, error }, componentRead] = await Promise.all([
    sb.from("compliance_configuration_requests")
      .select("id,request_number,title,request_type,owner_id,submitted_at,current_revision,status")
      .in("status", ["pending_review", "partially_approved", "approved"])
      .order("submitted_at", { ascending: true }),
    sb.from("compliance_request_components")
      .select("request_id,revision_number,entity_kind,component_status"),
  ]);
  const queueError = error ?? componentRead.error;
  const correlationId = queueError ? crypto.randomUUID() : null;
  if (queueError) console.error(`[compliance-approval-queue:${correlationId}]`, queueError.message, queueError.code);
  const allRows = (data ?? []) as RequestRow[];
  const rows = allRows.filter(row => row.owner_id !== user?.id);
  const components = (componentRead.data ?? []) as ComponentRow[];
  // Object review / decision rail scope to the current (first, is-selected)
  // request in the list — same "current" convention the card list already uses.
  const currentRequest = rows[0] ?? null;
  const { data: currentComponents, error: currentComponentsError } = currentRequest
    ? await sb.from("compliance_request_components")
        .select("id,entity_kind,component_status,target_entity_id,proposed_value_snapshot,decision_comments")
        .eq("request_id", currentRequest.id).eq("revision_number", currentRequest.current_revision).order("entity_kind")
    : { data: [], error: null };
  const currentComponentRows = (currentComponents ?? []) as ComponentDetailRow[];

  return (
    <Shell current={current} title="">
      <div className="rv-approval">
        {error || componentRead.error ? <div className="sq-banner sq-banner--critical" role="alert"><strong>Approval Queue unavailable.</strong> No workload claim is made. Reference {correlationId}.</div> : null}
        <header className="rv-approval__heading">
          <div><p className="sq-overline">Compliance configuration</p><h1>{copy("Approval Queue", "قائمة الاعتماد")}</h1><p>Object-level maker-checker decisions and governed publication readiness.</p></div>
          <span className="sq-lozenge sq-lozenge--warning">{rows.length} pending</span>
        </header>
        {/* CLASS-CONTRACT.md § Approval Queue — three-column workspace: request
            list · object review · decision rail. sq-grid-2's auto-fit columns
            already hold 3 panels at desktop width; no new CSS needed.
            Structure exists even with zero requests; each column then shows
            its own empty state rather than being omitted. */}
        <div className="sq-grid-2">
        <div className="rv-approval__cards">
          {rows.map((row, index) => {
            const current = components.filter(item => item.request_id === row.id && item.revision_number === row.current_revision);
            const decided = current.filter(item => ["approved", "rejected"].includes(item.component_status)).length;
            const kinds = ["regulation", "inspection_item", "violation", "penalty"];
            return (
              <article className={`rv-approval__card ${index === 0 ? "is-selected" : ""}`} key={row.id}>
                <div>
                  <p className="sq-overline">{row.request_type === "create" ? copy("Create", "إنشاء") : "Modify"} regulation</p>
                  <h2>{row.title}</h2>
                  <p>{row.request_number} · {copy("Version", "الإصدار")} {row.current_revision}</p>
                  <div className="rv-approval__chips">
                    {kinds.map(kind => <span key={kind}>◇ {current.filter(item => item.entity_kind === kind).length} {kind.replace("_", " ")}</span>)}
                  </div>
                  <small>{row.submitted_at ? new Date(row.submitted_at).toLocaleString("en-SA") : "Submission time not recorded"}</small>
                </div>
                <span className="sq-lozenge sq-lozenge--warning">• {row.status.replaceAll("_", " ")}</span>
                <a aria-label={`${copy("Open review", "فتح المراجعة")} ${row.title}`} href={`/admin/compliance-requests/${row.id}?from=approval-queue`}>{copy("Open review", "فتح المراجعة")}</a>
              </article>
            );
          })}
          {!error && !componentRead.error && rows.length === 0 ? (
            <section className="sq-state" role="status">
              <h2>No eligible requests in your scope</h2>
              <p>The RLS-scoped maker-checker read succeeded and returned zero requests. Requests owned by you remain excluded from your decision queue.</p>
            </section>
          ) : null}
        </div>

        <section className="panel" aria-label="Object review">
          <div className="panel-header"><span className="panel-title">Object review</span>{currentRequest ? <span className="badge">{currentRequest.request_number}</span> : null}</div>
          <div className="panel-body">
            {!currentRequest ? (
              <p className="desc">No request selected — the list is empty.</p>
            ) : currentComponentsError ? (
              <div className="sq-banner sq-banner--critical" role="alert"><strong>Object review unavailable.</strong> The component read failed.</div>
            ) : currentComponentRows.length === 0 ? (
              <p className="desc">No records.</p>
            ) : (
              <div className="stack">
                {currentComponentRows.map(component => {
                  const snapshotTitle = component.proposed_value_snapshot?.title ?? component.proposed_value_snapshot?.code ?? component.id.slice(0, 8);
                  return (
                    <div className="row" key={component.id} style={{ justifyContent: "space-between" }}>
                      <span><span className="id-code">{component.entity_kind}</span> · {String(snapshotTitle)}</span>
                      <span className={`badge ${component.component_status === "approved" ? "badge-completed" : component.component_status === "rejected" ? "badge-critical" : "badge-pending"}`}>{component.component_status.replaceAll("_", " ")}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <section className="panel" aria-label="Decision">
          <div className="panel-header"><span className="panel-title">{copy("Decision", "القرار")}</span></div>
          <div className="panel-body">
            {!currentRequest ? (
              <p className="desc">No records.</p>
            ) : (
              <div className="stack">
                <ActionForm action={publishComplianceRequest} className="stack">
                  <input type="hidden" name="request_id" value={currentRequest.id} />
                  <button className="btn" type="submit">{copy("Approve configuration request", "اعتماد طلب التهيئة")}</button>
                </ActionForm>
                <ActionForm action={returnComplianceRequest} className="stack">
                  <input type="hidden" name="request_id" value={currentRequest.id} />
                  <textarea className="input" name="comments" required placeholder="Return reason (required)" rows={3} />
                  <button className="btn btn-secondary" type="submit">{copy("Return package", "إعادة الحزمة")}</button>
                </ActionForm>
                <ActionForm action={rejectComplianceRequest} className="stack">
                  <input type="hidden" name="request_id" value={currentRequest.id} />
                  <textarea className="input" name="comments" required placeholder="Rejection reason (required)" rows={3} />
                  <button className="btn btn-danger" type="submit">{copy("Reject package", "رفض الحزمة")}</button>
                </ActionForm>
              </div>
            )}
          </div>
        </section>
        </div>
        <nav className="rv-approval__steps" aria-label="Review object sequence">
          {[
            [copy("Overview", "نظرة عامة"), copy("Read", "مقروء")],
            ["Regulation", `${components.filter(item => item.entity_kind === "regulation" && ["approved", "rejected"].includes(item.component_status)).length} decided`],
            [copy("Inspection items", "بنود التفتيش"), `${components.filter(item => item.entity_kind === "inspection_item" && ["approved", "rejected"].includes(item.component_status)).length} decided`],
            [copy("Violations", "المخالفات"), `${components.filter(item => item.entity_kind === "violation" && ["approved", "rejected"].includes(item.component_status)).length} decided`],
            [copy("Penalties", "العقوبات"), `${components.filter(item => item.entity_kind === "penalty" && ["approved", "rejected"].includes(item.component_status)).length} decided`],
            [copy("Summary", "الملخص"), copy("Blocked", "محجوب")],
          ].map(([label, meta], index) => <span className={index === 0 ? "is-current" : ""} key={label}><strong>{label}</strong><small>{meta}</small></span>)}
        </nav>
      </div>
    </Shell>
  );
}
