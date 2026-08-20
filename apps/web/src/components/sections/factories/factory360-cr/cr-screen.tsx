import EmptyState from "@/components/saqeel/empty-state/empty-state";
import FactoryWorkspace from "@/components/sections/factories/factory-workspace/factory-workspace";
import type { Factory360CrData } from "@/features/factories/cr-dossier/queries";
import { makeCrFormatters, type CrStrings } from "@/features/factories/cr-dossier/view";
import type { Locale } from "@/lib/i18n";
import CrContextRail from "./cr-context-rail";
import CrLicenseRail from "./cr-license-rail";
import CrCompliance from "./panels/cr-compliance";
import CrDocuments from "./panels/cr-documents";
import CrIndustrial from "./panels/cr-industrial";
import CrInspections from "./panels/cr-inspections";
import CrPermits from "./panels/cr-permits";
import CrProvenance from "./panels/cr-provenance";
import CrRegistry from "./panels/cr-registry";
import CrSelected from "./panels/cr-selected";

export default function Factory360CrScreen({ data, strings, locale }: {
  data: Factory360CrData;
  strings: CrStrings;
  locale: Locale;
}) {
  const fmt = makeCrFormatters(locale, strings);
  const { dossier, aiProviderState, visits, visitsFailed, timeline, timelineFailed } = data;

  return (
    <FactoryWorkspace
      startLabel={strings.licenses.heading}
      endLabel={strings.context.heading}
      top={dossier.licenseError ? <EmptyState variant="inline" tone="warning" title={strings.licenses.degraded} size="sm" /> : undefined}
      start={<CrLicenseRail dossier={dossier} fmt={fmt} strings={strings} locale={locale} />}
      end={<CrContextRail dossier={dossier} aiProviderState={aiProviderState} fmt={fmt} strings={strings} locale={locale} />}
    >
      <CrRegistry dossier={dossier} fmt={fmt} strings={strings} />
      <CrSelected dossier={dossier} visits={visits} visitsFailed={visitsFailed} fmt={fmt} strings={strings} />
      <CrCompliance dossier={dossier} fmt={fmt} strings={strings} locale={locale} />
      <CrInspections dossier={dossier} fmt={fmt} strings={strings} locale={locale} />
      <CrIndustrial dossier={dossier} fmt={fmt} strings={strings} locale={locale} />
      <CrPermits dossier={dossier} fmt={fmt} strings={strings} />
      <CrDocuments dossier={dossier} fmt={fmt} strings={strings} locale={locale} />
      <CrProvenance dossier={dossier} timeline={timeline} timelineFailed={timelineFailed} fmt={fmt} strings={strings} locale={locale} />
    </FactoryWorkspace>
  );
}
