import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** IBM Plex Mono + forced LTR — identifiers, coordinates, reference codes */
  mono?: boolean;
  /** leading icon (16px Lucide) */
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { mono, icon, className, ...rest },
  ref,
) {
  const input = (
    <input
      ref={ref}
      className={["input", mono ? "input-mono" : "", className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
  if (!icon) return input;
  return (
    <span className="input-affix">
      {icon}
      {input}
    </span>
  );
});

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { className, ...rest },
  ref,
) {
  return <textarea ref={ref} className={["input", className].filter(Boolean).join(" ")} {...rest} />;
});
