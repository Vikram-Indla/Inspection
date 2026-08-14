import type { GeoMarkerData } from "@/components/GeoMap";
import { riyadhDateParts } from "@/lib/dates";
import {
  FILTER_KEYS,
  type ExecutionFilters,
  type ExecutionRow,
  type ExecutionView,
  type FilterKey,
} from "./types";

const WEEK_DAYS = 7;
const MONTH_DAYS = 35;

const riyadhKey = (value: string | number | Date): string => {
  const { year, month, day } = riyadhDateParts(value);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

export function startOfWeek(nowMs: number): Date {
  const result = new Date(nowMs);
  result.setDate(result.getDate() - result.getDay() + 1);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function calendarDays(weekStart: Date, span: number): Date[] {
  return Array.from({ length: span }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
}

export function calendarSpan(mode: "week" | "month"): number {
  return mode === "week" ? WEEK_DAYS : MONTH_DAYS;
}

export function dayKey(value: string | number | Date): string {
  return riyadhKey(value);
}

export function rowsForDay(rows: readonly ExecutionRow[], key: string): ExecutionRow[] {
  return rows.filter(row => riyadhKey(row.executionDate ?? row.windowStart) === key);
}

export function scopeRows(
  rows: readonly ExecutionRow[],
  view: ExecutionView,
  currentUserId: string,
): ExecutionRow[] {
  return view === "mine" ? rows.filter(row => row.inspectorId === currentUserId) : [...rows];
}

const matchesQuery = (row: ExecutionRow, needle: string): boolean =>
  !needle || [row.factory, row.crNumber, row.visitReference]
    .some(value => value?.toLowerCase().includes(needle));

const fieldOf = (row: ExecutionRow, key: FilterKey): string | null => {
  if (key === "inspector") return row.inspector;
  if (key === "region") return row.region;
  if (key === "risk") return row.risk;
  if (key === "visitMode") return row.visitMode;
  return row.operationalState;
};

export function filterRows(
  rows: readonly ExecutionRow[],
  query: string,
  filters: ExecutionFilters,
): ExecutionRow[] {
  const needle = query.trim().toLowerCase();
  return rows.filter(row => matchesQuery(row, needle)
    && FILTER_KEYS.every(key => {
      const chosen = filters[key];
      return !chosen || fieldOf(row, key) === chosen;
    }));
}

export function filterOptions(rows: readonly ExecutionRow[]): Record<FilterKey, string[]> {
  const collect = (key: FilterKey) => Array.from(
    new Set(rows.map(row => fieldOf(row, key)).filter((value): value is string => !!value)),
  ).sort();
  return {
    inspector: collect("inspector"),
    region: collect("region"),
    risk: collect("risk"),
    visitMode: collect("visitMode"),
    operationalState: collect("operationalState"),
  };
}

export function hasActiveFilters(query: string, filters: ExecutionFilters): boolean {
  return !!query.trim() || FILTER_KEYS.some(key => !!filters[key]);
}

export function markersOf(rows: readonly ExecutionRow[]): GeoMarkerData[] {
  return rows.flatMap(row => row.lat == null || row.lng == null ? [] : [{
    id: row.id,
    lat: row.lat,
    lng: row.lng,
    label: row.factory,
    tone: row.risk === "high" ? "high" : row.risk === "medium" ? "medium" : row.risk === "low" ? "low" : "neutral",
  }]);
}

export function missingCoordinateCount(rows: readonly ExecutionRow[]): number {
  return rows.filter(row => row.lat == null || row.lng == null).length;
}
