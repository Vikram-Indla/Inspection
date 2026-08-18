"use client";

import { useActionState } from "react";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect from "@/components/saqeel/select/select";
import TextInput from "@/components/saqeel/text-input/text-input";
import Button from "@/components/saqeel/button/button";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import { createGisLayer, type GisResult } from "@/app/(app)/admin/gis/spatial/actions";
import type { AdminGisMessages } from "@/features/admin-gis/strings";
import { spatialResultMessage } from "@/features/admin-gis-spatial/strings";
import styles from "./spatial.module.css";

export default function SpatialCreateLayer({ strings, canCreate }: {
  strings: AdminGisMessages;
  canCreate: boolean;
}) {
  const [state, action, pending] = useActionState<GisResult, FormData>(createGisLayer, {});
  const c = strings.spatial.create;

  if (!canCreate) {
    return (
      <Card as="section">
        <CardHeader level="h3" title={c.title} />
        <CardBody><Text tone="warning" role="bodyStrong" live="status">{c.viewOnly}</Text></CardBody>
      </Card>
    );
  }

  return (
    <Card as="section">
      <CardHeader level="h3" title={c.title} />
      <CardBody>
        <form action={action} className={styles.form}>
          <div className={styles.formGrid}>
            <Field label={c.key} htmlFor="sp-key">
              <TextInput id="sp-key" name="layer_key" required placeholder={c.keyPlaceholder} />
            </Field>
            <Field label={c.label} htmlFor="sp-label">
              <TextInput id="sp-label" name="label" required placeholder={c.labelPlaceholder} />
            </Field>
            <Field label={c.type} htmlFor="sp-type">
              <SaqeelSelect
                id="sp-type"
                name="layer_type"
                label={c.type}
                defaultValue="overlay"
                required
                options={[
                  { value: "overlay", label: c.typeOverlay },
                  { value: "base", label: c.typeBase },
                  { value: "boundary", label: c.typeBoundary },
                  { value: "heat", label: c.typeHeat },
                  { value: "route", label: c.typeRoute },
                ]}
              />
            </Field>
          </div>
          <div className={styles.formActions}>
            <Button type="submit" variant="primary" disabled={pending}>{pending ? c.submitting : c.submit}</Button>
            {state.error ? <Text tone="danger" role="label" live="alert">{spatialResultMessage(state.error, strings)}</Text> : null}
            {state.ok ? <StatusPill tone="success">{c.created}</StatusPill> : null}
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
