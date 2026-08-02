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
    const actions = SRC("src/app/(app)/virtual/[id]/actions.ts");
    const room = SRC("src/app/(app)/virtual/[id]/Room.tsx");
    expect(actions).toMatch(/sb\.rpc\("vs_mark_session_verified"/);
    expect(actions).toMatch(/p_participant: participant_id/);
    expect(actions).not.toMatch(/update\(\{ state: "verified" \}\)/);
    expect(room).toMatch(/fd\.set\("participant_id", p\.id\)/);
    expect(room).not.toMatch(/fd\.set\("participant", p\.display_name\)/);
  });

  test("the driven fixture uses a wide-random plausible-year window to avoid inspector-window collisions", () => {
    // Obsolete-test fix (Cycle 2 completion pass): the fixture no longer
    // queries/chains off existing assignment windows — see the DEF-DATA-005
    // comment in cd-041-virtual-verified-gate.spec.ts for why that approach
    // (and a later narrow-band variant) both made collisions worse. It now
    // uses the same wide-random-range pattern already proven collision-free
    // in golden-journey.spec.ts / cd-022-identity-lens.spec.ts / offline-drill.spec.ts.
    const driven = SRC("e2e/cd-041-virtual-verified-gate.spec.ts");
    expect(driven).toContain("DEF-DATA-005 (Cycle 2 completion pass)");
    expect(driven).toContain("now + (400 + Math.floor(Math.random() * 20000)) * DAY + stageCount * 2 * DAY");
  });

  test("the inspector route uses real Twilio admission and never the staging video provider", () => {
    const page = SRC("src/app/(app)/field/virtual/[id]/page.tsx");
    const client = SRC("src/app/(app)/field/virtual/[id]/VirtualSessionClient.tsx");
    const stage = SRC("src/app/(app)/virtual/[id]/RoomStage.tsx");
    const admission = SRC("src/app/(app)/virtual/[id]/video-actions.ts");
    const i18n = SRC("src/lib/i18n.ts");
    const virtualArabic = SRC("src/lib/virtual-arabic.ts");

    expect(page).toMatch(/videoRoomJoinable\(\)/);
    expect(client).toMatch(/import RoomStage/);
    expect(client).toMatch(/transportConfigured=\{transportConfigured && online && !closed\}/);
    expect(client).not.toMatch(/selectVideoProvider|StagingVideoProvider|SIMULATED VIDEO SESSION|Open simulated provider/);
    expect(client).not.toMatch(/const stageStrings|غرفة التفتيش|جاهزة للاتصال/);
    expect(page).toMatch(/stage=\{stage\}/);
    expect(page).toMatch(/t\("virtual\.stage\.title", "Inspection room"\)/);
    expect(i18n).toMatch(/VIRTUAL_AR_FALLBACK/);
    expect(virtualArabic).toMatch(/"virtual\.stage\.title": "غرفة التفتيش"/);
    expect(stage).toMatch(/requestRoomToken\(sessionId\)/);
    expect(stage).toMatch(/import\("twilio-video"\)/);
    expect(stage).toMatch(/navigator\.mediaDevices/);
    expect(stage).toMatch(/getUserMedia/);
    expect(stage).toMatch(/getDisplayMedia/);
    expect(admission).toMatch(/videoRoomJoinable\(\)/);
    expect(admission).toMatch(/const identity = `user:\$\{user\.id\}`/);
    expect(admission).toMatch(/ensureRoom\(sessionId\)/);
    expect(admission).toMatch(/mintRoomToken\(sessionId, identity\)/);
    expect(admission).toMatch(/AUDITABLE_ROOM_EVENTS/);
    expect(admission).toMatch(/sb\.rpc\("vs_append_event"/);
    expect(stage).toMatch(/recordRoomEvent\(sessionId, "video_connected"/);
    expect(stage).toMatch(/recordRoomEvent\(sessionId, "video_left"/);
    expect(stage).toMatch(/recordRoomEvent\(sessionId, "participant_connected"/);
    expect(stage).toMatch(/recordRoomEvent\(sessionId, "participant_disconnected"/);
    expect(stage).toMatch(/recordRoomEvent\(sessionId, "video_reconnecting"/);
    expect(stage).toMatch(/recordRoomEvent\(sessionId, "video_reconnected"/);
  });

  test("remote completion returns to the Field Dashboard after evidence-backed submission", () => {
    const workspace = SRC("src/app/(app)/field/inspection/[id]/Workspace.tsx");
    const page = SRC("src/app/(app)/field/inspection/[id]/page.tsx");

    expect(workspace).toMatch(/<EvidenceReview/);
    expect(workspace).toMatch(/href="\/field"/);
    expect(page).toMatch(/"Back to Dashboard"/);
    expect(page).not.toMatch(/العودة إلى لوحة المعلومات/);
  });
});
