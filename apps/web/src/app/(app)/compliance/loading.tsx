import { StateSurface } from "@/components/saqeel/feedback/StateSurface";

export default function ComplianceLoading() {
  return <StateSurface kind="loading" title="Loading Compliance Library" body="Loading the RLS-scoped regulation catalogue and governed dependencies." />;
}
