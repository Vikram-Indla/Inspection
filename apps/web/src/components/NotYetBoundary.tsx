// R2 evidence grammar (CD-016/017/019). An honest "Not available yet" boundary:
// it names a capability that is deliberately ABSENT from the current build, the
// human consequence of that absence, and ONE traceable seam id. It is never a
// disabled control or a fake feature — the boundary itself is the truthful UI.
// All copy is passed in so the calling page owns i18n (useT).

export function NotYetBoundary({
  title,
  consequence,
  seam,
  notAvailableLabel = "Not available yet",
}: {
  title: string;
  consequence: string;
  seam?: string;
  notAvailableLabel?: string;
}) {
  return (
    <div className="nya" role="note">
      <div className="nya__head">
        <span className="nya__glyph" aria-hidden="true">◌</span>
        <b>{title}</b>
        <span className="nya__lbl">{notAvailableLabel}</span>
      </div>
      <p className="nya__body">{consequence}</p>
      {seam && <span className="nya__seam">{seam}</span>}
    </div>
  );
}

export default NotYetBoundary;
