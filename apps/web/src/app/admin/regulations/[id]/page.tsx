import Regulations from "../page";

export const dynamic = "force-dynamic";

export default async function RegulationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return Regulations({ searchParams: Promise.resolve({ id }) });
}
