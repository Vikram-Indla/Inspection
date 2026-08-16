import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { ANALYTICS_BOTTLENECKS } from "@/features/analytics/bottlenecks";

const root = path.resolve(__dirname, "..");
const read = (relative: string) => fs.readFileSync(path.join(root, relative), "utf8");

const ROUTE = "src/app/(app)/analytics";
const SECTIONS = "src/components/sections/analytics";

test("ANL-S01 renders each absent state as itself, never as another", () => {
  const page = read(`${ROUTE}/page.tsx`);
  const screen = read(`${SECTIONS}/analytics-screen/analytics-screen.tsx`);

  expect(page).toContain("result.kind === \"unauthorized\"");
  expect(page).toContain("strings.denied.title");
  expect(page).toContain("result.kind === \"error\"");
  expect(page).toContain("strings.error.title");
  expect(screen).toContain("strings.empty.title");
  expect(read(`${ROUTE}/loading.tsx`)).toContain("AnalyticsSkeleton");
  expect(read(`${ROUTE}/error.tsx`)).toContain("analyticsMessages(locale).error");

  expect(page).not.toContain("result.rows.length === 0 ? <StateSurface kind=\"rls-denied\"");
});

test("ANL-S01 keeps per-metric lineage and definitions on screen", () => {
  expect(read(`${SECTIONS}/analytics-blocked/analytics-blocked.tsx`)).toContain("metric.trace");
  expect(read(`${SECTIONS}/analytics-rates/analytics-rates.tsx`)).toContain("metric.definition");
  expect(read(`${SECTIONS}/analytics-counts/analytics-counts.tsx`)).toContain("metric.definition");
});

test("ANL-S01 declares export unavailable and asserts no live AI request", () => {
  const byKey = new Map(ANALYTICS_BOTTLENECKS.map(entry => [entry.key, entry]));

  expect(byKey.get("export")).toEqual({ key: "export", status: "unavailable", note: "exportNote" });
  expect(byKey.get("attentionQueue")?.note).toBe("attentionQueueNote");

  const en = JSON.parse(read("src/i18n/locales/en/analytics.json"));
  const ar = JSON.parse(read("src/i18n/locales/ar/analytics.json"));
  expect(en.bottlenecks.attentionQueueNote).toContain("No live AI request");
  expect(ar.bottlenecks.attentionQueueNote).toBeTruthy();
  expect(ar.bottlenecks.exportNote).toBeTruthy();
});

test("ANL-S01 states and metric copy ship in both locales", () => {
  const en = JSON.parse(read("src/i18n/locales/en/analytics.json"));
  const ar = JSON.parse(read("src/i18n/locales/ar/analytics.json"));
  const flatten = (value: unknown, prefix = ""): readonly string[] =>
    value && typeof value === "object"
      ? Object.entries(value).flatMap(([key, child]) => flatten(child, `${prefix}${key}.`))
      : [prefix];

  expect(flatten(ar)).toEqual(flatten(en));
  for (const group of ["denied", "error", "empty"]) {
    expect(Object.keys(en[group]).length).toBeGreaterThan(0);
  }
});

test("ANL-S01 the route tree carries no inline style and no Astryx", () => {
  const files = [
    `${ROUTE}/page.tsx`,
    `${ROUTE}/loading.tsx`,
    `${ROUTE}/error.tsx`,
    ...fs.readdirSync(path.join(root, SECTIONS))
      .map(dir => `${SECTIONS}/${dir}/${dir}.tsx`)
      .filter(candidate => fs.existsSync(path.join(root, candidate))),
  ];

  for (const file of files) {
    const source = read(file);
    expect(source, file).not.toContain("style={{");
    expect(source, file).not.toContain("ax-");
    expect(source, file).not.toContain("astryx");
  }
  expect(files.length).toBeGreaterThan(5);
});
