"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { getFieldDeviceIdentifier } from "@/lib/field-device";
import { readFieldDeviceEnrollment } from "@/app/(app)/field/settings/actions";
import { readBiometricUnlock, unlockWithBiometric, type BiometricUnlockRecord } from "@/lib/field-biometric-unlock";
import { authorizeInspectorLogin, bootstrapFieldSession, safeFieldReturnPath } from "@/lib/field-auth";
import { establishAuthenticatedThemeDefault } from "@/lib/theme-preference";
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
//
// Mental model (corrected from an earlier version of this file): Face ID is an
// UNLOCK for an existing signed-in session on an ALREADY BACKEND-TRUSTED
// device — never a way to establish trust or a fresh login. A device only
// reaches that state by (1) an inspector signing in normally at least once
// with "keep me signed in", (2) Operations approving the device in the real
// device register (readFieldDeviceEnrollment / selfEnrollFieldDevice —
// server-authoritative, never inferred client-side), and (3) the inspector
// opting into biometric unlock from Settings > Security > Trusted Devices,
// which is only offered once step 2 is true.
//
// Concretely, on load this screen checks, in order: is there a persisted
// Supabase session (getSession, local — no fresh login is happening)? Is THIS
// device's identifier reported `trusted` by the real backend register? Has
// this browser opted into a local biometric credential? Only when all three
// hold does the Face ID lock screen appear. Every other case — first run, no
// session, device not yet approved, biometric not opted in, session expired —
// is the exact same plain credential form. There is no "unrecognised device"
// warning: an unenrolled device is the normal, expected first-run state, not
// an anomaly worth alarming a user over.

