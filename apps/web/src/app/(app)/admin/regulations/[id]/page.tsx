import Regulations from "../page";

export default async function RegulationDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return Regulations({ searchParams: Promise.resolve({ id }) });
}
