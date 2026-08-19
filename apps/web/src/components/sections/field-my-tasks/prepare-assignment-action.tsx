"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { acceptPrepareAssignment, type AssignmentPrepareResult } from "@/app/(app)/field/my-tasks/actions";
import Button from "@/components/saqeel/button/button";
import { Text } from "@/components/saqeel/type";
import styles from "./my-tasks.module.css";

const INITIAL: AssignmentPrepareResult = { status: "idle" };

export default function PrepareAssignmentAction({ visitId, label, working }: {
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
    <form action={action} className={styles.itemActions}>
      <input type="hidden" name="visit_id" value={visitId} />
      <Button
        type="submit"
        variant="secondary"
        size="sm"
        disabled={pending}
        busy={pending}
        describedBy={state.status === "error" ? `prepare-error-${visitId}` : undefined}
      >
        {pending ? working : label}
      </Button>
      {state.status === "error" ? (
        <Text role="label" tone="danger" live="alert" id={`prepare-error-${visitId}`}>
          {state.message}
        </Text>
      ) : null}
    </form>
  );
}
