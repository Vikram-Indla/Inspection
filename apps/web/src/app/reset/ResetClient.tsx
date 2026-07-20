"use client";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { getVerifiedUser } from "@/lib/verified-user";
import { logAuthEvent } from "@/lib/audit";
import { IconEye, IconEyeOff } from "../icons";
import ThemeToggle from "@/components/ThemeToggle";

export type ResetStrings = {
  dir: "rtl" | "ltr";
  lang: "ar" | "en";
  brandTitle: string;
  brandSub: string;
  checking: string;
  invalidTitle: string;
  invalidBody: string;
  invalidHint: string;
  title: string;
  sub: string;
  pwLabel: string;
  pwPlaceholder: string;
  pw2Label: string;
  pw2Placeholder: string;
  showPw: string;
  hidePw: string;
  mismatch: string;
  policyError: string;
  saveTransportError: string;
  saveUnexpectedError: string;
  save: string;
  saving: string;
  doneTitle: string;
  doneBody: string;
  toSignIn: string;
  langHref: string;
  langLabel: string;
  themeToLight: string;
  themeToDark: string;
};

type Stage = "checking" | "form" | "invalid" | "done";
type FieldError = { id: "pw" | "pw2"; message: string } | null;

// Deterministic classification — the provider's error.message is never
// rendered or otherwise exposed; only used to pick one of four safe copies.
function classifyResetError(error: unknown): "policy" | "transport" | "invalidSession" | "generic" {
  const raw = error instanceof Error
    ? error.message
    : String((error as { message?: unknown } | null)?.message ?? "");
  const m = raw.toLowerCase();
  if (m.includes("password")) return "policy";
  if (m.includes("fetch") || m.includes("network") || m.includes("timeout")) return "transport";
  if (m.includes("session") || m.includes("token") || m.includes("expired") || m.includes("unauthorized") || m.includes("not authenticated")) return "invalidSession";
  return "generic";
}

