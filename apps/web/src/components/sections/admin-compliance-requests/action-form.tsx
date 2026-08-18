"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, type ReactNode } from "react";
import { Text } from "@/components/saqeel/type";
import type { CcrActionResult } from "@/app/(app)/admin/compliance-requests/actions";

export default function ActionForm({ action, children, className, redirectOnCreate = false, savedLabel }: {
  action: (state: CcrActionResult, formData: FormData) => Promise<CcrActionResult>;
  children: ReactNode;
  className?: string;
  redirectOnCreate?: boolean;
  savedLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const router = useRouter();

  useEffect(() => {
    if (redirectOnCreate && state.requestId) router.push(`/admin/compliance-requests/${state.requestId}`);
  }, [redirectOnCreate, router, state.requestId]);

  return (
    <form action={formAction} className={className} aria-busy={pending}>
      {children}
      {state.error ? <Text tone="danger" live="alert">{state.error}</Text> : null}
      {savedLabel && state.ok && !state.requestId ? <Text tone="success" live="status">{savedLabel}</Text> : null}
    </form>
  );
}
