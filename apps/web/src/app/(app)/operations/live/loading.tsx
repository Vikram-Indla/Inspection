export default function Loading() {
  return (
    <div className="stack" role="status" aria-busy="true" aria-label="Loading live operations">
      <div className="page-header">
        <strong>Recorded positions — not live GPS</strong>
        <span className="skeleton" />
      </div>
      <div className="kpi-grid">
        {Array.from({ length: 3 }, (_, index) => <span className="panel kpi skeleton" key={index} />)}
      </div>
      <div className="sq-grid-2">
        <span className="map-panel skeleton" />
        <span className="panel skeleton" />
      </div>
    </div>
  );
}
