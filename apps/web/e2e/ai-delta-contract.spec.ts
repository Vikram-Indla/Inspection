import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const SRC = (p: string) => fs.readFileSync(path.resolve(__dirname, "..", p), "utf8");

test.describe("contextual AI delta contract", () => {
  test("preparation assistant is present before geofence and cannot gate start", () => {
    const startup = SRC("src/app/(app)/field/[visitId]/Startup.tsx");
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

  test("item explanation is bound to the locked package and cannot decide an answer", () => {
    const workspace = SRC("src/app/(app)/field/inspection/[id]/Workspace.tsx");
    expect(workspace).toContain("MVP1-M04-138");
    expect(workspace).toContain('surface="inspection_item_explanation"');
    expect(SRC("src/app/(app)/field/inspection/[id]/page.tsx")).toContain("Human decision required");
    const explanationIndex = workspace.indexOf('surface="inspection_item_explanation"');
    const responseControlsIndex = workspace.indexOf("{isDate ? (");
    expect(explanationIndex).toBeGreaterThan(-1);
    expect(explanationIndex).toBeLessThan(responseControlsIndex);

    const action = SRC("src/lib/ai/contextual-actions.ts");
    expect(action).toContain("inspection_item_explanation");
    expect(action).toContain('from("inspection_items")');
    expect(action).toContain("packageItemCodes.includes(item.code)");
    expect(action).toContain("Do not recommend an inspection answer");
    expect(action).toContain('surface === "inspection_item_explanation" ? "inspection_item"');
    expect(action).toContain('surface === "factory_risk_explanation" ? "factory_risk_profile"');
  });

  test("factory health and risk explanation uses persisted records only", () => {
    const factory = SRC("src/app/(app)/factories/[id]/page.tsx");
    expect(factory).toContain('surface="factory_risk_explanation"');
    expect(factory).toContain("MVP1-M07-014");
    expect(factory).toContain("MVP1-M07-015");
    const action = SRC("src/lib/ai/contextual-actions.ts");
    expect(action).toContain('from("factory_risk_snapshots")');
    expect(action).toContain("factory_risk_profile");
    expect(action).toContain("Do not calculate, change or recommend a risk");
    const provider = SRC("src/lib/providers/ai-gemini.ts");
    expect(provider).toContain("Do not recalculate risk");
  });

  test("inspector daily briefing starts in My assignments and has a human review path", () => {
    const field = SRC("src/app/(app)/field/page.tsx");
    expect(field).toContain("getOrGenerateBriefing");
    expect(field).toContain("DailyBriefingCard");
    const briefing = SRC("src/lib/ai/briefing.ts");
    expect(briefing).toContain('"inspector_daily_briefing"');
    expect(briefing).toContain("MVP1-M03-001");
    expect(briefing).toContain("MVP1-M03-003");
    expect(briefing).toContain('from("assignments")');
    expect(briefing).toContain('.eq("inspector_id", userId)');
    expect(briefing).toContain("Do not invent a route or travel order");
    const panel = SRC("src/components/ContextualAiPanel.tsx");
    expect(panel).toContain("/ai/suggestions#ai-suggestion-");
    const docket = SRC("src/app/(app)/ai/suggestions/AiDockets.tsx");
    expect(docket).toContain("id={`ai-suggestion-${r.id}`}");
  });
});
