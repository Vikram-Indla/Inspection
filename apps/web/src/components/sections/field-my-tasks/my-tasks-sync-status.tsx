"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/saqeel/button/button";
import StatusPill from "@/components/saqeel/status-pill/status-pill";

export default function MyTasksSyncStatus({ onlineLabel, offlineLabel, syncLabel, syncingLabel }: {
  onlineLabel: string;
  offlineLabel: string;
  syncLabel: string;
  syncingLabel: string;
}) {
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <>
      <StatusPill tone={online ? "success" : "warning"}>
        {online ? onlineLabel : offlineLabel}
      </StatusPill>
      <Button
        variant="tertiary"
        size="sm"
        icon="refresh"
        disabled={!online || pending}
        busy={pending}
        onClick={() => startTransition(() => router.refresh())}
      >
        {pending ? syncingLabel : syncLabel}
      </Button>
    </>
  );
}
