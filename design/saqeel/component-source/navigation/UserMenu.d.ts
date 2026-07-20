export interface UserMenuProps {
  name: string;
  role?: string;
  items?: Array<"sep" | { label: string; icon?: any; danger?: boolean; onSelect?: () => void }>;
}
