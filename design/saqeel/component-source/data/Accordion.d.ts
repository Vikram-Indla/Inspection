export interface AccordionProps {
  sections?: Array<{ title: React.ReactNode; meta?: React.ReactNode; content: React.ReactNode; open?: boolean }>;
}
