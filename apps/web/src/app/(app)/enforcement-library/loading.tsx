import { StateSurface } from "@/components/saqeel/feedback/StateSurface";

export default function EnforcementLibraryLoading() {
  return <StateSurface kind="loading" title="Loading Enforcement Library" body="Loading RLS-visible violations, penalties, and action forms." />;
}
