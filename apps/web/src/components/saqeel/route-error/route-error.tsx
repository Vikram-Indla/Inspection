"use client";
import Button from "../button/button";
import { Card, CardBody, CardFooter, CardHeader } from "../card/card";
import EmptyState from "../empty-state/empty-state";
import styles from "./route-error.module.css";

export type RouteErrorProps = {
  title: string;
  body: string;
  retryLabel: string;
  reference?: string;
  referenceLabel?: string;
  onRetry: () => void;
};

/**
 * The surface a route's `error.tsx` renders.
 *
 * A thrown page never renders its own `Shell`, so an error boundary sits
 * directly inside the app layout with **no page inset** — which is why an
 * unstyled boundary appears welded to the viewport edges. This carries the
 * inset itself rather than relying on a wrapper that is not there.
 */
export default function RouteError({
  title, body, retryLabel, reference, referenceLabel, onRetry,
}: RouteErrorProps) {
  return (
    <div className={styles.root}>
      <Card as="section" labelledBy="route-error">
        <CardHeader level="h2" titleId="route-error" title={title} />
        <CardBody gap="tight">
          <EmptyState tone="danger" title={body} size="sm" />
          {reference ? (
            <p className={styles.reference}>
              {referenceLabel ? `${referenceLabel} ` : null}
              <bdi className={styles.code}>{reference}</bdi>
            </p>
          ) : null}
        </CardBody>
        <CardFooter>
          <Button variant="secondary" onClick={onRetry} label={retryLabel}>{retryLabel}</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
