"use client";

import { useCallback, useEffect, useState } from "react";
import { getFieldDeviceIdentifier } from "@/lib/field-device";
import {
  readFieldDeviceEnrollment,
  selfEnrollFieldDevice,
  type DeviceTrustStatus,
  type FieldDeviceEnrollmentResult,
} from "../actions";
import { listFieldDevices, type FieldDeviceListResult, type FieldDeviceListRow } from "./actions";
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
//   • The device register LIST. `listFieldDevices()` (./actions.ts) returns
//     every `mvp3_devices` row RLS releases for this user — that is the design's
//     `sc-for`, and it is the real register, not a sample. Every trust value
//     rendered comes from that row; nothing is inferred client-side, ever.
//   • Trust transitions. Only `mvp3_issue_device_command` (Operations /
//     security_admin) moves a row between trust states. This screen cannot.
//
// NOT REAL (and must never be presented as if it were):
//   • Per-device Revoke. The design mock puts one on every card. The schema has
//     no UPDATE and no DELETE policy on `mvp3_devices`, so no revoke exists that
//     an inspector may call. The control is therefore ABSENT rather than
//     present-and-broken, and `registerNote` names Operations as its owner.
//   • Device NAME. `mvp3_devices` has no name/model column. The bold line is the
//     `platform` check-constraint value rendered in words; an unrecognised value
//     renders an em dash rather than a plausible-looking model name.
//   • Separate Face ID and Touch ID switches. The design shows two. WebAuthn
//     exposes only `isUserVerifyingPlatformAuthenticatorAvailable()` — a single
//     boolean that never says which modality the hardware offers. Two
//     independently-togglable rows would be two invented capabilities, so this
//     renders the one control the platform actually reports.
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
  return statusLabel(result.trustStatus, s);
}

function statusLabel(status: DeviceTrustStatus, s: TrustedDevicesStrings): string {
  switch (status) {
    case "pending": return s.stPending;
    case "trusted": return s.stTrusted;
    case "suspended": return s.stSuspended;
    case "revoked": return s.stRevoked;
    case "wipe_pending": return s.stWipePending;
    case "wiped": return s.stWiped;
    default: return s.stUnavailable;
  }
}

/** Badge tone per real backend trust state. No state borrows another's colour. */
function statusBadge(status: DeviceTrustStatus): string {
  switch (status) {
    case "trusted": return "badge-compliant";
    case "pending": return "badge-pending";
    case "suspended": return "badge-warning";
    case "wipe_pending": return "badge-warning";
    case "revoked": return "badge-critical";
    case "wiped": return "badge-disabled";
    default: return "badge-outline";
  }
}

/**
 * The design's bold device line. `mvp3_devices` carries no name or model, so
 * this renders the `platform` enum in words. An unrecognised value renders an
 * em dash — never a guessed device name.
 */
