import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import { Card, CardBody } from "@/components/saqeel/card/card";
import SegmentedControl, { type SegmentedItem } from "@/components/saqeel/segmented-control/segmented-control";
import { Text } from "@/components/saqeel/type";
import { adminSenaiDataMessages, SENAI_TABS, type SenaiTab } from "@/features/admin-senai-data/strings";
import type { SenaiDataView } from "@/features/admin-senai-data/types";
import { getMessages } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import SenaiEndpoints from "./senai-endpoints";
import SenaiMapping from "./senai-mapping";
import SenaiReconcile from "./senai-reconcile";
import SenaiSources from "./senai-sources";
import styles from "./senai-data.module.css";

export default function SenaiDataScreen({ tab, data, locale }: {
  tab: SenaiTab;
  data: SenaiDataView;
  locale: Locale;
}) {
  const strings = adminSenaiDataMessages(locale);
  const na = getMessages(locale).common.state.na;
  const tabItems: readonly SegmentedItem<SenaiTab>[] = SENAI_TABS.map(key => ({
    value: key,
    label: strings.tabs[key],
    href: `/admin/integrations/senai-data?tab=${key}`,
  }));
  const holds = data.writeBackEndpoints === 0;

  return (
    <ShellPageFrame
      breadcrumbLabel={strings.breadcrumb.label}
      breadcrumbs={[
        { label: strings.breadcrumb.administration, href: "/admin" },
        { label: strings.breadcrumb.hub, href: "/admin/integrations" },
        { label: strings.breadcrumb.senai },
      ]}
      title={strings.title}
    >
      <div className={styles.stack}>
        <SegmentedControl items={tabItems} value={tab} label={strings.tabs.label} tone="accent" />

        <Card as="section" role="note">
          <CardBody>
            <Text tone="secondary">
              {`${strings.fnd007.lead} `}
              <Text as="strong" role="bodyStrong" tone={holds ? "success" : "danger"}>
                {holds ? strings.fnd007.holds : strings.fnd007.breach}
              </Text>
              {` ${strings.fnd007.snapshot}`}
            </Text>
          </CardBody>
        </Card>

        {tab === "sources" ? <SenaiSources data={data} strings={strings} locale={locale} /> : null}
        {tab === "endpoints" ? <SenaiEndpoints data={data} strings={strings} locale={locale} /> : null}
        {tab === "mapping" ? <SenaiMapping strings={strings} na={na} /> : null}
        {tab === "reconcile" ? <SenaiReconcile data={data} strings={strings} locale={locale} /> : null}
      </div>
    </ShellPageFrame>
  );
}