export type FieldLoginStrings = {
  brand1: string;
  tagline: string;
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
  offlineNote: string;
  dismiss: string;
  copyright: string;
  // Copy with no DC counterpart: states the mockup never had to express.
  bioUnavailable: string;
  bioFallback: string;
  directoryBlocked: string;
  authInvalid: string;
  authNetwork: string;
  signingIn: string;
  unlocking: string;
  checkingSession: string;
  sessionExpired: string;
  offlineKnown: string;
  offlineLoginBlocked: string;
  unauthorizedInspector: string;
  signedOut: string;
  continueOffline: string;
};

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
  localeHref: localeHrefProp,
  returnTo,
  reason,
}: {
  s: FieldLoginStrings;
  dir: "rtl" | "ltr";
  lang: "ar" | "en";
  // Optional override for the language-toggle target. Defaults to the
  // standalone field route so /login/field is unchanged; the unified /login
  // passes its cookie-based /locale route so switching language stays on /login
  // (and keeps the atlas) instead of navigating here.
  localeHref?: string;
  // Session-recovery return path. safeFieldReturnPath tolerates undefined, so
  // the unified /login caller may omit it.
  returnTo?: string;
  reason?: string;
}) {
  const [showPw, setShowPw] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [online, setOnline] = useState(true);

  // Face ID lock-screen eligibility. Starts closed; only flips open once every
  // one of session + backend trust + local opt-in is confirmed. Never assume
  // eligibility while the checks are in flight — the plain form is always the
  // safe default and what renders during that window.
  // returnTo is optional (the unified /login caller omits it); normalise once so
  // every navigation target below is a concrete, validated path.
  const safeReturnTo = useMemo(() => safeFieldReturnPath(returnTo), [returnTo]);
  const [lockScreen, setLockScreen] = useState<{ record: BiometricUnlockRecord; deviceId: string } | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [showPasswordFallback, setShowPasswordFallback] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [offlineReady, setOfflineReady] = useState(false);
  // Login v2 makes the offline note dismissible. It is advisory copy, and on a
  // short viewport it competed with the form for space.
  const [showOfflineNote, setShowOfflineNote] = useState(true);

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
    let cancelled = false;
    (async () => {
      const sb = supabaseBrowser();
      const bootstrap = await bootstrapFieldSession(sb, navigator.onLine);
      if (cancelled) return;
      if (bootstrap.status === "ready") {
        // Same rule as the credential path: an explicit returnTo means a field
        // page asked for this user back; without one, let /launch route by the
        // live role grants rather than assuming the field channel.
        window.location.replace(returnTo ? safeReturnTo : "/launch");
        return;
      }
      if (bootstrap.status === "offline_known") {
        setMessage(s.offlineKnown);
        setOfflineReady(true);
      } else if (bootstrap.status === "expired" || reason === "expired") {
        setMessage(s.sessionExpired);
      } else if (bootstrap.status === "unauthorized") {
        await sb.auth.signOut();
        setMessage(s.unauthorizedInspector);
      } else if (reason === "signedout") {
        setMessage(s.signedOut);
      }
      setBootstrapping(false);

      // 1. Is there a persisted session? If not, this is a fresh login —
      // there is nothing to unlock, so no further check runs.
      const { data: { session } } = await supabaseBrowser().auth.getSession();
      if (cancelled || !session?.user) return;

      // 2. Has THIS browser opted into biometric unlock for THIS user? The
      // check is local-only and cheap, so it runs before the network call.
      const record = readBiometricUnlock(session.user.id);
      if (!record) return;

      // 3. Is this device currently reported trusted by the real backend
      // register? This is the only source of truth for trust — read fresh,
      // never cached, never inferred from the local opt-in record existing.
      const deviceId = getFieldDeviceIdentifier();
      const enrollment = await readFieldDeviceEnrollment(deviceId);
      if (cancelled) return;
      const trusted = "trustStatus" in enrollment && enrollment.trustStatus === "trusted";
      if (!trusted) return;

      setLockScreen({ record, deviceId });
    })();
    return () => {
      cancelled = true;
    };
  }, [reason, returnTo, s.offlineKnown, s.sessionExpired, s.signedOut, s.unauthorizedInspector]);

  const unlockWithFaceId = useCallback(async () => {
    if (!lockScreen) return;
    setMessage(null);
    setUnlocking(true);
    const ok = await unlockWithBiometric(lockScreen.record);
    setUnlocking(false);
    if (!ok) {
      setMessage(s.bioUnavailable);
      setShowPasswordFallback(true);
      return;
    }
    // The biometric ceremony only gates access to the session that already
    // existed at load — it never mints one. Confirm it is still valid rather
    // than assuming so.
    const { data: { session } } = await supabaseBrowser().auth.getSession();
    if (!session) {
      setMessage(s.bioUnavailable);
      setShowPasswordFallback(true);
      return;
    }
    const bootstrap = await bootstrapFieldSession(supabaseBrowser(), navigator.onLine);
    if (bootstrap.status === "ready" || bootstrap.status === "offline_known") window.location.assign(safeReturnTo);
    else {
      setMessage(bootstrap.status === "unauthorized" ? s.unauthorizedInspector : s.sessionExpired);
      setShowPasswordFallback(true);
    }
  }, [lockScreen, returnTo, s.bioUnavailable, s.sessionExpired, s.unauthorizedInspector]);

  const submitCredentials = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setMessage(null);
      if (!navigator.onLine) {
        setMessage(s.offlineLoginBlocked);
        return;
      }

      // The design labels this field "National ID / Staff number". Resolving a
      // national ID or staff number to an account requires the MIM directory
      // contract, which is not supplied. Rather than silently treating the
      // value as an email, the unresolvable case is stated plainly.
      const id = identifier.trim();
      // DEMO-ADMIN-ALIAS-001 — explicit Product Owner demo credential. Supabase
      // Auth remains email-based; this single alias resolves to the separately
      // seeded synthetic account and does not claim a ministry-directory lookup.
      const email = id.toLocaleLowerCase() === "admin1" ? "admin1@mim.gov.sa" : id;
      if (!email.includes("@")) {
        setMessage(s.directoryBlocked);
        return;
      }

      setBusy(true);
      const { data, error } = await supabaseBrowser().auth.signInWithPassword({
        email,
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
      // Authentication surfaces are dark-locked. Carry that product default
      // into the authenticated shell when this browser has no explicit theme
      // preference; never overwrite a user's saved light or dark choice.
      establishAuthenticatedThemeDefault(window.localStorage);
      // Where sign-in lands depends on whether a field page asked for the user
      // back. With an explicit returnTo the user was bounced out of /field, so
      // the inspector grant is the thing to check and the intended page is the
      // destination. Without one this is a plain sign-in on the single /login
      // surface, and role routing is the SERVER's job: /launch reads the live
      // grants and fails closed to /launch/no-workspace on an unmatched role.
      // Deciding "everyone is an inspector, send them to /field" here left every
      // non-field persona — ops, leadership, planner, reviewer — with no way in.
      if (returnTo) {
        if (!(await authorizeInspectorLogin(supabaseBrowser(), data.session, keepSignedIn))) {
          await supabaseBrowser().auth.signOut();
          setMessage(s.unauthorizedInspector);
          return;
        }
        window.location.assign(safeReturnTo);
        return;
      }
      // No rememberInspector here: this path has NOT verified an inspector
      // grant, and marking the device "known inspector" would be a claim the
      // check never made. Supabase already persists the session itself.
      window.location.assign("/launch");
    },
    [identifier, keepSignedIn, password, returnTo, s.directoryBlocked, s.authInvalid, s.authNetwork, s.offlineLoginBlocked, s.unauthorizedInspector],
  );

  const netLabel = online ? s.netOnline : s.netOffline;
  const showLockScreen = lockScreen !== null && !showPasswordFallback;

  const localeHref = useMemo(
    () => localeHrefProp
      ?? `/login?lang=${lang === "ar" ? "en" : "ar"}&next=${encodeURIComponent(safeReturnTo)}`,
    [localeHrefProp, lang, safeReturnTo],
  );

  return (
    <main className="fl-root" dir={dir} lang={lang}>
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
            {/* The authenticated AppShell owns the global theme control. This
                focused sign-in surface keeps only its language control. */}
      </div>

      <div className="fl-stage">
        <div className="fl-col">
          {/* brand lockup */}
          <ShieldIcon />
          <div className="fl-brand">
            <span className="fl-brand-latin" lang="en">
              {s.brand1}
            </span>
            <span className="fl-brand-ar" lang="ar">
              صقيل
            </span>
          </div>
          <div className="t-caption fl-tagline">{s.tagline}</div>

          {/* Face ID lock screen — only when session + backend device trust +
              local opt-in all hold. See the mental-model note above the
              component: this never appears on a first-run or unenrolled
              device, and there is no "unrecognised device" warning — an
              unenrolled device is the normal case, not an anomaly. */}
          {/* The session probe is a STATUS, never a gate. Replacing the card
              with "checking your session" hid the credential form on both
              /login and /login/field whenever the probe was slow or never
              resolved, which left the product with no way to sign in at all.
              Per the note above: the plain form is the safe default and is what
              renders during that window. */}
          {bootstrapping ? (
            <div className="fl-msg" role="status">{s.checkingSession}</div>
          ) : null}
          {showLockScreen ? (
            <>
              <div className="fl-pill fl-trusted-pill">
                <LockIcon />
                {s.trustedDevice} · <span className="id-code" dir="ltr">{lockScreen.deviceId}</span>
              </div>
              <button
                type="button"
                className="fl-bio"
                onClick={unlockWithFaceId}
                aria-label={s.faceUnlock}
                disabled={unlocking}
              >
                <FaceIcon />
              </button>
              <div className="fl-face-title">{unlocking ? s.unlocking : s.faceUnlock}</div>
              <div className="t-caption fl-face-desc">{s.faceDesc}</div>
              <div className="fl-or">
                <span className="fl-or-line" />
                <span className="t-label fl-or-label">{s.orPassword}</span>
                <span className="fl-or-line" />
              </div>
            </>
          ) : null}

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
              {offlineReady && (
                <button type="button" className="btn btn-secondary btn-lg btn-block"
                  onClick={() => window.location.assign(safeReturnTo)}>
                  {s.continueOffline}
                </button>
              )}

              <button type="submit" className="btn btn-primary btn-lg btn-block fl-submit" disabled={busy || !online}>
                {busy ? s.signingIn : s.signIn}
              </button>
          </form>
        </div>
      </div>

      {/* footer: offline-first assurance. Taken out of flow (position:absolute
          in field-login.css) so the credential block stays centred against the
          full column and dismissing the note cannot shift the form. */}
      <div className="fl-foot">
        {showOfflineNote && <div className="fl-foot-note">
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
          <button type="button" className="fl-foot-dismiss" onClick={() => setShowOfflineNote(false)}
            aria-label={s.dismiss} title={s.dismiss}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
              strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>}
        <div className="fl-foot-row">
          <span className="t-caption">{s.copyright}</span>
          {/* The DC's "Last sync 08:41" is a fact about a signed-in device.
              Before authentication there is no sync history to report, so the
              chip states connectivity instead of inventing a timestamp. */}
          <span className="t-caption fl-sync">
            {/* The dot states the same connectivity fact as the label beside
                it — an offline device must never show a compliant indicator. */}
            <span
              className={`fl-sync-dot ${online ? "fl-sync-dot-online" : "fl-sync-dot-offline"}`}
              data-online={online ? "true" : "false"}
              aria-hidden="true"
            />
            {netLabel}
          </span>
        </div>
      </div>
    </main>
  );
}
