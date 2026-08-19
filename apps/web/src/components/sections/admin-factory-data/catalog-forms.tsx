"use client";

import { useActionState } from "react";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect from "@/components/saqeel/select/select";
import TextInput from "@/components/saqeel/text-input/text-input";
import Choice from "@/components/saqeel/choice/choice";
import Button from "@/components/saqeel/button/button";
import { mutateFactoryMasterData, type FactoryDataResult } from "@/app/(app)/admin/integrations/factory-data/actions";
import type { AdminFactoryDataMessages } from "@/features/admin-factory-data/strings";
import FormResult from "./form-result";
import styles from "./factory-data.module.css";

export function ProductForm({ factoryId, strings }: {
  factoryId: string;
  strings: AdminFactoryDataMessages;
}) {
  const [state, action, pending] = useActionState<FactoryDataResult, FormData>(mutateFactoryMasterData, {});
  const p = strings.masterData.product;

  return (
    <Card as="section">
      <CardHeader level="h3" title={p.title} />
      <CardBody>
        <form action={action} className={styles.formBody}>
          <input type="hidden" name="factory_id" value={factoryId} />
          <input type="hidden" name="operation" value="product" />
          <Field label={p.name} htmlFor="fd-prod-name">
            <TextInput id="fd-prod-name" name="name" required placeholder={p.namePlaceholder} />
          </Field>
          <Field label={p.hsCode} htmlFor="fd-prod-hs">
            <TextInput id="fd-prod-hs" name="hs_code" placeholder={p.hsCodePlaceholder} />
          </Field>
          <Field label={p.unit} htmlFor="fd-prod-unit">
            <TextInput id="fd-prod-unit" name="unit" placeholder={p.unitPlaceholder} />
          </Field>
          <Field label={p.capacity} htmlFor="fd-prod-capacity">
            <TextInput id="fd-prod-capacity" type="number" inputMode="decimal" name="annual_capacity" placeholder={p.capacityPlaceholder} />
          </Field>
          <Choice kind="checkbox" name="is_primary" value="on" label={p.primary} />
          <Button type="submit" variant="secondary" disabled={pending}>{p.submit}</Button>
          <FormResult state={state} strings={strings} />
        </form>
      </CardBody>
    </Card>
  );
}

export function MaterialForm({ factoryId, strings }: {
  factoryId: string;
  strings: AdminFactoryDataMessages;
}) {
  const [state, action, pending] = useActionState<FactoryDataResult, FormData>(mutateFactoryMasterData, {});
  const m = strings.masterData.material;

  return (
    <Card as="section">
      <CardHeader level="h3" title={m.title} />
      <CardBody>
        <form action={action} className={styles.formBody}>
          <input type="hidden" name="factory_id" value={factoryId} />
          <input type="hidden" name="operation" value="material" />
          <Field label={m.name} htmlFor="fd-mat-name">
            <TextInput id="fd-mat-name" name="name" required placeholder={m.namePlaceholder} />
          </Field>
          <Field label={m.source} htmlFor="fd-mat-source">
            <SaqeelSelect
              id="fd-mat-source"
              name="source"
              label={m.source}
              defaultValue="local"
              required
              options={[
                { value: "local", label: m.sourceLocal },
                { value: "imported", label: m.sourceImported },
              ]}
            />
          </Field>
          <Field label={m.hsCode} htmlFor="fd-mat-hs">
            <TextInput id="fd-mat-hs" name="hs_code" placeholder={m.hsCodePlaceholder} />
          </Field>
          <Button type="submit" variant="secondary" disabled={pending}>{m.submit}</Button>
          <FormResult state={state} strings={strings} />
        </form>
      </CardBody>
    </Card>
  );
}
