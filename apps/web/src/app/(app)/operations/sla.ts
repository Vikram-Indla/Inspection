// ENG-09 SLA math (engine_settings 'sla' — configuration, not code).
// FIX WAVE F4: extracted verbatim from operations/page.tsx so the CSV export
// route (M08-017) computes the SAME flags the on-screen SLA watch shows —
// one implementation, two consumers.

export type SlaConf = {
  calendar?: { days?: string; hours?: string; tz?: string };
  reminders?: number[];
  escalation?: Record<string, string>;
  review_business_days?: number;
  resubmission_business_days?: number;
  action_due_calendar_days?: number;
};

export type SlaVisitBase = {
  id: string;
  operational_state: string;
  window_start: string;
  window_end: string;
};

export type SlaFlag<T extends SlaVisitBase = SlaVisitBase> = {
  visit: T;
  kind: "overdue_start" | "overdue_submit" | "reminder";
  pct?: number;
  deadlineMs: number;
  escalation: "L1" | "L2" | null;
};

const DAY_IDX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
// Asia/Riyadh is fixed UTC+3 (no DST), so a constant offset is exact for day-of-week math.
const RIYADH_OFFSET_MS = 3 * 3_600_000;

/** Parse "Sun-Thu" → set of working weekday indexes; null when unparsable (then no L2 math — never invent). */
export function workingDays(spec: string | undefined): Set<number> | null {
  const m = /^([A-Za-z]{3})-([A-Za-z]{3})$/.exec(spec ?? "");
  if (!m) return null;
  const a = DAY_IDX[m[1]], b = DAY_IDX[m[2]];
  if (a === undefined || b === undefined) return null;
  const s = new Set<number>();
  for (let d = a; ; d = (d + 1) % 7) { s.add(d); if (d === b) break; }
  return s;
}

export function addBusinessDays(ms: number, n: number, wd: Set<number>): number {
  let t = ms, added = 0;
  while (added < n) {
    t += 86_400_000;
    if (wd.has(new Date(t + RIYADH_OFFSET_MS).getUTCDay())) added++;
  }
  return t;
}

/** ENG-09 — compute SLA flags from REAL visit windows (no timers, no synthetic clocks). */
export function computeSlaFlags<T extends SlaVisitBase>(visits: T[], sla: SlaConf, nowMs: number): SlaFlag<T>[] {
  const reminders = (Array.isArray(sla.reminders) ? sla.reminders : []).filter(r => typeof r === "number");
  const wd = workingDays(sla.calendar?.days);
  // escalation.L2 is contract-encoded as "breach+1bd" — parse the business-day offset.
  const l2Match = /\+(\d+)bd$/.exec(sla.escalation?.L2 ?? "");
  const l2Bd = l2Match ? Number.parseInt(l2Match[1], 10) : null;

  const flags: SlaFlag<T>[] = [];
  for (const v of visits) {
    const ws = Date.parse(v.window_start), we = Date.parse(v.window_end);
    if (Number.isNaN(ws) || Number.isNaN(we)) continue;
    const notStarted = v.operational_state === "new" || v.operational_state === "prepared";
    const notSubmitted = v.operational_state !== "submitted";

    let flag: SlaFlag<T> | null = null;
    if (notStarted && nowMs > ws) {
      flag = { visit: v, kind: "overdue_start", deadlineMs: ws, escalation: "L1" };
    } else if (notSubmitted && nowMs > we) {
      flag = { visit: v, kind: "overdue_submit", deadlineMs: we, escalation: "L1" };
    } else if (notSubmitted && nowMs > ws && we > ws && reminders.length > 0) {
      const frac = (nowMs - ws) / (we - ws);
      const hit = [...reminders].sort((a, b) => b - a).find(r => frac >= r);
      if (hit !== undefined) flag = { visit: v, kind: "reminder", pct: Math.round(hit * 100), deadlineMs: we, escalation: null };
    }
    if (!flag) continue;
    if (flag.escalation && wd && l2Bd !== null && nowMs > addBusinessDays(flag.deadlineMs, l2Bd, wd)) {
      flag.escalation = "L2";
    }
    flags.push(flag);
  }
  // Breaches first (L2 before L1), then reminders; oldest deadline first within each.
  const rank = (f: SlaFlag<T>) => (f.kind === "reminder" ? 2 : f.escalation === "L2" ? 0 : 1);
  return flags.sort((a, b) => rank(a) - rank(b) || a.deadlineMs - b.deadlineMs);
}

// ---------- TASK-EXECUTION-MODULE-001 · Phase 6 — resubmission SLA (§22, D-022) ----------
export type ResubmissionSource = {
  inspection_id: string;
  visit_id: string;
  factory_name: string | null;
  /** Latest decided Return review timestamp (the SLA clock start). */
  returned_at: string;
};
export type ResubmissionFlag = ResubmissionSource & { deadlineMs: number; overdue: boolean };

/**
 * Resubmission deadline for RETURNED inspections: returned_at +
 * engine_settings.sla.resubmission_business_days working days. Same math
 * pattern as the review queue SLA (reviews/page.tsx): the working-day set
 * comes from the configured calendar and an unparsable calendar degrades to
 * calendar days — the threshold itself is never invented. Display-only: no
 * escalation writes, consistent with the review SLA.
 */
export function computeResubmissionFlags(rows: ResubmissionSource[], sla: SlaConf, nowMs: number): ResubmissionFlag[] {
  const days = sla.resubmission_business_days;
  if (typeof days !== "number") return []; // callers surface "SLA unavailable" honestly
  const wd = workingDays(sla.calendar?.days) ?? new Set([0, 1, 2, 3, 4, 5, 6]);
  const flags: ResubmissionFlag[] = [];
  for (const r of rows) {
    const base = Date.parse(r.returned_at);
    if (Number.isNaN(base)) continue;
    const deadlineMs = addBusinessDays(base, days, wd);
    flags.push({ ...r, deadlineMs, overdue: nowMs > deadlineMs });
  }
  // Overdue first, then the nearest deadline — same breach-first ordering as computeSlaFlags.
  return flags.sort((a, b) => Number(b.overdue) - Number(a.overdue) || a.deadlineMs - b.deadlineMs);
}
