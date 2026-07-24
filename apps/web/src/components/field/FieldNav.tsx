import Link from "next/link";

// SAQEEL field design-system bottom navigation — markup, geometry and tokens
// ported verbatim from the design's shared nav (SAQEEL Field Dashboard.dc.html
// / My Tasks.dc.html), rendered with the design's own `--nav-*` tokens so it is
// pixel-identical to the canonical Claude Design field bar. Active item is
// marked by colour (--nav-text-active) only, matching the design.
export type FieldNavKey = "home" | "myTasks" | "establishments" | "notifications" | "account";

export type FieldNavLabels = {
  home: string;
  myTasks: string;
  establishments: string;
  notifications: string;
  account: string;
};

const items: { key: FieldNavKey; href: string; label: (l: FieldNavLabels) => string; icon: React.ReactNode }[] = [
  { key: "home", href: "/field", label: l => l.home, icon: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></> },
  { key: "myTasks", href: "/field/my-tasks", label: l => l.myTasks, icon: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 9h6M9 13h6" /></> },
  { key: "establishments", href: "/field/establishments", label: l => l.establishments, icon: <path d="M3 21V10l7 4v-4l7 4V6l4-2v17" /> },
  { key: "notifications", href: "/field/notifications", label: l => l.notifications, icon: <><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></> },
  { key: "account", href: "/field/account", label: l => l.account, icon: <><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></> },
];

export default function FieldNav({ active, labels }: { active: FieldNavKey; labels: FieldNavLabels }) {
  return (
    <nav aria-label={labels.home}
      style={{
        position: "fixed", insetInline: 0, bottom: 0, zIndex: 30, display: "flex",
        background: "var(--nav-bg)", color: "var(--nav-text)",
        paddingBlockEnd: "env(safe-area-inset-bottom)",
        borderBlockStart: "1px solid var(--nav-border)",
      }}>
      {items.map(item => {
        const isActive = item.key === active;
        return (
          <Link key={item.key} href={item.href} prefetch={false}
            aria-current={isActive ? "page" : undefined}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
              padding: "10px 0", textDecoration: "none",
              color: isActive ? "var(--nav-text-active)" : "var(--nav-text)",
            }}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {item.icon}
            </svg>
            <span style={{ fontSize: "11px", fontWeight: isActive ? 600 : 500 }}>{item.label(labels)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
