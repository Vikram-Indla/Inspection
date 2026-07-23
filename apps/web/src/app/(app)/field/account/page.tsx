import Link from "next/link";
import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import FieldTabs from "@/components/FieldTabs";
import { getUserRoles } from "@/lib/persona";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";

// SAQEEL Field Account.dc.html — dedicated field Account screen. Previously
// account info was reachable only via the topbar avatar dropdown
// (ShellClient.tsx), with no standalone page. Read-only profile card + entry
// points into Settings and Trusted Devices, per the handoff spec — no
// self-service identity/role editing (matches the console /profile page's
// own "governed elsewhere" note).
export default async function FieldAccountPage() {
  const sb = await supabaseServer();
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => (locale === "ar" ? ar : t(key, en));
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login");

  const [{ data: profile }, roleRows] = await Promise.all([
    sb.from("profiles").select("full_name, email, region, org_scope").eq("user_id", user.id).maybeSingle(),
    getUserRoles(user.id),
  ]);
  const roles = (roleRows.data ?? []).map(r => r.role_key);
  const email = profile?.email ?? user.email ?? "—";
  const initials = (email.split("@")[0].slice(0, 2) || "I").toUpperCase();

  const tabs = (
    <FieldTabs active="account" labels={{
      home: t("field.tabs.dashboard", "Dashboard"),
      myTasks: t("field.tabs.visits", "Visits"),
      establishments: t("field.establishments.title", "Field establishments"),
      notifications: t("field.notifications.title", "Notifications"),
      account: tr("field.account.title", "Account", "الحساب"),
    }} />
  );

  return (
    <Shell current="/field" title={tr("field.account.title", "Account", "الحساب")}>
      <div className="ax-field-page" style={{ display: "flex", flexDirection: "column", gap: "var(--ax-space-300)" }}>
        <section className="ax-surface ax-panel" style={{ padding: "var(--ax-space-300)", display: "flex", alignItems: "center", gap: "var(--ax-space-200)" }}>
          <span className="ax-shell-account__avatar" aria-hidden="true" style={{ inlineSize: 56, blockSize: 56, fontSize: "1.25rem" }}>{initials}</span>
          <div>
            <div style={{ font: "var(--ax-text-heading)" }}>{profile?.full_name ?? tr("field.account.nameUnset", "Inspector", "مفتش")}</div>
            <div className="ax-caption ax-numeric"><bdi dir="ltr">{email}</bdi></div>
            <div className="ax-caption"><bdi dir="ltr">{roles.join(" · ") || "—"}</bdi>{profile?.region ? ` · ${profile.region}` : ""}</div>
          </div>
        </section>

        <section className="ax-surface ax-panel" style={{ padding: 0, display: "flex", flexDirection: "column" }}>
          <Link href="/field/settings" prefetch={false} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--ax-space-200) var(--ax-space-300)", textDecoration: "none", color: "inherit", borderBlockEnd: "1px solid var(--ax-color-border)" }}>
            <span>{tr("field.account.settings", "Settings", "الإعدادات")}</span>
            <span aria-hidden="true" style={{ color: "var(--ax-color-text-secondary)" }}>→</span>
          </Link>
          <Link href="/field/settings/devices" prefetch={false} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--ax-space-200) var(--ax-space-300)", textDecoration: "none", color: "inherit" }}>
            <span>{tr("field.account.devices", "Biometric & trusted devices", "البصمة والأجهزة الموثوقة")}</span>
            <span aria-hidden="true" style={{ color: "var(--ax-color-text-secondary)" }}>→</span>
          </Link>
        </section>

        <a href="/signout" className="ax-btn ax-btn--secondary ax-btn--field" style={{ alignSelf: "flex-start" }}>
          {tr("field.account.signOut", "Sign out", "تسجيل الخروج")}
        </a>
      </div>
      {tabs}
    </Shell>
  );
}
