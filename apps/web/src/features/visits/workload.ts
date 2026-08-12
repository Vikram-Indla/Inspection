import type { SupabaseClient } from "@supabase/supabase-js";
import { riyadhDateParts } from "@/lib/dates";

const DAY_MS = 86_400_000;
const WEEK_DAYS = 7;
const WEEKS = 6;
const ASSIGNMENT_LIMIT = 2000;
const DEFAULT_DAILY_CAP = 10;

export type WorkloadInspector = {
  readonly id: string;
  readonly name: string;
  readonly weeks: readonly number[];
  readonly inWindow: number;
  readonly later: number;
  readonly total: number;
  readonly peakDay: number;
};

export type WorkloadData = {
  readonly inspectors: readonly WorkloadInspector[];
  readonly weekStarts: readonly number[];
  readonly dailyCap: number;
  readonly activeTotal: number;
  readonly laterTotal: number;
  readonly weekPeak: number;
};

export type WorkloadLoad =
  | { readonly ok: false; readonly reason: string }
  | { readonly ok: true; readonly data: WorkloadData };

type AssignmentRow = {
  readonly inspectorId: string;
  readonly name: string | null;
  readonly windowStart: string;
};

type Tally = {
  name: string;
  readonly weeks: number[];
  readonly perDay: Map<string, number>;
  later: number;
  total: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function embedded(value: unknown): Record<string, unknown> | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  return isRecord(candidate) ? candidate : null;
}

function text(source: Record<string, unknown>, key: string): string | null {
  const value = source[key];
  return typeof value === "string" ? value : null;
}

/**
 * Narrows one assignment read into the fields this view needs, dropping rows
 * whose visit is not active load. Supabase types a to-one embed as an array,
 * so the shape is narrowed here rather than asserted at the call site.
 */
function toAssignment(row: unknown): AssignmentRow | null {
  if (!isRecord(row)) return null;
  const inspectorId = text(row, "inspector_id");
  const visit = embedded(row.visits);
  if (inspectorId === null || visit === null) return null;
  if (text(visit, "planning_status") !== "published") return null;
  if (text(visit, "operational_state") === "submitted") return null;
  const windowStart = text(visit, "window_start");
  if (windowStart === null) return null;
  const profile = embedded(row.profiles);
  return { inspectorId, name: profile === null ? null : text(profile, "full_name"), windowStart };
}

function dayKey(ms: number): string {
  const { year, month, day } = riyadhDateParts(ms);
  return `${year}-${month}-${day}`;
}

export function windowStartMs(nowMs: number): number {
  const today = riyadhDateParts(nowMs);
  const midnight = Date.UTC(today.year, today.month - 1, today.day);
  return midnight - new Date(midnight).getUTCDay() * DAY_MS;
}

export function weekStartsFrom(startMs: number): readonly number[] {
  return Array.from({ length: WEEKS }, (_unused, index) => startMs + index * WEEK_DAYS * DAY_MS);
}

function weekIndexOf(iso: string, startMs: number): number {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms) || ms < startMs || ms >= startMs + WEEKS * WEEK_DAYS * DAY_MS) return -1;
  return Math.floor((ms - startMs) / (WEEK_DAYS * DAY_MS));
}

function readDailyCap(settings: unknown): number {
  if (typeof settings !== "object" || settings === null) return DEFAULT_DAILY_CAP;
  const cap = (settings as Record<string, unknown>).daily_visit_cap;
  return typeof cap === "number" && cap > 0 ? cap : DEFAULT_DAILY_CAP;
}

function tally(rows: readonly unknown[], startMs: number): readonly WorkloadInspector[] {
  const byInspector = new Map<string, Tally>();

  for (const row of rows) {
    const assignment = toAssignment(row);
    if (assignment === null) continue;
    const entry = byInspector.get(assignment.inspectorId) ?? {
      name: assignment.name ?? assignment.inspectorId.slice(0, 8),
      weeks: Array.from({ length: WEEKS }, () => 0),
      perDay: new Map<string, number>(),
      later: 0,
      total: 0,
    };
    const index = weekIndexOf(assignment.windowStart, startMs);
    if (index >= 0) entry.weeks[index] += 1;
    else entry.later += 1;
    const day = dayKey(Date.parse(assignment.windowStart));
    entry.perDay.set(day, (entry.perDay.get(day) ?? 0) + 1);
    entry.total += 1;
    byInspector.set(assignment.inspectorId, entry);
  }

  return [...byInspector.entries()]
    .map(([id, entry]) => ({
      id,
      name: entry.name,
      weeks: entry.weeks,
      inWindow: entry.total - entry.later,
      later: entry.later,
      total: entry.total,
      peakDay: Math.max(0, ...entry.perDay.values()),
    }))
    .sort((left, right) => right.total - left.total || left.name.localeCompare(right.name));
}

export async function loadInspectorWorkload(sb: SupabaseClient, nowMs: number): Promise<WorkloadLoad> {
  const startMs = windowStartMs(nowMs);
  const [assignments, engine] = await Promise.all([
    sb.from("assignments")
      .select("inspector_id, profiles(full_name), visits(planning_status, operational_state, window_start)")
      .limit(ASSIGNMENT_LIMIT),
    sb.from("engine_settings").select("settings").eq("engine", "execution").maybeSingle(),
  ]);

  if (assignments.error) return { ok: false, reason: assignments.error.message };

  const rows: readonly unknown[] = assignments.data ?? [];
  const inspectors = tally(rows, startMs);

  return {
    ok: true,
    data: {
      inspectors,
      weekStarts: weekStartsFrom(startMs),
      dailyCap: readDailyCap(engine.data?.settings),
      activeTotal: inspectors.reduce((sum, entry) => sum + entry.total, 0),
      laterTotal: inspectors.reduce((sum, entry) => sum + entry.later, 0),
      weekPeak: Math.max(1, ...inspectors.flatMap(entry => [...entry.weeks])),
    },
  };
}
