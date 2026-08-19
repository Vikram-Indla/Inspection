"use client";

import Link from "next/link";
import Button from "@/components/saqeel/button/button";
import Field from "@/components/saqeel/field/field";
import Icon from "@/components/saqeel/icon/icon";
import Select from "@/components/saqeel/select/select";
import TextInput from "@/components/saqeel/text-input/text-input";
import { Heading } from "@/components/saqeel/type";
import { RISK_BANDS } from "@/features/field-establishments/params";
import type { EstablishmentsCopy } from "@/features/field-establishments/labels";
import type { EstablishmentQuery } from "@/features/field-establishments/params";
import styles from "./establishments.module.css";

export default function EstablishmentFilters({ query, regions, cities, copy, closeHref, clearHref }: {
  query: EstablishmentQuery;
  regions: readonly string[];
  cities: readonly string[];
  copy: EstablishmentsCopy;
  closeHref: string;
  clearHref: string;
}) {
  const riskOptions = [
    { value: "", label: copy.drawer.all },
    ...RISK_BANDS.map(band => ({ value: band, label: copy.risk[band] })),
  ];
  const facetOptions = (values: readonly string[]) => [
    { value: "", label: copy.drawer.all },
    ...values.map(value => ({ value, label: value })),
  ];

  return (
    <>
      <Link href={closeHref} aria-label={copy.drawer.close} className={styles.overlay} />
      <aside className={styles.drawer} aria-label={copy.drawer.heading}>
        <div className={styles.drawerHead}>
          <Heading level={2} visual="subheading">{copy.drawer.heading}</Heading>
          <Link href={closeHref} aria-label={copy.drawer.close} className={styles.drawerClose}>
            <Icon name="dismiss" size="md" />
          </Link>
        </div>
        <form method="get" className={styles.drawerForm}>
          <input type="hidden" name="status" value={query.status} />

          <Field label={copy.drawer.tradeName} htmlFor="est-q">
            <TextInput id="est-q" name="q" defaultValue={query.q} placeholder={copy.drawer.estName} label={copy.drawer.tradeName} />
          </Field>

          <Field label={copy.drawer.riskClass} htmlFor="est-risk">
            <Select id="est-risk" name="risk" defaultValue={query.risk} options={riskOptions} label={copy.drawer.riskClass} />
          </Field>

          <Field label={copy.drawer.region} htmlFor="est-region">
            <Select id="est-region" name="region" defaultValue={query.region} options={facetOptions(regions)} label={copy.drawer.region} />
          </Field>

          <Field label={copy.drawer.city} htmlFor="est-city">
            <Select id="est-city" name="city" defaultValue={query.city} options={facetOptions(cities)} label={copy.drawer.city} />
          </Field>

          <div className={styles.drawerFoot}>
            <Button href={clearHref} variant="tertiary">{copy.drawer.clear}</Button>
            <Button type="submit" variant="primary">{copy.drawer.apply}</Button>
          </div>
        </form>
      </aside>
    </>
  );
}
