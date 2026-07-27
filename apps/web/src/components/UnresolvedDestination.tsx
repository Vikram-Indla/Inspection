type Item = { text: string };

export default function UnresolvedDestination({
  bannerTitle,
  bannerBody,
  title,
  intro,
  evidence,
  gaps,
  questions,
  guard,
}: {
  bannerTitle: string;
  bannerBody: string;
  title: string;
  intro: string;
  evidence: Item[];
  gaps: Item[];
  questions: Item[];
  guard: string;
}) {
  const columns = [
    ["Evidence located", evidence],
    ["Missing before this can be designed", gaps],
    ["Questions for the sponsor", questions],
  ] as const;
  return (
    <div className="sq-unresolved">
      <div className="sq-unresolved__warning">
        <strong>{bannerTitle}</strong>
        <p>{bannerBody}</p>
      </div>
      <section className="sq-unresolved__panel">
        <div>
          <h1>{title}</h1>
          <p>{intro}</p>
        </div>
        <div className="sq-unresolved__columns">
          {columns.map(([heading, items]) => (
            <section key={heading}>
              <h2>{heading}</h2>
              {items.map(item => <p key={item.text}>{item.text}</p>)}
            </section>
          ))}
        </div>
        <div className="sq-unresolved__guard">
          <strong>Not invented here</strong>
          <p>{guard}</p>
        </div>
      </section>
    </div>
  );
}
