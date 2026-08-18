"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Card, CardBody } from "@/components/saqeel/card/card";
import DefinitionList from "@/components/saqeel/definition-list/definition-list";
import EmptyState from "@/components/saqeel/empty-state/empty-state";
import Field from "@/components/saqeel/field/field";
import TextInput from "@/components/saqeel/text-input/text-input";
import Button from "@/components/saqeel/button/button";
import StatusPill from "@/components/saqeel/status-pill/status-pill";
import { Heading, Text } from "@/components/saqeel/type";
import type { GeoFocus, GeoMarkerData } from "@/components/GeoMap";
import type { GisResult } from "@/app/(app)/admin/gis/actions";
import { bandLabel, bandTone, resultMessage, type AdminGisMessages } from "@/features/admin-gis/strings";
import type { GisFactory, GisSettings } from "@/features/admin-gis/types";
import { fill } from "@/i18n/messages";
import styles from "./gis.module.css";

const GeoMap = dynamic(() => import("@/components/GeoMap"), { ssr: false });

export type BandCounts = { high: number; medium: number; low: number; unbanded: number };

export default function GisMapPanel({
  strings, markers, selectedId, focus, selected, settings, defaultFence, draftRadius,
  canEdit, bandCounts, state, formAction, pending, onMarkerClick, onRadiusChange, onDraftChange,
}: {
  strings: AdminGisMessages;
  markers: readonly GeoMarkerData[];
  selectedId: string | null;
  focus: GeoFocus | undefined;
  selected: GisFactory | null;
  settings: GisSettings;
  defaultFence: number;
  draftRadius: string;
  canEdit: boolean;
  bandCounts: BandCounts;
  state: GisResult;
  formAction: (formData: FormData) => void;
  pending: boolean;
  onMarkerClick: (id: string) => void;
  onRadiusChange: (id: string, radiusM: number) => void;
  onDraftChange: (value: string) => void;
}) {
  const p = strings.panel;
  const mono = (value: React.ReactNode) => <Text as="span" role="mono" dir="ltr">{value}</Text>;
  const defaults = [
    { label: p.defaultsCheckin, value: mono(`≤ ${settings.gps_accuracy_checkin_max_m ?? strings.dash} m`) },
    { label: p.defaultsArrival, value: mono(`${settings.arrival_detection_radius_m ?? strings.dash} m`) },
    { label: p.defaultsFence, value: mono(`${defaultFence} m`) },
  ];

  return (
    <div className={styles.layout}>
      <div className={styles.mapCard}>
        <Suspense fallback={<EmptyState icon="map" title={strings.map.loadingTitle} description={strings.map.loadingBody} size="sm" />}>
          <GeoMap
            center={[24.0, 44.5]}
            zoom={5}
            markers={[...markers]}
            height="100%"
            selectedId={selectedId}
            focus={focus}
            ariaLabel={strings.map.ariaLabel}
            onMarkerClick={onMarkerClick}
            onRadiusChange={onRadiusChange}
          />
        </Suspense>
      </div>

      <Card as="section">
        <CardBody>
          {!selected ? (
            <EmptyState icon="map" title={p.selectTitle} description={p.selectBody} size="sm" />
          ) : (
            <>
              <div className={styles.panelBlock}>
                <Heading level={3}>{selected.name}</Heading>
                <div className={styles.pills}>
                  <StatusPill tone="neutral" ping={false}>{selected.factory_code}</StatusPill>
                  <StatusPill tone={bandTone(selected.risk_band)}>
                    {`${bandLabel(selected.risk_band, strings)}${selected.risk_score != null ? ` · ${selected.risk_score}` : ""}`}
                  </StatusPill>
                </div>
                <Text role="label" tone="muted">{`${selected.region ?? strings.dash} · ${selected.city ?? strings.dash}`}</Text>
              </div>

              <div className={styles.panelBlock}>
                <Text role="label" tone="muted">{p.coordsLabel}</Text>
                {mono(`${selected.official_lat}, ${selected.official_lng}`)}
                <Text role="label" tone="muted">{p.coordsCaption}</Text>
              </div>

              {canEdit ? (
                <form action={formAction} className={styles.panelBlock}>
                  <input type="hidden" name="factory_id" value={selected.id} />
                  <Field label={p.radiusLabel} htmlFor="gis-radius" hint={fill(p.radiusHint, { default: defaultFence })}>
                    <TextInput id="gis-radius" name="geofence_radius_m" type="number" inputMode="numeric" required value={draftRadius} onChange={onDraftChange} placeholder={String(defaultFence)} />
                  </Field>
                  <div className={styles.formRow}>
                    <Button type="submit" variant="primary" disabled={pending}>{pending ? p.saving : p.save}</Button>
                    {state.error ? <Text tone="danger" role="label" live="alert">{resultMessage(state.error, strings)}</Text> : null}
                    {state.ok ? <StatusPill tone="success">{p.saved}</StatusPill> : null}
                  </div>
                </form>
              ) : (
                <Text tone="warning" role="bodyStrong" live="status">{p.viewOnly}</Text>
              )}
            </>
          )}

          <div className={styles.panelBlock}>
            <Text role="label" tone="muted">{p.defaultsTitle}</Text>
            <DefinitionList items={defaults} />
          </div>

          <div className={styles.pills}>
            <StatusPill tone="danger">{`${bandLabel("high", strings)} ${bandCounts.high}`}</StatusPill>
            <StatusPill tone="warning">{`${bandLabel("medium", strings)} ${bandCounts.medium}`}</StatusPill>
            <StatusPill tone="success">{`${bandLabel("low", strings)} ${bandCounts.low}`}</StatusPill>
            {bandCounts.unbanded > 0 ? <StatusPill tone="neutral">{`${bandLabel("unbanded", strings)} ${bandCounts.unbanded}`}</StatusPill> : null}
            <Text role="label" tone="muted">{p.legendCaption}</Text>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
