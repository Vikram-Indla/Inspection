/** iPad bottom task bar — persistent, 52px targets, one primary; page reserves safe-area padding (.ax-field-page). */
export interface FieldActionBarProps {
  items: { label: React.ReactNode; href?: string; current?: boolean; onClick?: (e: any) => void }[];
  primary?: { label: React.ReactNode; href?: string; onClick?: (e: any) => void };
  className?: string;
}
export declare function FieldActionBar(props: FieldActionBarProps): JSX.Element;
