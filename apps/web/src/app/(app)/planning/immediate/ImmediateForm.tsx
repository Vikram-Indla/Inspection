"use client";
import { useActionState, useEffect, useRef, useState } from "react";
import { createImmediateVisit, type ImmResult } from "./actions";
import LocationDispatch from "@/components/sections/planning-immediate/location-dispatch/location-dispatch";
import ImmediateOutcome from "@/components/sections/planning-immediate/immediate-outcome/immediate-outcome";
import DispatchProtections from "@/components/sections/planning-immediate/dispatch-protections/dispatch-protections";
import IdentitySection from "@/components/sections/planning-immediate/identity-section/identity-section";
import UrgencyReason from "@/components/sections/planning-immediate/urgency-reason/urgency-reason";
import PlanningNotice from "@/components/sections/planning-single/planning-notice/planning-notice";
import { dispatchProtections } from "@/features/planning-immediate/protections";
import { urgencyReasonLabel, urgencyReasonSatisfied } from "@/features/planning-immediate/reasons";
import type { ImmediateFormStrings, ImmediateMessages } from "@/features/planning-immediate/strings";
import type { ImmediateFactory, ImmediatePlanningData } from "@/features/planning-immediate/types";
import type { Locale } from "@/lib/i18n";
import styles from "./immediate-form.module.css";

type F = ImmediateFactory;


// Saudi mobile, configurable-format stand-in: optional +966/0 prefix then 5XXXXXXXX.
const MOBILE_RE = /^(?:\+?966|0)?5\d{8}$/;
const normalizeMobile = (v: string) => v.replace(/[\s-]/g, "");


