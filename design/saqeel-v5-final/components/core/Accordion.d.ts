/** Content accordion with progress counters (inspection item groups). */
export interface AccordionProps {
  items: { title: React.ReactNode; content: React.ReactNode; progress?: string; defaultOpen?: boolean }[];
  className?: string;
}
export declare function Accordion(props: AccordionProps): JSX.Element;
