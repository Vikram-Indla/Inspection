"use client";

import { useActionState } from "react";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Field from "@/components/saqeel/field/field";
import TextInput from "@/components/saqeel/text-input/text-input";
import Choice from "@/components/saqeel/choice/choice";
import Button from "@/components/saqeel/button/button";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Text } from "@/components/saqeel/type";
import { mutateFactoryMasterData, type FactoryDataResult } from "@/app/(app)/admin/integrations/factory-data/actions";
import type { AdminFactoryDataMessages } from "@/features/admin-factory-data/strings";
import type { RepresentativeRow } from "@/features/admin-factory-data/types";
import FormResult from "./form-result";
import styles from "./factory-data.module.css";

export default function RepresentativeForm({ factoryId, strings }: {
  factoryId: string;
  strings: AdminFactoryDataMessages;
}) {
  const [state, action, pending] = useActionState<FactoryDataResult, FormData>(mutateFactoryMasterData, {});
  const r = strings.masterData.representative;

  return (
    <Card as="section">
      <CardHeader level="h3" title={r.title} />
      <CardBody>
        <form action={action} className={styles.formBody}>
          <input type="hidden" name="factory_id" value={factoryId} />
          <input type="hidden" name="operation" value="representative" />
          <Field label={r.fullName} htmlFor="fd-rep-name">
            <TextInput id="fd-rep-name" name="full_name" required placeholder={r.fullNamePlaceholder} />
          </Field>
          <Field label={r.role} htmlFor="fd-rep-role">
            <TextInput id="fd-rep-role" name="role_title" placeholder={r.rolePlaceholder} />
          </Field>
          <Field label={r.phone} htmlFor="fd-rep-phone">
            <TextInput id="fd-rep-phone" type="tel" name="phone" placeholder={r.phonePlaceholder} />
          </Field>
          <Field label={r.email} htmlFor="fd-rep-email">
            <TextInput id="fd-rep-email" type="email" name="email" placeholder={r.emailPlaceholder} />
          </Field>
          <Choice kind="checkbox" name="is_primary" value="on" label={r.primary} />
          <Button type="submit" variant="secondary" disabled={pending}>{r.submit}</Button>
          <FormResult state={state} strings={strings} />
        </form>
      </CardBody>
    </Card>
  );
}

export function RepresentativeToggle({ factoryId, representative, strings }: {
  factoryId: string;
  representative: RepresentativeRow;
  strings: AdminFactoryDataMessages;
}) {
  const [state, action, pending] = useActionState<FactoryDataResult, FormData>(mutateFactoryMasterData, {});
  const st = strings.masterData.status;

  return (
    <form action={action} className={styles.repRow}>
      <input type="hidden" name="factory_id" value={factoryId} />
      <input type="hidden" name="operation" value="representative_status" />
      <input type="hidden" name="representative_id" value={representative.id} />
      <input type="hidden" name="active" value={representative.active ? "false" : "true"} />
      <span className={styles.selectedRow}>
        <Text as="span">{representative.full_name}</Text>
        <StatusPill tone={representative.active ? "success" : "neutral"} ping={false}>
          {representative.active ? st.active : st.inactive}
        </StatusPill>
      </span>
      <span className={styles.selectedRow}>
        <Button type="submit" variant="tertiary" size="sm" disabled={pending}>
          {representative.active ? st.deactivate : st.reactivate}
        </Button>
        <FormResult state={state} strings={strings} />
      </span>
    </form>
  );
}
