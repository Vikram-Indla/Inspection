export interface ChecklistQuestionProps {
  number: string | number;
  question: string;
  requirement?: string;
  value?: "compliant" | "violation" | "na";
  onChange?: (v: string) => void;
  note?: string;
  onNote?: () => void;
  evidenceCount?: number;
  onEvidence?: () => void;
  readOnly?: boolean;
}
