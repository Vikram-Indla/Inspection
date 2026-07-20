export interface CommandPaletteProps {
  open?: boolean;
  onClose?: () => void;
  items?: Array<{ label: string; section?: string; icon?: any; meta?: string; kbd?: string; onSelect?: () => void }>;
  placeholder?: string;
}
