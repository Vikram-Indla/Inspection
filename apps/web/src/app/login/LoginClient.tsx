"use client";
import { useState } from "react";
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
// panel: framed KSA map showing one sample inspection journey plus the
// four-step Plan → Inspect → Review → Decide strip. No persona selector —
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
  langHref: string;
  langLabel: string;
  themeToLight: string;
  themeToDark: string;
  story: StoryStrings;
  demo: DemoStrings;
  demoAccounts: DemoAccount[];
};

type View = "signin" | "forgot" | "forgot-sent";

export default function LoginClient({ strings: s }: { strings: LoginStrings }) {
  const [view, setView] = useState<View>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { setError(error.message); return; }  // ERR-AUTH-001: deny with safe message
    // Hard navigation: guarantees the auth cookie is on the request before
    // /launch renders server-side (router.push races the cookie write).
    // /launch decides the landing by role — the URL never does.
    window.location.assign("/launch");
  }

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const { error } = await supabaseBrowser().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset`,
    });
    setBusy(false);
    // Anti-enumeration: never reveal whether the address exists — always
    // advance to the neutral confirmation on success; only surface transport
    // errors. Audit the request (FND-003); the address is hashed client-side.
    if (error) { setError(error.message); return; }
    void logAuthEvent("password_reset_requested", email);
    setView("forgot-sent");
  }

  const themeLabels = { toLight: s.themeToLight, toDark: s.themeToDark };

  return (
    <div className="lg-page lg-page--split" dir={s.dir} lang={s.lang}>
      <main className="lg-panel">
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
                <button className="ax-btn ax-btn--prominent lg-submit" type="submit" disabled={busy}>
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
              <h1 className="lg-card__title">{s.forgotTitle}</h1>
              <p className="lg-card__sub">{s.forgotSub}</p>
              <form className="lg-credentials" onSubmit={sendReset}>
                <div className="ax-field">
                  <label className="ax-field__label" htmlFor="email">{s.idLabel}</label>
                  <input id="email" className="ax-input lg-input--email" type="email" autoComplete="username"
                    dir="ltr" placeholder={s.idPlaceholder} value={email}
                    onChange={e => setEmail(e.target.value)} required />
                </div>
                {error && <div className="ax-banner ax-banner--critical" role="alert">{error}</div>}
                <button className="ax-btn ax-btn--prominent lg-submit" type="submit" disabled={busy}>
                  {busy ? s.forgotSending : s.forgotSend}
                </button>
                <button type="button" className="lg-linkbtn" onClick={() => { setError(null); setView("signin"); }}>
                  {s.back}
                </button>
              </form>
            </section>
          )}

          {view === "forgot-sent" && (
            <section className="lg-card" aria-label={s.forgotSentTitle}>
              <h1 className="lg-card__title">{s.forgotSentTitle}</h1>
              <p className="lg-card__sub">{s.forgotSentBody}</p>
              <button type="button" className="lg-linkbtn" onClick={() => { setError(null); setView("signin"); }}>
                {s.back}
              </button>
            </section>
          )}
        </div>

        <footer className="lg-foot">
          <span className="lg-foot__item"><IconShieldCheck /> {s.footTrust} · {s.footSecure}</span>
          <div className="lg-foot__row">
            <span className="lg-foot__copy">{s.footCopyright}</span>
            <a className="lg-lang" href={s.langHref}>{s.langLabel}</a>
          </div>
        </footer>
      </main>

      <StoryPanel strings={s.story} locale={s.lang} themeLabels={themeLabels} />
    </div>
  );
}
