import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import type { AdminGisMessages } from "@/features/admin-gis/strings";
import type { GisLayer } from "@/features/admin-gis-spatial/types";
import type { Locale } from "@/lib/i18n";
import { humaniseEnum } from "@/lib/text";
import styles from "./spatial.module.css";

export default function SpatialLayers({ layers, strings, locale }: {
  layers: readonly GisLayer[];
  strings: AdminGisMessages;
  locale: Locale;
}) {
  const s = strings.spatial;

  return (
    <Card as="section">
      <CardHeader level="h2" title={s.layersTitle} />
      <CardBody>
        <div className={styles.layerList}>
          {layers.map(layer => (
            <div className={styles.layerRow} key={layer.id}>
              <span>
                <Text as="span" role="bodyStrong">{layer.label}</Text>{" "}
                <Text as="span" role="mono" tone="muted">{`· ${humaniseEnum(layer.layer_type, locale)}`}</Text>
              </span>
              <StatusPill tone={layer.active ? "success" : "warning"}>{layer.active ? s.active : s.inactive}</StatusPill>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
