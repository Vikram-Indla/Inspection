import Shell from "@/components/Shell";
import { supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import { resolveFeatureFlag } from "@/lib/providers/env-gate";
import { NotYetBoundary } from "@/components/NotYetBoundary";
import { AiDockets, type AiRow, type AiStrings } from "./AiDockets";
import type { AiDisposition } from "@/lib/ai/suggestions";

// TASK-MVP2-M2-11-ASSISTIVE-AI-001 · MVP2-REQ-0056..0066,0217..0223 · CD-048 (ai_dockets_v1, OFF).
export const dynamic = "force-dynamic";
const MODES = ["off", "on"] as const;

export default async function AiSuggestionsPage() {
  const { t } = await useT();
  if (resolveFeatureFlag(process.env.FEATURE_AI_DOCKETS, MODES, "off") !== "on") {
    return (
      <Shell current="/ai/suggestions" title={t("ai.title", "Assistive AI dockets")} context={<span className="ax-lozenge ax-lozenge--warning">CD-048 · REQ-0056</span>}>
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
    dispose: t("ai.dispose", "Disposition"), disposing: t("ai.disposing", "Applying…"), disposed: t("ai.disposed", "disposed"),
    reason: t("ai.reason", "Reason"),
    context: t("ai.context", "Context (advisory)"), generate: t("ai.generate", "Generate (AI)"),
    generating: t("ai.generating", "Generating…"), generated: t("ai.generated", "generated"),
    evidenceRefs: t("ai.evidenceRefs", "Evidence references"), clauseRefs: t("ai.clauseRefs", "Clause references"),
    confidence: t("ai.confidence", "Provider confidence"), confidenceUnavailable: t("ai.confidenceUnavailable", "Not supplied — do not infer"),
  };
  const mapped: AiRow[] = (rows ?? []).map((r) => ({
    id: r.id, surface: r.surface, text: String((r.suggestion as { text?: string })?.text ?? ""),
    disposition: r.disposition as AiDisposition, provider_status: r.provider_status,
    evidenceRefs: Array.isArray((r.suggestion as { evidence_refs?: unknown })?.evidence_refs) ? (r.suggestion as { evidence_refs: string[] }).evidence_refs : [],
    clauseRefs: Array.isArray((r.suggestion as { clause_refs?: unknown })?.clause_refs) ? (r.suggestion as { clause_refs: string[] }).clause_refs : [],
    confidence: typeof (r.suggestion as { confidence?: unknown })?.confidence === "number" ? (r.suggestion as { confidence: number }).confidence : null,
  }));
  return (
    <Shell current="/ai/suggestions" title={t("ai.title", "Assistive AI dockets")} context={<span className="ax-lozenge ax-lozenge--info">CD-048 · REQ-0056..0066</span>}>
      <div className="ax-banner"><div><strong>{t("ai.banner.title", "Advisory only — human decides.")}</strong> {t("ai.banner.body", "AI never writes a decision or legal text. Every suggestion needs a human disposition. The provider is fail-closed (unavailable) until configured; nothing is auto-actioned.")}</div></div>
      {error && <div className="ax-banner ax-banner--critical" role="alert"><div><strong>{t("ai.error", "Couldn’t load suggestions. Nothing changed.")}</strong></div></div>}
      {!error && mapped.length === 0 && (
        <div className="ax-surface"><div className="ax-state"><span className="ax-state__glyph">🤖</span>
          <h4>{t("ai.empty.title", "No suggestions")}</h4>
          <p className="ax-caption">{t("ai.empty.body", "With no configured provider, none are generated. A human may propose an advisory item for disposition. Empty may also mean none are in your scope (RLS).")}</p></div></div>
      )}
      <AiDockets rows={mapped} strings={strings} />
    </Shell>
  );
}
