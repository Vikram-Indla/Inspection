import { expect, test } from "@playwright/test";
import {
  mergeFindingOp, applyFindingReplay, findingSubmitBlockers, findingsPrecedeSubmit,
  type FindingOp, type FindingSyncState,
} from "../src/app/(app)/field/inspection/[id]/finding-outbox";

// SCR-IPAD-630 · FLD-FND-001..003 — behavioral coverage for the inspector-
// finding CANONICAL FIFO outbox op. Pure logic, no browser/backend: proves the
// replay-safety properties the workspace relies on (ordering, idempotency,
// submit gate) that direct-write findings could not guarantee.

const op = (over: Partial<FindingOp> & { id: string; item_id: string }): FindingOp => ({
  kind: "finding",
  inspection_id: "insp-1",
  severity: "major",
  description: `narrative for ${over.item_id}`,
  queued_at: "2026-07-25T00:00:00.000Z",
  ...over,
});

test.describe("SCR-IPAD-630 findings outbox — FIFO ordering (persist before submit)", () => {
  test("finding ops always precede the submit op after an offline reconnect replay", () => {
    // Two findings captured offline, then submit queued: FIFO guarantees both
    // findings persist/link BEFORE the submit op is replayed.
    const queue = [
      op({ id: "f1", item_id: "i1" }),
      op({ id: "f2", item_id: "i2" }),
      { kind: "submit" as const },
    ];
    expect(findingsPrecedeSubmit(queue)).toBe(true);
  });

  test("a submit op ahead of a finding op violates the invariant (guarded against)", () => {
    const bad = [{ kind: "submit" as const }, op({ id: "f1", item_id: "i1" })];
    expect(findingsPrecedeSubmit(bad)).toBe(false);
  });

  test("re-queuing a finding keeps it before a later submit op (dedupe preserves FIFO)", () => {
    let queue: { kind: string }[] = [op({ id: "f1", item_id: "i1" })];
    queue = mergeFindingOp(queue, op({ id: "f1", item_id: "i1", description: "edited" }));
    queue = [...queue, { kind: "submit" as const }];
    expect(findingsPrecedeSubmit(queue)).toBe(true);
    expect(queue.filter(o => o.kind === "finding")).toHaveLength(1);
  });
});

test.describe("SCR-IPAD-630 findings outbox — idempotency (ambiguous retry, no duplicates)", () => {
  test("mergeFindingOp replaces the queued op for the same id instead of appending", () => {
    let queue: { kind: string }[] = [];
    queue = mergeFindingOp(queue, op({ id: "f1", item_id: "i1", description: "first" }));
    queue = mergeFindingOp(queue, op({ id: "f1", item_id: "i1", description: "retry" }));   // ambiguous retry
    expect(queue).toHaveLength(1);
    expect((queue[0] as FindingOp).description).toBe("retry");
  });

  test("distinct findings coexist; only the same id dedupes", () => {
    let queue: { kind: string }[] = [];
    queue = mergeFindingOp(queue, op({ id: "f1", item_id: "i1" }));
    queue = mergeFindingOp(queue, op({ id: "f2", item_id: "i2" }));
    queue = mergeFindingOp(queue, op({ id: "f1", item_id: "i1", description: "again" }));
    expect(queue.filter(o => o.kind === "finding")).toHaveLength(2);
  });

  test("replaying the same id any number of times yields exactly one row (upsert by id)", () => {
    let rows: { id: string; item_id: string; severity: string; description: string }[] = [];
    rows = applyFindingReplay(rows, op({ id: "f1", item_id: "i1", description: "v1" }));
    rows = applyFindingReplay(rows, op({ id: "f1", item_id: "i1", description: "v2" }));   // duplicate op / retry
    rows = applyFindingReplay(rows, op({ id: "f1", item_id: "i1", description: "v2" }));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: "f1", description: "v2", severity: "major" });
  });
});

test.describe("SCR-IPAD-630 findings outbox — submit gate (block until synced)", () => {
  const implied = [{ itemId: "i1", itemCode: "ITEM-001" }, { itemId: "i2", itemCode: "ITEM-002" }];

  test("a failed finding blocks submission", () => {
    const state: Record<string, FindingSyncState> = { i1: "saved", i2: "failed" };
    expect(findingSubmitBlockers(implied, state)).toEqual(["ITEM-002"]);
  });

  test("a still-queued (pending/unsynced) finding blocks submission", () => {
    const state: Record<string, FindingSyncState> = { i1: "pending", i2: "saved" };
    expect(findingSubmitBlockers(implied, state)).toEqual(["ITEM-001"]);
  });

  test("an empty or missing narrative blocks submission", () => {
    expect(findingSubmitBlockers(implied, { i1: "empty", i2: "saved" })).toEqual(["ITEM-001"]);
    expect(findingSubmitBlockers(implied, { i1: "saved" })).toEqual(["ITEM-002"]);   // i2 missing → empty
  });

  test("submission proceeds only once every required finding has SYNCED", () => {
    // Model the successful path: capture → replay clears the op → 'saved'.
    let rows: { id: string; item_id: string; severity: string; description: string }[] = [];
    const f1 = op({ id: "f1", item_id: "i1" });
    const f2 = op({ id: "f2", item_id: "i2" });
    rows = applyFindingReplay(rows, f1);
    rows = applyFindingReplay(rows, f2);
    const synced: Record<string, FindingSyncState> = { i1: "saved", i2: "saved" };
    expect(findingSubmitBlockers(implied, synced)).toEqual([]);
    // Both findings are persisted rows before submit; the FIFO invariant holds.
    expect(rows).toHaveLength(2);
    expect(findingsPrecedeSubmit([f1, f2, { kind: "submit" }])).toBe(true);
  });
});
