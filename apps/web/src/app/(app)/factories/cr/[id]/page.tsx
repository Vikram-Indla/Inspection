import Shell from "@/components/Shell";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import Factory360CrScreen from "@/components/sections/factories/factory360-cr/cr-screen";
import { loadFactory360Cr } from "@/features/factories/cr-dossier/queries";
import { crFreshness, crTitle } from "@/features/factories/cr-dossier/view";
import { getMessages } from "@/i18n/messages";
import { getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function Factory360ByCrPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ license?: string }>;
}) {
  const [{ id }, { license }, locale] = await Promise.all([params, searchParams, getLocale()]);
  const { factoriesCr: t } = getMessages(locale);
  const result = await loadFactory360Cr(id, license);

  if (result.kind === "denied") {
    return <Shell current="/factories" title={t.title}><EmptyState icon="restricted" tone="danger" title={t.permission.title} description={t.permission.body} /></Shell>;
  }
  if (result.kind === "not-found") {
    return <Shell current="/factories" title={t.notFound.title}><EmptyState icon="factory" tone="warning" title={t.notFound.body} description={result.degraded ? t.notFound.neutral : undefined} /></Shell>;
  }

  const { cr, dossier } = result.data;
  const context = (
    <>
      <StatusPill tone="info">{t.badge}</StatusPill>
      <Text as="span" role="label" tone="muted">{crFreshness(dossier.selected?.source_system ?? cr.source_system, dossier.selected?.source_synced_at ?? cr.source_synced_at, t, locale)}</Text>
    </>
  );
  return (
    <Shell current="/factories" title={crTitle(cr, locale)} context={context}>
      <Factory360CrScreen data={result.data} strings={t} locale={locale} />
    </Shell>
  );
}
