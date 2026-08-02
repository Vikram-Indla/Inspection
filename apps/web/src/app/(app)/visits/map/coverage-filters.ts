// INSP-697 — pure filter logic for CoveragePanel.tsx, extracted so it is
// testable without a DOM/React render pass.
import type { MappedVisit } from "./VisitMap";

export function withinWindow(windowStart: string | null | undefined, days: number | null, now: number): boolean {
  if (days == null) return true;
  if (!windowStart) return false;
  const start = new Date(windowStart).getTime();
  if (Number.isNaN(start)) return false;
  return start >= now - 24 * 60 * 60 * 1000 && start <= now + days * 24 * 60 * 60 * 1000;
}

export type CoverageFilterState = {
  region: string; risk: string; windowDays: number | null;
  inspectorFilter: "" | "assigned" | "unassigned";
};

export function filterVisits(visits: MappedVisit[], f: CoverageFilterState, now: number): MappedVisit[] {
  return visits.filter(v => {
    if (f.region && v.region !== f.region) return false;
    if (f.risk && v.riskBand !== f.risk) return false;
    if (!withinWindow(v.windowStart, f.windowDays, now)) return false;
    if (f.inspectorFilter === "assigned" && !v.inspectorName) return false;
    if (f.inspectorFilter === "unassigned" && v.inspectorName) return false;
    return true;
  });
}

export function regionalCoverage(visits: MappedVisit[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const v of visits) {
    if (!v.region) continue;
    counts.set(v.region, (counts.get(v.region) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}
