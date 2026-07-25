"use client";

import { useActionState, type ReactNode } from "react";
import type { DashConfigActionResult } from "./actions";

export default function ActionForm({ action, children, className }: {
  action: (state: DashConfigActionResult, formData: FormData) => Promise<DashConfigActionResult>;
  children: ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className={className} aria-busy={pending}>
      {children}
      {state.error ? <p className="t-caption" role="alert" style={{ color: "var(--status-critical-text)", marginBlockStart: 8 }}>{state.error}</p> : null}
      {state.ok ? <p className="t-caption" role="status" style={{ color: "var(--status-compliant-text)", marginBlockStart: 8 }}>Saved.</p> : null}
    </form>
  );
}
