import React from "react";
export function TypeCards({ name = "typecard", options = [], value, onChange, className = "" }) {
  return <div className={"ax-typecards " + className}>
    {options.map(o => <label key={o.value} className={"ax-typecard" + (value === o.value ? " is-selected" : "")}>
      <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange && onChange(o.value)} className="ax-sr-only" />
      <span className="ax-typecard__title">{o.title}</span>
      {o.meta ? <span className="ax-typecard__meta">{o.meta}</span> : null}
    </label>)}
  </div>;
}
