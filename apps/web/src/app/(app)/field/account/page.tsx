import Link from "next/link";
import { redirect } from "next/navigation";
import FieldNav from "@/components/field/FieldNav";
import FieldHeader from "@/components/field/FieldHeader";
import { getUserRoles } from "@/lib/persona";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import styles from "./account.module.css";

// SAQEEL Field Account.dc.html (isProfile view) — the design's Account screen:
// a profile card (avatar-lg + name + role + email + gear→Settings), an
// "Account" section (Personal ID / Mobile / Entity), a "Settings" section that
// links out to the appearance/language and trusted-devices screens, a danger
// Sign-out button and the ministry footer. Account is a bottom-nav destination,
// so the shared FieldNav is rendered (active="account").
//
// Read-only: no self-service identity/role editing (matches the console
// /profile page's own "governed elsewhere" note). Every value is real,
// RLS-scoped data; where the schema has no backing column the field renders a
// governed "—" — never a fabricated value (CLAUDE.md: never invent identifiers).
export default async function FieldAccountPage() {
  const sb = await supabaseServer();
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => (locale === "ar" ? ar : t(key, en));
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login"); // ERR-AUTH-001: never proceed with a null session

  const [{ data: profile }, roleRows] = await Promise.all([
    sb.from("profiles").select("full_name, email, region, org_scope").eq("user_id", user.id).maybeSingle(),
    getUserRoles(user.id),
  ]);
  const roles = (roleRows.data ?? []).map(r => r.role_key);
  const email = profile?.email ?? user.email ?? "—";
  const initials = (email.split("@")[0].slice(0, 2) || "I").toUpperCase();
  const roleLine = roles.join(" · ") || "—";

  // Design "Account" section fields. The profiles table (0001_foundation.sql)
  // carries only full_name/email/region/org_scope — there is NO national-id or
  // phone column, so Personal ID and Mobile render a governed "—" rather than a
  // fabricated value. Entity maps to the real org_scope column, "—" when unset.
  const accountRows: Array<{ key: string; label: string; value: string; numeric?: boolean }> = [
    { key: "personalId", label: tr("field.account.personalId", "Personal ID", "المعرّف الشخصي"), value: "—", numeric: true },
    { key: "mobile", label: tr("field.account.mobile", "Mobile", "الجوال"), value: "—", numeric: true },
    { key: "entity", label: tr("field.account.entity", "Entity", "الجهة"), value: profile?.org_scope ?? "—" },
  ];

  const langHref = locale === "ar" ? "/locale?set=en" : "/locale?set=ar";
  const langLabel = locale === "ar" ? "EN" : "AR";

  const chevron = (
    <span className={styles.chev} aria-hidden="true">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" data-directional><path d="m9 6 6 6-6 6" /></svg>
    </span>
  );

  return (
    <>
      <FieldHeader
        title={tr("field.account.title", "Account", "الحساب")}
        langHref={langHref} langLabel={langLabel}
        themeLabels={{
          toLight: tr("field.theme.toLight", "Light mode", "الوضع الفاتح"),
          toDark: tr("field.theme.toDark", "Dark mode", "الوضع الداكن"),
        }}
      />

      <div className={styles.wrap}>
        {/* Profile card — avatar + name + role + email + gear→Settings */}
        <section className={`${styles.card} ${styles.profile}`}>
          <span className="avatar avatar-lg" aria-hidden="true"
            style={{ background: "var(--action-primary)", color: "var(--text-on-action)", width: 56, height: 56, fontSize: 20 }}>{initials}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 17 }}><bdi>{profile?.full_name ?? tr("field.account.nameUnset", "Inspector", "مفتش")}</bdi></div>
            <div className="t-caption"><bdi dir="ltr">{roleLine}</bdi>{profile?.region ? ` · ${profile.region}` : ""}</div>
            <div className="t-caption id-code" style={{ marginBlockStart: 2 }}><bdi dir="ltr">{email}</bdi></div>
          </div>
          <Link href="/field/settings" prefetch={false} className="btn btn-icon btn-ghost" aria-label={tr("field.account.settings", "Settings", "الإعدادات")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ width: 20, height: 20 }}>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>
        </section>

        {/* Account section — Personal ID / Mobile / Entity */}
        <section className={styles.card} style={{ padding: "6px 0" }}>
          <div className={styles.groupLabel}>{tr("field.account.title", "Account", "الحساب")}</div>
          {accountRows.map(row => (
            <div key={row.key} className={styles.fieldRow}>
              <span className="t-caption" style={{ width: 150, flex: "none" }}>{row.label}</span>
              <span className={row.numeric ? "id-code" : undefined} style={{ flex: 1, minWidth: 0, fontSize: row.numeric ? undefined : "13.5px" }}>
                <bdi dir={row.numeric ? "ltr" : undefined}>{row.value}</bdi>
              </span>
            </div>
          ))}
        </section>

        {/* Settings section — link out to the appearance/language & devices screens */}
        <section className={styles.card} style={{ padding: "6px 0" }}>
          <div className={styles.groupLabel}>{tr("field.account.settings", "Settings", "الإعدادات")}</div>
          <Link href="/field/settings" prefetch={false} className={styles.linkRow}>
            <span style={{ flex: 1 }}>{tr("field.account.appearanceLanguage", "Appearance & language", "المظهر واللغة")}</span>
            {chevron}
          </Link>
          <Link href="/field/settings/devices" prefetch={false} className={styles.linkRow}>
            <span style={{ flex: 1 }}>{tr("field.account.devices", "Biometric & trusted devices", "البصمة والأجهزة الموثوقة")}</span>
            {chevron}
          </Link>
        </section>

        <a href="/signout" className="btn btn-danger btn-block">
          {tr("field.account.logout", "Sign out", "تسجيل الخروج")}
        </a>

        <div className="t-caption" style={{ textAlign: "center" }}>
          {tr("field.account.footer", "SAQEEL — Ministry of Industry and Mineral Resources © 2026", "صقيل — وزارة الصناعة والثروة المعدنية © 2026")}
        </div>
      </div>

      <div aria-hidden="true" style={{ height: 58, flex: "none" }} />
      <FieldNav active="account" labels={{
        home: tr("field.tabs.home", "Home", "الرئيسية"),
        myTasks: tr("field.tabs.myTasks", "My Tasks", "مهامي"),
        establishments: tr("field.tabs.establishments", "Establishments", "المنشآت"),
        notifications: tr("field.tabs.notifications", "Notifications", "الإشعارات"),
        account: tr("field.tabs.account", "Account", "الحساب"),
      }} />
    </>
  );
}
