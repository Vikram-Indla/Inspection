import Shell from "@/app/(app)/admin/_components/AdminShell";
import ItemsScreen from "@/components/sections/admin-items/items-screen";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import { loadAdminItems } from "@/features/admin-items/queries";
import { fill, getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";
import { getServerUser, supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export default async function AdminItemsPage({ searchParams }: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [locale, sb, sp] = await Promise.all([getLocale(), supabaseServer(), searchParams]);
  const { data: { user } } = await getServerUser();
  const auditItemId = typeof sp.audit === "string" ? sp.audit : Array.isArray(sp.audit) ? sp.audit[0] ?? null : null;
  const data = await loadAdminItems(sb, user, locale, auditItemId);
  const { adminItems } = getMessages(locale);

  return (
    <Shell current="/admin/items" title={adminItems.title}
      context={
        <>
          <Text as="span" tone="muted" live="status">{fill(adminItems.readAt, { time: data.readAt })}</Text>
          {data.clauseUnavailable ? <> <StatusPill tone="warning">{adminItems.degradedClause}</StatusPill></> : null}
        </>
      }>
      <ItemsScreen data={data} locale={locale} strings={adminItems} />
    </Shell>
  );
}
