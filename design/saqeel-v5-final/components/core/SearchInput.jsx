import React from "react";
import { Icon } from "../icons/Icon.jsx";

export function SearchInput({ className = "", iconLabel, ...rest }) {
  return (
    <span className={`ax-search ${className}`}>
      <Icon name="search" size={18} className="ax-search__icon" />
      <input type="search" className="ax-input" {...rest} />
      {iconLabel ? <span className="ax-sr-only">{iconLabel}</span> : null}
    </span>
  );
}
