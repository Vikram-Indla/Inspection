"use client";

import { useEffect, useState } from "react";
import { getFieldDeviceIdentifier } from "@/lib/field-device";
import {
  readFieldDeviceEnrollment,
  selfEnrollFieldDevice,
  type FieldDeviceEnrollmentResult,
} from "../actions";
import {
  clearBiometricUnlock,
  enrollBiometricUnlock,
  platformAuthenticatorAvailable,
  readBiometricUnlock,
  type BiometricUnlockRecord,
} from "@/lib/field-biometric-unlock";
import type { TrustedDevicesStrings } from "./strings";
import styles from "./devices.module.css";

type Locale = "en" | "ar";

// ---------------------------------------------------------------------------
// WHAT IS AND IS NOT REAL ON THIS SCREEN — read before changing anything here.
//
// REAL (backend-authoritative):
//   • The device register. `mvp3_devices` is a real table with real RLS
//     (`mvp3_devices_read` scopes a row to its `assigned_user_id`). Everything
//     this screen renders about trust comes from that row; nothing is inferred
//     client-side, ever.
//   • Trust transitions. Only `mvp3_issue_device_command` (Operations /
//     security_admin) moves a row between trust states. This screen cannot.
//
// NOT REAL (and must never be presented as if it were):
//   • Self-enrolment is gated on the `mvp3_devices_self_enroll_insert` policy.
//     Where that policy is not applied the insert fails with 42501 and the
//     action returns `policy_pending` — enrolment genuinely cannot complete, so
//     the control fails closed with the reason stated instead of retrying.
//   • Biometric unlock is NOT a passkey and NOT a sign-in credential.
//     `lib/field-biometric-unlock.ts` does run a genuine WebAuthn ceremony
//     (`navigator.credentials.create` / `.get`), but the challenge is generated
//     on the client, the public key is never registered with a server, and the
//     assertion is never verified by one — `unlockWithBiometric` returns
//     `assertion != null` and nothing more. It therefore proves only that the
//     platform authenticator on THIS browser succeeded, and it is used for
//     exactly one thing: gating re-entry into a Supabase session that already
//     exists (FieldLoginClient). It cannot mint a session and it is not a
//     second factor. `bioScopeNote` says this to the user in both languages.
//
// Consequence for the UI: every affordance whose precondition is not met is
// rendered disabled with the reason visible. Nothing is hidden to imply it
// works, and nothing is shown enabled unless it will actually complete.
// ---------------------------------------------------------------------------

function trustLabel(result: FieldDeviceEnrollmentResult | null, s: TrustedDevicesStrings): string {
  if (!result) return s.stChecking;
  switch (result.kind) {
    case "not_enrolled": return s.stNotEnrolled;
    case "identifier_collision": return s.stCollision;
    case "signed_out": return s.stSignedOut;
    case "invalid_identifier": return s.stInvalidId;
    case "unavailable": return s.stUnavailable;
    case "policy_pending": return s.stPolicyPending;
    default: break;
  }
  switch (result.trustStatus) {
    case "pending": return s.stPending;
    case "trusted": return s.stTrusted;
    case "suspended": return s.stSuspended;
    case "revoked": return s.stRevoked;
    case "wipe_pending": return s.stWipePending;
    case "wiped": return s.stWiped;
    default: return s.stUnavailable;
  }
}

function trustDetail(result: FieldDeviceEnrollmentResult | null, s: TrustedDevicesStrings): string {
  if (!result) return s.dtChecking;
  switch (result.kind) {
    case "not_enrolled": return s.dtNotEnrolled;
    case "identifier_collision": return s.dtCollision;
    case "signed_out": return s.dtSignedOut;
    case "invalid_identifier": return s.dtInvalidId;
    case "unavailable": return s.dtUnavailable;
    case "policy_pending": return s.dtPolicyPending;
    default: break;
  }
  const registered = result.kind === "already_registered";
  if (result.trustStatus === "pending") return registered ? s.dtPendingRegistered : s.dtPending;
  if (result.trustStatus === "trusted") return registered ? s.dtTrustedRegistered : s.dtTrusted;
  return s.dtUntrusted;
}

