import { test, expect } from "@playwright/test";
import {
  isSelfAssessmentTransitionAllowed, emitsRiskSignal,
  isExternalRequestTransitionAllowed, canDecideExternalRequest,
  resolvePortalState, isExternalRequestType,
} from "../src/lib/portal/self-assessment";

// TASK-MVP2-M2-08-EXTERNAL-PORTAL-001 · MVP2-REQ-0109..0113 · CD-044.
// Pure source-contract test (no browser/DB). Locks the risk-signal boundary and
// the external request/self-assessment lifecycles.

test("only an accepted self-assessment emits a risk signal (W4)", () => {
  expect(emitsRiskSignal("accepted")).toBe(true);
  expect(emitsRiskSignal("draft")).toBe(false);
  expect(emitsRiskSignal("submitted")).toBe(false);
  expect(emitsRiskSignal("returned")).toBe(false);
  expect(emitsRiskSignal("rejected")).toBe(false);
});

test("self-assessment lifecycle is draft→submitted→accepted/returned only", () => {
  expect(isSelfAssessmentTransitionAllowed("draft", "submitted")).toBe(true);
  expect(isSelfAssessmentTransitionAllowed("submitted", "accepted")).toBe(true);
  expect(isSelfAssessmentTransitionAllowed("submitted", "rejected")).toBe(true);
  expect(isSelfAssessmentTransitionAllowed("returned", "submitted")).toBe(true);
  expect(isSelfAssessmentTransitionAllowed("draft", "accepted")).toBe(false); // no skip
  expect(isSelfAssessmentTransitionAllowed("accepted", "returned")).toBe(false); // terminal
});

test("INSP-246,248..255 resolve to bounded query states", () => {
  expect(resolvePortalState({ tab: "establishments" })).toEqual({ tab: "establishments", type: null, review: false });
  expect(resolvePortalState({ tab: "requests", type: "visit" })).toEqual({ tab: "requests", type: "visit", review: false });
  expect(resolvePortalState({ tab: "requests", type: "correction", view: "review" })).toEqual({ tab: "requests", type: "correction", review: true });
  expect(resolvePortalState({ tab: "self-assessment", view: "review" })).toEqual({ tab: "self-assessment", type: null, review: true });
  expect(resolvePortalState({ tab: "requests", type: "invented" })).toEqual({ tab: "requests", type: "visit", review: false });
  expect(isExternalRequestType("objection")).toBe(true);
  expect(isExternalRequestType("unknown")).toBe(false);
});

test("external request lifecycle + decision guard", () => {
  expect(isExternalRequestTransitionAllowed("submitted", "in_review")).toBe(true);
  expect(isExternalRequestTransitionAllowed("in_review", "accepted")).toBe(true);
  expect(isExternalRequestTransitionAllowed("accepted", "in_review")).toBe(false);
  expect(canDecideExternalRequest({ toStatus: "accepted", reason: "" }).ok).toBe(false);
  expect(canDecideExternalRequest({ toStatus: "accepted", reason: "meets clause" }).ok).toBe(true);
  expect(canDecideExternalRequest({ toStatus: "in_review", reason: "x" }).ok).toBe(false); // not a decision
});
