import { redirect } from "next/navigation";

export default async function LegacyEnforcementRoute({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const violation = typeof params.violation === "string" ? params.violation : "";
  redirect(violation
    ? `/enforcement-library?violation=${encodeURIComponent(violation)}`
    : "/enforcement-library");
}
