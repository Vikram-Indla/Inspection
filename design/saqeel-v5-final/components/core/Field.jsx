import React, { useId } from "react";

export function Field({ label, hint, error, invalid, field, children, className = "", ...rest }) {
  const generated = useId();
  const bad = Boolean(invalid || error);
  const isControl = React.isValidElement(children);
  const controlId = isControl ? (children.props.id ?? `${generated}-control`) : undefined;
  const hintId = hint ? `${generated}-hint` : undefined;
  const errorId = bad && error ? `${generated}-error` : undefined;
  const existingDescribedBy = isControl ? children.props["aria-describedby"] : undefined;
  const describedBy = [existingDescribedBy, hintId, errorId].filter(Boolean).join(" ") || undefined;

  const control = isControl
    ? React.cloneElement(children, {
        id: controlId,
        "aria-describedby": describedBy,
        "aria-invalid": bad || children.props["aria-invalid"] || undefined,
        "aria-errormessage": errorId,
      })
    : children;

  const classes = ["ax-field", field && "ax-field--field", bad && "is-invalid", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...rest}>
      {label ? <label className="ax-field__label" htmlFor={controlId}>{label}</label> : null}
      {control}
      {hint ? <span className="ax-field__hint" id={hintId}>{hint}</span> : null}
      {error ? <span className="ax-field__error" id={errorId}>{error}</span> : null}
    </div>
  );
}
