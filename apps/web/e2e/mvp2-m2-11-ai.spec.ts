import { test, expect } from "@playwright/test";
import { isDispositionAllowed, canDispose, adapterMaySuggest, isSuggestionSurfaceAllowed } from "../src/lib/ai/suggestions";

// TASK-MVP2-M2-11-ASSISTIVE-AI-001 · MVP2-REQ-0056..0066,0217..0223 · CD-048.
test("disposition lifecycle requires a human act with reason", () => {
  expect(isDispositionAllowed("proposed", "accepted")).toBe(true);
  expect(isDispositionAllowed("accepted", "superseded")).toBe(true);
  expect(isDispositionAllowed("rejected", "accepted")).toBe(false);
  expect(canDispose({ to: "accepted", actor: null, reason: "x" }).ok).toBe(false);      // no human
  expect(canDispose({ to: "accepted", actor: "u1", reason: "" }).ok).toBe(false);       // no reason
  expect(canDispose({ to: "accepted", actor: "u1", reason: "good" }).ok).toBe(true);
});

test("adapter is fail-closed unless configured", () => {
  expect(adapterMaySuggest("configured")).toBe(true);
  expect(adapterMaySuggest("unavailable")).toBe(false);
  expect(adapterMaySuggest("failed")).toBe(false);
});

test("AI never generates legal source text", () => {
  expect(isSuggestionSurfaceAllowed("planning")).toBe(true);
  expect(isSuggestionSurfaceAllowed("regulation_body")).toBe(false);
  expect(isSuggestionSurfaceAllowed("clause_text")).toBe(false);
});
