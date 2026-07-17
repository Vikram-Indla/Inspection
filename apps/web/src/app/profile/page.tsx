import { redirect } from "next/navigation";
import Shell from "@/components/Shell";
import ThemeToggle from "@/components/ThemeToggle";
import { getServerUser, supabaseServer } from "@/lib/supabase-server";
import { useT } from "@/lib/i18n";
import NotificationPrefsForm from "./NotificationPrefsForm";

// DEF-PRF-003 — Profile Settings, approved extent only (Cycle 2 Wave 1):
// personal details display, language, light/dark preference, notification
// preferences, session/security information. No role self-grant, no
// unrestricted identity editing — everything below this line is read-only
// except the notification-channel form, which writes only
// notification_preferences (own row, RLS-enforced).
//
// UX correction pass: every Latin-script value (email, dates, role keys) is
// wrapped in <bdi dir="ltr"> so it renders correctly inside an Arabic/RTL
// row instead of the value/label reordering seen in the original build
// (matches the <bdi dir="ltr"> convention already used throughout the app,
// e.g. reports/inspection/[id]/page.tsx, admin/regulations/page.tsx).
export const dynamic = "force-dynamic";

export default async function ProfileSettings() {
  const { t, locale } = await useT();
  const sb = await supabaseServer();
  const { data: { user } } = await getServerUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: roleRows }, { data: pref }, { data: claimsData }] = await Promise.all([
    sb.from("profiles").select("full_name, email, region, org_scope, created_at").eq("user_id", user.id).maybeSingle(),
    sb.from("user_roles").select("role_key").eq("user_id", user.id),
    sb.from("notification_preferences").select("push_enabled, sms_enabled, email_enabled").eq("user_id", user.id).maybeSingle(),
    sb.auth.getClaims(),
  ]);
  const roles = (roleRows ?? []).map(r => r.role_key);
  const claims = claimsData?.claims as { iat?: number; exp?: number } | undefined;
  const issuedAt = claims?.iat ? new Date(claims.iat * 1000).toISOString().slice(0, 16).replace("T", " ") : null;
  const expiresAt = claims?.exp ? new Date(claims.exp * 1000).toISOString().slice(0, 16).replace("T", " ") : null;
  // Role keys are canonical identifiers (roles.role_key), not free text — kept
  // as-is (bdi/ltr) rather than inventing a per-role translation surface.
  const roleLabel = (key: string) => key;

  const languageHref = locale === "ar" ? "/locale?set=en" : "/locale?set=ar";
  const languageLabel = locale === "ar" ? "English" : "العربية";

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="ax-row" style={{ gap: "var(--ax-space-150)", justifyContent: "space-between", padding: "var(--ax-space-100) 0", borderBlockEnd: "1px solid var(--ax-color-border)" }}>
      <span className="ax-caption">{label}</span>
      <span>{children}</span>
    </div>
  );

  return (
    <Shell current="/profile" title={t("profile.title", "Profile settings")}
      context={<span className="ax-lozenge ax-lozenge--info">{t("profile.badge", "My account")}</span>}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "var(--ax-space-200)" }}>
        <section className="ax-surface ax-stack" style={{ padding: "var(--ax-space-300)", gap: "var(--ax-space-100)" }} aria-labelledby="profile-details-h">
          <h3 id="profile-details-h" style={{ margin: 0 }}>{t("profile.details.heading", "Personal details")}</h3>
          <Row label={t("profile.details.name", "Name")}><bdi dir="ltr">{profile?.full_name ?? "—"}</bdi></Row>
          <Row label={t("profile.details.email", "Email")}><bdi dir="ltr" className="ax-numeric">{profile?.email ?? user.email ?? "—"}</bdi></Row>
          <Row label={t("profile.details.region", "Region")}><bdi dir="ltr">{profile?.region ?? "—"}</bdi></Row>
          <Row label={t("profile.details.roles", "Roles")}><bdi dir="ltr">{roles.length ? roles.map(roleLabel).join(", ") : "—"}</bdi></Row>
          <p className="ax-caption" style={{ margin: 0, marginBlockStart: "var(--ax-space-100)" }}>
            {t("profile.details.editNote", "Personal details, region and roles are governed elsewhere and are not editable from this screen (no self-service identity or role changes).")}
          </p>
        </section>

        <section className="ax-surface ax-stack" style={{ padding: "var(--ax-space-300)", gap: "var(--ax-space-150)" }} aria-labelledby="profile-appearance-h">
          <h3 id="profile-appearance-h" style={{ margin: 0 }}>{t("profile.appearance.heading", "Language & appearance")}</h3>
          <Row label={t("profile.appearance.languageLabel", "Language")}>
            <a className="ax-btn ax-btn--subtle" href={languageHref} lang={locale === "ar" ? "en" : "ar"}>{languageLabel}</a>
          </Row>
          <Row label={t("profile.appearance.themeLabel", "Theme")}>
            <ThemeToggle labels={{ toLight: t("theme.light", "Light mode"), toDark: t("theme.dark", "Dark mode") }} className="ax-btn ax-btn--subtle" />
          </Row>
          <p className="ax-caption" style={{ margin: 0 }}>{t("profile.appearance.themeNote", "Theme preference is saved to this browser.")}</p>
        </section>

        <section className="ax-surface ax-stack" style={{ padding: "var(--ax-space-300)", gap: "var(--ax-space-150)" }} aria-labelledby="profile-notif-h">
          <h3 id="profile-notif-h" style={{ margin: 0 }}>{t("profile.notif.heading", "Notification preferences")}</h3>
          <NotificationPrefsForm
            push={pref?.push_enabled ?? true}
            sms={pref?.sms_enabled ?? true}
            email={pref?.email_enabled ?? true}
            l={{
              heading: t("profile.notif.heading", "Notification preferences"),
              push: t("profile.notif.push", "Push notifications"),
              sms: t("profile.notif.sms", "SMS notifications"),
              email: t("profile.notif.email", "Email notifications"),
              inappNote: t("profile.notif.inappNote", "In-app notifications (the bell) are always on — they are the only guaranteed delivery surface in this environment."),
              save: t("profile.notif.save", "Save preferences"),
              saving: t("profile.notif.saving", "Saving…"),
              saved: t("profile.notif.saved", "Saved"),
            }}
          />
        </section>

        <section className="ax-surface ax-stack" style={{ padding: "var(--ax-space-300)", gap: "var(--ax-space-100)" }} aria-labelledby="profile-session-h">
          <h3 id="profile-session-h" style={{ margin: 0 }}>{t("profile.session.heading", "Session & security")}</h3>
          <Row label={t("profile.session.issued", "Session started")}><bdi dir="ltr" className="ax-numeric">{issuedAt ?? "—"}</bdi></Row>
          <Row label={t("profile.session.expires", "Session expires")}><bdi dir="ltr" className="ax-numeric">{expiresAt ?? "—"}</bdi></Row>
          <a className="ax-btn ax-btn--subtle" href="/signout" style={{ alignSelf: "flex-start", marginBlockStart: "var(--ax-space-100)" }}>{t("nav.signout", "Sign out")}</a>
        </section>
      </div>
    </Shell>
  );
}
