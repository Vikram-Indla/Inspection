"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import "./field-login.css";

// SAQEEL Field Login — implementation of the Claude Design component
// `SAQEEL Field Login.dc.html` (project 5e8154ad-9a7d-4e3d-9b7a-c66ca020bd61).
//
// Structure, spacing, type scale and every token reference are transcribed from
// that DC. Three classes of DC content are deliberately NOT carried across,
// because a mockup may assert things a running system must not:
//
//   1. Prefilled credentials (`1082 447 913` / `inspection2026`) — never ship a
//      form that pre-populates an identity or a secret.
//   2. `DVC-77120` and `Last sync 08:41` — a device id and a sync time are
//      facts about the running device. They are read from real state or the
//      element is not rendered at all.
//   3. The OTP screen's fixed digits and `00:27` countdown — the countdown is
//      real; the cells start empty.
//
// The DC's own copy already says the OTP transport is "not wired in this
// mockup" (DEC-007: Unifonic at release), so that path stays honest-blocked
// rather than simulating a delivery.

export type FieldLoginStrings = {
  brand1: string;
  tagline: string;
  theme: string;
  langBtn: string;
  netOnline: string;
  netOffline: string;
  trustedDevice: string;
  faceUnlock: string;
  faceDesc: string;
  orPassword: string;
  idLabel: string;
  password: string;
  showPw: string;
  keepSignedIn: string;
  forgot: string;
  signIn: string;
  verifyContinue: string;
  offlineNote: string;
  copyright: string;
  synced: string;
  newDeviceTitle: string;
  newDeviceDesc: string;
  otpTitle: string;
  otpDesc: string;
  otpResendIn: string;
  otpResend: string;
  otpVerify: string;
  otpBack: string;
  otpTrustThis: string;
  otpTransportNote: string;
  // Copy with no DC counterpart: states the mockup never had to express.
  bioUnavailable: string;
  directoryBlocked: string;
  authInvalid: string;
  authNetwork: string;
  signingIn: string;
};

// Device trust is stored per-origin and per-device only. The server-side
// trusted-device registry (W1: WebAuthn enrolment -> admin/devices) is not
// built, so there is no claim here that the SERVER trusts this device — only
// that this device has previously enrolled a platform authenticator locally.
const TRUST_KEY = "saqeel.field.deviceTrust.v1";

type DeviceTrust = { deviceId: string; credentialId: string; enrolledAt: string };

function readDeviceTrust(): DeviceTrust | null {
  try {
    const raw = window.localStorage.getItem(TRUST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DeviceTrust>;
    return parsed.deviceId && parsed.credentialId && parsed.enrolledAt
      ? (parsed as DeviceTrust)
      : null;
  } catch {
    return null;
  }
}

const ShieldIcon = () => (
  <svg
    className="fl-shield"
    viewBox="0 0 24 24"
    fill="none"
    stroke="var(--nav-indicator)"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const FaceIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="var(--nav-indicator)"
    strokeWidth="1.6"
    style={{ width: 42, height: 42 }}
    aria-hidden="true"
  >
    <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
    <path d="M9 10h.01M15 10h.01M9.5 15c.9.7 4.1.7 5 0" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ width: 14, height: 14 }} aria-hidden="true">
    <rect x="5" y="11" width="14" height="9" rx="1.5" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

