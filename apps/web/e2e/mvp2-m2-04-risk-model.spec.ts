import { test, expect } from "@playwright/test";
import {
  validateWeights, validateBands, validateRiskModelPayload,
  computeRiskScore, bandFor, isRiskModelTransitionAllowed,
  type RiskBands,
} from "../src/lib/risk/model";

// TASK-MVP2-M2-04-RISK-TARGETING-001 · MVP2-REQ-0001..0024 · CD-032.
// Pure source-contract test (no browser/DB). Proves the draft-layer guards are
// parity-identical to the accepted saveRiskSettings rule and that scoring/bands/
// lifecycle are deterministic. No policy VALUES are asserted (DEC-001 held) — only
// structure.

const BANDS: RiskBands = { low: [0, 39], medium: [40, 69], high: [70, 100] };

test("weights must sum to 1.00 within tolerance", () => {
  expect(validateWeights([{ key: "a", weight: 0.5 }, { key: "b", weight: 0.5 }]).ok).toBe(true);
  expect(validateWeights([{ key: "a", weight: 0.5 }, { key: "b", weight: 0.4 }]).ok).toBe(false);
  expect(validateWeights([{ key: "a", weight: 1.2 }]).ok).toBe(false); // out of [0,1]
  expect(validateWeights([]).ok).toBe(false);
});

test("bands must be contiguous integers covering 0..100", () => {
  expect(validateBands(BANDS).ok).toBe(true);
  expect(validateBands({ low: [0, 39], medium: [40, 39], high: [40, 100] }).ok).toBe(false); // med<=low
  expect(validateBands({ low: [0, 39], medium: [41, 69], high: [70, 100] }).ok).toBe(false); // gap (not contiguous)
  expect(validateBands({ low: [0, 39], medium: [40, 69], high: [70, 99] }).ok).toBe(false);  // high must reach 100
});

test("full payload validation combines weights + bands", () => {
  expect(validateRiskModelPayload({ factors: [{ key: "a", weight: 1 }], bands: BANDS }).ok).toBe(true);
  expect(validateRiskModelPayload({ factors: [{ key: "a", weight: 0.9 }], bands: BANDS }).ok).toBe(false);
  expect(validateRiskModelPayload(null).ok).toBe(false);
  expect(validateRiskModelPayload({}).ok).toBe(false);
  expect(validateRiskModelPayload({ factors: [] }).ok).toBe(false);
});

test("score is a deterministic weighted sum clamped to [0,100] and banded", () => {
  const factors = [{ key: "a", weight: 0.6 }, { key: "b", weight: 0.4 }];
  expect(computeRiskScore(factors, { a: 1, b: 1 })).toBe(100);
  expect(computeRiskScore(factors, { a: 0, b: 0 })).toBe(0);
  expect(computeRiskScore(factors, { a: 1, b: 0 })).toBe(60);
  expect(computeRiskScore(factors, { a: 2, b: -1 })).toBe(60); // clamped inputs
  expect(bandFor(60, BANDS)).toBe("medium");
  expect(bandFor(70, BANDS)).toBe("high");
  expect(bandFor(10, BANDS)).toBe("low");
});

test("model lifecycle allows only maker-checker legal transitions", () => {
  expect(isRiskModelTransitionAllowed("draft", "review")).toBe(true);
  expect(isRiskModelTransitionAllowed("review", "approved")).toBe(true);
  expect(isRiskModelTransitionAllowed("approved", "published")).toBe(true);
  expect(isRiskModelTransitionAllowed("published", "retired")).toBe(true);
  expect(isRiskModelTransitionAllowed("draft", "published")).toBe(false); // no skipping review/approve
  expect(isRiskModelTransitionAllowed("retired", "draft")).toBe(false);   // terminal
});
