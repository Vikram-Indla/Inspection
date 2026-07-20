/** Hybrid-shell command bar — brand+context | global search | scope + ONE principal action + utilities + account. Approved 1.5% texture allowed here (chrome only). Never wraps into multiple rows — overflow collapses into utilities. */
export interface CommandHeaderProps {
  context?: React.ReactNode;
  search?: React.ReactNode;
  scope?: React.ReactNode;
  action?: React.ReactNode;
  utilities?: React.ReactNode;
  account?: React.ReactNode;
  className?: string;
}
export declare function CommandHeader(props: CommandHeaderProps): JSX.Element;
