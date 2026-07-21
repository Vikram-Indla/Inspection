export interface PageHeaderProps {
  breadcrumb?: React.ReactNode;
  title: React.ReactNode;
  /** identifiers, status badge, last-updated */
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  tabs?: React.ReactNode;
}
