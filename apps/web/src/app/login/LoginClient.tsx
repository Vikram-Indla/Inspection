"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { IconFingerprint, IconLock, IconEye, IconEyeOff, IconShieldCheck } from "../icons";
import GovBar from "../GovBar";

// SCR-PUB-010 — national sign-in (client half). Layout mirrors the
// app.industry.sa auth pattern: one centered card, Nafath panel first,
// OR divider, credential form below. The Nafath sub-flow (ID → app-approval
// trust number) is a clearly-flagged simulation kept in the path until the
// official integration lands; credential sign-in is the real Supabase auth.
export type LoginStrings = {
  dir: "rtl" | "ltr";
  lang: "ar" | "en";
  govBanner: string;
  howToVerify: string;
  linkTitle: string;
  linkBody: string;
  httpsTitle: string;
  httpsBody: string;
  brandTitle: string;
  brandSub: string;
  cardTitle: string;
  cardSub: string;
  nafathTitle: string;
  nafathSub: string;
  or: string;
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
  nidLabel: string;
  nidHint: string;
  continueBtn: string;
  back: string;
  waitingTitle: string;
  waitingBody: string;
  simulatedNote: string;
  approveSimulated: string;
  verifiedBanner: string;
  footTrust: string;
  footSecure: string;
  footCopyright: string;
  backToLanding: string;
  langHref: string;
  langLabel: string;
};

type View = "methods" | "nafath-id" | "nafath-waiting" | "forgot" | "forgot-sent";

