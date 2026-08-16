import AccessScreen from "@/components/sections/admin-access/access-screen/access-screen";
import { loadAdminAccess } from "@/features/admin-access/queries";
import { parseAccessView, parseTargetUser } from "@/features/admin-access/view";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function AccessPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [locale, params, data] = await Promise.all([
    getLocale(),
    searchParams,
    loadAdminAccess(),
  ]);

  return (
    <AccessScreen
      data={data}
      locale={locale}
      targetUserId={parseTargetUser(params.target, data.profiles)}
      view={parseAccessView(params.view)}
    />
  );
}
