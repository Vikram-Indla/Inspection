"use client";

import { useEffect, useState } from "react";
import { Text } from "@/components/saqeel/type";
import { connectivityState, type ConnectivityState } from "@/lib/offline";
import styles from "./reports.module.css";

type NetworkInformation = EventTarget & { effectiveType?: string };

function currentConnectivity(): ConnectivityState {
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  return connectivityState(navigator.onLine, connection?.effectiveType);
}

export default function ReportsConnectivity({ offline, weak }: { offline: string; weak: string }) {
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
    <div className={styles.banner} role="status" aria-live="polite">
      <Text role="label" tone="warning">{state === "offline" ? offline : weak}</Text>
    </div>
  );
}
