"use client";
import { useEffect, useRef, useState } from "react";
import { homeForRoles } from "@/lib/role-home";
import { supabaseBrowser } from "@/lib/supabase";
import { logAuthEvent } from "@/lib/audit";
import { IconEye, IconEyeOff, IconShieldCheck } from "../icons";
import SaqeelMark from "./SaqeelMark";
import StoryPanel, { type StoryStrings } from "./StoryPanel";
import DemoAccess, { type DemoAccount, type DemoStrings } from "./DemoAccess";

// SCR-PUB-010 v4 — Saqeel unified sign-in (client half), from Login.dc.html
// Turn 4 ("the inspection story"). Solid credential panel on the start side —
// lockup, one form, trust footer; zero text sits on imagery — beside a story
// panel: framed KSA map showing one sample inspection journey plus one attached
// Plan → Travel → Arrive → Inspect → Review → Decide control strip. No persona selector —
// role routing is server-side (/launch); making the user self-declare
// "admin" was security theatre and leaked the console's existence.
// Credential sign-in is real Supabase auth — ERR-AUTH-001 safe deny,
// anti-enumeration reset, and FND-003 auth audit events are preserved.
export type LoginStrings = {
  dir: "rtl" | "ltr";
  lang: "ar" | "en";
  wordmarkFull: string;
  cardTitle: string;
  cardSub: string;
  idLabel: string;
  idPlaceholder: string;
  pwLabel: string;
  pwPlaceholder: string;
  showPw: string;
  hidePw: string;
  signIn: string;
  signingIn: string;
  authErrorInvalid: string;
  authErrorNetwork: string;
  authErrorGeneric: string;
  resetErrorGeneric: string;
  emailInvalid: string;
  forgotLink: string;
  forgotTitle: string;
  forgotSub: string;
  forgotSend: string;
  forgotSending: string;
  forgotSentTitle: string;
  forgotSentBody: string;
  otpLabel: string;
  otpPlaceholder: string;
  otpInvalid: string;
  otpErrorGeneric: string;
  otpVerify: string;
  otpVerifying: string;
  back: string;
  footTrust: string;
  footSecure: string;
  footCopyright: string;
  securityNote: string;
  langHref: string;
  langLabel: string;
  themeToLight: string;
  themeToDark: string;
  story: StoryStrings;
  demo: DemoStrings;
  demoAccounts: DemoAccount[];
};

type View = "signin" | "forgot" | "forgot-sent";

// Format check only — never an existence check (that would be enumeration).
const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_FORMAT = /^\d{6}$/;
const RECOVERY_OTP_USER_KEY = "saqeel-recovery-otp-user";

function safeSignInError(error: unknown, s: LoginStrings): string {
  const message = error instanceof Error
    ? error.message.toLowerCase()
    : String((error as { message?: unknown } | null)?.message ?? "").toLowerCase();
  if (message.includes("invalid login") || message.includes("invalid credentials")) return s.authErrorInvalid;
  if (message.includes("fetch") || message.includes("network") || message.includes("timeout")) return s.authErrorNetwork;
  return s.authErrorGeneric;
}

