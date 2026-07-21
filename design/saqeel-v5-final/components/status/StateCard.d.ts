/** Empty / error / unauthorized screen-state card (12 mandatory states). */
export interface StateCardProps {
  glyph?: React.ReactNode;
  title?: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
  inline?: boolean;
  /** Dashed permission border for ERR-AUTH-001 denials */
  unauthorized?: boolean;
  className?: string;
}
export declare function StateCard(props: StateCardProps): JSX.Element;
