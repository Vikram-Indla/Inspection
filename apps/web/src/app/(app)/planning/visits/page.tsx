import { notFound } from "next/navigation";
import Visits from "../../visits/page";

export const dynamic = "force-dynamic";

export default async function PlanningVisits({ searchParams }: {
  searchParams: Promise<{ limit?: string; wa_preview?: string }>;
}) {
  const sp = await searchParams;
  if (process.env.SAQEEL_M2_PREVIEW !== "enabled" || sp.wa_preview !== "1") notFound();

  return Visits({
    searchParams: Promise.resolve({ ...sp, wa_route_base: "planning" }),
  });
}
