import { VisitsMapView } from "../../visits/map/MapView";
import type { VisitMapParams } from "@/features/visits/map";

export default async function PlanningMap({ searchParams }: { searchParams: Promise<VisitMapParams> }) {
  return <VisitsMapView basePath="/planning" params={await searchParams} />;
}
