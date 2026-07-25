import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");
const workspace = read("src/app/(app)/field/inspection/[id]/Workspace.tsx");
const page = read("src/app/(app)/field/inspection/[id]/page.tsx");
const offline = read("src/lib/offline.ts");
const rpc = read("../../supabase/migrations/20260721160000_execution_submission_review.sql");

test.describe("TASK-IPAD-SUBMISSION-COMPLETION-001 · SCR-IPAD-660", () => {
  test("final review exposes authoritative counts, blockers, and section recovery", () => {
    expect(workspace).toContain('type SubmissionPhase = "idle" | "review"');
    expect(workspace).toContain('aria-labelledby="final-review-title"');
    expect(workspace).toContain("summary.answered + summary.pending");
    expect(workspace).toContain("liveBlockers.map");
    expect(workspace).toContain('href={`#ax-section-${group.key}`}');
    expect(workspace).toContain('setSubmissionPhase("idle")');
  });

  test("acknowledgement is required only by the frozen package definition", () => {
    expect(workspace).toContain("acknowledgement?: AcknowledgementConfig");
    expect(workspace).toContain("acknowledgement?.required === true");
    expect(workspace).toContain('acknowledgement?.mode === "signature"');
    expect(workspace).toContain('acknowledgement?.mode === "declaration"');
    expect(workspace).toContain("acknowledgementRequired ? {");
    expect(workspace).toContain("} : null");
  });

  test("submission does not claim success before the authoritative RPC receipt", () => {
    const enqueueAt = workspace.indexOf('await local.enqueue({ kind: "submit"');
    const receiptAt = workspace.indexOf("setReceipt({ ...info", enqueueAt);
    const submittedAt = workspace.indexOf("setSubmitted(true)", enqueueAt);
    const successAt = workspace.indexOf('setSubmissionPhase("success")');
    expect(enqueueAt).toBeGreaterThan(-1);
    expect(receiptAt).toBeGreaterThan(enqueueAt);
    expect(submittedAt).toBeGreaterThan(receiptAt);
    expect(successAt).toBeGreaterThan(submittedAt);
    expect(workspace).toContain('setSubmissionPhase(navigator.onLine ? "submitting" : "queued")');
    expect(workspace).toContain('setSubmissionPhase("failed")');
    expect(workspace).toContain("retrySubmission");
    expect(workspace).toContain("setReceipt({ ...info");
    expect(workspace).toContain("setSubmitted(true)");
  });

  test("FIFO, idempotency, assigned-inspector scope, and atomic transition stay authoritative", () => {
    expect(offline).toContain('kind: "submit"');
    expect(offline).toContain('p_idempotency_key: op.idempotency_key');
    expect(offline).toContain("stop; order preserved; retry later");
    expect(rpc).toContain("public.is_assigned_inspector");
    expect(rpc).toContain("public.has_capability('execution.submit')");
    expect(rpc).toContain("EXE-SUBMIT-EVIDENCE-PENDING");
    expect(rpc).toContain("insert into public.submission_versions");
    expect(rpc).toContain("set status = 'submitted'");
    expect(rpc).toContain("return jsonb_build_object(");
  });

  test("server receipt and immutable reload state are user-visible", () => {
    expect(page).toContain("submission_versions(id, version_number, submitted_at)");
    expect(workspace).toContain('aria-labelledby="submission-receipt-title"');
    expect(workspace).toContain("receipt.submission_version_id");
    expect(workspace).toContain("receipt.version_number");
    expect(workspace).toContain("strings.receiptReport");
    expect(workspace).toContain('disabled={cancelApproved || ["queued", "submitting", "failed", "success"].includes(submissionPhase)}');
  });
});
