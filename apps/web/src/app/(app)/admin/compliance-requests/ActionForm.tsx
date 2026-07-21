"use client";

import { useActionState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { CcrActionResult } from "./actions";

export default function ActionForm({ action, children, className, redirectOnCreate = false }: {
  action: (state: CcrActionResult, formData: FormData) => Promise<CcrActionResult>;
  children: ReactNode;
  className?: string;
  redirectOnCreate?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const router = useRouter();
  useEffect(() => {
    if (redirectOnCreate && state.requestId) router.push(`/admin/compliance-requests/${state.requestId}`);
  }, [redirectOnCreate, router, state.requestId]);
  return (
    <form action={formAction} className={className} aria-busy={pending}>
      {children}
      {state.error ? <p className="t-caption ccr-error" role="alert">{state.error}</p> : null}
      {state.ok && !state.requestId ? <p className="t-caption ccr-success" role="status">Saved.</p> : null}
    </form>
  );
}
