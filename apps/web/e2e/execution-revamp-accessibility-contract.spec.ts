import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.resolve(process.cwd(), "src/app/(app)/execution/RevampExecutionWorkspace.tsx"),
  "utf8",
);

test.describe("EXE-CP-S01 governed drawer accessibility contract", () => {
  test("both modal drawers receive focus and close on Escape", () => {
    expect(source).toContain("detailCloseRef.current?.focus()");
    expect(source).toContain("rescheduleCloseRef.current?.focus()");
    expect(source).toContain('if (event.key === "Escape") setSelected(null)');
    expect(source).toContain('if (event.key === "Escape") setReschedule(null)');
  });

  test("focus returns to the originating control after either drawer closes", () => {
    expect(source.match(/origin\?\.focus\(\)/g)).toHaveLength(2);
  });

  test("drawers retain named modal dialog semantics", () => {
    expect(source).toContain('role="dialog" aria-modal="true" aria-labelledby="execution-detail-title"');
    expect(source).toContain('role="dialog" aria-modal="true" aria-labelledby="reschedule-title"');
  });
});
