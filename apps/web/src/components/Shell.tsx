import { useT } from "@/lib/i18n";
import NotificationBell, { type BellStrings } from "@/components/NotificationBell";
import ThemeToggle from "@/components/ThemeToggle";

export default async function Shell({ current, children, title, context }: {
  current: string; children: React.ReactNode; title: string; context?: React.ReactNode;
}) {
  const { t, locale } = await useT();
  const nav = [
    [t("nav.overview", "Overview"), "/launch"],
    [t("nav.planning", "Planning"), "/planning"],
    [t("nav.visits", "Visits"), "/visits"],
    [t("nav.reviews", "Reviews"), "/reviews"],
    [t("nav.factory360", "Factory 360"), "/factories"],
    [t("nav.virtual", "Virtual"), "/virtual"],
    [t("nav.field", "Field"), "/field"],
    [t("nav.operations", "Operations"), "/operations"],
    [t("nav.admin", "Admin"), "/admin"],
  ] as const;
  // Language switch shows the OTHER language (SB19); /locale sets the cookie and bounces back.
  const bellStrings: BellStrings = {
    label: t("bell.label", "Notifications"),
    heading: t("bell.heading", "Notifications"),
    empty: t("bell.empty", "No notifications"),
    markAll: t("bell.markAll", "Mark all read"),
    markRead: t("bell.markRead", "Mark read"),
    unreadBadge: t("bell.unread", "unread"),
    loadError: t("bell.loadError", "Couldn’t load notifications:"),
    events: {
      assignment: t("bell.ev.assignment", "New visit assigned"),
      visit_cancelled: t("bell.ev.visitCancelled", "Visit cancelled"),
      submission_received: t("bell.ev.submissionReceived", "Submission awaiting review"),
      resubmission: t("bell.ev.resubmission", "Resubmission awaiting review"),
      review_decision: t("bell.ev.reviewDecision", "Review decided"),
      virtual_scheduled: t("bell.ev.virtualScheduled", "Virtual session scheduled"),
      virtual_rescheduled: t("bell.ev.virtualRescheduled", "Virtual session rescheduled"),
      virtual_closed: t("bell.ev.virtualClosed", "Virtual session closed"),
    },
    channels: {
      inapp: t("bell.ch.inapp", "in-app"), push: t("bell.ch.push", "push"),
      sms: t("bell.ch.sms", "SMS"), email: t("bell.ch.email", "email"),
    },
    notConfigured: t("bell.notConfigured", "provider pending"),
  };
  const langHref = locale === "ar" ? "/locale?set=en" : "/locale?set=ar";
  const langLabel = locale === "ar" ? "English" : "العربية";
  const langLang = locale === "ar" ? "en" : "ar";
  return (
    <div className="ax-shell">
      <nav className="ax-shell__nav" aria-label={t("nav.primary", "Primary")} style={{ display: "flex", flexDirection: "column" }}>
        <div className="ax-shell__brand"><span className="ax-shell__brand-wordmark" lang="ar">{"صقيل | صناعي"}</span></div>
        {nav.map(([label, href]) => (
          <a key={href} className="ax-nav-item" aria-current={href === current ? "page" : undefined} href={href}>{label}</a>
        ))}
        <div className="ax-nav-item ax-nav-item--toggle" style={{ marginBlockStart: "auto" }}>
          <ThemeToggle className="ax-theme-toggle" labels={{ toLight: t("theme.light", "Light mode"), toDark: t("theme.dark", "Dark mode") }} />
          <a className="ax-nav-sub" href={langHref} lang={langLang}>{langLabel}</a>
        </div>
        {/* server route clears the session — keeps Shell free of client imports */}
        <a className="ax-nav-item" href="/signout">↩ {t("nav.signout", "Sign out")}</a>
      </nav>
      <main className="ax-shell__main">
        <div className="ax-pagehead">
          <div className="ax-pagehead__row">
            <div className="ax-pagehead__context"><h2>{title}</h2>{context}</div>
            <NotificationBell strings={bellStrings} />
          </div>
        </div>
        <div className="ax-content">{children}</div>
      </main>
    </div>
  );
}
