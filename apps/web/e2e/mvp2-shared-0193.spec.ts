import { test, expect } from "@playwright/test";
import { bilingual, isPresentable, arabicComplete, type Communication } from "../src/lib/shared/communication";

// TASK-MVP2-SHARED-0193 · MVP2-REQ-0193. Bilingual communication contract.
test("an unapproved Arabic term is held, never fabricated", () => {
  const held = bilingual("Correction notice");
  expect(held.ar).toBeNull();
  expect(held.arStatus).toBe("held");
  const approved = bilingual("Correction notice", "إشعار تصحيح");
  expect(approved.ar).toBe("إشعار تصحيح");
  expect(approved.arStatus).toBe("approved");
});

test("presentable on English; Arabic completeness reported separately", () => {
  const c: Communication = {
    kind: "notice",
    subject: bilingual("Subject", null),
    body: bilingual("Body", null),
  };
  expect(isPresentable(c)).toBe(true);       // English complete → presentable
  expect(arabicComplete(c)).toBe(false);     // AR held → flagged, never hidden
});
