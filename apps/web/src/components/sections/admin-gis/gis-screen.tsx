import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { Text } from "@/components/saqeel/type";
import { adminGisMessages } from "@/features/admin-gis/strings";
import type { GisView } from "@/features/admin-gis/types";
import type { Locale } from "@/lib/i18n";
import GisSettings from "./gis-settings";
import GisStudio from "./gis-studio";
import styles from "./gis.module.css";

export default function GisScreen({ data, locale }: { data: GisView; locale: Locale }) {
  const strings = adminGisMessages(locale);

  return (
    <ShellPageFrame
      breadcrumbLabel={strings.breadcrumb.label}
      breadcrumbs={[
        { label: strings.breadcrumb.administration, href: "/admin" },
        { label: strings.breadcrumb.hub },
      ]}
      description={strings.subtitle}
      title={strings.title}
      actions={data.versionLabel ? <Text as="span" role="mono" tone="muted">{data.versionLabel}</Text> : undefined}
    >
      <div className={styles.studio}>
        <Card as="section" role="note">
          <CardHeader level="h2" title={strings.banner.title} />
          <CardBody><Text tone="secondary">{strings.banner.body}</Text></CardBody>
        </Card>

        {data.failed ? (
          <Card as="section" role="alert">
            <CardHeader level="h2" title={strings.error.title} />
            <CardBody><Text tone="secondary">{strings.error.body}</Text></CardBody>
          </Card>
        ) : data.factories.length === 0 ? (
          <EmptyState icon="map" title={strings.empty.title} description={strings.empty.body} />
        ) : (
          <>
            <GisStudio strings={strings} factories={data.factories} settings={data.settings} canEdit={data.canEdit} />
            <GisSettings strings={strings} settings={data.settings} />
          </>
        )}
      </div>
    </ShellPageFrame>
  );
}
