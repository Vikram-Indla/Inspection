"use client";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { logAuthEvent } from "@/lib/audit";
import { IconEye, IconEyeOff, IconShieldCheck } from "../icons";
import ThemeToggle from "@/components/ThemeToggle";
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
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailFormatError, setEmailFormatError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [credentialFocus, setCredentialFocus] = useState(false);

  const forgotHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const backLinkRef = useRef<HTMLButtonElement | null>(null);

  // CD-002 focus table: entering "forgot" moves focus to its heading;
  // entering "forgot-sent" moves focus to "Back to sign in".
  useEffect(() => {
    if (view === "forgot") forgotHeadingRef.current?.focus();
    else if (view === "forgot-sent") backLinkRef.current?.focus();
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
    // Hard navigation: guarantees the auth cookie is on the request before
    // /launch renders server-side (router.push races the cookie write).
    // /launch decides the landing by role — the URL never does.
    window.location.assign("/launch");
  }

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!EMAIL_FORMAT.test(email)) { setEmailFormatError(s.emailInvalid); return; }
    setEmailFormatError(null);
    setBusy(true);
    const { error } = await supabaseBrowser().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset`,
    });
    setBusy(false);
    // Anti-enumeration: never reveal whether the address exists — always
    // advance to the neutral confirmation on success; only surface transport
    // errors. Audit the request (FND-003); the address is hashed client-side.
    if (error) { setError(s.resetErrorGeneric); return; }
    void logAuthEvent("password_reset_requested", email);
    setView("forgot-sent");
  }

  const themeLabels = { toLight: s.themeToLight, toDark: s.themeToDark };

  return (
    <div className="lg-page lg-page--split" dir={s.dir} lang={s.lang}>
      <main className="lg-panel"
        onFocusCapture={() => setCredentialFocus(true)}
        onBlurCapture={event => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setCredentialFocus(false);
        }}>
        <header className="lg-lockup">
          <SaqeelMark className="lg-lockup__mark" />
          <span className="lg-lockup__wordmark" lang="ar">{s.wordmarkFull}</span>
          {/* the story panel (and its theme toggle) is hidden on small screens */}
          <div className="lg-controls lg-controls--compact">
            <ThemeToggle className="lg-iconbtn" labels={themeLabels} />
          </div>
        </header>

        <div className="lg-center">
          {view === "signin" && (
            <section className="lg-card" aria-label={s.cardTitle}>
              <h1 className="lg-card__title">{s.cardTitle}</h1>
              <p className="lg-card__sub">{s.cardSub}</p>

              <form className="lg-credentials" onSubmit={signIn}>
                <div className="ax-field">
                  <label className="ax-field__label" htmlFor="email">{s.idLabel}</label>
                  <input id="email" className="ax-input lg-input--email" type="email" autoComplete="username"
                    dir="ltr" placeholder={s.idPlaceholder} value={email}
                    onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="ax-field">
                  <label className="ax-field__label" htmlFor="pw">{s.pwLabel}</label>
                  <div className="lg-pwwrap">
                    <input id="pw" className="ax-input" type={showPw ? "text" : "password"}
                      autoComplete="current-password" placeholder={s.pwPlaceholder} value={password}
                      onChange={e => setPassword(e.target.value)} required />
                    <button type="button" className="lg-pwtoggle" onClick={() => setShowPw(v => !v)}
                      aria-label={showPw ? s.hidePw : s.showPw}>
                      {showPw ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>
                </div>
                {error && <div className="ax-banner ax-banner--critical" role="alert">{error}</div>}
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
                <div className={`ax-field${emailFormatError ? " is-invalid" : ""}`}>
                  <label className="ax-field__label" htmlFor="email">{s.idLabel}</label>
                  <input id="email" className="ax-input lg-input--email" type="email" autoComplete="username"
                    dir="ltr" placeholder={s.idPlaceholder} value={email}
                    aria-invalid={emailFormatError ? true : undefined}
                    aria-describedby={emailFormatError ? "email-err" : undefined}
                    onChange={e => { setEmail(e.target.value); setEmailFormatError(null); }} required />
                  {emailFormatError && <p id="email-err" className="ax-field__error">{emailFormatError}</p>}
                </div>
                {error && <div className="ax-banner ax-banner--critical" role="alert">{error}</div>}
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
                <h1 className="lg-card__title">{s.forgotSentTitle}</h1>
                <p className="lg-card__sub">{s.forgotSentBody}</p>
              </div>
              <button ref={backLinkRef} type="button" className="lg-linkbtn" onClick={() => { setError(null); setView("signin"); }}>
                {s.back}
              </button>
            </section>
          )}
        </div>

        <footer className="lg-foot">
          <span className="lg-foot__item"><IconShieldCheck /> {s.footTrust} · {s.footSecure}</span>
          <span className="lg-foot__item">{s.securityNote}</span>
          <div className="lg-foot__row">
            <span className="lg-foot__copy">{s.footCopyright}</span>
            <a className="lg-lang" href={s.langHref} dir={s.lang === "ar" ? "ltr" : "rtl"}>{s.langLabel}</a>
          </div>
        </footer>
      </main>

      <StoryPanel strings={s.story} locale={s.lang} themeLabels={themeLabels}
        subdued={view !== "signin"} paused={credentialFocus || busy} />
    </div>
  );
}
