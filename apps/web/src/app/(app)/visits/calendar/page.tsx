import { VisitsCalendarView } from "./CalendarView";
import type { CalendarParams } from "@/features/visits/calendar";

export default async function VisitsCalendar({ searchParams }: { searchParams: Promise<CalendarParams> }) {
  return <VisitsCalendarView params={await searchParams} />;
}
