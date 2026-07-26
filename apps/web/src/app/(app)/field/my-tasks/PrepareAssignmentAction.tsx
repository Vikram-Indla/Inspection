"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { acceptPrepareAssignment, type AssignmentPrepareResult } from "./actions";
import styles from "./my-tasks.module.css";

const INITIAL: AssignmentPrepareResult = { status: "idle" };

export default function PrepareAssignmentAction({
  visitId,
  label,
  working,
}: {
  visitId: string;
  label: string;
  working: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(acceptPrepareAssignment, INITIAL);

  useEffect(() => {
    if (state.status === "success" && state.visitId) {
      router.push(`/field/${state.visitId}#preparation`);
    }
  }, [router, state]);

  return (
    <form action={action} className={styles.itemActionForm}>
      <input type="hidden" name="visit_id" value={visitId} />
      <button type="submit" className="btn btn-secondary btn-sm" disabled={pending}
        aria-describedby={state.status === "error" ? `prepare-error-${visitId}` : undefined}>
        {pending ? working : label}
      </button>
      {state.status === "error" ? (
        <span id={`prepare-error-${visitId}`} role="alert" className="t-caption">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}
