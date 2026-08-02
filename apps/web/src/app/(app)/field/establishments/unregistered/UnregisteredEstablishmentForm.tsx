"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { GeoMarkerData } from "@/components/GeoMap";
import PackageTypeSelector, { type PackageTypeOption } from "@/components/PackageTypeSelector";
import EmptyState from "@/components/EmptyState";
import { createUnregisteredEstablishmentVisit, type UnregisteredResult } from "./actions";
import styles from "../../incident-reports/incident-reports.module.css";

export type UnregisteredStrings = {
  location: string; useCurrentLocation: string; locating: string; locationCaptured: string;
  latitude: string; longitude: string; mapLoading: string;
  reportType: string; reportTypeHint: string;
  visitType: string; visitTypeComplaint: string; visitTypeFollowUp: string; visitTypePeriodic: string;
  reason: string; reasonComplaint: string; reasonIncident: string; reasonReferral: string; reasonOther: string; reasonOtherHint: string;
  notes: string; notesPlaceholder: string;
  photosNote: string;
  submit: string; submitting: string;
};

let mapLoadingLabel = "Loading location map";
const GeoMap = dynamic(() => import("@/components/GeoMap"), {
  ssr: false,
  loading: () => <EmptyState glyph="…" title={mapLoadingLabel} inline bare role="status" ariaBusy />,
});

// Jira INSP-605. Figma: "Create an Unlicensed Establishment" (node
// 941:49887) — Photos, Location Verification, نوع التقرير (report type),
// notes. Photos deferred (see actions.ts header). Location reuses the same
// GeoMap + browser geolocation pattern planning/immediate/ImmediateForm.tsx
// already uses. Report-type selection reuses PackageTypeSelector rather than
// hand-building the design's 6-card grid — the underlying need (pick which
// inspection package applies) is identical, and this is a real, already-wired
// selector against real package_versions data instead of 6 invented cards.
export default function UnregisteredEstablishmentForm({ locale, strings: s, packages, visitType, context }: {
  locale: string; strings: UnregisteredStrings; packages: PackageTypeOption[];
  visitType: "complaint" | "follow_up" | "periodic";
  context?: { visitId?: string };
}) {
  const [state, action, pending] = useActionState<UnregisteredResult, FormData>(createUnregisteredEstablishmentVisit, {});
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [packageId, setPackageId] = useState("");
  const [reason, setReason] = useState("");
  const [requestId, setRequestId] = useState("");
  const isFirstRender = useRef(true);
  useEffect(() => { setRequestId(crypto.randomUUID()); }, []);
  mapLoadingLabel = s.mapLoading;

  const latNum = Number(lat); const lngNum = Number(lng);
  const locationOk = lat !== "" && lng !== "" && Number.isFinite(latNum) && Number.isFinite(lngNum);
  const markers: GeoMarkerData[] = locationOk ? [{ id: "captured", lat: latNum, lng: lngNum, label: s.locationCaptured, tone: "low" as const }] : [];
  const center: [number, number] = locationOk ? [latNum, lngNum] : [23.8859, 45.0792];

  function useCurrentLocation() {
    setLocating(true); setLocError(null);
    if (!("geolocation" in navigator)) { setLocating(false); setLocError(s.locating); return; }
    navigator.geolocation.getCurrentPosition(
      pos => { setLat(String(pos.coords.latitude)); setLng(String(pos.coords.longitude)); setLocating(false); },
      () => { setLocating(false); setLocError(s.locating); },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  return (
    <form action={action} className={styles.card}>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="request_id" value={requestId} />
      <input type="hidden" name="visit_type" value={visitType} />
      <input type="hidden" name="lat" value={lat} />
      <input type="hidden" name="lng" value={lng} />

      <p className="t-caption">{s.photosNote}</p>

      <section aria-label={s.location}>
        <h5>{s.location}</h5>
        <button type="button" className="btn btn-secondary" onClick={useCurrentLocation} disabled={locating}>
          {locating ? s.locating : s.useCurrentLocation}
        </button>
        {locError && <p className="field-error" role="alert">{locError}</p>}
        <GeoMap center={center} zoom={locationOk ? 15 : 6} markers={markers} height={220} />
        <div className={styles.grid2}>
          <div className="field"><span>{s.latitude}</span><input className="input numeric" dir="ltr" readOnly value={lat} /></div>
          <div className="field"><span>{s.longitude}</span><input className="input numeric" dir="ltr" readOnly value={lng} /></div>
        </div>
      </section>

      <section aria-label={s.reportType} style={{ marginBlockStart: "var(--space-3)" }}>
        <h5>{s.reportType}</h5>
        <p className="t-caption">{s.reportTypeHint}</p>
        <PackageTypeSelector
          name="package_version_id"
          options={packages}
          value={packageId}
          onChange={setPackageId}
        />
      </section>

      <input type="hidden" name="reason" value={reason} />
      <div className="field" id="ue-reason-group" tabIndex={-1} style={{ marginBlockStart: "var(--space-3)" }}>
        <label htmlFor="ue-reason-group">{s.reason}</label>
        <div className="btn-group" role="group" aria-label={s.reason}>
          {[["Complaint received", s.reasonComplaint], ["Incident / accident report", s.reasonIncident], ["Referral from authority", s.reasonReferral], ["Other", s.reasonOther]].map(([v, label]) => (
            <button className={`btn ${reason === v ? "btn-primary" : "btn-secondary"}`} key={v} type="button" aria-pressed={reason === v} onClick={() => setReason(v)}>{label}</button>
          ))}
        </div>
        {reason === "Other" && <p className="t-caption">{s.reasonOtherHint}</p>}
      </div>

      <div className="field" style={{ marginBlockStart: "var(--space-3)" }}>
        <label htmlFor="ue-notes">{s.notes}</label>
        <textarea id="ue-notes" className="input" name="notes" rows={3} placeholder={s.notesPlaceholder} required={reason === "Other"} />
      </div>

      <div className={styles.actionbar}>
        {context?.visitId && <span className="badge badge-info"><span className="dot" />{context.visitId}</span>}
        <span className={styles.grow} />
        {state.error && <span className="field-error" role="alert">{state.error}</span>}
        <button className="btn btn-primary" disabled={pending || !locationOk || !packageId || !reason}>
          {pending ? s.submitting : s.submit}
        </button>
      </div>
    </form>
  );
}
