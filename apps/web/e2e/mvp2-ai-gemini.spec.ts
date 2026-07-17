import { test, expect } from "@playwright/test";
import { GeminiSuggestionProvider, geminiProviderState, getGeminiProvider } from "../src/lib/providers/ai-gemini";

// Gemini assistive-AI provider certification. No browser/DB. The LIVE test runs only
// when GEMINI_API_KEY is present. TASK-MVP2-M2-11-ASSISTIVE-AI-001.

test("fail-closed: no GEMINI_API_KEY → provider unavailable, factory null", () => {
  const prev = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    expect(geminiProviderState()).toBe("unavailable");
    expect(getGeminiProvider()).toBeNull();
  } finally { if (prev !== undefined) process.env.GEMINI_API_KEY = prev; }
});

test("guardrail: legal source surfaces are refused before any AI call", async () => {
  const p = new GeminiSuggestionProvider("dummy-key");
  for (const surface of ["regulation_body", "clause_text", "legal_decision"]) {
    const r = await p.generate(surface, "x");
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("legal_surface_refused");
  }
});

test("LIVE: Gemini returns an advisory suggestion for an allowed surface", async () => {
  test.skip(!process.env.GEMINI_API_KEY, "GEMINI_API_KEY not set in this run");
  const p = getGeminiProvider()!;
  const r = await p.generate("planning", "Two overdue high-risk factories in Riyadh branch; limited inspector capacity this week.");
  expect(r.ok).toBe(true);
  expect((r.text ?? "").length).toBeGreaterThan(0);
});
