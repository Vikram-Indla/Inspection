// Assistive-AI provider — Google Gemini adapter for M2-11 governed suggestions.
// TASK-MVP2-M2-11-ASSISTIVE-AI-001 · MVP2-REQ-0056..0066 · CD-048.
//
// Hard rules (never relaxed): AI is ADVISORY only — it never writes a decision and
// NEVER generates legal source text (regulation/clause/decision surfaces are
// refused before any call). Fail-closed: without GEMINI_API_KEY the provider is
// 'unavailable' and produces nothing (the suggestion lifecycle stays human-driven).
import { isSuggestionSurfaceAllowed } from "@/lib/ai/suggestions";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export type AiGenResult = { ok: boolean; text?: string; reason?: string };

// Every consumer of this provider renders `text` as plain text/whitespace-pre
// (ContextualAiPanel, the field daily/weekly briefing card) — none of them
// interpret Markdown. The prompts below ask for plain prose, but models don't
// always comply; this is a defensive belt-and-suspenders strip so a stray
// "**bold**" or "* bullet" never leaks into the UI as literal asterisks.
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^[ \t]*[-*]\s+/gm, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// The daily/weekly briefing renders as a real bullet list (DR-47 — a wall of
// prose is not scannable for a field inspector). Keep the "- " line markers
// (unlike stripMarkdown above) but still strip inline bold/asterisk emphasis,
// and normalize any bullet glyph the model uses to a single "- " form.
function bulletize(text: string): string {
  return text
    .split("\n")
    .map((line) => line.replace(/\*\*(.*?)\*\*/g, "$1").replace(/^[ \t]*[-*•]\s*/, "").trim())
    .filter(Boolean)
    .map((line) => `- ${line}`)
    .join("\n");
}

// A response cut off by MAX_TOKENS ends mid-sentence on its last line. Rather
// than show a dangling fragment (DR-47's "additional trailing text record is
// cut off" apology text was itself a symptom of this), drop that last
// incomplete line — the remaining complete bullets are still a valid,
// honest-if-shorter briefing.
function dropTruncatedTail(text: string, truncated: boolean): string {
  if (!truncated) return text;
  const lines = text.split("\n").filter(Boolean);
  if (lines.length <= 1) return text; // nothing complete to fall back to — show what we have
  return lines.slice(0, -1).join("\n");
}

export class GeminiSuggestionProvider {
  constructor(private readonly apiKey: string, private readonly model = "gemini-flash-latest") {}

  async generate(surface: string, context: string): Promise<AiGenResult> {
    // Guardrail first: legal source surfaces are refused before any network call.
    if (!isSuggestionSurfaceAllowed(surface)) return { ok: false, reason: "legal_surface_refused" };
    const prompt = [
      "You are an advisory assistant for a factory inspection platform.",
      `Give ONE brief, non-binding operational suggestion for the "${surface}" surface.`,
      "Do NOT write legal text, regulation clauses, decisions, or policy values.",
      "Keep it under 60 words.",
      "Write plain prose sentences only — no Markdown, no asterisks, no bullet lists, no headings.",
      `Context: ${String(context ?? "").slice(0, 2000)}`,
    ].join(" ");
    try {
      const res = await fetch(`${GEMINI_BASE}/${this.model}:generateContent`, {
        method: "POST",
        headers: { "x-goog-api-key": this.apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          // gemini-flash-latest resolves to a "thinking" model (gemini-3.6-flash):
          // it spends part of maxOutputTokens on internal thoughtsTokenCount before
          // producing any visible text. Without a bounded thinkingBudget, longer
          // prompts exhaust the token budget on reasoning and finishReason comes
          // back MAX_TOKENS with a truncated/empty visible response. A small fixed
          // budget (confirmed against the live API) leaves the rest of the budget
          // for real output. See generateContextual() below for the same fix.
          generationConfig: { maxOutputTokens: 400, temperature: 0.4, thinkingConfig: { thinkingBudget: 100 } },
        }),
      });
      if (!res.ok) return { ok: false, reason: `gemini_${res.status}` };
      const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const text = stripMarkdown((data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim());
      if (!text) return { ok: false, reason: "empty_response" };
      return { ok: true, text };
    } catch {
      return { ok: false, reason: "gemini_network_error" };
    }
  }

