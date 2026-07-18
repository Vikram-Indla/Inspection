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
      `Context: ${String(context ?? "").slice(0, 2000)}`,
    ].join(" ");
    try {
      const res = await fetch(`${GEMINI_BASE}/${this.model}:generateContent`, {
        method: "POST",
        headers: { "x-goog-api-key": this.apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 256, temperature: 0.4 },
        }),
      });
      if (!res.ok) return { ok: false, reason: `gemini_${res.status}` };
      const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const text = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
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
  async generateContextual(surface: "planning_summary" | "preparation_assistant" | "inspection_item_explanation", context: string): Promise<AiGenResult> {
    const itemExplanation = surface === "inspection_item_explanation";
    const prompt = [
      "You are an advisory assistant for a government factory-inspection platform.",
      `Produce a concise ${surface === "planning_summary" ? "planning summary" : surface === "preparation_assistant" ? "inspector preparation brief" : "inspection-item explanation"}.`,
      "Use only the supplied source facts. Never invent a threshold, score, legal clause, penalty, severity, license decision, route, assignment, or policy value.",
      itemExplanation
        ? "Explain only the recorded item title, official guidance, clause reference and evidence rule in at most 4 short bullets. Do not recommend an answer or interpret law; tell the inspector to verify the actual observation and source evidence."
        : "Return at most 5 short bullets, each labelled Risk, Workload, Hotspot, Route, or Recommendation as applicable.",
      "State when a fact is unavailable. This is advisory text only; a human remains the decision maker.",
      `Source facts: ${String(context ?? "").slice(0, 6000)}`,
    ].join(" ");
    try {
      const res = await fetch(`${GEMINI_BASE}/${this.model}:generateContent`, {
        method: "POST",
        headers: { "x-goog-api-key": this.apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 512, temperature: 0.2 },
        }),
      });
      if (!res.ok) return { ok: false, reason: `gemini_${res.status}` };
      const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const text = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim();
      if (!text) return { ok: false, reason: "empty_response" };
      return { ok: true, text };
    } catch {
      return { ok: false, reason: "gemini_network_error" };
    }
  }
}

export function geminiProviderState(): "configured" | "unavailable" {
  return process.env.GEMINI_API_KEY ? "configured" : "unavailable";
}

/** Fail-closed factory: null when no key is configured. */
export function getGeminiProvider(): GeminiSuggestionProvider | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  return new GeminiSuggestionProvider(key, process.env.GEMINI_MODEL ?? "gemini-flash-latest");
}
