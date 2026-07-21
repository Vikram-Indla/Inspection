import React, { useState } from "react";
export function Segmented({ options = [], value, defaultValue, onChange, className = "" }) {
  const [internal, setInternal] = useState(defaultValue ?? options[0]);
  const current = value ?? internal;
  return <div className={"ax-segmented " + className} role="group">
    {options.map(o => <button key={o} type="button" aria-pressed={o === current} onClick={() => { setInternal(o); onChange && onChange(o); }}>{o}</button>)}
  </div>;
}
