/** Action menu; guard-disabled items show a lock and stay visible (never hidden). */
export interface MenuProps {
  items: { label: React.ReactNode; icon?: React.ReactNode; onClick?: () => void; danger?: boolean; disabled?: boolean; disabledReason?: string }[];
  className?: string;
  style?: React.CSSProperties;
}
export declare function Menu(props: MenuProps): JSX.Element;
