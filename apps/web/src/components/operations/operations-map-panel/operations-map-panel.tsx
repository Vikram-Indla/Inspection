import { type ReactNode } from "react";
import { Card, CardHeader, CardMedia } from "@/components/saqeel/card/card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import styles from "./operations-map-panel.module.css";

export default function OperationsMapPanel({ title, description, count, countLabel, children }: {
  title: string;
  description?: string;
  count?: number;
  countLabel?: string;
  children: ReactNode;
}) {
  return (
    <Card as="section" labelledBy="operations-map-panel">
      <CardHeader
        level="h2"
        titleId="operations-map-panel"
        title={title}
        description={description}
        trailing={count === undefined ? undefined : (
          <StatusPill tone="accent" size="sm" ping>{`${count} ${countLabel ?? ""}`.trim()}</StatusPill>
        )}
      />
      <CardMedia height="lg" label={title}>
        <div className={styles.canvas}>{children}</div>
      </CardMedia>
    </Card>
  );
}
