import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import {
  completionReference,
  latestSubmittedVersions,
  normalizeEmbedded,
  summarizeSnapshot,
  type CompletedHistoryRecord,
} from "../src/lib/field/completed-history";

const root = path.resolve(__dirname, "..");
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");

const record = (versionNumber: number, submittedAt: string): CompletedHistoryRecord => ({
  inspectionId: "inspection-1",
  visitId: "visit-1",
  factoryName: "Factory",
  factoryCode: "F-1",
  visitType: "routine",
  status: "submitted",
  versionId: "12345678-abcd-4000-8000-000000000000",
  versionNumber,
  submittedAt,
  submittedBy: "inspector-1",
  acknowledgement: null,
  snapshot: { answers: { a: "compliant", b: "non_compliant" }, evidence: { by_item: { b: 2 } } },
});

test.describe("TASK-IPAD-COMPLETED-HISTORY-001 contract", () => {
  test("uses stable receipt references and immutable snapshot summaries", () => {
    expect(completionReference(record(2, "2026-07-25T08:00:00Z"))).toBe("SUB-12345678-V2");
    expect(summarizeSnapshot(record(1, "2026-07-25T08:00:00Z").snapshot)).toEqual({
      answered: 2, compliant: 1, nonCompliant: 1, findings: 1, evidence: 2,
    });
  });

  test("INSP-699 regression — normalizes array, single-object, and null/undefined embed shapes", () => {
    // PostgREST returns array, bare object, or null for the same nested relation
    // depending on inferred FK cardinality (INSP-699: /field/completed crashed
    // with "flatMap is not a function" when a visit had exactly one inspection
    // and the embed came back as a bare object instead of a one-item array).
    const asArray = [{ id: "a" }, { id: "b" }];
    const asObject = { id: "solo" };

    expect(normalizeEmbedded(asArray, "test.array")).toEqual([{ id: "a" }, { id: "b" }]);
    expect(normalizeEmbedded(asObject, "test.object")).toEqual([{ id: "solo" }]);
    expect(normalizeEmbedded(null, "test.null")).toEqual([]);
    expect(normalizeEmbedded(undefined, "test.undefined")).toEqual([]);

    // Genuinely invalid shapes (not array/object/null/undefined) must NOT be
    // silently hidden as an empty result set with no trace — they're logged.
    const originalError = console.error;
    const logged: unknown[][] = [];
    console.error = (...args: unknown[]) => logged.push(args);
    try {
      expect(normalizeEmbedded("not-an-object-or-array", "test.invalid-string")).toEqual([]);
      expect(normalizeEmbedded(42, "test.invalid-number")).toEqual([]);
    } finally {
      console.error = originalError;
    }
    expect(logged.length).toBe(2);
    expect(logged[0].join(" ")).toContain("test.invalid-string");
    expect(logged[1].join(" ")).toContain("test.invalid-number");
  });

  test("selects latest versions without merging mutable state", () => {
    const latest = latestSubmittedVersions([
      record(1, "2026-07-24T08:00:00Z"),
      record(2, "2026-07-25T08:00:00Z"),
    ]);
    expect(latest).toHaveLength(1);
    expect(latest[0].versionNumber).toBe(2);
  });

  test("list and detail enforce inspector scope, immutable backing, and no mutation controls", () => {
    const queries = read("src/features/field-completed/queries.ts");
    expect(queries).toContain('.eq("inspector_id", user.id)');
    expect(queries).toContain("submission_versions");
    expect(queries).toContain("submission_versions!inner");
    expect(queries).not.toMatch(/<form|action=|from\\(\"checklist_responses\"\\)|from\\(\"evidence\"\\)/);
  });

  test("cached history is user-scoped, display-only, and absent from outbox operations", () => {
    const offline = read("src/lib/offline.ts");
    expect(offline).toContain('s.put(records, "completed-history")');
    expect(offline).toContain('s.get("completed-history")');
    expect(offline).not.toContain('kind: "completed');
  });
});
