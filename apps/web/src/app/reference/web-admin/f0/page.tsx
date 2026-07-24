import { notFound } from "next/navigation";
import { ReferenceRenderer } from "@/components/saqeel/ReferenceRenderer";

export const dynamic = "force-dynamic";

export default function WebAdminF0ReferencePage() {
  if (process.env.SAQEEL_F0_REFERENCE_RENDERER !== "enabled") notFound();
  return <ReferenceRenderer />;
}
