/** Flat record/version row with start-edge selection rail — replaces bordered version cards (TypeCards deprecated for lists). */
export interface RecordRowProps {
  title: React.ReactNode;
  chips?: React.ReactNode;
  meta?: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}
export declare function RecordRow(props: RecordRowProps): JSX.Element;
