import Shell from "@/components/Shell";
import EmptyState from "@/components/EmptyState";

export default function Loading() {
  return (
    <Shell current="/field" title="Field dashboard">
      <EmptyState glyph="…" title="Loading dashboard"
        body="Fetching your assigned visits, review outcomes and submission history (SCR-IPAD-600 · RBAC-009)." />
    </Shell>
  );
}
