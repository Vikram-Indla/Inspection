"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { logAuthEvent } from "@/lib/audit";
import { IconEye, IconEyeOff } from "../icons";

export type ResetStrings = {
  dir: "rtl" | "ltr";
  lang: "ar" | "en";
  brandTitle: string;
  brandSub: string;
  checking: string;
  invalidTitle: string;
  invalidBody: string;
  title: string;
  sub: string;
  pwLabel: string;
  pwPlaceholder: string;
  pw2Label: string;
  pw2Placeholder: string;
  showPw: string;
  hidePw: string;
  mismatch: string;
  save: string;
  saving: string;
  doneTitle: string;
  doneBody: string;
  toSignIn: string;
};

type Stage = "checking" | "form" | "invalid" | "done";

export default function ResetClient({ strings: s }: { strings: ResetStrings }) {
  const [stage, setStage] = useState<Stage>("checking");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // The recovery token arrives in the URL fragment; supabase-js processes it on
  // load and fires PASSWORD_RECOVERY (or establishes a session). If neither
  // happens within a short window, the link is invalid/expired.
  useEffect(() => {
    const sb = supabaseBrowser();
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setStage(cur => (cur === "checking" ? "form" : cur));
      }
    });
    sb.auth.getSession().then(({ data }) => {
      if (data.session) setStage(cur => (cur === "checking" ? "form" : cur));
    });
    const t = setTimeout(() => setStage(cur => (cur === "checking" ? "invalid" : cur)), 4000);
    return () => { subscription.unsubscribe(); clearTimeout(t); };
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pw !== pw2) { setError(s.mismatch); return; }
    setBusy(true);
    const sb = supabaseBrowser();
    const { error } = await sb.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { setError(error.message); return; }  // surfaces Supabase password-policy errors verbatim
    // Audit the completion (FND-003) while the recovery session still exists,
    // so actor = auth.uid() is captured. Best-effort; email hashed client-side.
    const { data } = await sb.auth.getUser();
    if (data.user?.email) await logAuthEvent("password_reset_completed", data.user.email);
    // Drop the short-lived recovery session so sign-in starts clean.
    await sb.auth.signOut();
    setStage("done");
  }

  return (
    <div className="lg-page" dir={s.dir} lang={s.lang}>
      <header className="lg-topbar">
        <a className="lg-topbar__brand" href="/login" lang="ar" dir="rtl">{s.brandTitle}</a>
      </header>

      <main className="lg-center">
        <div className="lg-card">
          {stage === "checking" && (
            <div className="lg-waiting">
              <div className="lg-waiting__spinner" aria-hidden="true" />
              <p className="lg-card__sub">{s.checking}</p>
            </div>
          )}

          {stage === "invalid" && (
            <div className="lg-waiting">
              <div className="ax-banner ax-banner--critical" role="alert"><div>{s.invalidTitle}</div></div>
              <p className="lg-card__sub">{s.invalidBody}</p>
              <a className="ax-btn ax-btn--prominent lg-submit" href="/login">{s.toSignIn}</a>
            </div>
          )}

          {stage === "form" && (
            <form onSubmit={save} className="lg-credentials">
              <h1 className="lg-card__title">{s.title}</h1>
              <p className="lg-card__sub">{s.sub}</p>
              <div className="ax-field">
                <label className="ax-field__label" htmlFor="pw">{s.pwLabel}</label>
                <div className="lg-pwwrap">
                  <input id="pw" className="ax-input" type={showPw ? "text" : "password"} placeholder={s.pwPlaceholder}
                    value={pw} onChange={e => setPw(e.target.value)} autoComplete="new-password" required />
                  <button type="button" className="lg-pwtoggle" onClick={() => setShowPw(v => !v)}
                    aria-label={showPw ? s.hidePw : s.showPw}>
                    {showPw ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
              </div>
              <div className="ax-field">
                <label className="ax-field__label" htmlFor="pw2">{s.pw2Label}</label>
                <input id="pw2" className="ax-input" type={showPw ? "text" : "password"} placeholder={s.pw2Placeholder}
                  value={pw2} onChange={e => setPw2(e.target.value)} autoComplete="new-password" required />
              </div>
              {error && <div className="ax-banner ax-banner--critical" role="alert"><div>{error}</div></div>}
              <button className="ax-btn ax-btn--prominent lg-submit" disabled={busy}>{busy ? s.saving : s.save}</button>
            </form>
          )}

          {stage === "done" && (
            <div className="lg-waiting">
              <div className="ax-banner ax-banner--success" role="status"><div>{s.doneTitle}</div></div>
              <p className="lg-card__sub">{s.doneBody}</p>
              <a className="ax-btn ax-btn--prominent lg-submit" href="/login">{s.toSignIn}</a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
