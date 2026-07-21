/** Breadcrumb trail (RTL-aware separators). */
export interface BreadcrumbProps { items: { label: React.ReactNode; href?: string }[]; className?: string; }
export declare function Breadcrumb(props: BreadcrumbProps): JSX.Element;
