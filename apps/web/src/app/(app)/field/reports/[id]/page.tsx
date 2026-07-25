import { notFound, redirect } from "next/navigation";

// The official immutable report already has one governed projection at
// /reports/inspection/[id]. Field detail delegates to it so snapshot,
// acknowledgement and submitted_at can never drift into a second projection.
export default async function FieldReportDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    notFound();
  }
  redirect(`/reports/inspection/${id}`);
}
