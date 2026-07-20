import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const SRC = (p: string) => fs.readFileSync(path.resolve(__dirname, "..", p), "utf8");

test("OCR journey begins at accountable evidence capture, not a detached upload", () => {
  const page = SRC("src/app/(app)/evidence-ocr/page.tsx");
  const review = SRC("src/app/(app)/evidence-ocr/OcrReview.tsx");
  expect(page).toContain('not("storage_path", "is", null)');
  expect(page).toContain("How to use evidence text extraction");
  expect(page).toContain('href="/field"');
  expect(page).toContain("Only stored photos and documents appear here");
  // i18n audit (TASK-I18N-RTL-AUDIT-001) threaded this string through t() so it
  // has a real Arabic path — the English fallback now lives in page.tsx, the
  // href template literal is unaffected and stays in OcrReview.tsx.
  expect(page).toContain("Open the inspection item that owns this evidence");
  expect(review).toContain("/field/inspection/${row.inspectionId}");
});