export default function LoginClient({ strings: s }: { strings: LoginStrings }) {
  const [view, setView] = useState<View>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailFormatError, setEmailFormatError] = useState<string | null>(null);
  const [otpFormatError, setOtpFormatError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [credentialFocus, setCredentialFocus] = useState(false);

  const forgotHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const otpHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const otpRef = useRef<HTMLInputElement | null>(null);

  // CD-002 focus table: entering "forgot" moves focus to its heading;
  // entering "forgot-sent" moves focus to the OTP heading.
  useEffect(() => {
    if (view === "forgot") forgotHeadingRef.current?.focus();
    else if (view === "forgot-sent") otpHeadingRef.current?.focus();
  }, [view]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const { data, error } = await supabaseBrowser().auth.signInWithPassword({ email, password });
    setBusy(false);
    // Supabase can return an empty session without a transport error (for
    // example when an auth gateway denies the exchange). Treat that exactly
    // like invalid credentials; never fall through to /launch with no session
    // and leave the user on a silent login page (ERR-AUTH-001).
    if (error || !data.session) { setError(safeSignInError(error ?? new Error("invalid credentials"), s)); return; }
    // K-005 — resolve the role home client-side and navigate straight to it,
    // collapsing the old /login -> /launch -> role-home chain by one full
    // server round trip. Hard navigation is kept (not router.push): it
    // guarantees the auth cookie is on the request before the destination
    // renders server-side (router.push races the cookie write). /launch
    // remains the fallback when the role read itself fails — the URL never
    // decides the landing.
    try {
      const { data: roleRows } = await supabaseBrowser()
        .from("user_roles").select("role_key").eq("user_id", data.session.user.id);
      const home = homeForRoles((roleRows ?? []).map(row => row.role_key as string));
      window.location.assign(home ?? "/launch");
    } catch {
      window.location.assign("/launch");
    }
  }

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!EMAIL_FORMAT.test(email)) { setEmailFormatError(s.emailInvalid); return; }
    setEmailFormatError(null);
    // A new request invalidates any abandoned same-tab recovery UX marker.
    sessionStorage.removeItem(RECOVERY_OTP_USER_KEY);
    setBusy(true);
    const { error } = await supabaseBrowser().auth.resetPasswordForEmail(email);
    setBusy(false);
    // Anti-enumeration: never reveal whether the address exists — always
    // advance to the neutral confirmation on success; only surface transport
    // errors. Audit the request (FND-003); the address is hashed client-side.
    if (error) { setError(s.resetErrorGeneric); return; }
    void logAuthEvent("password_reset_requested", email);
    setView("forgot-sent");
  }

  async function verifyResetOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!OTP_FORMAT.test(otp)) {
      setOtpFormatError(s.otpInvalid);
      otpRef.current?.focus();
      return;
    }
    setOtpFormatError(null);
    sessionStorage.removeItem(RECOVERY_OTP_USER_KEY);
    setBusy(true);
    const { data, error } = await supabaseBrowser().auth.verifyOtp({ email, token: otp, type: "recovery" });
    setBusy(false);
    // Safe failure copy covers wrong/expired codes, missing accounts and
    // provider errors without exposing which condition occurred.
    if (error || !data.session) { setError(s.otpErrorGeneric); return; }
    // /reset admits only the same-tab session established by this recovery
    // verification. Supabase's authenticated session remains authoritative;
    // this marker only prevents unrelated signed-in sessions entering the UX.
    sessionStorage.setItem(RECOVERY_OTP_USER_KEY, data.session.user.id);
    window.location.assign("/reset");
  }

  return (
    <div className="lg-page lg-page--split" dir={s.dir} lang={s.lang}>
      <main className="lg-panel"
        onFocusCapture={() => setCredentialFocus(true)}
        onBlurCapture={event => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setCredentialFocus(false);
        }}>
        {/* Top utility row: language only. Sign-in is dark-locked and exposes
            no theme control (ThemeScript / ThemeChannelSync force dark). */}
        <div className="lg-util">
          <a className="lg-lang" href={s.langHref} dir={s.lang === "ar" ? "ltr" : "rtl"}>{s.langLabel}</a>
        </div>

        <div className="lg-center">
          {/* PWA card head — shield + SAQEEL lockup + tagline, one centred unit
              with the form directly below (structure transcribed from
              SAQEEL PWA-Field Login.dc.html, mirroring the field login). */}
          <div className="lg-cardhead">
            <SaqeelMark className="lg-cardhead__mark" />
            <span className="lg-cardhead__brand">
              <span className="lg-cardhead__ar" lang="ar">صقيل</span>
              <span className="lg-cardhead__div" aria-hidden="true" />
              <span className="lg-cardhead__latin" lang="en">SAQEEL</span>
            </span>
            <span className="lg-cardhead__tagline" dir={s.dir}>
              {s.lang === "ar" ? "التفتيش الصناعي" : "INDUSTRIAL INSPECTIONS"}
            </span>
          </div>

          {view === "signin" && (
            <section className="lg-card" aria-label={s.cardTitle}>
              <h1 className="lg-card__title">{s.cardTitle}</h1>
              <p className="lg-card__sub">{s.cardSub}</p>

              <form className="lg-credentials" onSubmit={signIn}>
                <div className="sq-field">
                  <label className="sq-field__label" htmlFor="email">{s.idLabel}</label>
                  <input id="email" className="sq-input lg-input--email" type="email" autoComplete="username"
                    dir="ltr" placeholder={s.idPlaceholder} value={email}
                    onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="sq-field">
                  <label className="sq-field__label" htmlFor="pw">{s.pwLabel}</label>
                  <div className="lg-pwwrap">
                    <input id="pw" className="sq-input" type={showPw ? "text" : "password"}
                      autoComplete="current-password" placeholder={s.pwPlaceholder} value={password}
                      onChange={e => setPassword(e.target.value)} required />
                    <button type="button" className="lg-pwtoggle" onClick={() => setShowPw(v => !v)}
                      aria-label={showPw ? s.hidePw : s.showPw}>
                      {showPw ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>
                </div>
                {error && <div className="sq-banner sq-banner--critical" role="alert">{error}</div>}
                <button className="btn btn-primary btn-lg lg-submit btn-touch" type="submit" disabled={busy}>
                  {busy ? s.signingIn : s.signIn}
                </button>
                <button type="button" className="lg-linkbtn" onClick={() => { setError(null); setView("forgot"); }}>
                  {s.forgotLink}
                </button>
              </form>
              <DemoAccess accounts={s.demoAccounts} strings={s.demo}
                onPick={(em, pw) => { setEmail(em); setPassword(pw); setError(null); }} />
            </section>
          )}

          {view === "forgot" && (
            <section className="lg-card" aria-label={s.forgotTitle}>
              <h1 className="lg-card__title" ref={forgotHeadingRef} tabIndex={-1}>{s.forgotTitle}</h1>
              <p className="lg-card__sub">{s.forgotSub}</p>
              <form className="lg-credentials" onSubmit={sendReset} noValidate>
                <div className={`sq-field${emailFormatError ? " is-invalid" : ""}`}>
                  <label className="sq-field__label" htmlFor="email">{s.idLabel}</label>
                  <input id="email" className="sq-input lg-input--email" type="email" autoComplete="username"
                    dir="ltr" placeholder={s.idPlaceholder} value={email}
                    aria-invalid={emailFormatError ? true : undefined}
                    aria-describedby={emailFormatError ? "email-err" : undefined}
                    onChange={e => { setEmail(e.target.value); setEmailFormatError(null); }} required />
                  {emailFormatError && <p id="email-err" className="sq-field__error">{emailFormatError}</p>}
                </div>
                {error && <div className="sq-banner sq-banner--critical" role="alert">{error}</div>}
                <button className="btn btn-primary btn-lg lg-submit btn-touch" type="submit" disabled={busy} aria-busy={busy}>
                  {busy ? s.forgotSending : s.forgotSend}
                </button>
                <button type="button" className="lg-linkbtn" onClick={() => { setError(null); setEmailFormatError(null); setView("signin"); }}>
                  {s.back}
                </button>
              </form>
            </section>
          )}

          {view === "forgot-sent" && (
            <section className="lg-card" aria-label={s.forgotSentTitle}>
              <div role="status">
                <h1 className="lg-card__title" ref={otpHeadingRef} tabIndex={-1}>{s.forgotSentTitle}</h1>
                <p className="lg-card__sub">{s.forgotSentBody}</p>
              </div>
              <form className="lg-credentials" onSubmit={verifyResetOtp} noValidate>
                <div className={`ax-field${otpFormatError ? " is-invalid" : ""}`}>
                  <label className="ax-field__label" htmlFor="reset-otp">{s.otpLabel}</label>
                  <input ref={otpRef} id="reset-otp" className="ax-input" type="text" inputMode="numeric"
                    autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} dir="ltr"
                    placeholder={s.otpPlaceholder} value={otp}
                    aria-invalid={otpFormatError ? true : undefined}
                    aria-describedby={otpFormatError ? "otp-err" : undefined}
                    onChange={e => {
                      setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                      setOtpFormatError(null);
                      setError(null);
                    }} required />
                  {otpFormatError && <p id="otp-err" className="ax-field__error">{otpFormatError}</p>}
                </div>
                {error && <div className="ax-banner ax-banner--critical" role="alert">{error}</div>}
                <button className="btn btn-primary btn-lg lg-submit btn-touch" type="submit" disabled={busy} aria-busy={busy}>
                  {busy ? s.otpVerifying : s.otpVerify}
                </button>
                <button type="button" className="lg-linkbtn" onClick={() => {
                  setError(null); setOtp(""); setOtpFormatError(null); setView("signin");
                }}>
                  {s.back}
                </button>
              </form>
            </section>
          )}
        </div>

        <footer className="lg-foot">
          <span className="lg-foot__item"><IconShieldCheck /> {s.footTrust} · {s.footSecure}</span>
          {/* Ministry mark — moved down from mid-page (Figma node 370:40975
              "Gov_Logo" ribbon sub-asset), last line of the footer. The old
              "Saqeel — Ministry of Industry and Mineral Resources © 2026"
              copyright line was dropped as redundant with this one; its
              copyright year is folded in here instead of lost. */}
          <div className="lg-foot__ministry">
            <img className="lg-foot__ministry-mark" src="/mim-logo-mark.svg"
              alt={s.lang === "ar" ? "وزارة الصناعة والثروة المعدنية" : "Ministry of Industry and Mineral Resources"} />
            <span className="lg-foot__ministry-label">
              {s.lang === "ar" ? "وزارة الصناعة والثروة المعدنية © 2026" : "Ministry of Industry and Mineral Resources © 2026"}
            </span>
          </div>
        </footer>
      </main>

      <StoryPanel strings={s.story} locale={s.lang}
        subdued={view !== "signin"} paused={credentialFocus || busy} />
    </div>
  );
}
