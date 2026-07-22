// Saqeel canonical brand mark — shield with checkmark. This is the single
// authoritative logomark for the app: login lockup, console nav drawer
// header, and apps/web/src/components/saqeel/navigation/Sidebar.tsx default
// brandMark all render this exact path. Theme-adaptive through `currentColor`
// only (GLOBAL COLOR LAW) — callers set color via a CSS class, never inline.
export default function SaqeelBrandMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" role="img" aria-label="Saqeel"
      fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
