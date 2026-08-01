import { StateSurface } from "@/components/saqeel/feedback/StateSurface";

export default function EnforcementLibraryLoading() {
  return <StateSurface kind="loading" title="Loading Violations & Penalties" body="Loading the violations, penalties, and action forms you can access." />;
}
