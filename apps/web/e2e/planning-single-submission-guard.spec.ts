import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import {
  readSubmissionToken,
  resetSubmissionGuard,
  runOncePerSubmission,
  submissionKey,
} from "@/features/planning-single/submission-guard";

const root = path.resolve(__dirname, "..");
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");
const readRepo = (relative: string) => fs.readFileSync(path.resolve(root, "../..", relative), "utf8");

const STALE = { error: "PLANNING-DRAFT-STALE" };
const USER = "a2000000-0000-4000-8000-000000000001";

test.beforeEach(() => resetSubmissionGuard());

test("INC-STALE-01 one user submission reaches the RPC at most once", async () => {
  const key = submissionKey(USER, "form1-0");
  const calls: number[] = [];
  const rpc = async () => {
    calls.push(1);
    return STALE;
  };

  const first = await runOncePerSubmission(key, rpc);
  const replay = await runOncePerSubmission(key, rpc);
  const replayAgain = await runOncePerSubmission(key, rpc);

  expect(calls).toHaveLength(1);
  expect(first).toEqual(STALE);
  expect(replay).toEqual(STALE);
  expect(replayAgain).toEqual(STALE);
});

test("INC-STALE-02 duplicate submissions in flight share a single RPC call", async () => {
  const key = submissionKey(USER, "form1-0");
  const calls: number[] = [];
  const rpc = async () => {
    calls.push(1);
    await new Promise(resolve => setTimeout(resolve, 20));
    return STALE;
  };

  const results = await Promise.all([
    runOncePerSubmission(key, rpc),
    runOncePerSubmission(key, rpc),
    runOncePerSubmission(key, rpc),
  ]);

  expect(calls).toHaveLength(1);
  expect(results).toEqual([STALE, STALE, STALE]);
});

test("INC-STALE-03 a stale answer cannot drive a further RPC call by itself", async () => {
  const key = submissionKey(USER, "form1-0");
  const calls: number[] = [];
  const rpc = async () => {
    calls.push(1);
    return STALE;
  };

  const answer = await runOncePerSubmission(key, rpc);
  const replays = await Promise.all(
    Array.from({ length: 50 }, () => runOncePerSubmission(key, rpc)),
  );

  expect(answer).toEqual(STALE);
  expect(replays.every(entry => entry === answer)).toBe(true);
  expect(calls).toHaveLength(1);
});

test("INC-STALE-04 the next user attempt is a new submission and does run", async () => {
  const calls: string[] = [];
  const rpc = async (label: string) => {
    calls.push(label);
    return STALE;
  };

  await runOncePerSubmission(submissionKey(USER, "form1-0"), () => rpc("first"));
  await runOncePerSubmission(submissionKey(USER, "form1-1"), () => rpc("retry"));

  expect(calls).toEqual(["first", "retry"]);
});

test("INC-STALE-05 one submission key never crosses users", () => {
  expect(submissionKey(USER, "form1-0")).not.toEqual(
    submissionKey("b2000000-0000-4000-8000-000000000002", "form1-0"),
  );
});

test("INC-STALE-06 a malformed token disables replay pairing rather than pairing wrongly", () => {
  expect(readSubmissionToken("form1-0")).toBe("form1-0");
  expect(readSubmissionToken("")).toBe("");
  expect(readSubmissionToken(undefined)).toBe("");
  expect(readSubmissionToken("a b")).toBe("");
  expect(readSubmissionToken("x".repeat(200))).toBe("");
});

test("INC-STALE-07 the publish action guards the submission and still asserts the target", () => {
  const action = read("src/app/(app)/planning/single/actions.ts");
  expect(action).toContain("runOncePerSubmission");
  expect(action).toContain("readSubmissionToken(formData.get(\"submission_token\"))");
  expect(action).toContain("sb.rpc(\"assert_resumed_planning_target_current\"");
  expect(action).toContain("isResumedTargetRejection");
});

test("INC-STALE-08 the screen posts a token that only a completed attempt advances", () => {
  const screen = read("src/components/sections/planning-single/single-visit-screen/single-visit-screen.tsx");
  const fields = read("src/components/sections/planning-single/single-visit-screen/target-fields.tsx");
  expect(screen).toContain("state.attempt ?? 0");
  expect(screen).toContain("submissionToken={submissionToken}");
  expect(fields).toContain("name=\"submission_token\"");
});

test("INC-STALE-09 nothing in the screen resubmits the form on its own", () => {
  const screen = read("src/components/sections/planning-single/single-visit-screen/single-visit-screen.tsx");
  const actions = read("src/components/sections/planning-single/single-visit-screen/publish-actions.tsx");
  for (const source of [screen, actions]) {
    expect(source).not.toContain("requestSubmit");
    expect(source).not.toContain("formAction(");
    expect(source).not.toContain("submit()");
  }
  expect(actions).toContain("disabled={!transitionsExecutable || pending || !publishReady}");
});

test("INC-STALE-10 the stale rejection carries a SQLSTATE no client layer retries", () => {
  const migration = readRepo("supabase/migrations/20260822200851_planning_draft_stale_non_retryable.sql");
  expect(migration).toContain("PLANNING-DRAFT-STALE");
  expect(migration).toContain("PLANNING-DRAFT-TARGET-RESELECT-REQUIRED");
  expect(migration).toContain("errcode='P0001'");
  expect(migration).not.toContain("errcode='40001'");
  expect(migration).toContain("for update");
  expect(migration).toContain("v_plan.created_by<>auth.uid()");
});
