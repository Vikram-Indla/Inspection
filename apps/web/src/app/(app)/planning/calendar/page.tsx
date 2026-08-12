import { VisitsCalendarView } from "../../visits/calendar/CalendarView";
import type { CalendarParams } from "@/features/visits/calendar";

export default async function PlanningCalendar({ searchParams }: { searchParams: Promise<CalendarParams> }) {
  return <VisitsCalendarView basePath="/planning" params={await searchParams} />;
}
