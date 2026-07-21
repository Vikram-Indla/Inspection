import React from "react";

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  required?: boolean;
  help?: string;
  /** replaces help; announces via role=alert */
  error?: string;
  htmlFor?: string;
  children?: React.ReactNode;
}

export function Field({ label, required, help, error, htmlFor, children, className, ...rest }: FieldProps) {
  return (
    <div className={["field", error ? "is-error" : "", className].filter(Boolean).join(" ")} {...rest}>
      {label && (
        <label htmlFor={htmlFor}>
          {label}
          {required && (
            <span className="req" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <span className="field-error" role="alert">
          {error}
        </span>
      ) : help ? (
        <span className="field-help">{help}</span>
      ) : null}
    </div>
  );
}
