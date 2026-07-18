import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const SRC = (p: string) => fs.readFileSync(path.resolve(__dirname, "..", p), "utf8");

test.describe("contextual AI delta contract", () => {
  test("planning summary is evidence-linked and cannot publish or select", () => {
    const page = SRC("src/app/planning/bulk/page.tsx");
    expect(page).toContain("MVP1-M01-016");
    expect(page).toContain("MVP1-M01-026");
    expect(page).toContain("ContextualAiPanel");
    expect(page).toContain("AC-0016");
    expect(page).toContain("AC-0026");
    expect(page).toContain("Do not select factories, alter risk values, invent thresholds, or publish a plan.");
  });

  test("preparation assistant is present before geofence and cannot gate start", () => {
    const startup = SRC("src/app/field/[visitId]/Startup.tsx");
    expect(startup).toContain("M03-009");
    expect(startup).toContain("ContextualAiPanel");
    expect(startup).toContain("surface=\"preparation_assistant\"");
    const aiIndex = startup.indexOf("surface=\"preparation_assistant\"");
    const mapIndex = startup.indexOf("compact geofence map card");
    expect(aiIndex).toBeGreaterThan(-1);
    expect(aiIndex).toBeLessThan(mapIndex);
    expect(startup).toContain("startInspection()");
  });

  test("server action re-reads RLS facts and fails closed", () => {
    const action = SRC("src/lib/ai/contextual-actions.ts");
    expect(action).toContain("getVerifiedUser");
    expect(action).toContain("getGeminiProvider");
    expect(action).toContain("from(\"factories\")");
    expect(action).toContain("from(\"visits\")");
    expect(action).toContain("AI provider unavailable");
    expect(action).toContain("evidence_refs");
    expect(action).toContain("disposition: \"proposed\"");
  });
});
