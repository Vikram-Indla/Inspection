// SCR-PUB-000/010 — inline SVG icon set for the public pages. Stroke icons,
// currentColor only (GLOBAL COLOR LAW: color comes from the CSS context).
// No emoji glyphs anywhere on public surfaces.
type IconProps = { size?: number; className?: string };

function base(size: number) {
  return {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const, "aria-hidden": true as const,
  };
}

export function IconTarget({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="0.8" fill="currentColor" />
    </svg>
  );
}

export function IconFactory({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3 21V9l6 4V9l6 4V9l6 4v8" /><path d="M3 21h18" /><path d="M7 17h2M12 17h2M17 17h2" />
    </svg>
  );
}

export function IconClipboardCheck({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4.5V3h6v1.5" /><path d="m9 13 2.2 2.2L15.5 11" />
    </svg>
  );
}

export function IconScale({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 4v16M8 20h8" /><path d="M12 6 5 8m7-2 7 2" />
      <path d="M3.5 13a2.8 2.8 0 0 0 3 0L5 8Zm3 0L5 8" /><path d="M17.5 13a2.8 2.8 0 0 0 3 0L19 8Zm3 0L19 8" />
    </svg>
  );
}

export function IconTrendUp({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" />
    </svg>
  );
}

export function IconVideo({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3" y="6" width="13" height="12" rx="2.5" /><path d="m16 10.5 5-3v9l-5-3" />
    </svg>
  );
}

export function IconMapPin({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" /><circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

export function IconShieldCheck({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 3 5 6v5c0 4.6 3 8 7 10 4-2 7-5.4 7-10V6Z" /><path d="m9 11.5 2.2 2.2L15.5 9.5" />
    </svg>
  );
}

export function IconCheck({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m4.5 12.5 5 5L19.5 7" />
    </svg>
  );
}

export function IconFingerprint({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 11a2 2 0 0 1 2 2c0 2.5-.4 4.9-1.2 7" />
      <path d="M8.5 12.5A3.5 3.5 0 0 1 15.5 13c0 1.4-.1 2.7-.4 4" />
      <path d="M5.6 10.2A6.5 6.5 0 0 1 18.5 13c0 .8 0 1.6-.1 2.4" />
      <path d="M4 14c.3 2 .2 3.7-.2 5" transform="translate(1.5 -0.5)" />
      <path d="M6.8 20a19 19 0 0 0 1.5-4" />
      <path d="M12 3.5a9 9 0 0 0-6.7 3" /><path d="M20.8 9A9 9 0 0 0 15 4"/>
    </svg>
  );
}

export function IconGovFlag({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M5 3v18" /><path d="M5 4h13l-2.5 4L18 12H5" />
    </svg>
  );
}

export function IconLock({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="5" y="10.5" width="14" height="9.5" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </svg>
  );
}

export function IconEye({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}

export function IconEyeOff({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 4l16 16" /><path d="M9.9 5.9A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17.5 17.5 0 0 1-3 3.8M6.1 8.3A17 17 0 0 0 2.5 12S6 18.5 12 18.5a9.3 9.3 0 0 0 3.4-.7" />
      <path d="M9.5 9.8a2.8 2.8 0 0 0 4 4" />
    </svg>
  );
}

export function IconChevronDown({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M5 8.5l7 7 7-7" />
    </svg>
  );
}

export function IconLink({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M9.5 14.5l5-5" />
      <path d="M11 7.5l1.2-1.2a3.6 3.6 0 0 1 5.1 5.1L16 12.6" />
      <path d="M13 16.5l-1.2 1.2a3.6 3.6 0 0 1-5.1-5.1L7.9 11.4" />
    </svg>
  );
}

export function IconClose({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

// V2 empty-state / status icon set — replaces the raw pictographic emoji
// glyphs (blocked, search, document, calendar, folder, map, globe, bell,
// lightbulb, scroll, list, chart, shuffle, robot, user, package, layers,
// satellite, pin, paperclip) previously used across EmptyState `icon` props.
export function IconBlocked({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="9" /><path d="m5.5 5.5 13 13" />
    </svg>
  );
}

export function IconSearch({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" />
    </svg>
  );
}

export function IconDocument({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path d="M14 3v4h4" /><path d="M8 13h8M8 17h8" />
    </svg>
  );
}

export function IconCalendar({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M8 3v4M16 3v4M3.5 10h17" />
    </svg>
  );
}

export function IconFolder({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3.5 6.5a1 1 0 0 1 1-1H10l2 2.5h7.5a1 1 0 0 1 1 1V18a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1Z" />
    </svg>
  );
}

export function IconMap({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m9 4-5.5 2v14L9 18l6 2 5.5-2V4L15 6 9 4Z" /><path d="M9 4v14M15 6v14" />
    </svg>
  );
}

export function IconGlobe({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18Z" />
    </svg>
  );
}

export function IconBell({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" />
    </svg>
  );
}

export function IconLightbulb({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.3 1 2.1h5c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 3Z" />
    </svg>
  );
}

export function IconScroll({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6 4h11a2 2 0 0 1 2 2v13a1 1 0 0 1-1.6.8L14 17l-3.4 2.8A1 1 0 0 1 9 19V6a2 2 0 0 0-2-2Z" /><path d="M6 4a2 2 0 0 0-2 2v3h5" />
    </svg>
  );
}

export function IconList({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M8 6h12M8 12h12M8 18h12" /><circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" /><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconChart({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 20V10M12 20V4M20 20v-6" />
    </svg>
  );
}

export function IconShuffle({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3 6h4l10 12h4M3 18h4l3.2-3.8M14.8 8.6 17 6h4" /><path d="m18 3 3 3-3 3M18 21l3-3-3-3" />
    </svg>
  );
}

export function IconRobot({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="4" y="9" width="16" height="11" rx="2" /><path d="M12 5v4M9 3.5h6" /><circle cx="9" cy="14.5" r="1.2" fill="currentColor" stroke="none" /><circle cx="15" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconUser({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <circle cx="12" cy="8" r="4" /><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" />
    </svg>
  );
}

export function IconPackage({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m3.5 8 8.5-4 8.5 4-8.5 4-8.5-4Z" /><path d="M3.5 8v9l8.5 4 8.5-4V8M12 12v9" />
    </svg>
  );
}

export function IconLayers({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" />
    </svg>
  );
}

export function IconSatellite({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m8 3 4 4-4 4-4-4 4-4Z" /><path d="m12 7 9 9-4 4-9-9 4-4Z" /><path d="M4 20l2.5-2.5" />
    </svg>
  );
}

export function IconPin({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11Z" /><circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function IconPaperclip({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M17.5 8 9 16.5a3.5 3.5 0 1 1-5-5L12.5 3a2.5 2.5 0 0 1 3.5 3.5L8.5 14a1.5 1.5 0 0 1-2-2l6-6" />
    </svg>
  );
}
