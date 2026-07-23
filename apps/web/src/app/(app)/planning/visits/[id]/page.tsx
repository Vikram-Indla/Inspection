import { notFound } from "next/navigation";
import VisitDetail from "../../../visits/[id]/page";

export const dynamic = "force-dynamic";

export default async function PlanningVisitDetail({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; focus?: string; wa_preview?: string }>;
}) {
  const sp = await searchParams;
  if (process.env.SAQEEL_M2_PREVIEW !== "enabled" || sp.wa_preview !== "1") notFound();

  return VisitDetail({
    params,
    searchParams: Promise.resolve({ ...sp, wa_route_base: "planning" }),
  });
}