export default function LoginClient({ strings: s }: { strings: LoginStrings }) {
  const [view, setView] = useState<View>("methods");
  const [nafathVerified, setNafathVerified] = useState(false);
  const [nid, setNid] = useState("");
  const [trustNumber] = useState(() => String(10 + Math.floor(Math.random() * 89)));

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
    window.location.assign("/launch");                // role decides the landing, not the URL
  }

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    // Supabase Auth sends the recovery email via its own mailer; the link
    // lands on /reset where the user sets a new password. redirectTo must be
    // in the project's auth redirect allowlist.
    const { error } = await supabaseBrowser().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset`,
    });
    setBusy(false);
    // Do not reveal whether the address exists (anti-enumeration): always
    // advance to the neutral "check your inbox" confirmation on success OR
    // a non-committal failure. Only surface transport errors.
    if (error) { setError(error.message); return; }
    setView("forgot-sent");
  }

  return (
    <div className="lg-page" dir={s.dir} lang={s.lang}>
      <GovBar
        prefix="lg"
        s={{
          banner: s.govBanner,
          howToVerify: s.howToVerify,
          linkTitle: s.linkTitle,
          linkBody: s.linkBody,
          httpsTitle: s.httpsTitle,
          httpsBody: s.httpsBody,
        }}
      />

      <header className="lg-topbar">
        <a className="lg-topbar__brand" href="/">
          <span className="ax-shell__brand-mark">IP</span>
          <span className="lg-topbar__brandtext">
            <strong>{s.brandTitle}</strong>
            <small>{s.brandSub}</small>
          </span>
        </a>
        <nav className="lg-topbar__actions">
          <a href={s.langHref} lang={s.lang === "ar" ? "en" : "ar"}>{s.langLabel}</a>
          <a href="/">{s.backToLanding}</a>
        </nav>
      </header>

      <main className="lg-center">
        <div className="lg-card">
          {view === "methods" && (
            <>
              <h1 className="lg-card__title">{s.cardTitle}</h1>
              <p className="lg-card__sub">{s.cardSub}</p>

              {nafathVerified && (
                <div className="ax-banner ax-banner--success" role="status"><div>{s.verifiedBanner}</div></div>
              )}

              <button type="button" className="lg-nafath" onClick={() => setView("nafath-id")}>
                <span className="lg-nafath__mark" aria-hidden="true"><IconFingerprint size={26} /></span>
                <span className="lg-nafath__text">
                  <strong>{s.nafathTitle}</strong>
                  <span>{s.nafathSub}</span>
                </span>
              </button>

              <div className="lg-or" role="separator" aria-label={s.or}><span>{s.or}</span></div>

              <form onSubmit={signIn} className="lg-credentials">
                <div className="ax-field">
                  <label className="ax-field__label" htmlFor="email">{s.idLabel}</label>
                  <input id="email" className="ax-input" type="email" placeholder={s.idPlaceholder}
                    value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" required />
                </div>
                <div className="ax-field">
                  <label className="ax-field__label" htmlFor="pw">{s.pwLabel}</label>
                  <div className="lg-pwwrap">
                    <input id="pw" className="ax-input" type={showPw ? "text" : "password"} placeholder={s.pwPlaceholder}
                      value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required />
                    <button type="button" className="lg-pwtoggle" onClick={() => setShowPw(v => !v)}
                      aria-label={showPw ? s.hidePw : s.showPw}>
                      {showPw ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>
                </div>
                <button type="button" className="lg-forgot"
                  onClick={() => { setError(null); setView("forgot"); }}>{s.forgotLink}</button>
                {error && <div className="ax-banner ax-banner--critical" role="alert"><div>{error}</div></div>}
                <button className="ax-btn ax-btn--prominent lg-submit" disabled={busy}>{busy ? s.signingIn : s.signIn}</button>
              </form>
            </>
          )}

          {view === "nafath-id" && (
            <form onSubmit={e => { e.preventDefault(); setView("nafath-waiting"); }} className="lg-credentials">
              <h1 className="lg-card__title">{s.nafathTitle}</h1>
              <p className="lg-card__sub">{s.nafathSub}</p>
              <div className="ax-field">
                <label className="ax-field__label" htmlFor="nid">{s.nidLabel}</label>
                <input id="nid" className="ax-input" type="text" inputMode="numeric" pattern="[0-9]{10}"
                  maxLength={10} placeholder={s.nidHint}
                  value={nid} onChange={e => setNid(e.target.value.replace(/\D/g, "").slice(0, 10))} required />
              </div>
              <button className="ax-btn ax-btn--prominent lg-submit" disabled={nid.length !== 10}>{s.continueBtn}</button>
              <button type="button" className="ax-btn ax-btn--secondary lg-submit" onClick={() => setView("methods")}>{s.back}</button>
            </form>
          )}

          {view === "nafath-waiting" && (
            <div className="lg-waiting">
              <div className="lg-waiting__spinner" aria-hidden="true" />
              <h1 className="lg-card__title">{s.waitingTitle}</h1>
              <p className="lg-card__sub">{s.waitingBody}</p>
              <div className="lg-waiting__number">{trustNumber}</div>
              <div className="ax-banner ax-banner--info"><div>{s.simulatedNote}</div></div>
              <button className="ax-btn ax-btn--prominent lg-submit"
                onClick={() => { setNafathVerified(true); setView("methods"); }}>
                {s.approveSimulated}
              </button>
              <button type="button" className="ax-btn ax-btn--secondary lg-submit" onClick={() => setView("methods")}>{s.back}</button>
            </div>
          )}

          {view === "forgot" && (
            <form onSubmit={sendReset} className="lg-credentials">
              <h1 className="lg-card__title">{s.forgotTitle}</h1>
              <p className="lg-card__sub">{s.forgotSub}</p>
              <div className="ax-field">
                <label className="ax-field__label" htmlFor="reset-email">{s.idLabel}</label>
                <input id="reset-email" className="ax-input" type="email" placeholder={s.idPlaceholder}
                  value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" required />
              </div>
              {error && <div className="ax-banner ax-banner--critical" role="alert"><div>{error}</div></div>}
              <button className="ax-btn ax-btn--prominent lg-submit" disabled={busy}>{busy ? s.forgotSending : s.forgotSend}</button>
              <button type="button" className="ax-btn ax-btn--secondary lg-submit"
                onClick={() => { setError(null); setView("methods"); }}>{s.back}</button>
            </form>
          )}

          {view === "forgot-sent" && (
            <div className="lg-waiting">
              <div className="ax-banner ax-banner--success" role="status"><div>{s.forgotSentTitle}</div></div>
              <p className="lg-card__sub">{s.forgotSentBody}</p>
              <button type="button" className="ax-btn ax-btn--prominent lg-submit"
                onClick={() => { setError(null); setView("methods"); }}>{s.back}</button>
            </div>
          )}
        </div>

        <footer className="lg-foot">
          <div className="lg-trust">
            <span><IconShieldCheck size={15} /> {s.footTrust}</span>
            <span><IconLock size={14} /> {s.footSecure}</span>
          </div>
          <p className="lg-foot__copyright">{s.footCopyright}</p>
        </footer>
      </main>
    </div>
  );
}
