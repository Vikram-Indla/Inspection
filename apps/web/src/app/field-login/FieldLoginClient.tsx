"use client";
import { useEffect, useState } from "react";
import { homeForRoles } from "@/lib/role-home";
import { supabaseBrowser } from "@/lib/supabase";
import { IconEye, IconEyeOff } from "../icons";
import ThemeToggle from "@/components/ThemeToggle";

// SCR-PWA-001 — Field Inspector sign-in, from the accepted Claude Design
// direction (SAQEEL Field Login.dc.html). The PWA/installed-app entry point
// (manifest start_url = /field): mobile-first, single column, a live
// network-status pill instead of the desktop /login story panel. Credential
// sign-in is the SAME real Supabase auth path as /login (ERR-AUTH-001 safe
// deny, anti-enumeration reset, FND-003 auth audit events preserved) — this
// is a different shell around the identical auth contract, not a new one.
//
// Deliberately NOT implemented from the design: the trusted-device chip and
// Face ID quick-unlock. No device-trust table, WebAuthn registration flow, or
// verification RPC exists anywhere in this codebase (confirmed by repo-wide
// search) — rendering that UI live would either fabricate a "trusted device"
// state with no backing data or wire a biometric button that does nothing.
// Per project rule, an unavailable integration doesn't get a permanent mock
// standing in for it. This is an open product/schema decision, not a bug.
export type FieldLoginStrings = {
  dir: "rtl" | "ltr";
  lang: "ar" | "en";
  brand1: string;
  brandAr: string;
  tagline: string;
  themeLabel: string;
  langBtn: string;
  netOnline: string;
  netOffline: string;
  idLabel: string;
  idPlaceholder: string;
  password: string;
  pwPlaceholder: string;
  showPw: string;
  hidePw: string;
  keepSignedIn: string;
  forgot: string;
  signIn: string;
  signingIn: string;
  authErrorInvalid: string;
  authErrorNetwork: string;
  authErrorGeneric: string;
  emailInvalid: string;
  offlineNote: string;
  copyright: string;
  langHref: string;
};

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeSignInError(error: unknown, s: FieldLoginStrings): string {
  const message = error instanceof Error
    ? error.message.toLowerCase()
    : String((error as { message?: unknown } | null)?.message ?? "").toLowerCase();
  if (message.includes("invalid login") || message.includes("invalid credentials")) return s.authErrorInvalid;
  if (message.includes("fetch") || message.includes("network") || message.includes("timeout")) return s.authErrorNetwork;
  return s.authErrorGeneric;
}

