/**
 * Shared skeleton primitives. Extracted from the ax-skeleton divs hand-copied
 * across 18 route-level loading.tsx files. Pure presentational, no data/i18n.
 */
type SkeletonBlockProps = {
  blockSize?: number | string;
  inlineSize?: number | string;
  style?: React.CSSProperties;
  ariaHidden?: boolean;
};

export function SkeletonBlock({ blockSize = 14, inlineSize, style, ariaHidden }: SkeletonBlockProps) {
  return <div className="ax-skeleton" style={{ blockSize, inlineSize, ...style }} aria-hidden={ariaHidden} />;
}

type SkeletonRowsProps = {
  rows?: number;
  rowBlockSize?: number;
  gap?: string;
};

export function SkeletonRows({ rows = 3, rowBlockSize = 28, gap = "var(--ax-space-200)" }: SkeletonRowsProps) {
  return (
    <div style={{ display: "grid", gap }} aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonBlock key={i} blockSize={rowBlockSize} />
      ))}
    </div>
  );
}
