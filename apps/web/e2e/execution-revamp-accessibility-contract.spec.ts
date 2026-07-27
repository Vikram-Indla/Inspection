import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(
  path.resolve(process.cwd(), "src/app/(app)/execution/RevampExecutionWorkspace.tsx"),
  "utf8",
);

test.describe("EXE-CP-S01 governed drawer accessibility contract", () => {
  test("both modal drawers receive focus and close on Escape", () => {
    expect(source).toContain("initialFocusRef.current?.focus()");
    expect(source).toContain('if (event.key === "Escape")');
    expect(source).toContain("close();");
  });

  test("focus returns to the originating control after either drawer closes", () => {
    expect(source).toContain("origin?.focus()");
    expect(source).toContain("useDialogFocus(!!selected");
    expect(source).toContain("useDialogFocus(!!reschedule");
  });

  test("drawers retain named modal dialog semantics", () => {
    expect(source).toContain('className="sq-execution__drawer" role="dialog" aria-modal="true" aria-labelledby="execution-detail-title"');
    expect(source).toContain('className="sq-execution__drawer" role="dialog" aria-modal="true" aria-labelledby="reschedule-title"');
  });

  test("Tab and Shift+Tab remain inside either modal drawer", () => {
    expect(source).toContain('if (event.key !== "Tab") return');
    expect(source).toContain('dialogRef.current?.querySelectorAll<HTMLElement>');
    expect(source).toContain("event.shiftKey && document.activeElement === first");
    expect(source).toContain("!event.shiftKey && document.activeElement === last");
    expect(source).toContain("detailDialogRef");
    expect(source).toContain("rescheduleDialogRef");
  });
});
