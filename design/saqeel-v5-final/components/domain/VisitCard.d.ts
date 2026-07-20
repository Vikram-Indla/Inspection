/** Field visit card — factory, appointment, risk, package context; 52px actions.
 * @startingPoint section="Domain" subtitle="iPad visit card" viewport="700x260" */
export interface VisitCardProps {
  title: React.ReactNode;
  status?: React.ReactNode;
  meta?: { label: React.ReactNode; value: React.ReactNode }[];
  actions?: React.ReactNode;
  className?: string;
}
export declare function VisitCard(props: VisitCardProps): JSX.Element;
