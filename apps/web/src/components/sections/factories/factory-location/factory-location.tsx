import { type ReactNode } from "react";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import styles from "./factory-location.module.css";

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
        <p className={styles.coords}><bdi>{coords}</bdi> <span className={styles.owner}>{coordsOwner}</span></p>
        <p className={styles.geofence}>{geofenceLabel} {geofenceValue}</p>
        {hasCoords ? children : <p className={styles.placeholder}>{noOfficial}</p>}
      </CardBody>
    </Card>
  );
}
