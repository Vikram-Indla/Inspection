import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(__dirname, "..");

test("ANL-S01 preserves truthful analytics states and lineage", async () => {
  const page = fs.readFileSync(
    path.join(root, "src/app/(app)/analytics/page.tsx"),
    "utf8",
  );
  const loading = fs.readFileSync(
    path.join(root, "src/app/(app)/analytics/loading.tsx"),
    "utf8",
  );
  const error = fs.readFileSync(
    path.join(root, "src/app/(app)/analytics/error.tsx"),
    "utf8",
  );

  expect(page).toContain('kind="unauthorized" locale={locale}');
  expect(page).toContain('kind="empty" locale={locale}');
  expect(page).not.toContain('result.rows.length === 0 ? <StateSurface kind="rls-denied"');
  expect(page).toContain("<code className=\"id-code\">{metric.trace}</code>");
  expect(page).toContain("<time dateTime={result.refreshedAt}>{result.refreshedAt}</time>");
  expect(page).toContain("Export · unavailable");
  expect(page).toContain("No live AI request is made.");
  expect(loading).toContain('kind="loading"');
  expect(error).toContain('kind="error"');
});

test("ANL-S01 uses only the existing Saqeel class contract", async () => {
  const page = fs.readFileSync(
    path.join(root, "src/app/(app)/analytics/page.tsx"),
    "utf8",
  );

  expect(page).not.toContain("style={{");
  expect(page).not.toContain("ax-");
  expect(page).not.toContain("astryx");
  expect(page).toContain('className="sq-content"');
  expect(page).toContain('className="page-header"');
  expect(page).toContain('className="kpi-grid"');
  expect(page).toContain('className="panel kpi"');
});