function platformLabel(platform: string, s: TrustedDevicesStrings): string {
  if (platform === "ipad_os") return s.platformIpadOs;
  if (platform === "web_managed") return s.platformWebManaged;
  return "—";
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
  initialList,
  strings: s,
}: {
  locale: Locale;
  userId: string;
  userLabel: string;
  initialList: FieldDeviceListResult;
  strings: TrustedDevicesStrings;
}) {
  const [deviceIdentifier, setDeviceIdentifier] = useState("");
  const [enrollment, setEnrollment] = useState<FieldDeviceEnrollmentResult | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  // Seeded from the server render, so the register is on screen at first paint
  // and there is no state in which a device silently fails to appear.
  const [list, setList] = useState<FieldDeviceListResult>(initialList);
  const [refreshing, setRefreshing] = useState(false);
  const [online, setOnline] = useState(true);

  const [bioSupport, setBioSupport] = useState<BioSupport>("checking");
  const [bioRecord, setBioRecord] = useState<BiometricUnlockRecord | null>(null);
  const [bioBusy, setBioBusy] = useState(false);
  const [bioError, setBioError] = useState(false);

  useEffect(() => {
    const identifier = getFieldDeviceIdentifier();
    setDeviceIdentifier(identifier);
    void readFieldDeviceEnrollment(identifier).then(setEnrollment);
    setBioRecord(readBiometricUnlock(userId));

    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    // WebAuthn is unavailable outside a secure context. Reporting that as
    // "your device doesn't support Face ID" would be a false statement about
    // the hardware, so it is a distinct, separately-worded state.
    if (!window.isSecureContext) {
      setBioSupport("insecure");
    } else {
      void platformAuthenticatorAvailable().then(ok => setBioSupport(ok ? "available" : "unsupported"));
    }

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [userId]);

  const refreshList = useCallback(async () => {
    setRefreshing(true);
    try {
      setList(await listFieldDevices());
    } finally {
      setRefreshing(false);
    }
  }, []);

  async function enroll() {
    if (!deviceIdentifier || enrolling || !online) return;
    setEnrolling(true);
    try {
      const result = await selfEnrollFieldDevice(deviceIdentifier);
      setEnrollment(result);
      // The register is re-read rather than patched locally: the row the
      // backend actually holds is the only thing allowed on screen.
      if (result.kind === "enrolled" || result.kind === "already_registered") await refreshList();
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

  const rows: FieldDeviceListRow[] = list.kind === "ok" ? list.devices : [];
  const currentInRegister = rows.some(d => d.deviceIdentifier === deviceIdentifier);

  return (
    <div className={styles.wrap}>
      <p className={`t-caption ${styles.intro}`}>{s.intro}</p>

      {!online && (
        <p className={`t-caption ${styles.reason} ${styles.reasonWarn}`} role="status">{s.listOffline}</p>
      )}

      {/* The device register. Every card below is one real, RLS-released
          `mvp3_devices` row — the design's `sc-for`, with no fabricated entry
          and no per-device Revoke, because no revoke exists for this actor. */}
      {list.kind === "signed_out" && (
        <div className={styles.card} data-list-state="signed-out">
          {deviceIcon}
          <div className={styles.body}><p className={`t-caption ${styles.reasonFirst}`} role="status">{s.listSignedOut}</p></div>
        </div>
      )}

      {list.kind === "unavailable" && (
        <div className={styles.card} data-list-state="unavailable">
          {deviceIcon}
          <div className={styles.body}><p className={`t-caption ${styles.reasonFirst} ${styles.reasonWarn}`} role="alert">{s.listUnavailable}</p></div>
        </div>
      )}

      {list.kind === "ok" && rows.length === 0 && (
        <div className={`${styles.card} ${styles.empty}`} data-list-state="empty">
          {deviceIcon}
          <div className={styles.body}>
            <div className={styles.nameText}>{s.listEmptyTitle}</div>
            <p className={`t-caption ${styles.reasonFirst}`}>{s.listEmptyDetail}</p>
          </div>
        </div>
      )}

      {rows.map(d => {
        const isCurrent = d.deviceIdentifier === deviceIdentifier;
        return (
          <div key={d.deviceIdentifier} className={styles.card} data-trust-status={d.trustStatus}>
            {deviceIcon}
            <div className={styles.body}>
              <div className={styles.name}>
                <span className={styles.nameText}>{platformLabel(d.platform, s)}</span>
                {isCurrent && <span className={`badge badge-info ${styles.badgeSm}`}>{s.thisDevice}</span>}
                <span className={`badge ${statusBadge(d.trustStatus)} ${styles.badgeSm}`}>{statusLabel(d.trustStatus, s)}</span>
              </div>
              <div className={`t-caption id-code ${styles.id}`}><bdi>{d.deviceIdentifier}</bdi></div>
              <div className={`t-caption ${styles.meta}`}>{s.lastAuth}: {fmt(d.lastSeenAt)}</div>
              <div className="t-caption">{s.enrolled}: {fmt(d.enrolledAt)}</div>
            </div>
          </div>
        );
      })}

      {refreshing && <p className={`t-caption ${styles.intro}`} role="status">{s.listRefreshing}</p>}

      {/* This device, when the register does not hold it. Same card shape, real
          status, no invented row. */}
      {!currentInRegister && list.kind === "ok" && (
        <div className={styles.card} data-enrollment-state={enrollment?.kind ?? "checking"}>
          {deviceIcon}
          <div className={styles.body}>
            <div className={styles.name}>
              <span className={styles.nameText}>{s.thisDevice}</span>
              <span className={`badge badge-warning ${styles.badgeSm}`}>{trustLabel(enrollment, s)}</span>
            </div>
            <div className={`t-caption id-code ${styles.id}`}><bdi>{deviceIdentifier || s.loading}</bdi></div>
            <p className={`t-caption ${styles.reason}`}>{trustDetail(enrollment, s)}</p>
          </div>
        </div>
      )}

      {enrollState !== "hidden" && (
        <div>
          <button
            type="button"
            className={`btn btn-primary btn-block btn-lg ${styles.touch}`}
            onClick={() => void enroll()}
            disabled={enrollState === "blocked" || enrolling || !online}
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
          merely unavailable. The switch is enabled only in the `ready` gate, and
          only ever reflects a credential this browser genuinely holds. */}
      <div className={`panel ${styles.bioPanel}`} data-bio-gate={bioGate}>
        <div className={styles.bioRow}>
          <span className={`${styles.bioIcn} ${bioGate === "active" ? "" : styles.bioIcnMuted}`} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={styles.icnSvg}>
              <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
              <path d="M9 10h.01M15 10h.01M9.5 15c.9.7 4.1.7 5 0" />
            </svg>
          </span>
          <div className={styles.bioText}>
            <div className={styles.bioTitle}>{s.bioTitle}</div>
            <div className="t-caption">{s.bioSubtitle}</div>
          </div>
          <span className={`badge ${bioGate === "active" ? "badge-compliant" : "badge-disabled"} ${styles.badgeSm}`}>
            {bioRecord ? s.bioOn : s.bioOff}
          </span>
          <label className={`switch ${styles.bioSwitch}`}>
            <input
              type="checkbox"
              checked={bioRecord != null}
              disabled={bioBusy || (bioRecord == null && bioGate !== "ready")}
              aria-label={bioRecord ? s.bioDisable : s.bioEnable}
              onChange={event => {
                if (event.currentTarget.checked) void enrollBiometric();
                else disableBiometric();
              }}
            />
          </label>
        </div>

        <p className={`t-caption ${styles.reason}`}>{bioBusy ? s.bioEnabling : bioReason}</p>

        {bioError && (
          <p className={`t-caption ${styles.reason} ${styles.reasonWarn}`} role="alert">{s.bioError}</p>
        )}
      </div>

      {/* Scope note — states plainly that this is not a passkey, not a
          credential, and not a second factor. */}
      <div className={`panel ${styles.callout}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={styles.calloutIcon} aria-hidden="true">
          <circle cx="12" cy="12" r="9" /><path d="M12 8h.01M11 12h1v4h1" />
        </svg>
        <span className={styles.calloutText}>{s.bioScopeNote}</span>
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
