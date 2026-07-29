import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

test("REQ-007 renders the append-only location provenance stream", () => {
  const visit = read("src/app/(app)/visits/[id]/page.tsx");
  expect(visit).toContain('from("visit_location_events")');
  expect(visit).toContain("lat, lng, source, actor, note, created_at");
  expect(visit).toContain("Location & provenance");
  expect(visit).toContain("first pin:");
});

test("REQ-007 mirrors corrections without overwriting master coordinates", () => {
  const migration = read("../../supabase/migrations/20260729081000_requirements_alignment_location_provenance.sql");
  expect(migration).toContain("after insert on public.visit_location_corrections");
  expect(migration).toContain("new.corrected_by");
  expect(migration).toContain("new.corrected_at");
  expect(migration).toContain("new.id");
  expect(migration).not.toMatch(/update\s+public\.(factories|visits)/i);
  expect(migration).not.toMatch(/delete\s+from/i);
});
