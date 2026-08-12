import Shell from "@/components/Shell";
import CreatedToast from "@/components/CreatedToast";
import VisitDetail from "@/components/visits/visit-detail/visit-detail";
import VisitDetailUnavailable from "@/components/visits/visit-detail/visit-detail-unavailable";
import { loadVisitDetail } from "@/features/visits/detail/queries";
import { buildVisitDetailStrings } from "@/features/visits/detail/strings";
import { buildActionBarProps, visitAttachmentRows } from "@/features/visits/detail/view";
import { getMessages } from "@/i18n/messages";
import { useT } from "@/lib/i18n";
import ActionBar from "./ActionBar";
import Attachments from "./Attachments";
import NotesEditor from "./NotesEditor";

export default async function VisitDetailRoute({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; focus?: string; wa_route_base?: string }>;
}) {
  const { created, wa_route_base } = await searchParams;
  const { t, locale } = await useT();
  const V = getMessages(locale).visits;
  const current = wa_route_base === "planning" ? "/planning" : "/visits";
  const page = await loadVisitDetail((await params).id);
  if (page.kind !== "ready") return <VisitDetailUnavailable current={current} kind={page.kind} strings={V.detail} />;
  const data = page.data;
  const enumLabel = (value: string) => t(`enum.${value}`, value.replace(/_/g, " "));
  const strings = buildVisitDetailStrings(locale, enumLabel);
  const title = V.detail.title
    .replace("{id}", data.visit.id.slice(0, 8))
    .replace("{factory}", data.visit.factories?.name ?? "—");
  return (
    <Shell current={current} title={title}>
      <CreatedToast created={created} registeredMessage={V.detail.createdToast} unregisteredMessage={V.detail.createdToastUnregistered} />
      <VisitDetail
        data={data}
        locale={locale}
        enumLabel={enumLabel}
        actions={<ActionBar {...buildActionBarProps(data, locale, enumLabel)} strings={strings.actionStrings} />}
        notes={<NotesEditor visitId={data.visit.id} planningVersion={data.visit.planning_version} initialNotes={data.visit.notes ?? ""} strings={strings.notesStrings} />}
        attachments={<Attachments visitId={data.visit.id} rows={visitAttachmentRows(data, locale)} strings={strings.attachmentsStrings} />}
      />
    </Shell>
  );
}
