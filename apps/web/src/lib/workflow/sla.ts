// M2-02 Workflow, SLA & Notification Studio — SLA timer model (DEC-003-honest).
// TASK-MVP2-M2-02-WORKFLOW-STUDIO-001 · MVP2-REQ-0033 · design GAP-03/04.
//
// DEC-003 (working calendar / pause-resume / escalation) is OPEN. This module
// therefore INVENTS NO durations, working days, holidays, warning thresholds or
// escalation timers. It:
//   1. blocks activation unless an authorized, fully-specified calendar exists;
//   2. computes a due date ONLY from governed calendar inputs supplied to it;
//   3. derives status (warning/breach/met) from config-supplied thresholds;
//   4. models pause/resume without any scheduler (no automatic breach execution).
// A caller that has no governed calendar gets a truthful "not activatable" — the
// human operations (pause/resume) stay usable regardless.

export type SlaCalendar = {
  timezone?: string | null;
  workingDays?: number[] | null;      // 0..6 (Sun..Sat) — governed input
  workingStartMinutes?: number | null; // minutes from midnight — governed input
  workingEndMinutes?: number | null;   // governed input
  holidays?: string[] | null;          // ISO date strings (YYYY-MM-DD) — governed input
  activationAuthorized?: boolean;      // only a recorded DEC-003 decision sets true
};

export type SlaActivation = { activatable: boolean; reason: string };

/** DEC-003 activation gate. Blocks unless the calendar is authorized AND fully
 *  specified AND a duration is supplied. Never assumes a default calendar. */
export function canActivateSla(calendar: SlaCalendar | null | undefined, durationMinutes: number | null | undefined): SlaActivation {
  if (!calendar) return { activatable: false, reason: "No SLA calendar ( unresolved) — activation blocked, timer stays pending." };
  if (!calendar.activationAuthorized) return { activatable: false, reason: "Calendar activation is not authorized ( decision not recorded)." };
  if (!calendar.workingDays?.length || calendar.workingStartMinutes == null || calendar.workingEndMinutes == null) {
    return { activatable: false, reason: "Calendar is not fully specified (working days/hours) — governed inputs missing." };
  }
  if (durationMinutes == null || durationMinutes <= 0) {
    return { activatable: false, reason: "No governed SLA duration supplied — activation blocked." };
  }
  return { activatable: true, reason: "Authorized, fully-specified calendar and duration present." };
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function isWorkingDay(d: Date, cal: SlaCalendar): boolean {
  const dow = d.getUTCDay();
  if (!cal.workingDays?.includes(dow)) return false;
  if (cal.holidays?.includes(ymd(d))) return false;
  return true;
}

/**
 * Compute due date by accruing `durationMinutes` of WORKING time from `startedAt`
 * over the supplied calendar. Returns null when the calendar is incomplete — it
 * never fabricates a due date. Pure and deterministic.
 */
export function computeDueAt(startedAtISO: string, durationMinutes: number, cal: SlaCalendar): string | null {
  const g = canActivateSla({ ...cal, activationAuthorized: true }, durationMinutes);
  if (!g.activatable) return null;
  const startMin = cal.workingStartMinutes!, endMin = cal.workingEndMinutes!;
  if (endMin <= startMin) return null;

  let remaining = durationMinutes;
  const cur = new Date(startedAtISO);
  // Cap the search to avoid an unbounded loop on a pathological calendar.
  for (let guard = 0; guard < 3660 && remaining > 0; guard++) {
    if (isWorkingDay(cur, cal)) {
      const dayStart = new Date(cur); dayStart.setUTCHours(0, startMin, 0, 0);
      const dayEnd = new Date(cur); dayEnd.setUTCHours(0, endMin, 0, 0);
      // position within this working day
      const from = cur > dayStart ? cur : dayStart;
      if (from < dayEnd) {
        const availMin = Math.floor((dayEnd.getTime() - from.getTime()) / 60000);
        if (remaining <= availMin) {
          return new Date(from.getTime() + remaining * 60000).toISOString();
        }
        remaining -= availMin;
      }
    }
    // advance to the next day's working start
    cur.setUTCDate(cur.getUTCDate() + 1);
    cur.setUTCHours(0, startMin, 0, 0);
  }
  return null; // duration exceeded the bounded search window
}

// ---- timer state machine (no scheduler) ----
export const SLA_STATUSES = ["pending_activation", "running", "paused", "breached", "met", "cancelled"] as const;
export type SlaStatus = (typeof SLA_STATUSES)[number];

const SLA_TRANSITIONS: Record<SlaStatus, SlaStatus[]> = {
  pending_activation: ["running", "cancelled"],
  running: ["paused", "met", "breached", "cancelled"],
  paused: ["running", "cancelled"],
  breached: ["met", "cancelled"],
  met: [],
  cancelled: [],
};
export function isSlaTransitionAllowed(from: SlaStatus, to: SlaStatus): boolean {
  return SLA_TRANSITIONS[from]?.includes(to) ?? false;
}

export type SlaTimerView = { dueAt?: string | null; warnAt?: string | null; breachAt?: string | null; status: SlaStatus };

/** Derived read only — NOT a scheduler. Returns the observable SLA state at `now`
 *  from config-supplied thresholds. Never fires a side effect. */
export function slaStatusAt(nowISO: string, t: SlaTimerView): "pending" | "running" | "warning" | "breach" | "met" | "cancelled" {
  if (t.status === "met") return "met";
  if (t.status === "cancelled") return "cancelled";
  if (t.status === "pending_activation" || !t.dueAt) return "pending";
  const now = new Date(nowISO).getTime();
  const due = new Date(t.dueAt).getTime();
  const breach = t.breachAt ? new Date(t.breachAt).getTime() : due;
  if (now >= breach) return "breach";
  if (t.warnAt && now >= new Date(t.warnAt).getTime()) return "warning";
  return "running";
}

export type PauseResumeDecision = { ok: boolean; why: string };
export function evaluatePause(status: SlaStatus, reason: string): PauseResumeDecision {
  if (status !== "running") return { ok: false, why: `Only a running SLA can be paused (was ${status}).` };
  if (!reason?.trim()) return { ok: false, why: "A pause reason is required." };
  return { ok: true, why: "Pause permitted." };
}
export function evaluateResume(status: SlaStatus): PauseResumeDecision {
  if (status !== "paused") return { ok: false, why: `Only a paused SLA can be resumed (was ${status}).` };
  return { ok: true, why: "Resume permitted." };
}
