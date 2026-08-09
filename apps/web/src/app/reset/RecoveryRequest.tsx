"use client";
import { useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase";
import { logAuthEvent } from "@/lib/audit";

export type RecoveryRequestStrings = {
  requestTitle: string;
  requestSub: string;
  emailLabel: string;
  emailPlaceholder: string;
  send: string;
  sending: string;
  sentAria: string;
  sentBody: string;
  otpLabel: string;
  otpPlaceholder: string;
  verify: string;
  verifying: string;
  otpError: string;
  back: string;
};

export default function RecoveryRequest({
  strings: s,
  onVerified,
}: {
  strings: RecoveryRequestStrings;
  onVerified: (userId: string) => void;
}) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const otpRef = useRef<HTMLInputElement | null>(null);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const sb = supabaseBrowser();
    await sb.auth.resetPasswordForEmail(email);
    await logAuthEvent("password_reset_requested", email);
    setBusy(false);
    setCode("");
    setCodeError(null);
    setStep("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setCodeError(null);
    const sb = supabaseBrowser();
    const { data, error } = await sb.auth.verifyOtp({ email, token: code, type: "recovery" });
    setBusy(false);
    if (error || !data.session) {
      setCodeError(s.otpError);
      otpRef.current?.focus();
      return;
    }
    onVerified(data.session.user.id);
  }

  if (step === "email") {
    return (
      <form onSubmit={sendCode} className="lg-credentials" noValidate>
        <h1 className="lg-card__title">{s.requestTitle}</h1>
        <p className="lg-card__sub">{s.requestSub}</p>
        <div className="sq-field">
          <label className="sq-field__label" htmlFor="email">{s.emailLabel}</label>
          <input
            id="email"
            className="sq-input"
            type="email"
            placeholder={s.emailPlaceholder}
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <button className="btn btn-primary btn-lg lg-submit btn-touch" disabled={busy || !email} aria-busy={busy}>
          {busy ? s.sending : s.send}
        </button>
      </form>
    );
  }

  return (
    <section aria-label={s.sentAria} className="lg-credentials">
      <h1 className="lg-card__title">{s.sentAria}</h1>
      <p className="lg-card__sub">{s.sentBody}</p>
      <form onSubmit={verifyCode} className="lg-credentials" noValidate>
        <div className={`sq-field${codeError ? " is-invalid" : ""}`}>
          <label className="sq-field__label" htmlFor="reset-otp">{s.otpLabel}</label>
          <input
            ref={otpRef}
            id="reset-otp"
            className="sq-input"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder={s.otpPlaceholder}
            value={code}
            onChange={e => { setCode(e.target.value); setCodeError(null); }}
            required
            aria-invalid={codeError ? true : undefined}
            aria-describedby={codeError ? "reset-otp-err" : undefined}
          />
          {codeError && <p id="reset-otp-err" className="sq-field__error">{codeError}</p>}
        </div>
        <button className="btn btn-primary btn-lg lg-submit btn-touch" disabled={busy || !code} aria-busy={busy}>
          {busy ? s.verifying : s.verify}
        </button>
      </form>
      <button type="button" className="btn btn-secondary btn-lg lg-submit btn-touch" onClick={() => setStep("email")}>
        {s.back}
      </button>
    </section>
  );
}
