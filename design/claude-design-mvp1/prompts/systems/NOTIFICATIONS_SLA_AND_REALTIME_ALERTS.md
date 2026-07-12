# System Prompt — Notifications, SLA, and Real-Time Alerts

Inspect NotificationBell, notify.ts, Operations monitoring, SLA computation, notification rows, provider states, and accepted calendar settings.

Design in-app notification inbox, unread state, event/type/recipient/channel, provider-pending delivery, mark read/handled, deep link, timestamps, and failure. Design SLA reminder, overdue start/submit, L1/L2 escalation, working-calendar context, assignment, ownership, acknowledgement, and resolution.

Every apparently real-time element must disclose source, last refresh, auto-refresh interval or subscription status, stale threshold source, and connectivity. Include polling, reconnecting, stale, provider unavailable, RLS-empty, partial widget failure, duplicate alert, and handled states. Never represent a created notification row as delivered SMS/email.

Acceptance IDs: SPC-RT-001 through SPC-RT-008.