export default function ResetClient({ strings: s }: { strings: ResetStrings }) {
  const [stage, setStage] = useState<Stage>("checking");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<FieldError>(null);
  const [busy, setBusy] = useState(false);

  const formHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const invalidCtaRef = useRef<HTMLAnchorElement | null>(null);
  const doneCtaRef = useRef<HTMLAnchorElement | null>(null);
  const pwRef = useRef<HTMLInputElement | null>(null);
  const pw2Ref = useRef<HTMLInputElement | null>(null);

  // CD-002 focus table: checking->form -> form heading; ...->invalid -> the
  // "Go to sign in" action; save success -> the same action on "done".
  useEffect(() => {
    if (stage === "form") formHeadingRef.current?.focus();
    else if (stage === "invalid") invalidCtaRef.current?.focus();
    else if (stage === "done") doneCtaRef.current?.focus();
  }, [stage]);

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
    setBannerError(null); setFieldError(null);
    if (pw !== pw2) {
      setFieldError({ id: "pw2", message: s.mismatch });
      pw2Ref.current?.focus();
      return;
    }
    setBusy(true);
    const sb = supabaseBrowser();
    const { error } = await sb.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) {
      const kind = classifyResetError(error);
      if (kind === "policy") {
        setBannerError(s.policyError);
        setFieldError({ id: "pw", message: s.policyError });
        pwRef.current?.focus();
        return;
      }
      if (kind === "transport") { setBannerError(s.saveTransportError); return; }
      if (kind === "invalidSession") { setStage("invalid"); return; }
      setBannerError(s.saveUnexpectedError);
      return;
    }
    // Audit the completion (FND-003) while the recovery session still exists,
    // so actor = auth.uid() is captured. Best-effort; email hashed client-side.
    const { data } = await getVerifiedUser(sb);
    if (data.user?.email) await logAuthEvent("password_reset_completed", data.user.email);
    // Drop the short-lived recovery session so sign-in starts clean.
    await sb.auth.signOut();
    setStage("done");
  }

  const themeLabels = { toLight: s.themeToLight, toDark: s.themeToDark };

  return (
    <div className="lg-page" dir={s.dir} lang={s.lang}>
      <header className="lg-topbar">
        <a className="lg-topbar__brand" href="/login" lang="ar" dir="rtl">{s.brandTitle}</a>
        <div className="lg-controls">
          <ThemeToggle className="lg-iconbtn" labels={themeLabels} />
          <a className="lg-lang" href={s.langHref} dir={s.lang === "ar" ? "ltr" : "rtl"}>{s.langLabel}</a>
        </div>
      </header>

      <main className="lg-center">
        <div className="lg-card">
          {stage === "checking" && (
            <div className="lg-waiting" role="status" aria-busy="true">
              <div className="lg-waiting__spinner" aria-hidden="true" />
              <p className="lg-card__sub">{s.checking}</p>
            </div>
          )}

          {stage === "invalid" && (
            <div className="lg-waiting">
              <div className="ax-banner ax-banner--critical" role="alert">
                <div>{s.invalidTitle}</div>
                <div>{s.invalidBody}</div>
              </div>
              <p className="lg-card__sub">{s.invalidHint}</p>
              <a ref={invalidCtaRef} className="btn btn-primary btn-lg lg-submit btn-touch" href="/login">{s.toSignIn}</a>
            </div>
          )}

          {stage === "form" && (
            <form onSubmit={save} className="lg-credentials" noValidate>
              <h1 className="lg-card__title" ref={formHeadingRef} tabIndex={-1}>{s.title}</h1>
              <p className="lg-card__sub">{s.sub}</p>
              <div className={`ax-field${fieldError?.id === "pw" ? " is-invalid" : ""}`}>
                <label className="ax-field__label" htmlFor="pw">{s.pwLabel}</label>
                <div className="lg-pwwrap">
                  <input ref={pwRef} id="pw" className="ax-input" type={showPw ? "text" : "password"} placeholder={s.pwPlaceholder}
                    value={pw} onChange={e => { setPw(e.target.value); if (fieldError?.id === "pw") setFieldError(null); }}
                    autoComplete="new-password" required
                    aria-invalid={fieldError?.id === "pw" ? true : undefined}
                    aria-describedby={fieldError?.id === "pw" ? "pw-err" : undefined} />
                  <button type="button" className="lg-pwtoggle" onClick={() => setShowPw(v => !v)}
                    aria-label={showPw ? s.hidePw : s.showPw}>
                    {showPw ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
                {fieldError?.id === "pw" && <p id="pw-err" className="ax-field__error">{fieldError.message}</p>}
              </div>
              <div className={`ax-field${fieldError?.id === "pw2" ? " is-invalid" : ""}`}>
                <label className="ax-field__label" htmlFor="pw2">{s.pw2Label}</label>
                <input ref={pw2Ref} id="pw2" className="ax-input" type={showPw ? "text" : "password"} placeholder={s.pw2Placeholder}
                  value={pw2} onChange={e => { setPw2(e.target.value); if (fieldError?.id === "pw2") setFieldError(null); }}
                  autoComplete="new-password" required
                  aria-invalid={fieldError?.id === "pw2" ? true : undefined}
                  aria-describedby={fieldError?.id === "pw2" ? "pw2-err" : undefined} />
                {fieldError?.id === "pw2" && <p id="pw2-err" className="ax-field__error">{fieldError.message}</p>}
              </div>
              {bannerError && <div className="ax-banner ax-banner--critical" role="alert"><div>{bannerError}</div></div>}
              <button className="btn btn-primary btn-lg lg-submit btn-touch" disabled={busy} aria-busy={busy}>{busy ? s.saving : s.save}</button>
            </form>
          )}

          {stage === "done" && (
            <div className="lg-waiting" role="status">
              <div className="ax-banner ax-banner--success"><div>{s.doneTitle}</div></div>
              <p className="lg-card__sub">{s.doneBody}</p>
              <a ref={doneCtaRef} className="btn btn-primary btn-lg lg-submit btn-touch" href="/login">{s.toSignIn}</a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
