"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Button from "@/components/saqeel/button/button";

export default function RefreshButton({ label, busyLabel }: { label: string; busyLabel: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button variant="secondary" disabled={pending} onClick={() => startTransition(() => router.refresh())}>
      {pending ? busyLabel : label}
    </Button>
  );
}
