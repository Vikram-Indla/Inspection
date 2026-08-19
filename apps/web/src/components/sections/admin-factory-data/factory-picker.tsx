"use client";

import { useRouter } from "next/navigation";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect from "@/components/saqeel/select/select";
import type { AdminFactoryDataMessages } from "@/features/admin-factory-data/strings";
import type { FactoryRow } from "@/features/admin-factory-data/types";
import styles from "./factory-data.module.css";

export default function FactoryPicker({ factories, selectedId, strings }: {
  factories: readonly FactoryRow[];
  selectedId: string;
  strings: AdminFactoryDataMessages;
}) {
  const router = useRouter();
  const md = strings.masterData;
  const options = factories.map(factory => ({
    value: factory.id,
    label: `${factory.name} · ${factory.factory_code ?? factory.cr_number ?? strings.dash}`,
  }));

  return (
    <div className={styles.picker}>
      <Field label={md.factory} htmlFor="fd-factory">
        <SaqeelSelect
          id="fd-factory"
          label={md.factory}
          value={selectedId}
          placeholder={md.selectFactory}
          options={options}
          onChange={value => router.push(`/admin/integrations/factory-data?factory=${value}`)}
        />
      </Field>
    </div>
  );
}
