import { type ReactNode } from "react";
import { Card, CardHeader, CardMedia } from "@/components/saqeel/card/card";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import styles from "./operations-map-panel.module.css";

export default function OperationsMapPanel({ title, description, count, countLabel, action, children }: {
  title: string;
  description?: string;
  count?: number;
  countLabel?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card as="section" labelledBy="operations-map-panel">
      <CardHeader
        level="h2"
        titleId="operations-map-panel"
        title={title}
        description={description}
        trailing={count === undefined && !action ? undefined : (
          <>
            {count === undefined ? null : (
              <StatusPill tone="neutral" ping={false}>{`${count} ${countLabel ?? ""}`.trim()}</StatusPill>
            )}
            {action}
          </>
        )}
      />
      <CardMedia height="lg" label={title}>
        <div className={styles.canvas}>{children}</div>
      </CardMedia>
    </Card>
  );
}
