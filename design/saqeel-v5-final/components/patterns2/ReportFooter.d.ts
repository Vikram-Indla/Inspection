/** Report legal footer — immutable-vs-live statement, generated/refreshed timestamps, report reference, contract IDs; print adds page numbers. */
export interface ReportFooterProps {
  reference: string;
  generated: React.ReactNode;
  refreshed?: React.ReactNode;
  contracts?: string;
  note?: React.ReactNode;
  className?: string;
}
export declare function ReportFooter(props: ReportFooterProps): JSX.Element;
