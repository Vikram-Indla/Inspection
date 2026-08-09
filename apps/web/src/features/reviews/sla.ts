const DAY_IDX: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };

export function workingDays(spec: string | undefined): Set<number> {
  const days = new Set<number>();
  if (!spec) return days;
  for (const part of spec.split(",")) {
    const range = part.trim().toLowerCase().match(/^([a-z]{3})\s*-\s*([a-z]{3})$/);
    if (range && DAY_IDX[range[1]] != null && DAY_IDX[range[2]] != null) {
      let day = DAY_IDX[range[1]];
      const end = DAY_IDX[range[2]];
      for (let index = 0; index < 7; index++) {
        days.add(day);
        if (day === end) break;
        day = (day + 1) % 7;
      }
    } else {
      const day = part.trim().toLowerCase().slice(0, 3);
      if (DAY_IDX[day] != null) days.add(DAY_IDX[day]);
    }
  }
  return days;
}

export function slaDeadline(submittedAt: string | null, businessDays: number | null, workDays: Set<number>): Date | null {
  if (!submittedAt || businessDays == null) return null;
  const deadline = new Date(submittedAt);
  if (Number.isNaN(deadline.getTime())) return null;
  let added = 0;
  while (added < businessDays) {
    deadline.setUTCDate(deadline.getUTCDate() + 1);
    if (workDays.size === 0 || workDays.has(deadline.getUTCDay())) added++;
  }
  return deadline;
}
