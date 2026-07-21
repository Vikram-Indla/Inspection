/** Side drawer — labeled dialog with Escape + focus entry/restore; modal variant traps focus. */
export interface DrawerProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** true = focus-trapped modal drawer; false (default) = non-modal contextual panel */
  modal?: boolean;
  children?: React.ReactNode;
  onClose?: () => void;
  className?: string;
}
export declare function Drawer(props: DrawerProps): JSX.Element;
