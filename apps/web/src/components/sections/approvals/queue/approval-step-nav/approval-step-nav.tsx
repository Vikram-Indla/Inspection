import Link from "next/link";
import type { ApprovalStep } from "@/features/approvals/params";
import type { StepState } from "@/features/approvals/rows";
import styles from "./approval-step-nav.module.css";

export type ApprovalStepEntry = {
  readonly state: StepState;
  readonly label: string;
  readonly detail: string;
  readonly href: string;
};

export default function ApprovalStepNav({ entries, current, label }: {
  entries: readonly ApprovalStepEntry[];
  current: ApprovalStep;
  label: string;
}) {
  return (
    <nav className={styles.root} aria-label={label}>
      <ol className={styles.list}>
        {entries.map(entry => (
          <li className={styles.item} key={entry.state.step}>
            <Link
              className={styles.step}
              href={entry.href}
              aria-current={entry.state.step === current ? "step" : undefined}
              data-settled={entry.state.settled ? "" : undefined}
            >
              <span className={styles.label}>{entry.label}</span>
              <span className={styles.detail}>{entry.detail}</span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
