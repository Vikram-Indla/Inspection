import React from "react";
export function Checkbox({ label, indeterminate, ...rest }) {
  const ref = React.useRef(null);
  React.useEffect(() => { if (ref.current) ref.current.indeterminate = !!indeterminate; }, [indeterminate]);
  return <label className="check"><input type="checkbox" ref={ref} {...rest} />{label && <span>{label}</span>}</label>;
}