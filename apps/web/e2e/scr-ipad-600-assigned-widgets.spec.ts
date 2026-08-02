import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import {
  assignmentCounts,
  connectivityPresentation,
  filterAssignmentTasks,
  hasAssignmentAlert,
  isActiveAssignment,
  type AssignmentTask,
} from "../src/app/(app)/field/my-tasks/assignment-task-model";

const root = path.resolve(__dirname, "..");
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");
const task = (overrides: Partial<AssignmentTask> = {}): AssignmentTask => ({
  id: "visit-001",
  assignmentStatus: "assigned",
  returnReason: null,
  planningStatus: "published",
  operationalState: "new",
  windowStart: "2026-07-25T07:00:00.000Z",
  windowEnd: "2026-07-25T10:00:00.000Z",
  visitType: "periodic",
  executionMode: "physical",
  priority: "medium",
  packageVersionId: null,
  inspectionId: null,
  inspectionStatus: null,
  unreadAlertCount: 0,
  factory: { name: "Al Amal", code: "FAC-001", region: "Riyadh", city: "Riyadh" },
  ...overrides,
});

// SCR-IPAD-600 · MVP1-M03-001..006 · AC-0099..0104
// Source-contract checks complement authenticated runtime coverage. They guard
// the RLS scope, journey ordering, honest state copy and governed action routes
// without mutating shared inspection data.
test.describe("SCR-IPAD-600 Assigned Visits widgets", () => {
  test("assigned work stays inspector-scoped and exposes the canonical states", () => {
    const page = read("src/app/(app)/field/my-tasks/page.tsx");
    expect(page).toContain('.eq("inspector_id", user.id)');
    expect(page).toContain('["published", "expired"].includes');
    expect(page).toContain("assignmentStatus: a.status");
    expect(page).toContain("packageVersionId: a.visits.package_version_id");
    expect(page).toContain('redirect("/login")');
    for (const state of ["Today", "Active", "Upcoming", "Needs attention", "Returned", "Expired"]) {
      expect(page).toContain(`"${state}"`);
    }
  });

  test("search, filters, active grouping and order behave on the same task model", () => {
    const rows = [
      task({ id: "future", windowStart: "2026-07-27T07:00:00.000Z", factory: { name: "مصنع النور", code: "AR-9", region: "الرياض", city: "الخرج" } }),
      task({ id: "active", operationalState: "on_the_way", priority: "high", unreadAlertCount: 2 }),
      task({ id: "returned", assignmentStatus: "returned", returnReason: "factory unavailable", unreadAlertCount: 1 }),
      task({ id: "expired", planningStatus: "expired" }),
    ];
    expect(isActiveAssignment(rows[1])).toBe(true);
    expect(hasAssignmentAlert(rows[1])).toBe(true);
    expect(assignmentCounts(rows, "2026-07-25T12:00:00+03:00")).toMatchObject({
      all: 4, active: 1, upcoming: 1, alerts: 2, returned: 1, expired: 1,
    });
    expect(filterAssignmentTasks(rows, {
      filter: "active", query: "", sort: "asc", locale: "en", now: "2026-07-25T12:00:00+03:00",
    }).map((row) => row.id)).toEqual(["active"]);
    expect(filterAssignmentTasks(rows, {
      filter: "all", query: "النور", sort: "asc", locale: "ar", now: "2026-07-25T12:00:00+03:00",
    }).map((row) => row.id)).toEqual(["future"]);
    expect(filterAssignmentTasks(rows, {
      filter: "all", query: "", sort: "desc", locale: "en", now: "2026-07-25T12:00:00+03:00",
    })[0].id).toBe("future");
  });

  test("accept/prepare and return actions preserve governed workflows", () => {
    const browser = read("src/app/(app)/field/my-tasks/AssignmentTaskBrowser.tsx");
    const prepare = read("src/app/(app)/field/my-tasks/actions.ts");
    const prepareControl = read("src/app/(app)/field/my-tasks/PrepareAssignmentAction.tsx");
    const prepareMigration = read("../../supabase/migrations/20260725152000_assignment_accept_prepare.sql");
    const startup = read("src/app/(app)/field/[visitId]/Startup.tsx");
    const actions = read("src/app/(app)/field/[visitId]/actions.ts");
    const visitPage = read("src/app/(app)/field/[visitId]/page.tsx");
    expect(browser).toContain('task.assignmentStatus === "assigned"');
    expect(browser).toContain("<PrepareAssignmentAction");
    expect(prepareControl).toContain("useActionState(acceptPrepareAssignment");
    expect(prepareControl).toContain("`/field/${state.visitId}#preparation`");
    expect(prepare).toContain('sb.rpc("accept_prepare_assignment"');
    expect(prepare).toContain("getVerifiedUser");
    expect(prepareMigration).toContain("v_assignment.status <> 'assigned'");
    expect(prepareMigration).toContain("v_planning_status <> 'published'");
    expect(prepareMigration).toContain("a.inspector_id = v_actor");
    expect(prepareMigration).toContain("raise insufficient_privilege");
    expect(prepareMigration).toContain("set status = 'preparing'");
    expect(prepareMigration).toContain("'accept_prepare'");
    expect(prepareMigration).toContain("array['MVP1-M03-002', 'STM-ASG-001']");
    expect(browser).toContain("`/field/${task.id}#return-assignment`");
    expect(browser).toContain("!expired && !returned");
    expect(visitPage).toContain('id="preparation"');
    expect(visitPage).toContain("<PreExecution");
    expect(startup).toContain("strings.returnHeading");
    expect(startup).toContain("submitReturn");
    expect(actions).toContain('sb.rpc("request_visit_return"');
    expect(actions).toContain("Return reason is mandatory");
  });

  test("attention filter is sourced only from unread visit-linked notifications", () => {
    const page = read("src/app/(app)/field/my-tasks/page.tsx");
    const model = read("src/app/(app)/field/my-tasks/assignment-task-model.ts");
    const highWithoutNotification = task({ id: "high", priority: "high", unreadAlertCount: 0 });
    const ordinaryWithNotification = task({ id: "notified", priority: "low", unreadAlertCount: 1 });

    expect(hasAssignmentAlert(highWithoutNotification)).toBe(false);
    expect(hasAssignmentAlert(ordinaryWithNotification)).toBe(true);
    expect(filterAssignmentTasks([highWithoutNotification, ordinaryWithNotification], {
      filter: "alerts", query: "", sort: "asc", locale: "en", now: "2026-07-25T12:00:00+03:00",
    }).map((row) => row.id)).toEqual(["notified"]);
    expect(page).toContain('.from("notifications")');
    expect(page).toContain('.eq("recipient", user.id)');
    expect(page).toContain("payload?.visit_id");
    expect(page).toContain("isNotificationUnread(row)");
    expect(model).toContain("return task.unreadAlertCount > 0");
    expect(model).not.toContain("ALERT_PRIORITIES");
  });

  test("Arabic/RTL and offline presentation remain truthful", () => {
    const browser = read("src/app/(app)/field/my-tasks/AssignmentTaskBrowser.tsx");
    const page = read("src/app/(app)/field/my-tasks/page.tsx");
    const layout = read("src/app/(app)/field/layout.tsx");
    const offline = connectivityPresentation(false, {
      online: "متصل",
      offline: "غير متصل — تحديث الخادم غير متاح. قد تكون المعلومات المعروضة قديمة؛ أعد الاتصال وحاول مجدداً.",
    });
    expect(offline).toEqual({
      tone: "offline",
      message: "غير متصل — تحديث الخادم غير متاح. قد تكون المعلومات المعروضة قديمة؛ أعد الاتصال وحاول مجدداً.",
      refreshAvailable: false,
    });
    expect(browser).toContain("navigator.onLine");
    expect(page).toContain("server refresh is unavailable. Information shown may be stale");
    expect(page).not.toContain("cached assignment details remain available");
    expect(page).toContain('"Prepared", "جاهزة"');
    expect(page).toContain('"Urgent", "عاجلة"');
    expect(layout).toContain('dir={locale === "ar" ? "rtl" : "ltr"}');
    expect(page).toContain('"Package linked"');
    expect(page).toContain('"Package not linked"');
    expect(page).not.toContain('"Offline ready"');
  });
});
