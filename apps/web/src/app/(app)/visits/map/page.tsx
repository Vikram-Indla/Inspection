import { VisitsMapView } from "./MapView";
import type { VisitMapParams } from "@/features/visits/map";

export default async function VisitsMap({ searchParams }: { searchParams: Promise<VisitMapParams> }) {
  return <VisitsMapView params={await searchParams} />;
}
