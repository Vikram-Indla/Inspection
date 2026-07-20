/** Wizard stepper with done / active / blocked states. */
export interface StepperProps {
  steps: { label: React.ReactNode; state?: "done" | "active" | "blocked" }[];
  className?: string;
}
export declare function Stepper(props: StepperProps): JSX.Element;
