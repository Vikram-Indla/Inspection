import { type ReactNode } from "react";
import styles from "./field.module.css";

export default function Field({ label, htmlFor, hint, requiredLabel, children }: {
  label: string;
  htmlFor?: string;
  hint?: string;
  /**
   * Visible marker naming this field as required, e.g. "(required)". The word
   * is the caller's — a primitive that hardcoded one would ship untranslated
   * copy — and it is read out as part of the label rather than as a bare glyph.
   */
  requiredLabel?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.root}>
      <label className={styles.label} htmlFor={htmlFor}>
        {label}
        {requiredLabel ? <span className={styles.required}>{requiredLabel}</span> : null}
      </label>
      {children}
      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </div>
  );
}
