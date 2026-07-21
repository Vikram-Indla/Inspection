/**
 * Shared inline spinner. Extracted from the .lg-waiting__spinner div hand-copied
 * in reset/ResetClient.tsx and launch/loading.tsx — same class, reusable component.
 */
type SpinnerProps = {
  label?: string;
};

export default function Spinner({ label }: SpinnerProps) {
  return (
    <div className="row" style={{ gap: "var(--ax-space-100)", alignItems: "center" }}>
      <div className="lg-waiting__spinner" aria-hidden="true" />
      {label ? <span className="t-caption">{label}</span> : null}
    </div>
  );
}