export default function ImmediateForm({ data, locale, strings, messages }: {
  data: ImmediatePlanningData;
  locale: Locale;
  strings: ImmediateFormStrings;
  messages: ImmediateMessages;
}) {
  const { factories, packages, inspectors, cityOptions, cityByRegion, actorName, visitTypes, manualReasons, initialFactoryId } = data;
  const { actorMode, manualEntryAllowed: manualAllowed } = data;
  const [state, formAction, pending] = useActionState<ImmResult, FormData>(createImmediateVisit, {});

  const [mode, setMode] = useState<"registered" | "unregistered">("registered");
  const [query, setQuery] = useState("");
  const [factory, setFactory] = useState<F | null>(() => (initialFactoryId ? factories.find(f => f.id === initialFactoryId) ?? null : null));
  const [notFoundConfirmed, setNotFoundConfirmed] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualCr, setManualCr] = useState("");
  const [manualLicense, setManualLicense] = useState("");
  const [manualActivity, setManualActivity] = useState("");
  const [manualRegion, setManualRegion] = useState("");
  const [manualCity, setManualCity] = useState("");
  const [manualReasonKey, setManualReasonKey] = useState("");
  const [manualReasonComment, setManualReasonComment] = useState("");
  const [notifyFactory, setNotifyFactory] = useState(false);
  const [factoryMobile, setFactoryMobile] = useState("");
  const [reason, setReason] = useState("");
  const [enforcementAction, setEnforcementAction] = useState("");
  const [enforcementNotes, setEnforcementNotes] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [locationSource, setLocationSource] = useState<"official" | "manual" | null>(null);
  const [locationAt, setLocationAt] = useState("");
  const [packageId, setPackageId] = useState("");
  const [inspectorId, setInspectorId] = useState("");
  const [visitType, setVisitType] = useState(visitTypes.find(v => v.manualEntryAllowed)?.key ?? visitTypes[0]?.key ?? "complaint");
  const [windowStart, setWindowStart] = useState("");
  const [windowEnd, setWindowEnd] = useState("");
  const [priority, setPriority] = useState("");
  const [notes, setNotes] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [requestId, setRequestId] = useState("");
  useEffect(() => { setRequestId(crypto.randomUUID()); }, []);


  // PLN-REQ-025 — all three legs must hold before manual entry is reachable:
  // permission (manualAllowed), the selected visit type permits unregistered
  // factories, and the governed reason list loaded. The not-found confirmation
  // (fourth control) sits inside the manual panel itself.
  const selectedType = visitTypes.find(v => v.key === visitType);
  // An urgent request is executable only against a registered target. Manual
  // establishment creation stays deliberately unavailable; urgency does not
  // weaken target identity or supervision.
  const immediateExecutable = true;
  const manualAvailable = false;
  useEffect(() => {
    if (mode === "unregistered" && !manualAvailable) setMode("registered");
  }, [manualAvailable, mode]);
  const manualLockReason = manualAvailable ? null
    : !manualAllowed ? strings.manualLockedPermission
      : manualReasons.length === 0 ? strings.manualLockedLookups
        : strings.manualLockedType;

  const ql = query.trim().toLowerCase();
  const shown = ql.length >= 2
    ? factories.filter(f => f.cr_number?.toLowerCase().includes(ql) || (f.license_number ?? "").toLowerCase().includes(ql) || f.name.toLowerCase().includes(ql))
    : factories;

  const latNum = Number(lat); const lngNum = Number(lng);
  const locationOk = lat !== "" && lng !== "" && Number.isFinite(latNum) && Number.isFinite(lngNum)
    && latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180;
  // PLN-REQ-026 — manual identity: not-found confirmation + establishment name +
  // region + city are required; the reason dropdown (Other → comment) and the
  // conditional contact mobile (required when factory notification is on) too.
  const manualReasonOk = manualReasonKey !== "" && (manualReasonKey !== "other" || manualReasonComment.trim() !== "");
  const mobileOk = !notifyFactory || MOBILE_RE.test(normalizeMobile(factoryMobile));
  const identityOk = mode === "registered" ? factory != null
    : notFoundConfirmed && manualName.trim() !== "" && manualRegion.trim() !== "" && manualCity.trim() !== "" && manualReasonOk && mobileOk;
  const reasonOk = urgencyReasonSatisfied(reason, notes);
  const packageOk = true; // optional while planning; required before execution
  const windowOk = actorMode === "inspector"
    || (!!windowStart && !!windowEnd && new Date(windowEnd).getTime() > new Date(windowStart).getTime());
  const inspectorOk = true; // Supervisor confirms one named Inspector on approval

  // Dependent city list (PLN-REQ-026): cities observed under the chosen region,
  // falling back to the full list when the region is free-typed.
  const manualCityOptions = (manualRegion && cityByRegion[manualRegion]) || cityOptions;

  const onLatChange = (v: string) => { setLat(v); setLocationSource("manual"); setLocationAt(new Date().toISOString()); };
  const onLngChange = (v: string) => { setLng(v); setLocationSource("manual"); setLocationAt(new Date().toISOString()); };

  const locationSourceLabel = locationSource === "official" ? messages.location.sourceOfficial
    : locationSource === "manual" ? messages.location.sourceManual.replace("{who}", actorName).replace("{when}", locationAt)
    : messages.location.sourceNone;

  const protections = dispatchProtections({
    blockingField: state.blockingField ?? null,
    actorMode,
    identityMode: mode,
    reasonSatisfied: reasonOk,
    reasonLabel: urgencyReasonLabel(reason, messages),
    reasonNeedsNotes: reason === "Other" && notes.trim() === "",
    identitySatisfied: identityOk,
    locationSatisfied: locationOk,
    locationSource,
    checklistLabel: packageId ? (packages.find(p => p.id === packageId)?.version_label ?? null) : null,
    inspectorChosen: inspectorId !== "",
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
      <DispatchProtections protections={protections} messages={messages.protections} />

      <PlanningNotice tone="warning">
        <strong>{strings.r05BlockedTitle}</strong> {strings.r05BlockedBody}
      </PlanningNotice>

      <div className={styles.columns}>
        <IdentitySection
          selection={{ query, factory, visitType }}
          matches={shown}
          visitTypes={visitTypes}
          lockReason={manualLockReason}
          messages={messages}
          locale={locale}
          onQueryChange={setQuery}
          onFactoryChange={id => { setFactory(shown.find(f => f.id === id) ?? null); setLocationSource(null); }}
          onVisitTypeChange={setVisitType}
        />

        <UrgencyReason value={reason} messages={messages} onChange={setReason} />
        <LocationDispatch
          value={{ lat, lng, windowStart, windowEnd, priority, packageId, inspectorId, notes }}
          onChange={next => {
            if (next.lat !== lat) onLatChange(next.lat);
            if (next.lng !== lng) onLngChange(next.lng);
            setWindowStart(next.windowStart);
            setWindowEnd(next.windowEnd);
            setPriority(next.priority);
            setPackageId(next.packageId);
            setInspectorId(next.inspectorId);
            setNotes(next.notes);
          }}
          official={factory?.official_lat != null && factory.official_lng != null
            ? { lat: factory.official_lat, lng: factory.official_lng }
            : null}
          sourceLabel={locationSourceLabel}
          catalogue={{ packages, inspectors }}
          messages={messages}
          locale={locale}
        />
      </div>

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
