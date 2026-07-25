import { expect, test } from "@playwright/test";
import {
  evidenceRowStatus, evidenceSyncWarning, evidenceReviewCounts,
} from "../src/app/(app)/field/inspection/[id]/evidence-review-status";

// SCR-IPAD-620 — behavioral coverage for the Evidence Review panel's sync-status
// logic. Pure logic, no browser/backend. Replaces the earlier source-contract
// (grep) test. Encodes the P1 fix: a pending evidence row is NEVER marked
// "failed" from the workspace-global sync state; a failed/offline sync surfaces
// once as a SEPARATE workspace-level warning while rows stay pending.

test.describe("SCR-IPAD-620 evidence review — per-row status is outbox-only", () => {
  test("a queued row is pending and a persisted row is synced", () => {
    expect(evidenceRowStatus(true)).toBe("pending");
    expect(evidenceRowStatus(false)).toBe("synced");
  });

  test("row status takes no global sync input — it cannot be painted failed", () => {
    // Structural guarantee: the only input is queue membership. A global 'failed'
    // sync therefore cannot flip a pending row's status.
    expect(evidenceRowStatus(true)).toBe("pending");   // still pending, whatever the workspace sync state is
    expect((evidenceRowStatus as (q: boolean) => string).length).toBe(1);
  });
});

test.describe("SCR-IPAD-620 evidence review — failure is a separate workspace warning", () => {
  test("a failed sync with pending items raises a failed workspace warning (rows stay pending)", () => {
    expect(evidenceSyncWarning("failed", 2)).toBe("failed");
    expect(evidenceRowStatus(true)).toBe("pending");   // the rows themselves are unchanged
  });

  test("offline with pending items raises an offline warning", () => {
    expect(evidenceSyncWarning("offline", 3)).toBe("offline");
  });

  test("no warning when nothing is pending, even if the sync state is failed/offline", () => {
    expect(evidenceSyncWarning("failed", 0)).toBe("none");
    expect(evidenceSyncWarning("offline", 0)).toBe("none");
  });

  test("healthy or in-flight sync states are not warnings", () => {
    expect(evidenceSyncWarning("synced", 2)).toBe("none");
    expect(evidenceSyncWarning("syncing", 2)).toBe("none");
    expect(evidenceSyncWarning("pending", 2)).toBe("none");
  });
});

test.describe("SCR-IPAD-620 evidence review — counts have no global-failed bucket", () => {
  test("counts carry synced + pending only", () => {
    expect(evidenceReviewCounts(3, 2)).toEqual({ synced: 3, pending: 2 });
    expect(evidenceReviewCounts(0, 0)).toEqual({ synced: 0, pending: 0 });
    // No 'failed' key is ever produced from the workspace-global sync state.
    expect(Object.keys(evidenceReviewCounts(1, 1))).toEqual(["synced", "pending"]);
  });
});