/** Platform-authenticator probe result. `checking` is never treated as available. */
type BioSupport = "checking" | "insecure" | "unsupported" | "available";

/** The single source of truth for what the biometric control may do. */
type BioGate = "checking" | "insecure" | "unsupported" | "device-untrusted" | "ready" | "active" | "active-inactive";

export default function TrustedDevicesClient({
  locale,
  userId,
  userLabel,
  strings: s,
}: {
  locale: Locale;
  userId: string;
  userLabel: string;
  strings: TrustedDevicesStrings;
}) {
  const [deviceIdentifier, setDeviceIdentifier] = useState("");
  const [enrollment, setEnrollment] = useState<FieldDeviceEnrollmentResult | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  const [bioSupport, setBioSupport] = useState<BioSupport>("checking");
  const [bioRecord, setBioRecord] = useState<BiometricUnlockRecord | null>(null);
  const [bioBusy, setBioBusy] = useState(false);
  const [bioError, setBioError] = useState(false);

  useEffect(() => {
    const identifier = getFieldDeviceIdentifier();
    setDeviceIdentifier(identifier);
    void readFieldDeviceEnrollment(identifier).then(setEnrollment);
    setBioRecord(readBiometricUnlock(userId));
    // WebAuthn is unavailable outside a secure context. Reporting that as
    // "your device doesn't support Face ID" would be a false statement about
    // the hardware, so it is a distinct, separately-worded state.
    if (!window.isSecureContext) {
      setBioSupport("insecure");
      return;
    }
    void platformAuthenticatorAvailable().then(ok => setBioSupport(ok ? "available" : "unsupported"));
  }, [userId]);

  async function enroll() {
    if (!deviceIdentifier || enrolling) return;
    setEnrolling(true);
    try {
      setEnrollment(await selfEnrollFieldDevice(deviceIdentifier));
    } finally {
      setEnrolling(false);
    }
  }

  const registered = enrollment != null && (enrollment.kind === "enrolled" || enrollment.kind === "already_registered");
  const trusted = registered && enrollment.trustStatus === "trusted";

  // Enrolment affordance. `blocked` is the honest live state where the
  // self-enroll RLS policy is not deployed: the control stays visible so the
  // user can see it exists, but it is disabled and says why.
  const enrollState: "hidden" | "enabled" | "blocked" =
    enrollment?.kind === "not_enrolled" ? "enabled"
      : enrollment?.kind === "policy_pending" ? "blocked"
        : "hidden";

  const bioGate: BioGate =
    bioRecord ? (trusted ? "active" : "active-inactive")
      : bioSupport === "checking" ? "checking"
        : bioSupport === "insecure" ? "insecure"
          : bioSupport === "unsupported" ? "unsupported"
            : !trusted ? "device-untrusted"
              : "ready";

  const bioReason: string = {
    checking: s.bioChecking,
    insecure: s.bioInsecure,
    unsupported: s.bioUnsupported,
    "device-untrusted": s.bioDeviceUntrusted,
    ready: s.bioReady,
    active: s.bioActive,
    "active-inactive": s.bioActiveInactive,
  }[bioGate];

  async function enrollBiometric() {
    if (bioBusy || bioGate !== "ready") return;
    setBioBusy(true);
    setBioError(false);
    try {
      setBioRecord(await enrollBiometricUnlock(userId, userLabel));
    } catch {
      setBioError(true);
    } finally {
      setBioBusy(false);
    }
  }

  function disableBiometric() {
    clearBiometricUnlock(userId);
    setBioRecord(null);
    setBioError(false);
  }

  // Unknown timestamps render an em dash, never an invented date.
  const fmt = (value: string | null): string => {
    if (!value) return "—";
    const d = new Date(value);
    return Number.isNaN(d.getTime())
      ? "—"
      : new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", { dateStyle: "medium", timeStyle: "short" }).format(d);
  };

  const deviceIcon = (
    <span className={styles.icn} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={styles.icnSvg}>
        <rect x="6" y="2" width="12" height="20" rx="2" /><path d="M10 18h4" />
      </svg>
    </span>
  );

  return (
    <div className={styles.wrap}>
      <p className={`t-caption ${styles.intro}`}>{s.intro}</p>

      {/* The ONE real, RLS-scoped device register row for this device. When the
          backend has no row, the same card shape carries the honest status
          instead of a fabricated device. */}
      <div className={styles.card} data-enrollment-state={enrollment?.kind ?? "checking"}>
        {deviceIcon}
        <div className={styles.body}>
          <div className={styles.name}>
            <span className={styles.nameText}>{s.thisDevice}</span>
            <span className={`badge ${trusted ? "badge-compliant" : "badge-warning"}`}>{trustLabel(enrollment, s)}</span>
          </div>
          <div className={`t-caption id-code ${styles.id}`}><bdi>{deviceIdentifier || s.loading}</bdi></div>
          {registered && (
            <>
              <div className={`t-caption ${styles.meta}`}>{s.lastAuth}: {fmt(enrollment.lastSeenAt)}</div>
              <div className="t-caption">{s.enrolled}: {fmt(enrollment.enrolledAt)}</div>
            </>
          )}
          <p className={`t-caption ${styles.reason}`}>{trustDetail(enrollment, s)}</p>
        </div>
      </div>

      {enrollState !== "hidden" && (
        <div>
          <button
            type="button"
            className={`btn btn-primary btn-block btn-lg ${styles.touch}`}
            onClick={() => void enroll()}
            disabled={enrollState === "blocked" || enrolling}
          >
            {enrolling ? s.enrolling : s.enroll}
          </button>
          {enrollState === "blocked" && (
            <p className={`t-caption ${styles.reason} ${styles.reasonWarn}`} role="status">{s.enrollBlocked}</p>
          )}
        </div>
      )}

      {/* Biometric unlock. Always rendered, never hidden — hiding it would leave
          the inspector unable to tell whether the capability is missing or
          merely unavailable. The control is enabled only in the `ready` gate. */}
      <div className={styles.card} data-bio-gate={bioGate}>
        <span className={styles.icn} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={styles.icnSvg}>
            <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
            <path d="M9 10h.01M15 10h.01M9.5 15c.9.7 4.1.7 5 0" />
          </svg>
        </span>
        <div className={styles.body}>
          <div className={styles.name}>
            <span className={styles.nameText}>{s.bioTitle}</span>
            <span className={`badge ${bioGate === "active" ? "badge-compliant" : "badge-warning"}`}>
              {bioRecord ? s.bioOn : s.bioOff}
            </span>
          </div>

          <p className={`t-caption ${styles.reason}`}>{bioReason}</p>

          {bioError && (
            <p className={`t-caption ${styles.reason} ${styles.reasonWarn}`} role="alert">{s.bioError}</p>
          )}

          {/* Scope note — states plainly that this is not a passkey, not a
              credential, and not a second factor. */}
          <div className={styles.callout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={styles.calloutIcon} aria-hidden="true">
              <circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" />
            </svg>
            <span className={styles.calloutText}>{s.bioScopeNote}</span>
          </div>

          <div className={styles.actions}>
            {bioRecord ? (
              <button type="button" className={`btn btn-ghost ${styles.touch}`} onClick={disableBiometric}>
                {s.bioDisable}
              </button>
            ) : (
              <button
                type="button"
                className={`btn btn-primary ${styles.touch}`}
                onClick={() => void enrollBiometric()}
                disabled={bioBusy || bioGate !== "ready"}
              >
                {bioBusy ? s.bioEnabling : s.bioEnable}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={`panel ${styles.hint}`}>
        <svg className={styles.hintIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
          <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" />
        </svg>
        <span>{s.registerNote}</span>
      </div>
    </div>
  );
}
