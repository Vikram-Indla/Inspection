import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Heading, Mono, Text } from "@/components/saqeel/type";
import type { Factory360Dossier } from "@/lib/factory360/dossier";
import type { Locale } from "@/lib/i18n";
import { localeHref } from "@/lib/locale-path";
import type { CrFormatters, CrStrings } from "@/features/factories/cr-dossier/view";
import styles from "../factory360-cr.module.css";

type DocRow = Factory360Dossier["docs"][number];

export default function CrDocuments({ dossier, fmt, strings, locale }: {
  dossier: Factory360Dossier;
  fmt: CrFormatters;
  strings: CrStrings;
  locale: Locale;
}) {
  const { docs, officialMedia, linkedEvidence, permissions, downloadUrls, mediaUrls, docsResult, mediaResult, factoryId } = dossier;
  const canView = permissions["view_factory_documents"];
  const canDownload = permissions["download_factory_documents"];
  const src = fmt.sourceState(docsResult.error || mediaResult.error, [...docs, ...officialMedia], Boolean(factoryId));
  const gallery = officialMedia.filter(asset => mediaUrls[asset.id]);

  const columns: DataColumn<DocRow>[] = [
    { key: "category", header: strings.fields.category, isRowHeader: true, cell: row => fmt.label(row.business_category ?? row.doc_type) },
    { key: "title", header: strings.fields.title, cell: row => row.title },
    { key: "reference", header: strings.fields.reference, numeric: true, cell: row => <Mono>{fmt.text(row.reference_no)}</Mono> },
    { key: "validity", header: strings.fields.validity, numeric: true, cell: row => <Mono>{`${fmt.dt(row.valid_from)} → ${fmt.dt(row.valid_to)}`}</Mono> },
    { key: "source", header: strings.fields.sourceSystem, cell: row => `${fmt.text(row.source_system)} · ${fmt.text(row.source_status)}` },
    {
      key: "download", header: strings.documents.download, headerHidden: true, align: "end",
      cell: row => canDownload && downloadUrls[row.id]
        ? <a className={styles.textLink} href={downloadUrls[row.id]} download><Text as="span" role="label" tone="inherit">{strings.documents.download}</Text></a>
        : <Text as="span" role="label" tone="muted">{canDownload ? strings.documents.downloadUnavailable : strings.documents.downloadRestricted}</Text>,
    },
  ];

  return (
    <Card as="section" labelledBy="f360cr-documents">
      <CardHeader
        level="h2"
        titleId="f360cr-documents"
        title={strings.documents.heading}
        trailing={canView ? <StatusPill tone={src.tone}>{src.label}</StatusPill> : <StatusPill tone="neutral">{strings.documents.restricted}</StatusPill>}
      />
      <CardBody>
        {!canView ? (
          <EmptyState icon="restricted" title={strings.documents.restrictedBody} size="sm" />
        ) : (
          <div className={styles.subgroup}>
            <DataTable rows={docs} columns={columns} getRowId={row => row.id} caption={strings.documents.heading} empty={{ icon: "library", title: docsResult.error ? strings.section.degraded : strings.documents.empty }} />
            {gallery.length ? (
              <>
                <Heading level={3}>{strings.media.official}</Heading>
                <ul className={styles.gallery}>
                  {gallery.map(asset => (
                    <li className={styles.galleryItem} key={asset.id}>
                      <img className={styles.galleryImage} src={mediaUrls[asset.id]} alt={asset.title ?? strings.media.alt} />
                      <Text as="span" role="label" tone="muted" dir="auto">{asset.title ?? fmt.label(asset.category)}</Text>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            <Text as="p" tone="muted">{strings.media.boundary}</Text>
            <Heading level={3}>{strings.media.evidence}</Heading>
            {linkedEvidence.length ? (
              <ul className={styles.evidenceList}>
                {linkedEvidence.map(asset => (
                  <li className={styles.evidenceItem} key={asset.id}>
                    <StatusPill tone="info">{fmt.label(asset.category)}</StatusPill>
                    <Text as="span" role="body" dir="auto">{asset.title ?? fmt.text(asset.evidence_id)}</Text>
                    <Text as="span" role="label" tone="muted">{fmt.dt(asset.captured_at)}</Text>
                    <span className={styles.rowLinks}>
                      {asset.inspection_id ? <a className={styles.textLink} href={localeHref(locale, `/reports/inspection/${asset.inspection_id}`)}><Text as="span" role="label" tone="inherit">{strings.media.origin}</Text></a> : null}
                      {asset.evidence_id ? <a className={styles.textLink} href={localeHref(locale, `/evidence-ocr?evidence=${asset.evidence_id}`)}><Text as="span" role="label" tone="inherit">{strings.media.ocr}</Text></a> : null}
                    </span>
                  </li>
                ))}
              </ul>
            ) : <Text as="p" tone="muted">{strings.media.evidenceEmpty}</Text>}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
