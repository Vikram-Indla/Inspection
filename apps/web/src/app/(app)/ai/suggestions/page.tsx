import Shell, { preloadShell } from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";
import EmptyState from "@/components/EmptyState";
import { NotYetBoundary } from "@/components/NotYetBoundary";
import { IconRobot } from "@/app/icons";
import { AiDockets, type AiRow, type AiStrings } from "./AiDockets";
import type { AiDisposition } from "@/lib/ai/suggestions";
import { geminiProviderState } from "@/lib/providers/ai-gemini";

// TASK-MVP2-M2-11-ASSISTIVE-AI-001 · MVP2-REQ-0056..0066,0217..0223 · CD-048 (ai_dockets_v1, OFF).
const MODES = ["off", "on"] as const;

export default async function AiSuggestionsPage() {
  preloadShell("/ai/suggestions");
  const { t } = await useT();
  if (resolveFeatureFlag(process.env.FEATURE_AI_DOCKETS, MODES, "off") !== "on") {
    return (
      <Shell current="/ai/suggestions" title={t("ai.title", "Assistive AI dockets")} context={<span className="badge badge-warning">CD-048 · REQ-0056</span>}>
        <NotYetBoundary title={t("ai.title", "Assistive AI dockets")}
          consequence={t("ai.off", "Assistive AI is off by default. Suggestions are advisory and require human disposition; the AI provider is fail-closed until configured, and legal source text is never generated.")}
          seam="FEATURE_AI_DOCKETS=off + AI provider held" notAvailableLabel={t("tasks.notYet", "Not available yet")} detailLabel={t("common.whyPrereq", "Why / prerequisites")} />
      </Shell>
    );
  }
  const sb = await supabaseServer();
  const { data: rows, error } = await sb.from("ai_suggestions")
    .select("id, surface, suggestion, disposition, provider_status").order("created_at", { ascending: false }).limit(50);
  if (error) console.error("[ai suggestions] load", error);
  const strings: AiStrings = {
    surface: t("ai.surface", "Surface"), text: t("ai.text", "Advisory suggestion"),
    propose: t("ai.propose", "Propose"), proposing: t("ai.proposing", "Proposing…"), proposed: t("ai.proposed", "proposed"),
    dispose: t("ai.dispose", "Disposition (allowed only)"), disposing: t("ai.disposing", "Applying…"), disposed: t("ai.disposed", "disposed"),
    applyDisposition: t("ai.applyDisposition", "Apply disposition"),
    reason: t("ai.reason", "Reason"), reasonHint: t("ai.reasonHint", "Rationale (recorded to audit)"),
    context: t("ai.context", "Context (advisory)"), generate: t("ai.generate", "Generate"),
    generating: t("ai.generating", "Generating…"), generated: t("ai.generated", "generated"),
    generateTitle: t("ai.generateTitle", "Generate advisory suggestion (AI)"),
    proposeTitle: t("ai.proposeTitle", "Propose advisory item (human)"),
    contextHint: t("ai.contextHint", "Non-authoritative context"),
    textHint: t("ai.textHint", "What to consider (not a decision)"),
    evidenceHint: t("ai.evidenceHint", "INS-… / EV-…"), clauseHint: t("ai.clauseHint", "FS-3.1"),
    evidenceRefs: t("ai.evidenceRefs", "Evidence refs"), clauseRefs: t("ai.clauseRefs", "Clause refs"),
    evidenceRefsLong: t("ai.evidenceRefsLong", "Evidence references"), clauseRefsLong: t("ai.clauseRefsLong", "Clause references"),
    confidence: t("ai.confidence", "Provider confidence"), confidenceUnavailable: t("ai.confidenceUnavailable", "Not supplied — do not infer"),
    confidenceUnverified: t("ai.confidenceUnverified", "(provider-reported, unverified)"),
    terminal: t("ai.terminal", "Terminal disposition — no further transition."),
    providerReady: t("ai.providerReady", "provider ready"), providerHeld: t("ai.providerHeld", "fail-closed"),
    generateHintReady: t("ai.generateHintReady", "Generated suggestions are still advisory and require a human disposition."),
    generateHintHeld: t("ai.generateHintHeld", "Generation is disabled while the provider is fail-closed. A human may still propose an advisory item below."),
  };
  const providerConfigured = geminiProviderState() === "configured";
  const mapped: AiRow[] = (rows ?? []).map((r) => ({
    id: r.id, surface: r.surface, text: String((r.suggestion as { text?: string })?.text ?? ""),
    disposition: r.disposition as AiDisposition, provider_status: r.provider_status,
    evidenceRefs: Array.isArray((r.suggestion as { evidence_refs?: unknown })?.evidence_refs) ? (r.suggestion as { evidence_refs: string[] }).evidence_refs : [],
    clauseRefs: Array.isArray((r.suggestion as { clause_refs?: unknown })?.clause_refs) ? (r.suggestion as { clause_refs: string[] }).clause_refs : [],
    confidence: typeof (r.suggestion as { confidence?: unknown })?.confidence === "number" ? (r.suggestion as { confidence: number }).confidence : null,
  }));
  return (
    <Shell current="/ai/suggestions" title={t("ai.title", "Assistive AI dockets")}
      context={
        <>
          <span className="t-caption">{t("ai.subtitle", "Advisory suggestions across planning, inspection, review & operations")}</span>
          <span className={`badge ${providerConfigured ? "badge-compliant" : "badge-critical"}`}>
            <span className="dot" />
            {providerConfigured
              ? t("ai.provider.configured", "AI provider · configured")
              : t("ai.provider.held", "AI provider · fail-closed (unavailable)")}
          </span>
        </>
      }>
      {/* Advisory banner — the standing statement of the rule this route exists to keep. */}
      <div className="panel" style={{ padding: "var(--space-4) var(--space-5)", borderInlineStart: "3px solid var(--action-primary)", display: "flex", gap: "var(--space-3)" }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--action-primary)" strokeWidth={1.7} aria-hidden="true" style={{ width: 20, height: 20, flex: "none", marginBlockStart: 2 }}>
          <circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" />
        </svg>
        <div>
          <div style={{ fontWeight: 600 }}>{t("ai.banner.title", "Advisory only — human decides.")}</div>
          <p className="t-caption" style={{ margin: "var(--space-1) 0 0" }}>{t("ai.banner.body", "AI never writes a decision or legal text. Every suggestion needs a human disposition. The provider is fail-closed (unavailable) until configured; nothing is auto-actioned.")}</p>
        </div>
      </div>
      {error && <div className="sq-banner sq-banner--critical" role="alert"><div><strong>{t("ai.error", "Couldn’t load suggestions. Nothing changed.")}</strong></div></div>}
      <AiDockets rows={mapped} strings={strings} providerConfigured={providerConfigured} />
      {!error && mapped.length === 0 && (
        <EmptyState icon={<IconRobot size={28} />} title={t("ai.empty.title", "No suggestions")}
          body={t("ai.empty.body", "With no configured provider, none are generated. A human may propose an advisory item for disposition. Empty may also mean none are in your scope (RLS).")} />
      )}
    </Shell>
  );
}
