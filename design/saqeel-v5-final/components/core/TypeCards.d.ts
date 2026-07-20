/** Single-select cards for package/report type (same value as a select, richer presentation). */
export interface TypeCardsProps {
  name?: string;
  options: { value: string; title: React.ReactNode; meta?: React.ReactNode }[];
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}
export declare function TypeCards(props: TypeCardsProps): JSX.Element;
