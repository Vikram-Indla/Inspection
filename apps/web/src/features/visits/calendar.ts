import type { StatusTone } from "@/components/saqeel/status-pill/status-pill";

export type CalendarView = "day" | "week" | "month";

export type CalendarParams = {
  readonly view?: string;
  readonly on?: string;
};

export type CalendarVisit = {
  readonly id: string;
  readonly windowStart: string;
  readonly windowEnd: string;
  readonly factoryName: string;
  readonly planningStatus: string;
  readonly planningLabel: string;
  readonly opsLabel: string;
  readonly typeLabel: string;
};

export type CalendarStrings = {
  readonly title: string;
  readonly context: string;
  readonly viewLabel: string;
  readonly day: string;
  readonly week: string;
  readonly month: string;
  readonly previous: string;
  readonly next: string;
  readonly today: string;
  readonly emptyTitle: string;
  readonly emptyBody: string;
  readonly more: string;
  readonly dayCount: string;
  readonly loadErrorNeutral: string;
  readonly loadErrorTitle: string;
  readonly openVisit: string;
  readonly windowRange: string;
};

const DAY_MS = 86_400_000;
const MONTH_CELLS = 42;
const WEEK_DAYS = 7;
const VIEWS: readonly CalendarView[] = ["day", "week", "month"];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const PLANNING_TONE: Readonly<Record<string, StatusTone>> = {
  published: "info",
  returned: "warning",
  cancelled: "danger",
  expired: "danger",
  draft: "neutral",
  pending_supervision: "pending",
};

export function planningTone(status: string): StatusTone {
  return PLANNING_TONE[status] ?? "neutral";
}

const pad = (value: number): string => String(value).padStart(2, "0");

export function dayKey(ms: number): string {
  const at = new Date(ms);
  return `${at.getUTCFullYear()}-${pad(at.getUTCMonth() + 1)}-${pad(at.getUTCDate())}`;
}

export function timeOf(iso: string): string {
  return iso.slice(11, 16);
}

export function utcMidnight(moment: Date): number {
  return Date.UTC(moment.getUTCFullYear(), moment.getUTCMonth(), moment.getUTCDate());
}

export function resolveView(raw: string | undefined): CalendarView {
  return VIEWS.find(view => view === raw) ?? "month";
}

export function resolveAnchor(raw: string | undefined, fallback: number): number {
  if (raw === undefined || !ISO_DATE.test(raw)) return fallback;
  const parsed = Date.parse(`${raw}T00:00:00Z`);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function weekStart(anchorMs: number): number {
  return anchorMs - new Date(anchorMs).getUTCDay() * DAY_MS;
}

export function weekCells(anchorMs: number): readonly number[] {
  const start = weekStart(anchorMs);
  return Array.from({ length: WEEK_DAYS }, (_unused, index) => start + index * DAY_MS);
}

export function monthCells(anchorMs: number): readonly number[] {
  const anchor = new Date(anchorMs);
  const first = Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1);
  const gridStart = first - new Date(first).getUTCDay() * DAY_MS;
  return Array.from({ length: MONTH_CELLS }, (_unused, index) => gridStart + index * DAY_MS);
}

export function monthWeeks(anchorMs: number): readonly (readonly number[])[] {
  const cells = monthCells(anchorMs);
  return Array.from(
    { length: MONTH_CELLS / WEEK_DAYS },
    (_unused, index) => cells.slice(index * WEEK_DAYS, index * WEEK_DAYS + WEEK_DAYS),
  );
}

export function shift(view: CalendarView, anchorMs: number, direction: -1 | 1): number {
  if (view === "day") return anchorMs + direction * DAY_MS;
  if (view === "week") return anchorMs + direction * WEEK_DAYS * DAY_MS;
  const anchor = new Date(anchorMs);
  return Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + direction, 1);
}

export function isInMonth(ms: number, anchorMs: number): boolean {
  return new Date(ms).getUTCMonth() === new Date(anchorMs).getUTCMonth();
}

export function groupByDay(visits: readonly CalendarVisit[]): ReadonlyMap<string, CalendarVisit[]> {
  const grouped = new Map<string, CalendarVisit[]>();
  for (const visit of visits) {
    const key = visit.windowStart.slice(0, 10);
    const list = grouped.get(key) ?? [];
    list.push(visit);
    grouped.set(key, list);
  }
  for (const list of grouped.values()) list.sort((a, b) => a.windowStart.localeCompare(b.windowStart));
  return grouped;
}

export function calendarHref(basePath: string, view: CalendarView, anchorMs: number): string {
  return `${basePath}/calendar?view=${view}&on=${dayKey(anchorMs)}`;
}
