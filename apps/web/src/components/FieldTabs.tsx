// Inspector task bar for the field channel (/field routes only).
// Shell A remains the governed global navigation. This local bar is the
// SAQEEL design handoff's fixed 5-slot bottom tab bar (Home · My Tasks ·
// Establishments · Notifications · Account) — replaces the earlier 3-tab +
// FAB bar. "My Tasks" links to the existing Visits list (relabeled, not a
// separate Tasks concept — sponsor decision, SAQEEL-CORRECTION-PROGRESS.md
// Step 6). Virtual and the old "Start next visit" primary action are no
// longer in the bar (sponsor decision, same step) — Virtual is now a quick
// action on the dashboard body instead; "Start next visit" was redundant
// with the dashboard's own "Go to check-in" action.
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

const HomeIcon = () => <Icon><path d="M4 4h7v7H4zM13 4h7v4h-7zM13 11h7v9h-7zM4 14h7v6H4z" /></Icon>;
const TasksIcon = () => <Icon><path d="M4 6h16M4 12h16M4 18h10" /></Icon>;
const EstablishmentsIcon = () => <Icon><path d="M3 21V9l6 4V9l6 4V9l6 4v8" /><path d="M3 21h18" /><path d="M7 17h2M12 17h2M17 17h2" /></Icon>;
const NotificationsIcon = () => <Icon><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></Icon>;
const AccountIcon = () => <Icon><circle cx="12" cy="8" r="4" /><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" /></Icon>;

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
      <Link href="/field#visits" className="ax-field-taskbar__item" prefetch={false}
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
