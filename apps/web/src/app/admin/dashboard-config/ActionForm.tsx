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
      {state.error ? <p className="ax-caption" role="alert">{state.error}</p> : null}
      {state.ok ? <p className="ax-caption" role="status">Saved.</p> : null}
    </form>
  );
}
