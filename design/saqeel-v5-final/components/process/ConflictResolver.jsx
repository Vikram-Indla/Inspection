import React from "react";
export function ConflictResolver({ title = "Sync conflict — explicit resolution required", local, server, onKeepLocal, onKeepServer, className = "" }) {
  return <div className={"ax-conflict " + className}>
    <div className="ax-conflict__head">⚠ {title}</div>
    <div className="ax-conflict__grid">
      <div className="ax-conflict__side"><h5>Your device</h5>{local}</div>
      <div className="ax-conflict__side"><h5>Server</h5>{server}</div>
    </div>
    <div className="ax-conflict__foot">
      <button type="button" className="ax-btn ax-btn--secondary" onClick={onKeepLocal}>Keep device value</button>
      <button type="button" className="ax-btn" onClick={onKeepServer}>Keep server value</button>
    </div>
  </div>;
}
