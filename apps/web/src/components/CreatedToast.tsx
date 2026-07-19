"use client";
// J-20 — success confirmation after planning/immediate creates a visit (and,
// for unregistered establishments, the unlicensed-establishment record). The
// server action redirects here with ?created=... since Next's redirect()
// fires before useActionState's client result would ever carry this.
import { useState } from "react";
import ToastRegion, { type ToastItem } from "@/components/Toast";

export default function CreatedToast({ created, registeredMessage, unregisteredMessage }: { created: string | undefined; registeredMessage: string; unregisteredMessage: string }) {
  const [items, setItems] = useState<ToastItem[]>(
    created ? [{ id: "created", tone: "success", message: created === "unregistered" ? unregisteredMessage : registeredMessage }] : []
  );
  if (!created) return null;
  return <ToastRegion items={items} onDismiss={id => setItems(prev => prev.filter(i => i.id !== id))} />;
}
