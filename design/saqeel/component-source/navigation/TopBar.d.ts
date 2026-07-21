export interface TopBarProps {
  /** leading slot: collapse toggle, breadcrumb */
  start?: React.ReactNode;
  /** global search input */
  search?: React.ReactNode;
  /** trailing slot: notifications, language, theme, user menu */
  end?: React.ReactNode;
  children?: React.ReactNode;
}
