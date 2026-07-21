import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { formatDateTime } from "@/lib/dates";
import { NotYetBoundary } from "@/components/NotYetBoundary";
import EmptyState from "@/components/EmptyState";
import { IconShuffle } from "@/app/icons";
import { ProposeDraftForm, DraftPayloadEditor, ApprovePublish, type WfStrings } from "./Controls";
import { WfDeck, type WfDeckStrings } from "./WfDeck";

export const dynamic = "force-dynamic";

type Transition = { id: string; from: string; to: string; actor: string; guard: string; side_effects?: string[]; terminal?: boolean };

export default async function Workflows() {
  const { t, locale } = await useT();
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  const { data: wfs, error } = await sb.from("config_versions")
    .select("id, version_label, status, payload, effective_from, created_at, created_by, approved_by")
    .eq("engine", "workflow").order("effective_from", { ascending: false });
  if (error) console.error("[admin workflows] load failed", error);
  // Approval-chain visibility (RBAC-002 maker-checker): resolve maker/checker names.
  const chainIds = [...new Set((wfs ?? []).flatMap(w => [w.created_by, w.approved_by]).filter((x): x is string => !!x))];
  const profRes = chainIds.length ? await sb.from("profiles").select("user_id, full_name").in("user_id", chainIds) : null;
  const nameOf = (uid: string | null) => uid ? (profRes?.data?.find(p => p.user_id === uid)?.full_name ?? `${uid.slice(0, 8)}…`) : null;
  const strings: WfStrings = {
    newVersionLabel: t("admin.wf.propose.label", "New version label"),
    proposing: t("admin.wf.propose.proposing", "Proposing…"),
    propose: t("admin.wf.propose.button", "Propose draft from this version"),
    draftCreated: t("admin.wf.propose.created", "draft created"),
    payloadLabel: t("admin.wf.editor.payloadLabel", "State machine payload (object · states[] · transitions[])"),
    saving: t("admin.wf.editor.saving", "Saving…"),
    saveDraft: t("admin.wf.editor.save", "Save draft"),
    saved: t("admin.wf.editor.saved", "saved"),
    publishing: t("admin.wf.publish.publishing", "Publishing…"),
    approvePublish: t("admin.wf.publish.approve", "Approve & publish"),
  };
  const deckStrings: WfDeckStrings = {
    ledgerTitle: t("admin.wf.deck.ledger", "Validation ledger (VAL-01..06)"),
    graphTitle: t("admin.wf.deck.graph", "State graph"),
    inspectorTitle: t("admin.wf.deck.inspector", "Transition inspector"),
    passed: t("admin.wf.deck.passed", "valid"),
    failed: t("admin.wf.deck.failed", "resolve before publishing"),
    initial: t("admin.wf.deck.initial", "initial"),
    terminal: t("admin.wf.deck.terminal", "terminal"),
    actor: t("admin.wf.deck.actor", "Actor"),
    guards: t("admin.wf.deck.guards", "Guards"),
    sideEffects: t("admin.wf.deck.sideEffects", "Side effects"),
    idempotent: t("admin.wf.deck.idempotent", "idempotent"),
    noIdempotencyKey: t("admin.wf.deck.noKey", "no idempotency key"),
    selectHint: t("admin.wf.deck.selectHint", "Select a state to filter its outgoing transitions; select a transition row to inspect it."),
    none: t("admin.wf.deck.none", "—"),
  };
  return (
    <Shell current="/admin/workflows" title={t("admin.wf.title", "Workflow configuration")}
      context={<span className="ax-lozenge ax-lozenge--info">SCR-ADM-050/051 · ENG-03</span>}>
      <div className="ax-banner"><div>
        <strong>{t("admin.wf.banner.title", "Governed change only.")}</strong> {t("admin.wf.banner.before", "Runtime evaluates transitions against the published version — no status bypass (RBAC-003). Changes flow draft → distinct-approver publish (RBAC-002 maker-checker, enforced by a DB constraint on")} <code>config_versions</code>{t("admin.wf.banner.mid", "); published versions are immutable. Risk/SLA values live in")} <code>engine_settings</code> {t("admin.wf.banner.after", "and are not editable here.")}
      </div></div>
      {error && (
        <div className="ax-banner ax-banner--critical"><div>
          <strong>{t("admin.wf.error.title", "Couldn’t load workflow configuration. Nothing was changed. Try again.")}</strong>
        </div></div>
      )}
      {!error && (wfs ?? []).length === 0 && (
        <EmptyState icon={<IconShuffle size={28} />} title={t("admin.wf.empty.title", "No workflow configuration published")}
          body={t("admin.wf.empty.body", "Workflow state machines are versioned config (ENG-03).")} />
      )}
      {(wfs ?? []).map(w => {
        const p = w.payload as { object?: string; states?: string[]; transitions?: Transition[] };
        // RBAC-002 separation of duties: the maker cannot be the checker. When the
        // viewer proposed this draft, the DB will reject self-approval — so we
        // pre-empt it with an explanation rather than an Approve button that fails.
        const isOwnDraft = w.status === "draft" && !!user && w.created_by === user.id;
        return (
          <div key={w.id} className="ax-surface" style={{ padding: "var(--ax-space-300)", display: "flex", flexDirection: "column", gap: "var(--ax-space-200)" }}>
            <div className="ax-row" style={{ justifyContent: "space-between" }}>
              <h3>{t("admin.wf.object", "Object:")} {p.object ?? "—"} <span className="ax-version">{w.version_label}</span></h3>
              <div className="ax-row" style={{ gap: "var(--ax-space-150)" }}>
                <span className={`ax-lozenge ${w.status === "published" ? "ax-lozenge--success" : "ax-lozenge--warning"}`}>{t(`enum.${w.status}`, String(w.status).replace(/_/g, " "))}</span>
                {w.status === "draft" && !isOwnDraft && <ApprovePublish versionId={w.id} strings={strings} />}
                {isOwnDraft && (
                  <span className="ax-lozenge ax-lozenge--warning" title={t("admin.wf.sod.desc", "You proposed this draft (the maker). A different checker must approve it — separation of duties is enforced by a DB constraint.")}>
                    {t("admin.wf.sod.title", "You proposed this — a distinct checker must approve")}
                  </span>
                )}
              </div>
            </div>
            <p className="ax-caption">{t("admin.wf.states", "States:")} {(p.states ?? []).join(" · ")} {t("admin.wf.statesNote", "— runtime evaluates transitions against this published version; no status bypass (RBAC-003; maker-checker on config_versions enforced by DB constraint).")}</p>
            {/* Approval chain — maker → checker, straight from config_versions (RBAC-002) */}
            <p className="ax-caption">
              {t("admin.wf.chain.proposed", "Proposed by")} <strong>{nameOf(w.created_by) ?? "—"}</strong>
              {w.created_at && <> · <span className="ax-numeric">{formatDateTime(w.created_at, locale === "ar" ? "ar" : "en")}</span></>}
              {" → "}
              {w.approved_by
                ? <>{t("admin.wf.chain.approved", "approved by")} <strong>{nameOf(w.approved_by)}</strong> <span className="ax-lozenge ax-lozenge--success">{t("admin.wf.chain.distinct", "distinct approver")}</span></>
                : <>{t("admin.wf.chain.pending", "awaiting a distinct approver (maker-checker, DB-enforced)")}</>}
            </p>
            {/* M2-02 Workflow Flight Deck — graph + outline, transition inspector,
                and the live VAL-01..06 validation ledger (now a real check). */}
            <WfDeck payload={w.payload} strings={deckStrings} />
            {w.status === "draft" && (
              <>
                <DraftPayloadEditor versionId={w.id} payload={w.payload as object} strings={strings} />
                {/* M2-02: the graph and the VAL-01..06 validation ledger above are now
                    real (WfDeck). The remaining honest boundary is the deterministic
                    simulation engine with fixtures + persisted replay/audit — the pure
                    evaluator exists (lib/workflow/transition), but the fixture store and
                    replay persistence are not built, so no run-replay is claimed here. */}
                <NotYetBoundary
                  title={t("admin.wf.sim.title", "Simulation fixtures & persisted replay")}
                  consequence={t("admin.wf.sim.desc", "The graph and validation ledger above are live; a persisted simulation/replay run (fixtures + audit) is not built yet, so no run history is shown.")}
                  seam="NEEDS_APPROVED_CONTRACT — simulation fixtures / replay persistence (GAP-02)"
                  prerequisites={[
                    t("admin.wf.sim.pre1", "A fixture store (sim_fixtures) and seed context"),
                    t("admin.wf.sim.pre2", "Persisted simulation runs (sim_runs) with audit"),
                  ]}
                  notAvailableLabel={t("admin.wf.notYet", "Not available yet")}
                  detailLabel={t("common.whyPrereq", "Why / prerequisites")}
                />
              </>
            )}
            {w.status === "published" && <ProposeDraftForm baseVersionId={w.id} baseLabel={w.version_label} strings={strings} />}
          </div>
        );
      })}
    </Shell>
  );
}
