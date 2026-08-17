"use client";

import { useActionState, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { GeoMarkerData } from "@/components/GeoMap";
import Button from "@/components/saqeel/button/button";
import { Skeleton } from "@/components/saqeel/skeleton/skeleton";
import Field from "@/components/saqeel/field/field";
import TextInput from "@/components/saqeel/text-input/text-input";
import TextArea from "@/components/saqeel/textarea/textarea";
import { Heading, Text } from "@/components/saqeel/type";
import type { Messages } from "@/i18n/messages";
import {
  createUnregisteredEstablishmentVisit,
  type UnregisteredResult,
} from "@/app/(app)/field/establishments/unregistered/actions";
import type { InspectionPackageOption } from "@/features/field-unregistered/queries";
import PackageTypeSelect from "./package-type-select";
import styles from "./unregistered.module.css";

const GeoMap = dynamic(() => import("@/components/GeoMap"), {
  ssr: false,
  loading: () => <Skeleton shape="block" width="full" />,
});

const KSA_CENTRE: readonly [number, number] = [23.8859, 45.0792];

const REASONS = [
  { value: "Complaint received", key: "complaint" },
  { value: "Incident / accident report", key: "incident" },
  { value: "Referral from authority", key: "referral" },
  { value: "Other", key: "other" },
] as const;

export default function UnregisteredForm({ locale, copy, packages }: {
  locale: string;
  copy: Messages["fieldUnregistered"];
  packages: readonly InspectionPackageOption[];
}) {
  const [state, action, pending] = useActionState<UnregisteredResult, FormData>(
    createUnregisteredEstablishmentVisit,
    {},
  );
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState(false);
  const [packageId, setPackageId] = useState("");
  const [reason, setReason] = useState("");
  const [requestId, setRequestId] = useState("");
  useEffect(() => { setRequestId(crypto.randomUUID()); }, []);

  const latNum = Number(lat);
  const lngNum = Number(lng);
  const locationOk = lat !== "" && lng !== "" && Number.isFinite(latNum) && Number.isFinite(lngNum);
  const markers: readonly GeoMarkerData[] = locationOk
    ? [{ id: "captured", lat: latNum, lng: lngNum, label: copy.location.captured, tone: "low" }]
    : [];
  const centre: [number, number] = locationOk ? [latNum, lngNum] : [KSA_CENTRE[0], KSA_CENTRE[1]];

  const capture = () => {
    setLocating(true);
    setLocError(false);
    if (!("geolocation" in navigator)) { setLocating(false); setLocError(true); return; }
    navigator.geolocation.getCurrentPosition(
      position => { setLat(String(position.coords.latitude)); setLng(String(position.coords.longitude)); setLocating(false); },
      () => { setLocating(false); setLocError(true); },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="request_id" value={requestId} />
      <input type="hidden" name="visit_type" value="follow_up" />
      <input type="hidden" name="lat" value={lat} />
      <input type="hidden" name="lng" value={lng} />
      <input type="hidden" name="reason" value={reason} />

      <Text role="label" tone="muted">{copy.photosNote}</Text>

      <section aria-labelledby="ue-location" className={styles.section}>
        <Heading level={2} visual="label" id="ue-location">{copy.location.heading}</Heading>
        <Button variant="secondary" onClick={capture} busy={locating}>
          {locating ? copy.location.locating : copy.location.capture}
        </Button>
        {locError ? <Text tone="danger" live="alert" role="label">{copy.location.error}</Text> : null}
        <div className={styles.map}>
          <GeoMap center={centre} zoom={locationOk ? 15 : 6} markers={[...markers]} height="100%" ariaLabel={copy.location.mapLabel} unavailableHeadingLevel={3} />
        </div>
        <div className={styles.pairs}>
          <Field label={copy.location.latitude} htmlFor="ue-lat">
            <TextInput id="ue-lat" readOnly value={lat} label={copy.location.latitude} />
          </Field>
          <Field label={copy.location.longitude} htmlFor="ue-lng">
            <TextInput id="ue-lng" readOnly value={lng} label={copy.location.longitude} />
          </Field>
        </div>
      </section>

      <section aria-labelledby="ue-report" className={styles.section}>
        <Heading level={2} visual="label" id="ue-report">{copy.report.heading}</Heading>
        <Text role="label" tone="muted">{copy.report.hint}</Text>
        <PackageTypeSelect name="package_version_id" options={packages} labelledBy="ue-report" onChange={setPackageId} />
      </section>

      <section aria-labelledby="ue-reason" className={styles.section}>
        <Heading level={2} visual="label" id="ue-reason">{copy.reason.heading}</Heading>
        <div className={styles.chips} role="radiogroup" aria-labelledby="ue-reason">
          {REASONS.map(item => (
            <label key={item.value} className={styles.chip} data-selected={reason === item.value ? "" : undefined}>
              <input
                type="radio"
                name="reason-choice"
                value={item.value}
                className="sqx-visually-hidden"
                checked={reason === item.value}
                onChange={() => setReason(item.value)}
              />
              <Text role="label" as="span">{copy.reason[item.key]}</Text>
            </label>
          ))}
        </div>
        {reason === "Other" ? <Text role="label" tone="muted">{copy.reason.otherHint}</Text> : null}
      </section>

      <Field label={copy.notes.heading} htmlFor="ue-notes">
        <TextArea id="ue-notes" name="notes" rows={3} placeholder={copy.notes.placeholder} required={reason === "Other"} />
      </Field>

      <div className={styles.footer}>
        {state.error ? <Text tone="danger" live="alert">{state.error}</Text> : null}
        <span className={styles.grow} />
        <Button type="submit" variant="primary" busy={pending} disabled={pending || !locationOk || !packageId || !reason}>
          {pending ? copy.submitting : copy.submit}
        </Button>
      </div>
    </form>
  );
}
