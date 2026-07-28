import "server-only";

import type { PlanningVisitRow } from "@/lib/planning/visit-list";

export type PlanningAiRecommendation = {
  visitId: string;
  rationale: string;
};

export type PlanningAiResult = {
  available: boolean;
  summary: string[];
  recommendations: PlanningAiRecommendation[];
  provider: "Gemini" | null;
};

type GeminiPayload = {
  summary?: unknown;
  recommendations?: unknown;
};

const MAX_CANDIDATES = 12;
const MAX_RECOMMENDATIONS = 4;

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized ? normalized.slice(0, max) : null;
}

export async function getPlanningAiRecommendations(
  rows: PlanningVisitRow[],
  locale: string,
): Promise<PlanningAiResult> {
  const key = process.env.GEMINI_API_KEY_INSPECTION;
  if (!key || rows.length === 0) {
    return { available: false, summary: [], recommendations: [], provider: null };
  }

  const candidates = rows.slice(0, MAX_CANDIDATES).map((row, index) => ({
    candidate_key: `candidate_${index + 1}`,
    visit_reference: row.visitReference ?? "Reference unavailable",
    factory: row.factoryName,
    region: row.region,
    planning_status: row.planningStatus,
    operational_state: row.operationalState,
    priority: row.priority,
    window_start: row.windowStart,
    window_end: row.windowEnd,
    assignment_status: row.assignmentStatus,
    return_reason: row.returnReason,
  }));
  const candidateToVisit = new Map(candidates.map((row, index) => [row.candidate_key, rows[index].id]));

  const prompt = [
    "You are an advisory planning assistant for an industrial inspection platform.",
    `Respond in ${locale === "ar" ? "Arabic" : "English"}.`,
    "Use only the supplied governed records. Do not invent policy, scores, dates, facts, inspectors, factories, thresholds, or actions.",
    "Return concise operational observations and at most four visit recommendations.",
    "Never expose database IDs, UUIDs, requirement IDs, screen IDs, acceptance IDs, or other internal identifiers.",
    "Refer to visits only by visit_reference, factory name, and business dates.",
    "Every recommendation must return one supplied candidate_key. Returned, high-priority, and near-window-end work may be highlighted when the record supports it.",
    "The planner remains responsible for every decision.",
    JSON.stringify({ records: candidates }),
  ].join("\n");

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
            responseJsonSchema: {
              type: "object",
              properties: {
                summary: {
                  type: "array",
                  maxItems: 4,
                  items: { type: "string" },
                },
                recommendations: {
                  type: "array",
                  maxItems: MAX_RECOMMENDATIONS,
                  items: {
                    type: "object",
                    properties: {
                      candidateKey: { type: "string" },
                      rationale: { type: "string" },
                    },
                    required: ["candidateKey", "rationale"],
                  },
                },
              },
              required: ["summary", "recommendations"],
            },
          },
        }),
        signal: AbortSignal.timeout(10_000),
        cache: "no-store",
      },
    );
    if (!response.ok) return { available: false, summary: [], recommendations: [], provider: null };

    const body = await response.json() as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const raw = body.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) return { available: false, summary: [], recommendations: [], provider: null };

    const parsed = JSON.parse(raw) as GeminiPayload;
    const summary = Array.isArray(parsed.summary)
      ? parsed.summary.map(value => cleanText(value, 240)).filter((value): value is string => Boolean(value)).slice(0, 4)
      : [];
    const recommendations = Array.isArray(parsed.recommendations)
      ? parsed.recommendations.flatMap(value => {
          if (!value || typeof value !== "object") return [];
          const candidateKey = cleanText((value as { candidateKey?: unknown }).candidateKey, 32);
          const rationale = cleanText((value as { rationale?: unknown }).rationale, 240);
          const visitId = candidateKey ? candidateToVisit.get(candidateKey) : null;
          return visitId && rationale ? [{ visitId, rationale }] : [];
        }).slice(0, MAX_RECOMMENDATIONS)
      : [];

    return {
      available: summary.length > 0 || recommendations.length > 0,
      summary,
      recommendations,
      provider: "Gemini",
    };
  } catch {
    return { available: false, summary: [], recommendations: [], provider: null };
  }
}
