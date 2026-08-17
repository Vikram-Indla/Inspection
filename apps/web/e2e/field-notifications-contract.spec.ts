import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  notificationPayloadEntries,
  notificationReadPatch,
} from "../src/lib/notification-read";
import { shellNotificationVisitHref } from "../src/lib/shell-navigation";

const SRC = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

test.describe("PLAN v7 item 2 Field Notifications contract", () => {
  test("read receipts keep queued delivery-state compatibility", () => {
    const at = "2026-07-22T12:34:56.000Z";

    expect(notificationReadPatch("queued", at)).toEqual({ read_at: at, delivery_state: "read" });
    expect(notificationReadPatch("handled", at)).toEqual({ read_at: at });
    expect(notificationReadPatch("not_configured", at)).toEqual({ read_at: at });
  });

  test("arbitrary payload keys render generically and malformed payloads fail safely", () => {
    expect(notificationPayloadEntries({
      arbitrary_alpha: "alpha",
      count: 0,
      enabled: false,
      nested: { source: "stored-row" },
    })).toEqual([
      { key: "arbitrary_alpha", value: "alpha" },
      { key: "count", value: "0" },
      { key: "enabled", value: "false" },
      { key: "nested", value: '{"source":"stored-row"}' },
    ]);

    for (const malformed of [null, undefined, "scalar", 42, ["array"]]) {
      expect(() => notificationPayloadEntries(malformed)).not.toThrow();
      expect(notificationPayloadEntries(malformed)).toEqual([]);
    }

    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(notificationPayloadEntries(cyclic)).toEqual([{ key: "self", value: "[unavailable]" }]);
  });

  test("detail route uses the real recipient-scoped row and records the first receipt on open", () => {
    const route = SRC("src/features/field-notifications/queries.ts");
    const actions = SRC("src/app/(app)/field/actions.ts");
    const dashboard = SRC("src/features/field-home/queries.ts");
    const copy = SRC("src/i18n/locales/en/field-notifications.json");

    expect(route).toContain('.from("notifications")');
    expect(route).toContain('"id, event_key, payload, delivery_state, read_at, created_at"');
    expect(route).toContain('.eq("recipient", user.id)');
    expect(route).toContain(".maybeSingle()");
    expect(route).toContain("notificationReadPatch(notification.delivery_state");
    expect(route).toContain(".update(patch)");
    expect(route).toContain('.is("read_at", null)');
    expect(route).toContain("notificationPayloadEntries(notification.payload)");
    expect(copy).toContain("No notification payload is available.");

    expect(actions).toContain('.select("id, delivery_state, read_at")');
    expect(actions).toContain("notificationReadPatch(row.delivery_state");
    expect(actions).toContain(".update(patch)");
    expect(actions).toContain('.is("read_at", null)');

    expect(dashboard).toContain('select("id, read_at, delivery_state")');
    expect(dashboard).toContain("isNotificationUnread");
  });

  test("bell visit links are field-safe only for field-only sessions", () => {
    expect(shellNotificationVisitHref(
      "visit-1",
      "/visits/visit-1?focus=return",
      true,
    )).toBe("/field/visit-1");
    expect(shellNotificationVisitHref(
      "visit-1",
      "/visits/visit-1?focus=return",
      false,
    )).toBe("/visits/visit-1?focus=return");

    const bell = SRC("src/components/NotificationBell.tsx");
    const notificationRead = SRC("src/lib/notification-read.ts");
    const shell = SRC("src/components/ShellClient.tsx");
    expect(notificationRead).toContain("shellNotificationVisitHref(visitId, webHref, fieldOnly)");
    expect(bell).toContain("notificationHref(r.event_key, r.payload, fieldOnly)");
    expect(shell).toContain("<NotificationBell strings={bellStrings} locale={locale} fieldOnly={fieldOnly} />");
  });
});
