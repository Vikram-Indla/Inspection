export interface DueDateProps {
  date: string;
  /** negative = overdue (critical); 0–2 = warning */
  daysLeft?: number;
}
