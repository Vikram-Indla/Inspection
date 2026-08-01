import { StateSurface } from "@/components/saqeel/feedback/StateSurface";

export default function ComplianceLoading() {
  return <StateSurface kind="loading" title="Loading Inspection Rules" body="Loading the regulation list filtered to your access, with its linked records." />;
}