export default function FieldLoginClient({
  s,
  dir,
  lang,
}: {
  s: FieldLoginStrings;
  dir: "rtl" | "ltr";
  lang: "ar" | "en";
}) {
  const [showPw, setShowPw] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const [trust, setTrust] = useState<DeviceTrust | null>(null);
  const [bioAvailable, setBioAvailable] = useState(false);

  // Network state is observed, never assumed: the DC's pill is a live claim
  // about connectivity and the field app is offline-first.
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  useEffect(() => {
    setTrust(readDeviceTrust());
    if (typeof window === "undefined" || !window.PublicKeyCredential) {
      setBioAvailable(false);
      return;
    }
    // Only a platform authenticator (Face ID / Touch ID) counts. A roaming key
    // is not the "this trusted device" guarantee the design's copy promises.
    void PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      .then(setBioAvailable)
      .catch(() => setBioAvailable(false));
  }, []);

  // The Face ID hero renders only when this device has actually enrolled a
  // platform credential. Otherwise the design's own "unrecognised device"
  // branch is the truthful state — no invented DVC id, no fake biometric.
  const trusted = Boolean(trust && bioAvailable);

  const submitLabel = trusted ? s.signIn : s.verifyContinue;

  const unlockWithFaceId = useCallback(async () => {
    if (!trust) return;
    setMessage(null);
    try {
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          allowCredentials: [
            {
              // Stored base64url at enrolment.
              id: Uint8Array.from(atob(trust.credentialId.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0)),
              type: "public-key",
              transports: ["internal"],
            },
          ],
          userVerification: "required",
          timeout: 60_000,
        },
      });
      if (!assertion) throw new Error("no assertion");
      // A WebAuthn assertion proves possession of the device key. It cannot by
      // itself mint a session: that requires server-side verification against
      // the trusted-device registry, which is not built (W1 / admin/devices).
      // Refreshing an existing session is the only truthful completion here.
      const { data, error } = await supabaseBrowser().auth.refreshSession();
      if (error || !data.session) {
        setMessage(s.bioUnavailable);
        return;
      }
      window.location.assign("/field");
    } catch {
      setMessage(s.bioUnavailable);
    }
  }, [trust, s.bioUnavailable]);

  const submitCredentials = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setMessage(null);

      // The design labels this field "National ID / Staff number". Resolving a
      // national ID or staff number to an account requires the MIM directory
      // contract, which is not supplied. Rather than silently treating the
      // value as an email, the unresolvable case is stated plainly.
      const id = identifier.trim();
      if (!id.includes("@")) {
        setMessage(s.directoryBlocked);
        return;
      }

      setBusy(true);
      const { data, error } = await supabaseBrowser().auth.signInWithPassword({
        email: id,
        password,
      });
      setBusy(false);

      if (error) {
        setMessage(/fetch|network/i.test(error.message) ? s.authNetwork : s.authInvalid);
        return;
      }
      if (!data.session) {
        setMessage(s.authInvalid);
        return;
      }
      window.location.assign("/field");
    },
    [identifier, password, s.directoryBlocked, s.authInvalid, s.authNetwork],
  );

  const netLabel = online ? s.netOnline : s.netOffline;

  const localeHref = useMemo(() => `/login/field?lang=${lang === "ar" ? "en" : "ar"}`, [lang]);

  return (
    <div className="fl-root" dir={dir} lang={lang}>
      {/* top utility row */}
      <div className="fl-top">
        <span className={`fl-pill ${online ? "fl-net-online" : "fl-net-offline"}`}>
          <span className={`fl-dot${online ? " fl-live" : ""}`} />
          {netLabel}
        </span>
        <span className="fl-grow" />
        <a className="fl-langbtn" href={localeHref}>
          {s.langBtn}
        </a>
        {/* The DC pairs the language control with a theme control. The field
            channel is fixed dark (see ThemeScript), so there is nothing for a
            theme control to switch and it is deliberately not rendered. The
            language control remains — locale is still a real user choice. */}
      </div>

      <div className="fl-stage">
        <div className="fl-col">
          {/* brand lockup */}
          <ShieldIcon />
          <div className="fl-brand">
            <span className="fl-brand-latin">{s.brand1}</span>
            <span className="fl-brand-ar" lang="ar">
              صقيل
            </span>
          </div>
          <div className="t-caption fl-tagline">{s.tagline}</div>

          {/* trusted-device path */}
          {trusted && trust && (
            <>
              <div className="fl-pill fl-trusted-pill">
                <LockIcon />
                {s.trustedDevice} · <span className="id-code">{trust.deviceId}</span>
              </div>
              <button
                type="button"
                className="fl-bio"
                onClick={unlockWithFaceId}
                aria-label={s.faceUnlock}
              >
                <FaceIcon />
              </button>
              <div className="fl-face-title">{s.faceUnlock}</div>
              <div className="t-caption fl-face-desc">{s.faceDesc}</div>
              <div className="fl-or">
                <span className="fl-or-line" />
                <span className="t-label fl-or-label">{s.orPassword}</span>
                <span className="fl-or-line" />
              </div>
            </>
          )}

          {/* unrecognised-device notice */}
          {!trusted && (
            <div className="fl-warn">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--status-warning-text)"
                strokeWidth="1.7"
                style={{ width: 18, height: 18, flex: "none", marginBlockStart: 1 }}
                aria-hidden="true"
              >
                <path d="M10.3 3.6 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.6a2 2 0 0 0-3.4 0z" />
                <path d="M12 9v4M12 17h.01" />
              </svg>
              <div>
                <div className="fl-warn-title">{s.newDeviceTitle}</div>
                <div className="t-caption fl-warn-desc">{s.newDeviceDesc}</div>
              </div>
            </div>
          )}

          {/* credential form */}
          <form className="fl-form" onSubmit={submitCredentials}>
            <label className="fl-label">
              <span className="t-label">{s.idLabel}</span>
              <input
                className="fl-in"
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
              />
            </label>
            <label className="fl-label">
              <span className="t-label">{s.password}</span>
              <div className="fl-pw-wrap">
                <input
                  className="fl-in fl-pw-in"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="fl-pw-toggle"
                  onClick={() => setShowPw(v => !v)}
                  aria-label={s.showPw}
                  aria-pressed={showPw}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 20, height: 20 }} aria-hidden="true">
                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
            </label>
            <div className="fl-row">
              <label className="check fl-keep">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={e => setKeepSignedIn(e.target.checked)}
                />
                {s.keepSignedIn}
              </label>
              <a href="/reset" className="fl-forgot">
                {s.forgot}
              </a>
            </div>

            {message && (
              <div className="fl-msg" role="alert">
                {message}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg btn-block fl-submit" disabled={busy}>
              {busy ? s.signingIn : submitLabel}
            </button>
          </form>
        </div>
      </div>

      {/* footer: offline-first assurance */}
      <div className="fl-foot">
        <div className="fl-foot-note">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--nav-indicator)"
            strokeWidth="1.6"
            style={{ width: 16, height: 16, flex: "none", marginBlockStart: 1 }}
            aria-hidden="true"
          >
            <path d="M5 12.55a11 11 0 0 1 14 0M8.5 16.05a6 6 0 0 1 7 0M2 8.82a15 15 0 0 1 20 0" />
            <circle cx="12" cy="20" r="1" />
          </svg>
          <span className="t-compact">{s.offlineNote}</span>
        </div>
        <div className="fl-foot-row">
          <span className="t-caption">{s.copyright}</span>
          {/* The DC's "Last sync 08:41" is a fact about a signed-in device.
              Before authentication there is no sync history to report, so the
              chip states connectivity instead of inventing a timestamp. */}
          <span className="t-caption fl-sync">
            <span className="fl-sync-dot" />
            {netLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
