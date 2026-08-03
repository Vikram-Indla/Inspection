import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const workspace = readFileSync(new URL("../src/app/(app)/field/inspection/[id]/Workspace.tsx", import.meta.url), "utf8");
const factory = readFileSync(new URL("../src/app/(app)/field/inspection/[id]/FactoryVerification.tsx", import.meta.url), "utf8");

test("INSP-714 replays before refreshing both durable evidence and the local queue", () => {
  assert.match(workspace, /await processOutbox\(userId, onState\);\s*await Promise\.all\(\[refreshQueued\(\), refreshSyncedEvidence\(\)\]\)/);
  assert.match(workspace, /const activeEvidence = useMemo\(\(\) => syncedEvidence\.filter\(isActiveEv\)/);
  assert.doesNotMatch(workspace, /processOutbox\(userId, onState\);\s*refreshQueued\(\)/);
});

test("INSP-714 applies the same ordered replay refresh to Factory Verification", () => {
  assert.match(factory, /await processOutbox\(userId, onState\);\s*await refreshQueued\(\);/);
  assert.match(factory, /setSyncedFieldEvidence\(\(data \?\? \[\]\)/);
  assert.match(factory, /syncedFieldEvidence\.filter\(e => e\.linked_id === id\)\.length \+ queuedEv\.filter/);
});
