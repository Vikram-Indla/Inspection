/** Segmented control — exclusive view toggle (e.g. Board / Table / Map). */
export interface SegmentedProps {
  options: string[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
}
export declare function Segmented(props: SegmentedProps): JSX.Element;
