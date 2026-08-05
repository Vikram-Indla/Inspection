// R2/R3 evidence grammar (CD-013/014/016/017/019). An honest "Not available"
// boundary: it names a capability deliberately ABSENT from the current build and
// the human consequence of that absence. It is never a disabled control or a fake
// feature — the boundary itself is the truthful UI.
//
// R3 item-7 refinement: the MAIN surface carries only the plain-language
// consequence. The technical seam id and the full prerequisite list live behind a
// collapsible detail, so the primary reading stays low on jargon.
// All copy is passed in so the calling page owns i18n (useT).

export function NotYetBoundary({
  title,
  consequence,
  seam,
  prerequisites,
  notAvailableLabel = "Not available",
  detailLabel = "Why / prerequisites",
}: {
  title: string;
  consequence: string;
  seam?: string;
  prerequisites?: string[];
  notAvailableLabel?: string;
  detailLabel?: string;
}) {
  const hasDetail = !!seam || (prerequisites?.length ?? 0) > 0;
  return (
    <div className="nya" role="note">
      <div className="nya__head">
        <span className="nya__glyph" aria-hidden="true">◌</span>
        <b>{title}</b>
        <span className="nya__lbl">{notAvailableLabel}</span>
      </div>
      <p className="nya__body">{consequence}</p>
      {hasDetail && (
        <details className="nya__more">
          <summary>{detailLabel}</summary>
          {prerequisites && prerequisites.length > 0 && (
            <ul className="nya__prereq">
              {prerequisites.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          )}
          {seam && <span className="nya__seam">{seam}</span>}
        </details>
      )}
    </div>
  );
}

export default NotYetBoundary;
