/** Governed date/time — Intl + Asia/Riyadh, Gregorian primary, bdi-isolated, never toISOString().slice(). Modes: date "18 Jul 2026" · datetime "…, 11:40 (Riyadh)" · due = exact date + relative urgency. */
export interface DateTimeProps {
  value: string | number | Date;
  mode?: "date" | "datetime" | "due";
  locale?: string;
  showZone?: boolean;
  className?: string;
}
export declare function DateTime(props: DateTimeProps): JSX.Element;