export default function FieldLoginClient({ strings: s }: { strings: FieldLoginStrings }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailFormatError, setEmailFormatError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(true);

  // Real device connectivity — same navigator.onLine + online/offline event
  // pattern as FieldSyncChips (the one other place this app displays network
  // state). No fabricated "last synced" timestamp: pre-auth, there is no
  // session yet to attribute a sync history to, and no local marker exists
  // that would make one honest.
  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_FORMAT.test(email)) { setEmailFormatError(s.emailInvalid); return; }
    setEmailFormatError(null);
    setBusy(true); setError(null);
    const { data, error } = await supabaseBrowser().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error || !data.session) { setError(safeSignInError(error ?? new Error("invalid credentials"), s)); return; }
    try {
      const { data: roleRows } = await supabaseBrowser()
        .from("user_roles").select("role_key").eq("user_id", data.session.user.id);
      const home = homeForRoles((roleRows ?? []).map(row => row.role_key as string));
      window.location.assign(home ?? "/field");
    } catch {
      window.location.assign("/field");
    }
    void keepSignedIn; // Supabase's own refresh-token persistence already keeps
    // the session alive across launches; this checkbox mirrors the design but
    // has no separate mechanism to wire it to yet (open decision, not faked).
  }

  const themeLabels = { toLight: s.lang === "ar" ? "الوضع الفاتح" : "Light mode", toDark: s.lang === "ar" ? "الوضع الداكن" : "Dark mode" };

  return (
    <div dir={s.dir} lang={s.lang} style={{
      minHeight: "100dvh", display: "flex", flexDirection: "column",
      background: "var(--nav-bg)", color: "var(--nav-text-active)", fontFamily: "var(--font-body)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 20px 0" }}>
        <span className="fl-pill" style={{
          background: online ? "color-mix(in srgb, var(--status-compliant-text) 16%, transparent)" : "color-mix(in srgb, var(--status-warning-text, #b0770a) 20%, transparent)",
          color: online ? "var(--status-compliant-text)" : "var(--status-warning-text, #b0770a)",
        }}>
          <span className={online ? "fl-live" : ""} style={{ width: 7, height: 7, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
          {online ? s.netOnline : s.netOffline}
        </span>
        <span style={{ flex: 1 }} />
        <a className="fl-langbtn" href={s.langHref}>{s.langBtn}</a>
        <ThemeToggle className="fl-langbtn" labels={themeLabels} />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 24px 12px", textAlign: "center" }}>
        <div style={{ width: "100%", maxWidth: 400, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--nav-indicator)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
            style={{ width: 52, height: 52, marginBlockEnd: 14 }} aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /><path d="m9 12 2 2 4-4" />
          </svg>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 28, letterSpacing: ".06em", color: "var(--nav-text-active)" }}>{s.brand1}</span>
            <span lang="ar" style={{ fontWeight: 700, fontSize: 24, color: "var(--nav-text-active)" }}>{s.brandAr}</span>
          </div>
          <div className="t-caption" style={{ color: "var(--nav-text)", marginBlockStart: 6 }}>{s.tagline}</div>

          <form className="lg-credentials" onSubmit={signIn} style={{ width: "100%", textAlign: "start", display: "flex", flexDirection: "column", gap: 14, marginBlockStart: 26 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <span className="t-label" style={{ color: "var(--nav-text)" }}>{s.idLabel}</span>
              <input className="fl-in" type="email" autoComplete="username" dir="ltr" placeholder={s.idPlaceholder}
                value={email} onChange={e => { setEmail(e.target.value); setEmailFormatError(null); }} required />
              {emailFormatError && <p className="ax-field__error">{emailFormatError}</p>}
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              <span className="t-label" style={{ color: "var(--nav-text)" }}>{s.password}</span>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input className="fl-in" type={showPw ? "text" : "password"} autoComplete="current-password"
                  placeholder={s.pwPlaceholder} value={password} onChange={e => setPassword(e.target.value)} required
                  style={{ paddingInlineEnd: 44 }} />
                <button type="button" onClick={() => setShowPw(v => !v)} aria-label={showPw ? s.hidePw : s.showPw}
                  style={{ position: "absolute", insetInlineEnd: 8, border: 0, background: "none", padding: 6, cursor: "pointer", color: "var(--text-muted)", display: "grid", placeItems: "center" }}>
                  {showPw ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </label>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <label className="check" style={{ fontSize: 13, color: "var(--nav-text)", display: "flex", alignItems: "center", gap: 7 }}>
                <input type="checkbox" checked={keepSignedIn} onChange={e => setKeepSignedIn(e.target.checked)} />
                {s.keepSignedIn}
              </label>
              <a href="/login" style={{ fontSize: 13, color: "var(--nav-indicator)" }}>{s.forgot}</a>
            </div>
            {error && <div className="ax-banner ax-banner--critical" role="alert">{error}</div>}
            <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={busy} style={{ marginBlockStart: 6 }}>
              {busy ? s.signingIn : s.signIn}
            </button>
          </form>
        </div>
      </div>

      <div style={{ padding: "0 24px 24px", maxWidth: 440, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "12px 14px", borderRadius: "var(--radius-md)", background: "color-mix(in srgb, var(--nav-text-active) 5%, transparent)", border: "1px solid color-mix(in srgb, var(--nav-text) 18%, transparent)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="var(--nav-indicator)" strokeWidth={1.6} style={{ width: 16, height: 16, flex: "none", marginBlockStart: 1 }} aria-hidden="true">
            <path d="M5 12.55a11 11 0 0 1 14 0M8.5 16.05a6 6 0 0 1 7 0M2 8.82a15 15 0 0 1 20 0" /><circle cx="12" cy="20" r="1" />
          </svg>
          <span className="t-compact" style={{ color: "var(--nav-text)", lineHeight: 1.55 }}>{s.offlineNote}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBlockStart: 12 }}>
          <span className="t-caption" style={{ color: "var(--nav-text)" }}>{s.copyright}</span>
        </div>
      </div>
    </div>
  );
}
