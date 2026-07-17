import { test, expect } from "@playwright/test";
import {
  deriveIdempotencyKey,
  buildSideEffectCommands,
  enqueueSideEffects,
  type OutboxClient,
  type SideEffectCommand,
  type Aggregate,
} from "../src/lib/workflow/outbox";
import type { WfTransition } from "../src/lib/workflow/validate";

// TASK-MVP2-M2-02-WORKFLOW-STUDIO-001 · MVP2-REQ-0031.
// Self-authored exactly-once / safe-retry tests. Prefix mvp2-m2-02-.

// Fake outbox backed by a Set — models the unique idempotency_key index.
function fakeOutbox(): OutboxClient & { store: Set<string> } {
  const store = new Set<string>();
  return {
    store,
    async insertIgnoringConflicts(commands: SideEffectCommand[]): Promise<string[]> {
      const inserted: string[] = [];
      for (const c of commands) {
        if (!store.has(c.idempotencyKey)) { store.add(c.idempotencyKey); inserted.push(c.idempotencyKey); }
      }
      return inserted;
    },
  };
}

const agg: Aggregate = { type: "visit", id: "11111111-1111-1111-1111-111111111111", version: 3 };
const transition: WfTransition = {
  from: "submitted", to: "approved", trigger: "approve", actor: "reviewer",
  fx: [
    { kind: "notify", idempotencyKey: "declared:notify" },
    { kind: "sla", idempotencyKey: "declared:sla" },
    { kind: "risk", idempotencyKey: "declared:risk" },
  ],
};

test("mvp2-m2-02 idempotency key is deterministic and bound to aggregate+version", () => {
  const a = deriveIdempotencyKey(agg, "submitted", "approved", "notify", 0);
  const b = deriveIdempotencyKey(agg, "submitted", "approved", "notify", 0);
  expect(a).toBe(b);
  expect(a).toContain(agg.id);
  expect(a).toContain("v3");
  // Different version → different key (a re-run on a new version is a distinct effect).
  const c = deriveIdempotencyKey({ ...agg, version: 4 }, "submitted", "approved", "notify", 0);
  expect(c).not.toBe(a);
});

test("mvp2-m2-02 build produces one command per declared side effect", () => {
  const cmds = buildSideEffectCommands(transition, agg);
  expect(cmds.map((c) => c.sideEffectKind)).toEqual(["notify", "sla", "risk"]);
  // keys are unique across the transition's side effects
  expect(new Set(cmds.map((c) => c.idempotencyKey)).size).toBe(3);
});

test("mvp2-m2-02 0031 first enqueue fires all; retry dedupes all (exactly-once)", async () => {
  const box = fakeOutbox();
  const cmds = buildSideEffectCommands(transition, agg);

  const first = await enqueueSideEffects(box, cmds);
  expect(first.enqueued).toHaveLength(3);
  expect(first.deduped).toHaveLength(0);

  // Retry of the same transition (same aggregate/version) — nothing fires again.
  const retry = await enqueueSideEffects(box, cmds);
  expect(retry.enqueued).toHaveLength(0);
  expect(retry.deduped).toHaveLength(3);

  // Store holds exactly 3 commands — no duplicates.
  expect(box.store.size).toBe(3);
});

test("mvp2-m2-02 0031 partial retry only enqueues the new side effect", async () => {
  const box = fakeOutbox();
  const cmds = buildSideEffectCommands(transition, agg);
  await enqueueSideEffects(box, cmds.slice(0, 2)); // notify + sla already enqueued
  const out = await enqueueSideEffects(box, cmds);   // full retry
  expect(out.enqueued).toEqual([cmds[2].idempotencyKey]); // only risk is new
  expect(out.deduped).toHaveLength(2);
  expect(box.store.size).toBe(3);
});

test("mvp2-m2-02 0031 empty side-effect set is a no-op", async () => {
  const box = fakeOutbox();
  const out = await enqueueSideEffects(box, []);
  expect(out.enqueued).toHaveLength(0);
  expect(out.deduped).toHaveLength(0);
  expect(box.store.size).toBe(0);
});
