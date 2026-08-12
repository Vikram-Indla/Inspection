"use client";
import dynamic from "next/dynamic";
import Button from "@/components/saqeel/button/button";
import { Card, CardBody, CardHeader } from "@/components/saqeel/card/card";
import DateRangePicker from "@/components/saqeel/date-range-picker/date-range-picker";
import Field from "@/components/saqeel/field/field";
import SaqeelSelect from "@/components/saqeel/select/select";
import TextInput from "@/components/saqeel/text-input/text-input";
import Textarea from "@/components/saqeel/textarea/textarea";
import type { ImmediateMessages } from "@/features/planning-immediate/strings";
import type { ImmediateInspector } from "@/features/planning-immediate/types";
import type { Locale } from "@/lib/i18n";
import styles from "./location-dispatch.module.css";

const GeoMap = dynamic(() => import("@/components/GeoMap"), { ssr: false });

const HEADING_ID = "immediate-location";
const RIYADH: readonly [number, number] = [23.8859, 45.0792];
const PINNED_ZOOM = 14;
const REGION_ZOOM = 6;

export type DispatchValue = {
  readonly lat: string;
  readonly lng: string;
  readonly windowStart: string;
  readonly windowEnd: string;
  readonly priority: string;
  readonly inspectorId: string;
  readonly notes: string;
};

export default function LocationDispatch({
  value, onChange, official, sourceLabel, inspectors, messages, locale,
}: {
  value: DispatchValue;
  onChange: (next: DispatchValue) => void;
  official: { readonly lat: number; readonly lng: number } | null;
  sourceLabel: string;
  inspectors: readonly ImmediateInspector[];
  messages: ImmediateMessages;
  locale: Locale;
}) {
  const { location, dispatch } = messages;
  const set = <K extends keyof DispatchValue>(key: K, next: DispatchValue[K]) =>
    onChange({ ...value, [key]: next });

  const latitude = Number(value.lat);
  const longitude = Number(value.lng);
  const pinned = value.lat !== "" && value.lng !== ""
    && Number.isFinite(latitude) && Number.isFinite(longitude);
  const centre: [number, number] = pinned
    ? [latitude, longitude]
    : official ? [official.lat, official.lng] : [...RIYADH];

  const windowLabel = value.windowStart && value.windowEnd
    ? `${value.windowStart} — ${value.windowEnd}`
    : dispatch.window.empty;

  return (
    <Card as="section" labelledBy={HEADING_ID}>
      <CardHeader level="h2" titleId={HEADING_ID} title={location.heading} description={sourceLabel} />
      <CardBody>
        {official ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            label={location.useOfficial}
            onClick={() => onChange({ ...value, lat: String(official.lat), lng: String(official.lng) })}
          >
            {location.useOfficial}
          </Button>
        ) : null}

        <div className={styles.map}>
          <GeoMap
            center={centre}
            zoom={pinned || official ? PINNED_ZOOM : REGION_ZOOM}
            markers={pinned ? [{ id: "candidate", lat: latitude, lng: longitude, label: location.sourceOfficial, tone: "low" }] : []}
            height="100%"
          />
        </div>

        <div className={styles.pair}>
          <Field label={location.latitude} htmlFor="imm-lat">
            <TextInput id="imm-lat" name="lat" inputMode="decimal" value={value.lat} onChange={next => set("lat", next)} />
          </Field>
          <Field label={location.longitude} htmlFor="imm-lng">
            <TextInput id="imm-lng" name="lng" inputMode="decimal" value={value.lng} onChange={next => set("lng", next)} />
          </Field>
        </div>

        <Field label={dispatch.window.label} hint={dispatch.windowHint}>
          <DateRangePicker
            from={value.windowStart}
            to={value.windowEnd}
            onChange={range => onChange({ ...value, windowStart: range.from, windowEnd: range.to })}
            label={dispatch.window.label}
            displayValue={windowLabel}
            block
            withTime
            presets={[]}
            locale={locale}
            monthLabels={{ previous: dispatch.window.previousMonth, next: dispatch.window.nextMonth }}
            timeLabels={{ from: dispatch.window.startTime, to: dispatch.window.endTime }}
            strings={{
              from: dispatch.windowStart,
              to: dispatch.windowEnd,
              pickStart: dispatch.window.pickStart,
              pickEnd: dispatch.window.pickEnd,
              reset: dispatch.window.reset,
              apply: dispatch.window.apply,
              empty: dispatch.window.empty,
            }}
          />
        </Field>

        <Field label={dispatch.priority} htmlFor="imm-priority">
          <TextInput
            id="imm-priority"
            name="priority"
            value={value.priority}
            placeholder={dispatch.priorityPlaceholder}
            onChange={next => set("priority", next)}
          />
        </Field>

        <Field label={dispatch.inspector} htmlFor="imm-inspector">
          <SaqeelSelect
            id="imm-inspector"
            label={dispatch.inspector}
            options={[
              { value: "", label: dispatch.autoAssign },
              ...inspectors.map(entry => ({ value: entry.user_id, label: entry.full_name })),
            ]}
            value={value.inspectorId}
            onChange={next => set("inspectorId", next)}
          />
        </Field>

        <Field label={dispatch.notes} htmlFor="imm-notes">
          <Textarea
            id="imm-notes"
            name="notes"
            rows={3}
            value={value.notes}
            placeholder={dispatch.notesPlaceholder}
            onChange={next => set("notes", next)}
          />
        </Field>
      </CardBody>
    </Card>
  );
}
