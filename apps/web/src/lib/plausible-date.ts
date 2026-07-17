// DEF-DATA-005 — implausible far-future/-past years (observed: 2193, 2325, 2055,
// 2033) reached plan/virtual-session date fields because every call site only
// checked Date.parse() succeeded and end > start, with no bound on the year
// itself. This is a data-sanity guard, not a business planning-horizon policy
// (DEC-003 SLA calendar remains open and unaffected) — the bound is
// deliberately generous so it only rejects obviously corrupted input.
const MIN_YEAR = 2020;
const MAX_YEAR = 2100;

export function isPlausibleDate(iso: string): boolean {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return false;
  const year = new Date(ms).getUTCFullYear();
  return year >= MIN_YEAR && year <= MAX_YEAR;
}

export const PLAUSIBLE_DATE_ERROR = `Date is outside the plausible range (${MIN_YEAR}–${MAX_YEAR}) — check for a data-entry error (DEF-DATA-005).`;
