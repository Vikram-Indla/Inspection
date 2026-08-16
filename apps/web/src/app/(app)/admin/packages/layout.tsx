import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import PackagesDenied from "@/components/sections/admin-packages/packages-denied/packages-denied";
import { canReadPackages } from "@/features/admin-packages/queries";
import { getLocale } from "@/lib/i18n";
import { getServerUser } from "@/lib/supabase-server";

export default async function PackagesLayout({ children }: { children: ReactNode }) {
  const { data: { user }, error } = await getServerUser();
  if (!user || error?.name === "AuthSessionMissingError") redirect("/login");
  if (await canReadPackages()) return children;
  return <PackagesDenied locale={await getLocale()} />;
}
