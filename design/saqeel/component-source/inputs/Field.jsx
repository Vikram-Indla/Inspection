import React from "react";
export function Field({ label, required, help, error, htmlFor, children, ...rest }) {
  return (
    <div className={"field" + (error ? " is-error" : "")} {...rest}>
      {label && <label htmlFor={htmlFor}>{label}{required && <span className="req" aria-hidden="true">*</span>}</label>}
      {children}
      {error ? <span className="field-error" role="alert">{error}</span> : help ? <span className="field-help">{help}</span> : null}
    </div>
  );
}