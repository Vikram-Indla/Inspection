"use client";

import { useActionState, type ReactNode } from "react";
import type { Mvp3ActionState } from "@/app/(app)/admin/mvp3-actions";

export default function Mvp3ActionForm({ action, children, submitLabel }: {
  action: (state: Mvp3ActionState, data: FormData) => Promise<Mvp3ActionState>;
  children: ReactNode;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, { ok: false, message: "" });
  return (
    <form action={formAction} className="stack" style={{ gap: "var(--ax-space-100)" }}>
      {children}
      <button className="btn btn-secondary btn-touch" type="submit" disabled={pending}>
        {pending ? "Working…" : submitLabel}
      </button>
      {state.message ? <p role="status" className={state.ok ? "t-caption" : "ax-banner ax-banner--critical"}>{state.message}</p> : null}
    </form>
  );
}
