import { StateSurface } from "@/components/saqeel/feedback/StateSurface";

export default function ExecutionLoading() {
  return <StateSurface kind="loading" title="Loading Execution" body="Loading the governed calendar, assignments, and operational states in your scope." />;
}
