import { redirect } from "next/navigation";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// CD-028 — post-start navigation bridge for Next 15. The Server Action must
// leave the already-current pathname before returning to the authoritative
// server-rendered workspace; otherwise the router can keep the pending form.
export default async function ReviewStarted({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ review?: string }>;
}) {
  const [{ id }, { review }] = await Promise.all([params, searchParams]);
  const query = review && UUID.test(review) ? `?review=${review}` : "";
  redirect(`/reviews/${id}${query}`);
}
