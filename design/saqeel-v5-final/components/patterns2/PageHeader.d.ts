/** Page header — breadcrumb + 24/32 title + status chips + bdi-isolated reference + one primary action. */
export interface PageHeaderProps {
  breadcrumb?: { label: React.ReactNode; href?: string }[];
  title: React.ReactNode;
  chips?: React.ReactNode;
  reference?: string;
  actions?: React.ReactNode;
  className?: string;
}
export declare function PageHeader(props: PageHeaderProps): JSX.Element;