  /**
   * Generate a business-context advisory. This is deliberately separate from
   * the M2-11 docket prompt so contextual surfaces can require source facts,
   * evidence references and a bounded response without changing docket UX.
   */
  async generateContextual(surface: "planning_summary" | "preparation_assistant" | "inspection_item_explanation" | "factory_risk_explanation" | "inspector_daily_briefing" | "visit_management_summary", context: string): Promise<AiGenResult> {
    const itemExplanation = surface === "inspection_item_explanation";
    const riskExplanation = surface === "factory_risk_explanation";
    const dailyBriefing = surface === "inspector_daily_briefing";
    const prompt = [
      "You are an advisory assistant for a government factory-inspection platform.",
      `Produce a concise ${surface === "planning_summary" ? "planning summary" : surface === "preparation_assistant" ? "inspector preparation brief" : itemExplanation ? "inspection-item explanation" : riskExplanation ? "factory risk and health-score explanation" : surface === "inspector_daily_briefing" ? "daily inspector briefing" : "visit-management operational summary"}.`,
      "Use only the supplied source facts. Never invent a threshold, score, legal clause, penalty, severity, license decision, route, assignment, or policy value.",
      itemExplanation
        ? "Explain only the recorded item title, official guidance, clause reference and evidence rule in at most 4 short sentences. Do not recommend an answer or interpret law; tell the inspector to verify the actual observation and source evidence."
        : riskExplanation
          ? "Explain only the recorded risk score, band, model version and stored driver values in at most 4 short sentences. Do not recalculate risk, infer a cause, assign a priority, or recommend an enforcement, licensing or inspection action."
          : dailyBriefing
            ? "Summarize only the inspector's recorded assigned visits, windows, states and factory details. Group by what the inspector actually needs to act on (e.g. today's/this week's visits, anything returned or overdue, anything expiring), not by array position. Do not invent a route, timing, priority, assignment, risk score or visit-state change; state unavailable where facts do not support it."
        : "Write at most 5 short sentences, one each covering Risk, Workload, Hotspot, Route, or Recommendation as applicable.",
      dailyBriefing
        ? "Output 3 to 5 short bullet lines, one fact or grouped finding per line (at most 16 words each), one per line separated by a newline, each line starting with \"- \". No paragraph, no sentence connecting multiple lines, no headings, no bold text, no nested bullets."
        : "Write plain prose sentences only — no Markdown, no asterisks, no bullet lists, no headings, no bold text.",
      "State when a fact is unavailable. This is advisory text only; a human remains the decision maker.",
      `Source facts: ${String(context ?? "").slice(0, 6000)}`,
    ].join(" ");
    try {
      const res = await fetch(`${GEMINI_BASE}/${this.model}:generateContent`, {
        method: "POST",
        headers: { "x-goog-api-key": this.apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          // Bounded thinkingBudget (see generate() above for why) — confirmed
          // against the live API with a 1400-token weekly-briefing context that
          // 768 output / 128 thinking budget returns finishReason STOP with a
          // complete, non-truncated visible paragraph. Production daily-briefing
          // context can be considerably larger (up to the 6000-char source-fact
          // slice below, e.g. 100 assignment rows), so this keeps extra headroom
          // above what was directly measured rather than the exact tested value.
          generationConfig: { maxOutputTokens: 1200, temperature: 0.2, thinkingConfig: { thinkingBudget: 220 } },
        }),
      });
      if (!res.ok) return { ok: false, reason: `gemini_${res.status}` };
      const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[] };
      const truncated = data.candidates?.[0]?.finishReason === "MAX_TOKENS";
      const raw = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
      const text = dailyBriefing
        ? dropTruncatedTail(bulletize(raw), truncated)
        : stripMarkdown(raw);
      if (!text) return { ok: false, reason: "empty_response" };
      return { ok: true, text };
    } catch {
      return { ok: false, reason: "gemini_network_error" };
    }
  }
}

// Key resolution prefers the project-scoped GEMINI_API_KEY_INSPECTION (the
// name this key is actually provisioned under in shared dev/staging envs),
// falling back to the plain GEMINI_API_KEY if that convention is used instead.
function resolveGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY_INSPECTION || process.env.GEMINI_API_KEY;
}

export function geminiProviderState(): "configured" | "unavailable" {
  return resolveGeminiApiKey() ? "configured" : "unavailable";
}

/** Fail-closed factory: null when no key is configured. */
export function getGeminiProvider(): GeminiSuggestionProvider | null {
  const key = resolveGeminiApiKey();
  if (!key) return null;
  return new GeminiSuggestionProvider(key, process.env.GEMINI_MODEL ?? "gemini-flash-latest");
}
