import Link from "next/link";
import { groupBreakdown, stepComponents } from "@/features/compliance/presentation";
import { approvalsHref } from "@/features/compliance/scope";
import { APPROVAL_STEPS, type ApprovalStep, type ApprovalsView } from "@/features/compliance/types";
import { fill, type Messages } from "@/i18n/messages";
import styles from "./approvals-progress.module.css";

type ApprovalsMessages = Messages["compliance"]["approvals"];

function stepState(view: ApprovalsView, step: ApprovalStep, messages: ApprovalsMessages): { text: string; done: boolean } {
  const steps = messages.steps;
  if (step === "overview") return { text: steps.read, done: true };
  if (step === "summary") {
    return view.allDecided ? { text: steps.ready, done: true } : { text: steps.pending, done: false };
  }
  const scoped = stepComponents(view.selectedComponents, step);
  if (!scoped.length) return { text: steps.none, done: true };
  const breakdown = groupBreakdown(scoped);
  return {
    text: fill(messages.requests.decided, { done: breakdown.decided, total: breakdown.total }),
    done: breakdown.pending === 0,
  };
}

export default function ApprovalsProgress({ view, messages }: {
  view: ApprovalsView;
  messages: ApprovalsMessages;
}) {
  return (
    <nav className={styles.track} aria-label={messages.steps.label}>
      {APPROVAL_STEPS.map(step => {
        const state = stepState(view, step, messages);
        return (
          <Link
            className={styles.step}
            key={step}
            href={approvalsHref(view.scope, { step: step === "overview" ? null : step })}
            aria-current={view.scope.step === step ? "page" : undefined}
            prefetch={false}
          >
            <span className={styles.label}>{messages.steps[step]}</span>
            <span className={styles.state} data-done={state.done ? "" : undefined}>{state.text}</span>
          </Link>
        );
      })}
    </nav>
  );
}
