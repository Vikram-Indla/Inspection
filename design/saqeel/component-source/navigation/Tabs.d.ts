export interface TabsProps {
  tabs?: Array<{ id: string; label: string; count?: number }>;
  value?: string;
  vertical?: boolean;
  onChange?: (id: string) => void;
}
