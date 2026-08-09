import { test, expect } from "@playwright/test";
import {
  isTaskStatusTransitionAllowed, isTerminalTaskStatus, taskScopeMatch, canManageTask,
  evaluateReassign, evaluateActivation,
} from "../src/lib/workflow/tasks";

// TASK-MVP2-M2-02-WORKFLOW-STUDIO-001 · MVP2-REQ-0032. Self-authored, pure.

test("mvp2-m2-02 0032 task status machine allows valid legs, blocks illegal", () => {
  expect(isTaskStatusTransitionAllowed("new", "assigned")).toBe(true);
  expect(isTaskStatusTransitionAllowed("assigned", "in_progress")).toBe(true);
  expect(isTaskStatusTransitionAllowed("in_progress", "suspended")).toBe(true);
  expect(isTaskStatusTransitionAllowed("suspended", "in_progress")).toBe(true);
  expect(isTaskStatusTransitionAllowed("in_progress", "completed")).toBe(true);
  // illegal
  expect(isTaskStatusTransitionAllowed("new", "completed")).toBe(false);
  expect(isTaskStatusTransitionAllowed("completed", "in_progress")).toBe(false);
  expect(isTaskStatusTransitionAllowed("cancelled", "assigned")).toBe(false);
});

test("mvp2-m2-02 0032 terminal statuses are terminal", () => {
  expect(isTerminalTaskStatus("completed")).toBe(true);
  expect(isTerminalTaskStatus("cancelled")).toBe(true);
  expect(isTerminalTaskStatus("in_progress")).toBe(false);
});

test("mvp2-m2-02 0032 manager scope matches by branch OR sector, not otherwise", () => {
  expect(taskScopeMatch({ region: "riyadh", orgScope: "metals" }, { branch: "riyadh", sector: "x" })).toBe(true);
  expect(taskScopeMatch({ region: "riyadh", orgScope: "metals" }, { branch: "jeddah", sector: "metals" })).toBe(true);
  expect(taskScopeMatch({ region: "riyadh", orgScope: "metals" }, { branch: "jeddah", sector: "food" })).toBe(false);
  expect(taskScopeMatch({ region: null, orgScope: null }, { branch: "riyadh", sector: "metals" })).toBe(false);
});

test("mvp2-m2-02 0032 canManageTask: admin any; manager only in scope; others never", () => {
  const scope = { region: "riyadh", orgScope: "metals" };
  const inScope = { branch: "riyadh", sector: "x" };
  const outScope = { branch: "jeddah", sector: "food" };
  expect(canManageTask({ id: "a", roles: ["admin"] }, scope, outScope)).toBe(true);
  expect(canManageTask({ id: "m", roles: ["supervisor"] }, scope, inScope)).toBe(true);
  expect(canManageTask({ id: "m", roles: ["supervisor"] }, scope, outScope)).toBe(false);
  expect(canManageTask({ id: "u", roles: ["assigned_inspector"] }, scope, inScope)).toBe(false);
  expect(canManageTask({ id: "w", roles: ["workflow_admin"] }, scope, inScope)).toBe(false);
});

test("mvp2-m2-02 0032 reassignment requires reason, assignee, non-terminal", () => {
  expect(evaluateReassign({ toAssignee: "u2", reason: "cover leave", currentStatus: "assigned" }).ok).toBe(true);
  expect(evaluateReassign({ toAssignee: "u2", reason: "", currentStatus: "assigned" }).ok).toBe(false);
  expect(evaluateReassign({ toAssignee: "", reason: "x", currentStatus: "assigned" }).ok).toBe(false);
  expect(evaluateReassign({ toAssignee: "u2", reason: "x", currentStatus: "completed" }).ok).toBe(false);
});

test("mvp2-m2-02 0032 activation: reason required; no reactivating a terminal task", () => {
  expect(evaluateActivation(false, "in_progress", "on hold").ok).toBe(true);
  expect(evaluateActivation(false, "in_progress", "").ok).toBe(false);
  expect(evaluateActivation(true, "completed", "reopen").ok).toBe(false);
  expect(evaluateActivation(true, "suspended", "resume").ok).toBe(true);
});
