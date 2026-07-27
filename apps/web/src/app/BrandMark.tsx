// Shared brand mark — twisted-ribbon (Möbius) loop, replaces the "IP"
// initials badge across public and authed shells. Token-only gradient
// (GLOBAL COLOR LAW): stops reference var(--sq-*), no hex.
export default function BrandMark({ size = 28, className }: { size?: number; className?: string }) {
  const gid = "bm-grad";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--text-primary)" />
          <stop offset="45%" stopColor="var(--border-subtle)" />
          <stop offset="55%" stopColor="var(--surface-primary)" />
          <stop offset="100%" stopColor="var(--text-secondary)" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gid})`}
        d="M50 6
           C74 2 92 18 92 38
           C92 52 82 62 70 64
           C74 58 74 48 66 42
           C58 36 46 38 40 46
           C46 40 56 40 62 46
           C70 54 68 68 56 74
           C40 82 20 74 12 58
           C4 42 10 22 26 12
           C18 22 16 36 24 46
           C30 54 42 56 50 50
           C42 54 32 52 28 44
           C22 32 30 18 44 14
           C46 13 48 12 50 6 Z"
      />
    </svg>
  );
}
