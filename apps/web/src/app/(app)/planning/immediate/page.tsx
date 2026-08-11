import Shell from "@/components/Shell";
import ImmediateAccessState from "@/components/sections/planning-immediate/immediate-access-state/immediate-access-state";
import ImmediatePageContext from "@/components/sections/planning-immediate/immediate-page-context/immediate-page-context";
import ImmediateReturnLink from "@/components/sections/planning-immediate/immediate-return-link/immediate-return-link";
import { loadImmediatePlanning, type ImmediatePlanningParams } from "@/features/planning-immediate/queries";
import { immediateFormStrings, immediateMessages, immediateScreenStrings } from "@/features/planning-immediate/strings";
import { getLocale } from "@/lib/i18n";
import ImmediateForm from "./ImmediateForm";

export default async function Immediate({ searchParams }: { searchParams: Promise<ImmediatePlanningParams> }) {
  const params = await searchParams;
  const locale = await getLocale();
  const strings = immediateScreenStrings(locale);
  const planning = await loadImmediatePlanning(params, locale);

  if (planning.kind !== "ready") {
    return <Shell current="/planning" title={strings.title}><ImmediateAccessState /></Shell>;
  }

  return (
    <Shell
      current="/planning"
      title={strings.title}
      context={<ImmediatePageContext handoff={planning.data.handoff} strings={strings} />}
    >
      <ImmediateReturnLink handoff={planning.data.handoff} strings={strings} />
      <ImmediateForm
        data={planning.data}
        locale={locale}
        strings={immediateFormStrings(locale)}
        messages={immediateMessages(locale)}
      />
    </Shell>
  );
}
