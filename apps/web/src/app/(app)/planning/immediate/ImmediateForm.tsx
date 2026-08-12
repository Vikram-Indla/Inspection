"use client";
import { useActionState, useEffect, useState } from "react";
import { createImmediateVisit, type ImmResult } from "./actions";
import LocationDispatch from "@/components/sections/planning-immediate/location-dispatch/location-dispatch";
import ImmediateOutcome from "@/components/sections/planning-immediate/immediate-outcome/immediate-outcome";
import DispatchChecklist from "@/components/sections/planning-immediate/dispatch-checklist/dispatch-checklist";
import DispatchProtections from "@/components/sections/planning-immediate/dispatch-protections/dispatch-protections";
import IdentitySection from "@/components/sections/planning-immediate/identity-section/identity-section";
import UrgencyReason from "@/components/sections/planning-immediate/urgency-reason/urgency-reason";
import { dispatchBlockers } from "@/features/planning-immediate/protections";
import { OTHER_URGENCY_REASON, urgencyReasonSatisfied } from "@/features/planning-immediate/reasons";
import type { ImmediateMessages } from "@/features/planning-immediate/strings";
import type { ImmediateFactory, ImmediatePlanningData } from "@/features/planning-immediate/types";
import type { Locale } from "@/lib/i18n";
import styles from "./immediate-form.module.css";

export default function ImmediateForm({ data, locale, messages }: {
  data: ImmediatePlanningData;
  locale: Locale;
  messages: ImmediateMessages;
}) {
  const { factories, packages, inspectors, actorName, visitTypes, initialFactoryId } = data;
  const { actorMode } = data;
  const [state, formAction, pending] = useActionState<ImmResult, FormData>(createImmediateVisit, {});

  const [query, setQuery] = useState("");
  const [factory, setFactory] = useState<ImmediateFactory | null>(
    () => (initialFactoryId ? factories.find(entry => entry.id === initialFactoryId) ?? null : null),
  );
  const [reason, setReason] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [locationSource, setLocationSource] = useState<"official" | "manual" | null>(null);
  const [locationAt, setLocationAt] = useState("");
  const [packageId, setPackageId] = useState("");
  const [inspectorId, setInspectorId] = useState("");
  const [visitType, setVisitType] = useState(
    visitTypes.find(type => type.manualEntryAllowed)?.key ?? visitTypes[0]?.key ?? "complaint",
  );
  const [windowStart, setWindowStart] = useState("");
  const [windowEnd, setWindowEnd] = useState("");
  const [priority, setPriority] = useState("");
  const [notes, setNotes] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [requestId, setRequestId] = useState("");
  useEffect(() => { setRequestId(crypto.randomUUID()); }, []);

  const ql = query.trim().toLowerCase();
  const shown = ql.length >= 2
    ? factories.filter(entry => entry.cr_number?.toLowerCase().includes(ql)
      || (entry.license_number ?? "").toLowerCase().includes(ql)
      || entry.name.toLowerCase().includes(ql))
    : factories;

  const latNum = Number(lat);
  const lngNum = Number(lng);
  const locationOk = lat !== "" && lng !== "" && Number.isFinite(latNum) && Number.isFinite(lngNum)
    && latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180;
  const identityOk = factory != null;
  const reasonOk = urgencyReasonSatisfied(reason, notes);
  const windowOk = !!windowStart && !!windowEnd
    && new Date(windowEnd).getTime() > new Date(windowStart).getTime();

  const onLatChange = (next: string) => {
    setLat(next);
    setLocationSource("manual");
    setLocationAt(new Date().toISOString());
  };
  const onLngChange = (next: string) => {
    setLng(next);
    setLocationSource("manual");
    setLocationAt(new Date().toISOString());
  };

  const locationSourceLabel = locationSource === "official" ? messages.location.sourceOfficial
    : locationSource === "manual" ? messages.location.sourceManual.replace("{who}", actorName).replace("{when}", locationAt)
    : messages.location.sourceNone;

  const blockers = dispatchBlockers({
    blockingField: state.blockingField ?? null,
    reasonSatisfied: reasonOk,
    reasonNeedsNotes: reason === OTHER_URGENCY_REASON && notes.trim() === "",
    identitySatisfied: identityOk,
    locationSatisfied: locationOk,
    windowSatisfied: windowOk,
  }, messages);

  return (
    <form action={formAction} className={styles.form}>
      <input type="hidden" name="request_id" value={requestId} />
      <input type="hidden" name="actor_mode" value={actorMode} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="location_source" value={locationSource ?? ""} />
      <input type="hidden" name="existing_factory_id" value={factory?.id ?? ""} />
      <input type="hidden" name="visit_type" value={visitType} />
      <DispatchProtections blockers={blockers} messages={messages.protections} />

      <div className={styles.columns}>
        <div className={styles.column}>
          <IdentitySection
            selection={{ query, factory, visitType }}
            matches={shown}
            visitTypes={visitTypes}
            messages={messages}
            locale={locale}
            onQueryChange={setQuery}
            onFactoryChange={id => { setFactory(shown.find(entry => entry.id === id) ?? null); setLocationSource(null); }}
            onVisitTypeChange={setVisitType}
          />
          <UrgencyReason value={reason} messages={messages} onChange={setReason} />
        </div>

        <LocationDispatch
          value={{ lat, lng, windowStart, windowEnd, priority, inspectorId, notes }}
          onChange={next => {
            if (next.lat !== lat) onLatChange(next.lat);
            if (next.lng !== lng) onLngChange(next.lng);
            setWindowStart(next.windowStart);
            setWindowEnd(next.windowEnd);
            setPriority(next.priority);
            setInspectorId(next.inspectorId);
            setNotes(next.notes);
          }}
          official={factory?.official_lat != null && factory.official_lng != null
            ? { lat: factory.official_lat, lng: factory.official_lng }
            : null}
          sourceLabel={locationSourceLabel}
          inspectors={inspectors}
          messages={messages}
          locale={locale}
        />
      </div>

      <DispatchChecklist
        packages={packages}
        value={packageId}
        messages={messages.dispatch}
        onChange={setPackageId}
      />

      <input type="hidden" name="window_start" value={windowStart} />
      <input type="hidden" name="window_end" value={windowEnd} />
      <input type="hidden" name="inspector_id" value={inspectorId} />

      <ImmediateOutcome
        reviewed={reviewed}
        onReview={setReviewed}
        error={state.error ?? null}
        pending={pending}
        canSubmit={Boolean(requestId) && identityOk && reasonOk && locationOk && windowOk && reviewed && !pending}
        messages={messages}
      />
    </form>
  );
}
