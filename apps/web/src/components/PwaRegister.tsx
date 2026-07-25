"use client";
import { useEffect, useState } from "react";
import { activateWaitingUpdate, installStaleAssetRecovery, registerFieldServiceWorker } from "@/lib/pwa/client";
import PwaUpdatePrompt from "./PwaUpdatePrompt";

// FND-005: field app survives offline. This component owns the CONTROLLED
// service-worker lifecycle for the whole origin:
//  • Production: register /sw.js. A newly deployed worker installs and WAITS
//    (public/sw.js no longer auto-skipWaiting), so we surface an explicit
//    "update ready" prompt instead of swapping assets under a running session
//    (which caused stale-chunk failures). The user reloads on their terms.
//  • Development: unregister any worker — dev webpack chunks share stable URLs
//    while their content changes, so a cached chunk would poison every reload.
//  • Stale-asset recovery: a ChunkLoadError after a deploy clears Cache Storage
//    (never IndexedDB — drafts/outbox are preserved, SPC-OFF-005) and reloads
//    once. Registration/recovery are production-only, matching the prior
//    contract that the offline field-app guarantee only needs to hold in prod.
export default function PwaRegister() {
  const [waitingReg, setWaitingReg] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const disposeSw = registerFieldServiceWorker(reg => setWaitingReg(reg));
    const disposeRecovery = process.env.NODE_ENV === "production" ? installStaleAssetRecovery() : () => {};
    return () => { disposeSw(); disposeRecovery(); };
  }, []);

  if (!waitingReg) return null;
  return (
    <PwaUpdatePrompt
      onReload={() => activateWaitingUpdate(waitingReg)}
      onDismiss={() => setWaitingReg(null)}
    />
  );
}
