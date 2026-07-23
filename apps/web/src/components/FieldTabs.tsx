// Inspector task bar for the field channel (/field routes only).
// Shell A remains the governed global navigation. This local bar is the
// SAQEEL design handoff's fixed 5-slot bottom tab bar (Home · My Tasks ·
// Establishments · Notifications · Account) — replaces the earlier 3-tab +
// FAB bar. "My Tasks" now links to the real /field/my-tasks screen (built
// from SAQEEL Field My Tasks.dc.html — task list → full establishment dossier
// with license/compliance/risk/map + Start-remote/Start-visit actions), not
// the old Visits-list anchor. Virtual and the old "Start next visit" primary
// action are no longer in the bar (sponsor decision, SAQEEL-CORRECTION-
// PROGRESS.md Step 6) — Virtual is now a quick action on the dashboard body
// instead; "Start next visit" was redundant with the dashboard's own
// "Go to check-in" action.
// Labels arrive pre-translated from the server page; logical properties
// preserve RTL. next/link (prefetch off — all targets are force-dynamic)
// keeps tab taps on the client router instead of full document reloads (K-006).
import Link from "next/link";

export type FieldTabsLabels = {
  home: string;
  myTasks: string;
  establishments: string;
  notifications: string;
  account: string;
};

type IconProps = { children: React.ReactNode };
function Icon({ children }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"
      fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

// Icon glyphs match the canonical SAQEEL Field design nav bar exactly
// (SAQEEL Field Dashboard.dc.html / My Tasks.dc.html nav SVG paths).
const HomeIcon = () => <Icon><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></Icon>;
const TasksIcon = () => <Icon><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 9h6M9 13h6" /></Icon>;
const EstablishmentsIcon = () => <Icon><path d="M3 21V10l7 4v-4l7 4V6l4-2v17" /></Icon>;
const NotificationsIcon = () => <Icon><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></Icon>;
const AccountIcon = () => <Icon><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></Icon>;

export type FieldTabActive = "home" | "myTasks" | "establishments" | "notifications" | "account";

export default function FieldTabs({ active, labels }: {
  active: FieldTabActive;
  labels: FieldTabsLabels;
}) {
  return (
    <nav aria-label={labels.home} className="ax-field-taskbar">
      <Link href="/field" className="ax-field-taskbar__item" prefetch={false}
        aria-current={active === "home" ? "page" : undefined}>
        <HomeIcon />{labels.home}
      </Link>
      <Link href="/field/my-tasks" className="ax-field-taskbar__item" prefetch={false}
        aria-current={active === "myTasks" ? "page" : undefined}>
        <TasksIcon />{labels.myTasks}
      </Link>
      <Link href="/field/establishments" className="ax-field-taskbar__item" prefetch={false}
        aria-current={active === "establishments" ? "page" : undefined}>
        <EstablishmentsIcon />{labels.establishments}
      </Link>
      <Link href="/field/notifications" className="ax-field-taskbar__item" prefetch={false}
        aria-current={active === "notifications" ? "page" : undefined}>
        <NotificationsIcon />{labels.notifications}
      </Link>
      <Link href="/field/account" className="ax-field-taskbar__item" prefetch={false}
        aria-current={active === "account" ? "page" : undefined}>
        <AccountIcon />{labels.account}
      </Link>
    </nav>
  );
}
