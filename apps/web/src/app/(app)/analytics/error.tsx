"use client";
import { StateSurface } from "@/components/saqeel";
export default function AnalyticsError({ reset }: { error: Error; reset: () => void }) {
  return <StateSurface kind="error" action={<button className="btn btn-secondary" onClick={reset}>Try again</button>} />;
}
