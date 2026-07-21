"use client";
// Refresh page action (PLN-REQ-018) — re-runs the server render against the
// latest data without losing the URL-held filter state.
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function RefreshButton({ label, busyLabel }: { label: string; busyLabel: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button type="button" className="ax-btn ax-btn--secondary" disabled={pending}
      onClick={() => startTransition(() => router.refresh())}>
      {pending ? busyLabel : label}
    </button>
  );
}
