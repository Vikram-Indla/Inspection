"use client";

import { useSyncExternalStore } from "react";

/* Immutability after submit (CR-205 / CR-242 / CR-264 / CR-299 — "cannot be
   edited after submission").

   FactoryVerification and Workspace are SIBLINGS rendered by the server page,
   not parent and child, so they cannot share React state. FactoryVerification's
   lock is therefore computed server-side (`ins.status !== "in_progress"`) and
   only re-evaluates on a fresh server render.

   Submit does not trigger one: finalizeSubmit enqueues to the outbox and flips
   local state without router.refresh(). The result was that after submitting,
   factory verification stayed fully editable for the rest of the session — the
   inspector could keep changing a record the database had already frozen.

   A router.refresh() would be the obvious fix and is the wrong one here: submit
   is asynchronous through the outbox, so at that moment the server still reports
   `in_progress` and the refresh would re-render the surface UNLOCKED, which is
   worse than doing nothing.

   So the lock is latched client-side, per inspection, the instant the inspector
   commits to submitting. It is deliberately one-way: it never unlocks. The
   server-side lock still wins on any later load, and the database remains the
   real guard — this only closes the in-session window. */

const submitted = new Set<string>();
const listeners = new Set<() => void>();

/** Latch this inspection as submitted for the rest of the session. One-way. */
export function markSubmitted(inspectionId: string): void {
  if (submitted.has(inspectionId)) return;
  submitted.add(inspectionId);
  for (const l of listeners) l();
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

/** True once this inspection has been submitted in this session. */
export function useSubmittedInSession(inspectionId: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => submitted.has(inspectionId),
    // Server render knows nothing about a client-only latch; the server-computed
    // lock covers that case, so this is false to keep hydration consistent.
    () => false,
  );
}
