/** In-page tabs with roving focus, RTL-aware arrows, Home/End and linked panels. */
export interface TabsProps {
  tabs: string[];
  value?: string;
  defaultValue?: string;
  onChange?: (tab: string) => void;
  children?: React.ReactNode;
  ariaLabel?: string;
  className?: string;
}
export declare function Tabs(props: TabsProps): JSX.Element;

/** Route navigation uses ordinary links with aria-current; it never uses tab roles. */
export interface RouteTabsProps {
  items: { label: React.ReactNode; href: string }[];
  current?: string;
  ariaLabel?: string;
  className?: string;
}
export declare function RouteTabs(props: RouteTabsProps): JSX.Element;
