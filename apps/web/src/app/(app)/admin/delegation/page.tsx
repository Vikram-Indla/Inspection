import DelegationScreen from "@/components/sections/admin-delegation/delegation-screen";
import { loadDelegation } from "@/features/admin-delegation/queries";
import { DELEGATION_VIEWS, type DelegationViewKey } from "@/features/admin-delegation/types";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

function resolveView(raw: string | string[] | undefined): DelegationViewKey {
  return typeof raw === "string" && (DELEGATION_VIEWS as readonly string[]).includes(raw)
    ? raw as DelegationViewKey
    : "active";
}

export default async function DelegationPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const view = resolveView((await searchParams).view);
  const [locale, data] = await Promise.all([getLocale(), loadDelegation(view)]);
  return <DelegationScreen view={view} data={data} locale={locale} />;
}
