import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  assignmentNoticeKind,
  fieldNotificationCacheKey,
  fieldNotificationHref,
  parseFieldNotificationCache,
  type FieldNotificationRow,
} from "../src/lib/field-notifications";

const SRC = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const row = (event_key: string, payload: Record<string, unknown> | null = {}): FieldNotificationRow => ({
  id: "notification-1",
  event_key,
  payload,
  channel: "push",
  delivery_state: "queued",
  read_at: null,
  created_at: "2026-07-25T12:00:00.000Z",
});

test.describe("TASK-IPAD-NOTIFICATIONS-ASSIGNMENT-CHANGES-001", () => {
  test("classifies only canonical assignment and visit events from stored facts", () => {
    expect(assignmentNoticeKind(row("assignment"))).toBe("assigned");
    expect(assignmentNoticeKind(row("assignment", { reassigned: true }))).toBe("reassigned");
    expect(assignmentNoticeKind(row("assignment", { released: true }))).toBe("released");
    expect(assignmentNoticeKind(row("visit_cancelled"))).toBe("cancelled");
    expect(assignmentNoticeKind(row("visit_rescheduled"))).toBe("rescheduled");
    expect(assignmentNoticeKind(row("visit_expired"))).toBe("expired");
    expect(assignmentNoticeKind(row("review_decision"))).toBe("other");
  });

  test("released inspectors stay on the notification while current assignments deep-link to field", () => {
    expect(fieldNotificationHref(row("assignment", { visit_id: "visit-1", released: true })))
      .toBe("/field/notifications/notification-1");
    expect(fieldNotificationHref(row("assignment", { visit_id: "visit-1", reassigned: true })))
      .toBe("/field/visit-1");
    expect(fieldNotificationHref(row("visit_cancelled", { visit_id: "visit-1" })))
      .toBe("/field/visit-1");
  });

  test("offline cache is inspector-namespaced and rejects cross-user or malformed snapshots", () => {
    expect(fieldNotificationCacheKey("inspector-a")).not.toBe(fieldNotificationCacheKey("inspector-b"));
    const cached = JSON.stringify({
      userId: "inspector-a",
      cachedAt: "2026-07-25T12:00:00.000Z",
      rows: [row("assignment")],
      visitNames: { "visit-1": "Factory" },
    });
    expect(parseFieldNotificationCache(cached, "inspector-a")?.rows).toHaveLength(1);
    expect(parseFieldNotificationCache(cached, "inspector-b")).toBeNull();
    expect(parseFieldNotificationCache("{", "inspector-a")).toBeNull();
    expect(parseFieldNotificationCache(JSON.stringify({ userId: "inspector-a", rows: [{}] }), "inspector-a")).toBeNull();
  });

  test("UI refresh and acknowledgement repeat recipient and first-receipt guards", () => {
    const page = SRC("src/app/(app)/field/notifications/page.tsx");
    const center = SRC("src/app/(app)/field/notifications/NotificationAttentionCenter.tsx");
    const migrations = [
      SRC("../../supabase/migrations/0002_rbac_audit.sql"),
      SRC("../../supabase/migrations/0015_w1_field_home.sql"),
      SRC("../../supabase/migrations/0027_cd023_immediate_visit_atomic.sql"),
    ].join("\n");

    expect(page).toContain('.eq("recipient", user.id)');
    expect(center).toContain('.eq("recipient", userId)');
    expect(center).toContain('.eq("recipient", props.userId)');
    expect(center).toContain('.is("read_at", null)');
    expect(center).toContain("if (!online)");
    expect(page).toContain("No acknowledgement was recorded.");
    expect(center).toContain('window.addEventListener("online", onOnline)');
    expect(migrations).toContain("create policy notif_own on notifications for select");
    expect(migrations).toContain("create policy notif_update_recipient on notifications for update");
    expect(migrations).toContain("create trigger trg_audit_notifications");
  });
});
