export interface MenuProps {
  trigger: any;
  items?: Array<"sep" | { label: string; heading?: boolean; icon?: any; danger?: boolean; disabled?: boolean; onSelect?: () => void }>;
  align?: "start" | "end";
}
