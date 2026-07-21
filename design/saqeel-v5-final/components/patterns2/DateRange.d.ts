/** Labeled date range — "From … to … (Riyadh)"; AR uses من/إلى, never a bare directional arrow. */
export interface DateRangeProps {
  from: string | number | Date;
  to: string | number | Date;
  mode?: "date" | "datetime";
  labels?: { from: string; to: string };
  className?: string;
}
export declare function DateRange(props: DateRangeProps): JSX.Element;
