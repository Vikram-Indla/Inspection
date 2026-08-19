"use client";

import { useActionState } from "react";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect from "@/components/saqeel/select/select";
import TextInput from "@/components/saqeel/text-input/text-input";
import DatePickerField from "@/components/saqeel/date-picker-field/date-picker-field";
import Button from "@/components/saqeel/button/button";
import { mutateFactoryMasterData, type FactoryDataResult } from "@/app/(app)/admin/integrations/factory-data/actions";
import type { AdminFactoryDataMessages } from "@/features/admin-factory-data/strings";
import type { Locale } from "@/lib/i18n";
import FormResult from "./form-result";
import styles from "./factory-data.module.css";

export default function DocumentForm({ factoryId, strings, locale }: {
  factoryId: string;
  strings: AdminFactoryDataMessages;
  locale: Locale;
}) {
  const [state, action, pending] = useActionState<FactoryDataResult, FormData>(mutateFactoryMasterData, {});
  const d = strings.masterData.document;

  return (
    <Card as="section">
      <CardHeader level="h3" title={d.title} />
      <CardBody>
        <form action={action} className={styles.formBody}>
          <input type="hidden" name="factory_id" value={factoryId} />
          <input type="hidden" name="operation" value="document" />
          <Field label={d.type} htmlFor="fd-doc-type">
            <SaqeelSelect
              id="fd-doc-type"
              name="doc_type"
              label={d.type}
              defaultValue="license"
              required
              options={[
                { value: "license", label: d.typeLicense },
                { value: "cr", label: d.typeCr },
                { value: "safety_cert", label: d.typeSafety },
                { value: "layout", label: d.typeLayout },
                { value: "other", label: d.typeOther },
              ]}
            />
          </Field>
          <Field label={d.titleLabel} htmlFor="fd-doc-title">
            <TextInput id="fd-doc-title" name="title" required placeholder={d.titlePlaceholder} />
          </Field>
          <Field label={d.reference} htmlFor="fd-doc-ref">
            <TextInput id="fd-doc-ref" name="reference_no" placeholder={d.referencePlaceholder} />
          </Field>
          <div className={styles.dateRow}>
            <DatePickerField name="valid_from" label={d.validFrom} locale={locale} strings={strings.datePicker} />
            <DatePickerField name="valid_to" label={d.validTo} locale={locale} strings={strings.datePicker} />
          </div>
          <Button type="submit" variant="secondary" disabled={pending}>{d.submit}</Button>
          <FormResult state={state} strings={strings} />
        </form>
      </CardBody>
    </Card>
  );
}
