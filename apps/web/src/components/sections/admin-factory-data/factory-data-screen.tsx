import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Button from "@/components/saqeel/button/button";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import { adminFactoryDataMessages } from "@/features/admin-factory-data/strings";
import type { FactoryDataView } from "@/features/admin-factory-data/types";
import type { Locale } from "@/lib/i18n";
import CsvImport from "./csv-import";
import FactoryHistory from "./factory-history";
import MasterDataPanel from "./master-data-panel";
import styles from "./factory-data.module.css";

export default function FactoryDataScreen({ data, locale }: { data: FactoryDataView; locale: Locale }) {
  const strings = adminFactoryDataMessages(locale);
  const p = strings.provider;

  return (
    <ShellPageFrame
      breadcrumbLabel={strings.breadcrumb.label}
      breadcrumbs={[
        { label: strings.breadcrumb.administration, href: "/admin" },
        { label: strings.breadcrumb.hub, href: "/admin/integrations" },
        { label: strings.breadcrumb.factory },
      ]}
      title={strings.title}
    >
      <div className={styles.stack}>
        <Card as="section" role="note">
          <CardHeader level="h2" title={strings.banner.title} />
          <CardBody><Text tone="secondary">{strings.banner.body}</Text></CardBody>
        </Card>

        <div className={styles.split}>
          <Card as="section">
            <CardHeader level="h3" title={p.title} trailing={<StatusPill tone="warning">{p.status}</StatusPill>} />
            <CardBody gap="tight">
              <Text role="label" tone="muted">{p.noRemoteCall}</Text>
              <Text role="label" tone="muted">{p.help}</Text>
              <Button href="/admin/integrations/senai-data?tab=endpoints" variant="link" size="sm">{p.link}</Button>
            </CardBody>
          </Card>
          <CsvImport strings={strings} />
        </div>

        <MasterDataPanel data={data} strings={strings} locale={locale} />
        <FactoryHistory data={data} strings={strings} locale={locale} />
      </div>
    </ShellPageFrame>
  );
}
