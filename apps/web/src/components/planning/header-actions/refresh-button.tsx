"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import IconButton from "@/components/saqeel/icon-button/icon-button";

export default function RefreshButton({ label, busyLabel }: { label: string; busyLabel: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <IconButton
      icon="refresh"
      label={pending ? busyLabel : label}
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
    />
  );
}
