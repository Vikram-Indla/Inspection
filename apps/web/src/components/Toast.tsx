/**
 * Shared toast region. The .sq-toast/.sq-toast-region CSS existed but had no
 * real consumer anywhere in the app before this. Auto-dismisses after `durationMs`.
 */
"use client";
import { useEffect } from "react";

export type ToastItem = { id: string; tone: "success" | "error"; message: string };

type ToastRegionProps = {
  items: ToastItem[];
  onDismiss: (id: string) => void;
  durationMs?: number;
};

export default function ToastRegion({ items, onDismiss, durationMs = 4000 }: ToastRegionProps) {
  return (
    <div className="sq-toast-region" aria-live="polite">
      {items.map(item => (
        <ToastEntry key={item.id} item={item} onDismiss={onDismiss} durationMs={durationMs} />
      ))}
    </div>
  );
}

function ToastEntry({ item, onDismiss, durationMs }: { item: ToastItem; onDismiss: (id: string) => void; durationMs: number }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(item.id), durationMs);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);
  return (
    <div className={`sq-toast sq-toast--${item.tone}`} role="status">{item.message}</div>
  );
}
