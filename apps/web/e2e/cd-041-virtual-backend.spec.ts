import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// CD-041..043 / M05-015..020 — source-level backend contract. This remains
// deterministic without mutating a shared live virtual-session fixture.
const SRC = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

test.describe("CD-041..043 virtual backend verification gate", () => {
  test("verified transition is server-proven, all-representative gated and atomic with its timeline event", () => {
    const migration = SRC("../../supabase/migrations/20260715170000_cd041_verified_transition_guard.sql");
    expect(migration).toMatch(/create or replace function vs_mark_session_verified/);
    expect(migration).toMatch(/security invoker/);
    expect(migration).toMatch(/role = 'factory_rep'/);
    expect(migration).toMatch(/verified_at is not null/);
    expect(migration).toMatch(/every factory representative must be OTP verified/);
    expect(migration).toMatch(/set state = 'verified'/);
    expect(migration).toMatch(/'event', 'verified'/);
    expect(migration).toMatch(/grant execute on function vs_mark_session_verified\(uuid, uuid\) to authenticated/);
  });

  test("the room cannot advance a session from a display name or a client-only OTP result", () => {
    const actions = SRC("src/app/virtual/[id]/actions.ts");
    const room = SRC("src/app/virtual/[id]/Room.tsx");
    expect(actions).toMatch(/sb\.rpc\("vs_mark_session_verified"/);
    expect(actions).toMatch(/p_participant: participant_id/);
    expect(actions).not.toMatch(/update\(\{ state: "verified" \}\)/);
    expect(room).toMatch(/fd\.set\("participant_id", p\.id\)/);
    expect(room).not.toMatch(/fd\.set\("participant", p\.display_name\)/);
  });
});
