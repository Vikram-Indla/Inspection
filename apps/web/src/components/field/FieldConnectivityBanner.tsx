"use client";

import { useEffect, useState } from "react";
import { connectivityState, type ConnectivityState } from "@/lib/offline";

type NetworkInformation = EventTarget & { effectiveType?: string };

function currentConnectivity(): ConnectivityState {
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  return connectivityState(navigator.onLine, connection?.effectiveType);
}

export default function FieldConnectivityBanner({ offline, weak }: { offline: string; weak: string }) {
  const [state, setState] = useState<ConnectivityState | null>(null);

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
    const refresh = () => setState(currentConnectivity());
    refresh();
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    connection?.addEventListener("change", refresh);
    return () => {
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
      connection?.removeEventListener("change", refresh);
    };
  }, []);

  if (state === null || state === "online") return null;
  return (
    <div className="sq-banner sq-banner--warning" role="status">
      {state === "offline" ? offline : weak}
    </div>
  );
}
