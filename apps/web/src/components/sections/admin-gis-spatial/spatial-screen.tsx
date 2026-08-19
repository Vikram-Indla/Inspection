import ShellPageFrame from "@/components/app-shell/shell-page-frame/shell-page-frame";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import { NotYetBoundary } from "@/components/NotYetBoundary";
import { Text } from "@/components/saqeel/type";
import { adminGisMessages } from "@/features/admin-gis/strings";
import type { SpatialView } from "@/features/admin-gis-spatial/types";
import type { Locale } from "@/lib/i18n";
import SpatialCreateLayer from "./spatial-create-layer";
import SpatialLayers from "./spatial-layers";
import styles from "./spatial.module.css";

export default function SpatialScreen({ data, locale }: { data: SpatialView; locale: Locale }) {
  const gis = adminGisMessages(locale);
  const s = gis.spatial;
  const breadcrumbs = [
    { label: gis.breadcrumb.administration, href: "/admin" },
    { label: gis.breadcrumb.hub, href: "/admin/gis" },
    { label: s.title },
  ];

  if (!data.enabled) {
    return (
      <ShellPageFrame breadcrumbLabel={gis.breadcrumb.label} breadcrumbs={breadcrumbs} description={s.subtitle} title={s.title}>
        <NotYetBoundary
          title={s.title}
          consequence={s.off.consequence}
          seam="FEATURE_SPATIAL_CANVAS=off + Mapbox held"
          notAvailableLabel={s.off.notAvailable}
          detailLabel={s.off.whyPrereq}
        />
      </ShellPageFrame>
    );
  }

  return (
    <ShellPageFrame breadcrumbLabel={gis.breadcrumb.label} breadcrumbs={breadcrumbs} description={s.subtitle} title={s.title}>
      <div className={styles.stack}>
        <Card as="section" role="note">
          <CardHeader level="h2" title={s.banner.title} />
          <CardBody><Text tone="secondary">{s.banner.body}</Text></CardBody>
        </Card>

        {data.failed ? (
          <Card as="section" role="alert"><CardHeader level="h2" title={s.error} /></Card>
        ) : null}

        <SpatialCreateLayer strings={gis} canCreate={data.canCreate} />

        {data.layers.length === 0 && data.locations.length === 0 ? (
          <EmptyState icon="map" title={s.emptyTitle} description={s.emptyBody} />
        ) : data.layers.length > 0 ? (
          <SpatialLayers layers={data.layers} strings={gis} locale={locale} />
        ) : null}
      </div>
    </ShellPageFrame>
  );
}
