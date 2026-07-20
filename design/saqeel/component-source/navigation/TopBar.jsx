import React from "react";
export function TopBar({ start, search, end, children }) {
  return (
    <header className="topbar">
      {start}
      {search && <div className="grow" style={{ maxWidth: 420 }}>{search}</div>}
      <div className="grow" />
      <div className="row">{end}{children}</div>
    </header>
  );
}