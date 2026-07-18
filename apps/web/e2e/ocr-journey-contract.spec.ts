import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const SRC = (p: string) => fs.readFileSync(path.resolve(__dirname, "..", p), "utf8");

test("OCR journey begins at accountable evidence capture, not a detached upload", () => {
  const page = SRC("src/app/evidence-ocr/page.tsx");
  const review = SRC("src/app/evidence-ocr/OcrReview.tsx");
  expect(page).toContain('not("storage_path", "is", null)');
  expect(page).toContain("How to use evidence text extraction");
  expect(page).toContain('href="/field"');
  expect(page).toContain("Only stored photos and documents appear here");
  expect(review).toContain("Open the inspection item that owns this evidence");
  expect(review).toContain("/field/inspection/${row.inspectionId}");
});
