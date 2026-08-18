import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import Button from "@/components/saqeel/button/button";
import { Heading, Text } from "@/components/saqeel/type";
import type { AdminFactoryDataMessages } from "@/features/admin-factory-data/strings";
import type { FactoryDataView } from "@/features/admin-factory-data/types";
import { fill } from "@/i18n/messages";
import type { Locale } from "@/lib/i18n";
import { ProductForm, MaterialForm } from "./catalog-forms";
import DocumentForm from "./document-form";
import FactoryPicker from "./factory-picker";
import RepresentativeForm, { RepresentativeToggle } from "./representative-form";
import styles from "./factory-data.module.css";

export default function MasterDataPanel({ data, strings, locale }: {
  data: FactoryDataView;
  strings: AdminFactoryDataMessages;
  locale: Locale;
}) {
  const md = strings.masterData;
  const selected = data.selected;

  return (
    <section className={styles.formBody}>
      <div>
        <Heading level={2}>{md.title}</Heading>
        <Text tone="secondary">{md.help}</Text>
      </div>
      <Card as="section" role="note">
        <CardBody>
          <Text tone="secondary">
            <Text as="strong" role="bodyStrong">{md.noWriteback}</Text>{` ${md.noWritebackHelp}`}
          </Text>
        </CardBody>
      </Card>
      {data.factoriesFailed ? <Text tone="warning" live="alert">{md.factoriesError}</Text> : null}

      <FactoryPicker factories={data.factories} selectedId={selected?.id ?? ""} strings={strings} />

      {selected ? (
        <>
          <div className={styles.selectedRow}>
            <Text role="bodyStrong" dir="auto">
              {fill(md.selected, {
                name: selected.name,
                cr: selected.cr_number ?? strings.dash,
                license: selected.license_number ?? strings.dash,
              })}
            </Text>
            <Button href={`/factories/${selected.id}`} variant="link" size="sm">{md.openDossier}</Button>
          </div>

          <div className={styles.forms}>
            <DocumentForm factoryId={selected.id} strings={strings} locale={locale} />
            <RepresentativeForm factoryId={selected.id} strings={strings} />
            <ProductForm factoryId={selected.id} strings={strings} />
            <MaterialForm factoryId={selected.id} strings={strings} />
          </div>

          <Card as="section">
            <CardHeader level="h3" title={md.status.title} />
            <CardBody>
              {data.representativesFailed ? (
                <Text tone="warning" live="alert">{md.representativesError}</Text>
              ) : data.representatives.length ? (
                <div className={styles.repList}>
                  {data.representatives.map(representative => (
                    <RepresentativeToggle key={representative.id} factoryId={selected.id} representative={representative} strings={strings} />
                  ))}
                </div>
              ) : (
                <Text tone="muted">{md.status.empty}</Text>
              )}
            </CardBody>
          </Card>
        </>
      ) : null}
    </section>
  );
}
