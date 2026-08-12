import { type ReactNode } from "react";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import styles from "./factory-location.module.css";
import { Text } from "@/components/saqeel/type";

export default function FactoryLocation({ heading, coords, coordsOwner, geofenceLabel, geofenceValue, hasCoords, noOfficial, children }: {
  heading: string;
  coords: string;
  coordsOwner: string;
  geofenceLabel: string;
  geofenceValue: string;
  hasCoords: boolean;
  noOfficial: string;
  children: ReactNode;
}) {
  return (
    <Card as="section" labelledBy="factory-location-title">
      <CardHeader level="h2" titleId="factory-location-title" title={heading} />
      <CardBody gap="tight">
        <Text tone="secondary" numeric><bdi>{coords}</bdi> <span className={styles.owner}>{coordsOwner}</span></Text>
        <Text tone="muted">{geofenceLabel} {geofenceValue}</Text>
        {hasCoords ? children : <div className={styles.placeholder}><Text tone="muted">{noOfficial}</Text></div>}
      </CardBody>
    </Card>
  );
}
