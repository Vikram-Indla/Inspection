import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

// SCR-IPAD Evidence Review — pre-submission Evidence Review panel (additive,
// read-only) over the canonical inspection evidence flow (FLD-EVD-001..006,
// M04-163/164/165/199/204). Source-contract assertions only: no browser, no
// live backend — the same style as execution-workspace-contract.spec.ts.
//
// The panel's hard contract is that it adds a read-only review surface and
// changes NONE of the hardened capture / annotate / replace / soft-delete /
// offline-replay / submission-guard behavior. These tests fail if that
// additive-only boundary is ever crossed.

const webRoot = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(webRoot, file), "utf8");
const exists = (file: string) => fs.existsSync(path.join(webRoot, file));

const reviewPath = "src/app/(app)/field/inspection/[id]/EvidenceReview.tsx";
const reviewCssPath = "src/app/(app)/field/inspection/[id]/evidence-review.module.css";
const workspacePath = "src/app/(app)/field/inspection/[id]/Workspace.tsx";
const pagePath = "src/app/(app)/field/inspection/[id]/page.tsx";
const offlinePath = "src/lib/offline.ts";

test.describe("SCR-IPAD Evidence Review panel (additive, read-only)", () => {
  test("the panel component exists and owns no write / storage / delete path", () => {
    expect(exists(reviewPath)).toBeTruthy();
    const c = read(reviewPath);
    // Testids the workspace/e2e surface relies on.
    expect(c).toContain('data-testid="evidence-review"');
    expect(c).toContain('data-testid="evidence-mandatory"');
    expect(c).toContain('data-testid="evidence-review-retry"');
    expect(c).toContain('data-testid="evidence-count-pending"');
    // Read-only: it delegates retry via a prop and NEVER writes evidence itself.
    expect(c).toContain("onRetry");
    expect(c).not.toContain("enqueue");
    expect(c).not.toContain("processOutbox");
    expect(c).not.toContain("supabase");
    expect(c).not.toMatch(/\.from\(["'`]evidence["'`]\)/);
    expect(c).not.toMatch(/\.(upload|remove|delete)\(/);
    expect(c).not.toContain("deleted_at");
    // Retry only offered when something is genuinely queued (never fabricated).
    expect(c).toContain("counts.pending > 0");
  });

  test("the mandatory-evidence summary mirrors the submit gate (met = total − gaps)", () => {
    const c = read(reviewPath);
    // The component renders met/total but derives nothing itself — the numbers
    // come from props. The authority is computed in Workspace from liveBlockers.
    expect(c).toContain("mandatory.total === 0");
    expect(c).toContain("mandatory.gaps.length === 0");
    const w = read(workspacePath);
    expect(w).toContain("const evidenceMandatory = useMemo");
    // Gaps are exactly the submit blockers' evidence codes → one source of truth.
    expect(w).toContain("liveBlockers.flatMap(g => g.evidence)");
    expect(w).toContain("Math.max(0, total - gaps.length)");
    // Total counts in-scope, visible items whose current answer triggers a
    // mandatory evidence leg — same helpers the gate uses.
    expect(w).toContain("evidenceLeg(it, answers[it.id]?.value)");
    expect(w).toContain("leg.mandatory");
  });

  test("Workspace wires the panel additively and reuses the existing outbox replay for retry", () => {
    const w = read(workspacePath);
    expect(w).toContain('import EvidenceReview');
    expect(w).toContain("<EvidenceReview");
    expect(w).toContain("evidenceReviewRows");
    expect(w).toContain("evidenceCounts");
    // Retry reuses the canonical replay — it does not introduce a new sync path.
    expect(w).toContain("const retryUploads = useCallback");
    expect(w).toContain("processOutbox(userId, onState)");
    // Pending status is derived from the real sync state, never invented.
    expect(w).toContain('sync === "failed" ? "failed" : "pending"');
  });

  test("the hardened evidence write / replay / guard path is unchanged (additive-only)", () => {
    const w = read(workspacePath);
    // The single canonical enqueue path still hardcodes item linkage exactly as
    // before — the panel did not generalize or touch the write path.
    expect(w).toContain('linked_type: "item", linked_id: item.id');
    expect(w).toContain("async function enqueueEvidence");
    // The offline engine (upload + idempotent replay + soft-delete op) is not
    // touched by this slice; its evidence replay contract stays intact.
    const o = read(offlinePath);
    expect(o).toContain('kind: "evidence"');
    expect(o).toContain('sb.storage.from("evidence").upload');
    expect(o).toContain('onConflict: "storage_path"');
  });

  test("panel strings are provided in EN and AR and typed on WorkspaceStrings", () => {
    const p = read(pagePath);
    expect(p).toContain("evReview: {");
    expect(p).toContain('field.ws.evReview.title');
    expect(p).toContain('field.ws.evReview.mandatoryMet');
    // Arabic leg present (tr(key, en, ar)) — RTL parity, no DB seeding needed.
    expect(p).toContain("مراجعة الأدلة");
    const w = read(workspacePath);
    expect(w).toContain("evReview: EvidenceReviewStrings");
  });

  test("panel styling is DS-token only — no bare colors", () => {
    expect(exists(reviewCssPath)).toBeTruthy();
    const css = read(reviewCssPath);
    expect(css).toContain("var(--");
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\b(rgb|rgba|hsl|hsla)\(/);
  });
});
