(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // components/core/Accordion.jsx
  var Accordion_exports = {};
  __export(Accordion_exports, {
    Accordion: () => Accordion
  });

  // vendor/react-global.js
  var React = window.React;
  if (!React) throw new Error("React global is required before loading the Saqeel design-system bundle.");
  var react_global_default = React;
  var Children = React.Children;
  var Fragment = React.Fragment;
  var cloneElement = React.cloneElement;
  var createElement = React.createElement;
  var forwardRef = React.forwardRef;
  var isValidElement = React.isValidElement;
  var useCallback = React.useCallback;
  var useEffect = React.useEffect;
  var useId = React.useId;
  var useMemo = React.useMemo;
  var useRef = React.useRef;
  var useState = React.useState;

  // components/core/Accordion.jsx
  function Accordion({ items = [], className = "" }) {
    const [open, setOpen] = useState(() => items.map((it, i) => it.defaultOpen ?? i === 0));
    return /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-accordion " + className }, items.map((it, i) => /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-accordion__item", key: i }, /* @__PURE__ */ react_global_default.createElement("button", { type: "button", className: "ax-accordion__trigger", "aria-expanded": !!open[i], onClick: () => setOpen((o) => o.map((v, j) => j === i ? !v : v)) }, /* @__PURE__ */ react_global_default.createElement("span", null, it.title), /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-row", style: { gap: "var(--ax-space-100)" } }, it.progress ? /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-accordion__progress" }, it.progress) : null, /* @__PURE__ */ react_global_default.createElement("svg", { className: "ax-accordion__chevron", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ react_global_default.createElement("path", { d: "m8 10 4 4 4-4" })))), open[i] ? /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-accordion__body" }, it.content) : null)));
  }

  // components/core/Button.jsx
  var Button_exports = {};
  __export(Button_exports, {
    Button: () => Button
  });
  function Button({
    variant = "primary",
    size,
    icon,
    loading = false,
    disabled = false,
    disabledReason,
    children,
    className = "",
    ...rest
  }) {
    const reasonId = useId();
    const classes = [
      "ax-btn",
      variant !== "primary" && `ax-btn--${variant}`,
      size === "prominent" && "ax-btn--prominent",
      size === "field" && "ax-btn--field",
      size === "compact" && "ax-btn--compact",
      icon && !children && "ax-btn--icon",
      loading && "is-loading",
      className
    ].filter(Boolean).join(" ");
    const unavailable = disabled || loading;
    const describedBy = [
      rest["aria-describedby"],
      disabled && disabledReason ? reasonId : null
    ].filter(Boolean).join(" ") || void 0;
    return /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement(
      "button",
      {
        type: "button",
        className: classes,
        disabled: unavailable,
        "aria-busy": loading || void 0,
        "aria-disabled": unavailable || void 0,
        "aria-describedby": describedBy,
        ...rest
      },
      icon,
      children
    ), disabled && disabledReason ? /* @__PURE__ */ react_global_default.createElement("span", { id: reasonId, className: "ax-sr-only" }, disabledReason) : null);
  }

  // components/core/Checkbox.jsx
  var Checkbox_exports = {};
  __export(Checkbox_exports, {
    Checkbox: () => Checkbox
  });
  function Checkbox({ label, className = "", ...rest }) {
    return /* @__PURE__ */ react_global_default.createElement("label", { className: "ax-choice ax-check " + className }, /* @__PURE__ */ react_global_default.createElement("input", { type: "checkbox", ...rest }), /* @__PURE__ */ react_global_default.createElement("span", null, label));
  }

  // components/core/Field.jsx
  var Field_exports = {};
  __export(Field_exports, {
    Field: () => Field
  });
  function Field({ label, hint, error, invalid, field, children, className = "", ...rest }) {
    const generated = useId();
    const bad = Boolean(invalid || error);
    const isControl = react_global_default.isValidElement(children);
    const controlId = isControl ? children.props.id ?? `${generated}-control` : void 0;
    const hintId = hint ? `${generated}-hint` : void 0;
    const errorId = bad && error ? `${generated}-error` : void 0;
    const existingDescribedBy = isControl ? children.props["aria-describedby"] : void 0;
    const describedBy = [existingDescribedBy, hintId, errorId].filter(Boolean).join(" ") || void 0;
    const control = isControl ? react_global_default.cloneElement(children, {
      id: controlId,
      "aria-describedby": describedBy,
      "aria-invalid": bad || children.props["aria-invalid"] || void 0,
      "aria-errormessage": errorId
    }) : children;
    const classes = ["ax-field", field && "ax-field--field", bad && "is-invalid", className].filter(Boolean).join(" ");
    return /* @__PURE__ */ react_global_default.createElement("div", { className: classes, ...rest }, label ? /* @__PURE__ */ react_global_default.createElement("label", { className: "ax-field__label", htmlFor: controlId }, label) : null, control, hint ? /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-field__hint", id: hintId }, hint) : null, error ? /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-field__error", id: errorId }, error) : null);
  }

  // components/core/Input.jsx
  var Input_exports = {};
  __export(Input_exports, {
    Input: () => Input
  });
  function Input({ className = "", ...rest }) {
    return /* @__PURE__ */ react_global_default.createElement("input", { className: "ax-input " + className, ...rest });
  }

  // components/core/Pagination.jsx
  var Pagination_exports = {};
  __export(Pagination_exports, {
    Pagination: () => Pagination
  });
  function Pagination({
    page = 1,
    pages = 1,
    onChange,
    labels = { nav: "Pagination", prev: "Previous page", next: "Next page", page: "Page" },
    className = ""
  }) {
    const go = (target) => onChange?.(Math.min(pages, Math.max(1, target)));
    const numbers = [];
    for (let candidate = 1; candidate <= pages; candidate += 1) {
      if (candidate === 1 || candidate === pages || Math.abs(candidate - page) <= 1) numbers.push(candidate);
      else if (numbers[numbers.length - 1] !== "\u2026") numbers.push("\u2026");
    }
    return /* @__PURE__ */ react_global_default.createElement("nav", { className: `ax-pagination ${className}`, "aria-label": labels.nav }, /* @__PURE__ */ react_global_default.createElement("button", { type: "button", className: "ax-pagination__item", "aria-label": labels.prev, disabled: page <= 1, onClick: () => go(page - 1) }, "\u2039"), numbers.map((item, index) => item === "\u2026" ? /* @__PURE__ */ react_global_default.createElement("span", { key: `overflow-${index}`, className: "ax-pagination__overflow", "aria-hidden": "true" }, "\u2026") : /* @__PURE__ */ react_global_default.createElement(
      "button",
      {
        type: "button",
        key: item,
        className: "ax-pagination__item",
        "aria-label": `${labels.page} ${item}`,
        "aria-current": item === page ? "page" : void 0,
        onClick: () => go(item)
      },
      item
    )), /* @__PURE__ */ react_global_default.createElement("button", { type: "button", className: "ax-pagination__item", "aria-label": labels.next, disabled: page >= pages, onClick: () => go(page + 1) }, "\u203A"));
  }

  // components/core/Radio.jsx
  var Radio_exports = {};
  __export(Radio_exports, {
    Radio: () => Radio
  });
  function Radio({ label, className = "", ...rest }) {
    return /* @__PURE__ */ react_global_default.createElement("label", { className: "ax-choice ax-check " + className }, /* @__PURE__ */ react_global_default.createElement("input", { type: "radio", ...rest }), /* @__PURE__ */ react_global_default.createElement("span", null, label));
  }

  // components/core/SearchInput.jsx
  var SearchInput_exports = {};
  __export(SearchInput_exports, {
    SearchInput: () => SearchInput
  });

  // components/icons/Icon.jsx
  var Icon_exports = {};
  __export(Icon_exports, {
    Icon: () => Icon
  });
  var P = {
    dashboard: /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("rect", { x: "3", y: "3", width: "7", height: "7", rx: "1" }), /* @__PURE__ */ react_global_default.createElement("rect", { x: "14", y: "3", width: "7", height: "7", rx: "1" }), /* @__PURE__ */ react_global_default.createElement("rect", { x: "3", y: "14", width: "7", height: "7", rx: "1" }), /* @__PURE__ */ react_global_default.createElement("rect", { x: "14", y: "14", width: "7", height: "7", rx: "1" })),
    radar: /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("circle", { cx: "12", cy: "12", r: "9" }), /* @__PURE__ */ react_global_default.createElement("circle", { cx: "12", cy: "12", r: "5" }), /* @__PURE__ */ react_global_default.createElement("path", { d: "M12 12l6-6M12 3v2M21 12h-2" })),
    factory: /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("path", { d: "M3 21V9l6 3V9l6 3V5h6v16z" }), /* @__PURE__ */ react_global_default.createElement("path", { d: "M7 17h2M13 17h2M18 9h3" })),
    calendar: /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("rect", { x: "3", y: "5", width: "18", height: "16", rx: "2" }), /* @__PURE__ */ react_global_default.createElement("path", { d: "M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01" })),
    visits: /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("path", { d: "M5 3h14v18H5zM8 7h8M8 11h8M8 15h5" })),
    inspect: /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("path", { d: "M9 11l2 2 4-4" }), /* @__PURE__ */ react_global_default.createElement("path", { d: "M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z" })),
    virtual: /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("rect", { x: "3", y: "5", width: "14", height: "14", rx: "2" }), /* @__PURE__ */ react_global_default.createElement("path", { d: "M17 10l4-3v10l-4-3z" })),
    review: /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("path", { d: "M9 5h10v16H5V9z" }), /* @__PURE__ */ react_global_default.createElement("path", { d: "M9 5v4H5M9 14l2 2 4-4" })),
    admin: /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("path", { d: "M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" }), /* @__PURE__ */ react_global_default.createElement("path", { d: "M9 12h6M12 9v6" })),
    library: /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("path", { d: "M4 4h6v16H4zM14 4h6v16h-6z" }), /* @__PURE__ */ react_global_default.createElement("path", { d: "M7 8h.01M17 8h.01" })),
    forms: /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("path", { d: "M6 3h9l3 3v15H6z" }), /* @__PURE__ */ react_global_default.createElement("path", { d: "M15 3v4h4M9 11h6M9 15h6" })),
    enforcement: /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("path", { d: "M4 20h16M8 17l8-8M10 5l4 4M6 9l4 4" })),
    workflow: /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("circle", { cx: "6", cy: "6", r: "2" }), /* @__PURE__ */ react_global_default.createElement("circle", { cx: "18", cy: "6", r: "2" }), /* @__PURE__ */ react_global_default.createElement("circle", { cx: "12", cy: "18", r: "2" }), /* @__PURE__ */ react_global_default.createElement("path", { d: "M8 6h8M17 8l-4 8M7 8l4 8" })),
    risk: /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("path", { d: "M12 3l10 18H2z" }), /* @__PURE__ */ react_global_default.createElement("path", { d: "M12 9v5M12 18h.01" })),
    map: /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("path", { d: "M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15" })),
    access: /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("circle", { cx: "9", cy: "8", r: "4" }), /* @__PURE__ */ react_global_default.createElement("path", { d: "M3 21v-2a6 6 0 0112 0v2M17 11h4M19 9v4" })),
    notify: /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("path", { d: "M6 8a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6z" }), /* @__PURE__ */ react_global_default.createElement("path", { d: "M10 20a2 2 0 004 0" })),
    insights: /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("path", { d: "M4 19V9M10 19V5M16 19v-7M22 19V3" }), /* @__PURE__ */ react_global_default.createElement("path", { d: "m3 6 6-3 6 5 7-6" })),
    search: /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("circle", { cx: "11", cy: "11", r: "7" }), /* @__PURE__ */ react_global_default.createElement("path", { d: "m20 20-4-4" })),
    lock: /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("rect", { x: "5", y: "10.5", width: "14", height: "9.5", rx: "2" }), /* @__PURE__ */ react_global_default.createElement("path", { d: "M8 10.5V8a4 4 0 0 1 8 0v2.5" })),
    close: /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("path", { d: "m6 6 12 12M18 6 6 18" })),
    menu: /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("path", { d: "M4 7h16M4 12h16M4 17h16" })),
    chevronDown: /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("path", { d: "M5 8.5l7 7 7-7" })),
    check: /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("path", { d: "m4.5 12.5 5 5L19.5 7" })),
    target: /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("circle", { cx: "12", cy: "12", r: "9" }), /* @__PURE__ */ react_global_default.createElement("circle", { cx: "12", cy: "12", r: "4.5" }), /* @__PURE__ */ react_global_default.createElement("circle", { cx: "12", cy: "12", r: "0.8", fill: "currentColor" })),
    shield: /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("path", { d: "M12 3 5 6v5c0 4.6 3 8 7 10 4-2 7-5.4 7-10V6Z" }), /* @__PURE__ */ react_global_default.createElement("path", { d: "m9 11.5 2.2 2.2L15.5 9.5" })),
    eye: /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("path", { d: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" }), /* @__PURE__ */ react_global_default.createElement("circle", { cx: "12", cy: "12", r: "2.8" })),
    video: /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("rect", { x: "3", y: "6", width: "13", height: "12", rx: "2.5" }), /* @__PURE__ */ react_global_default.createElement("path", { d: "m16 10.5 5-3v9l-5-3" })),
    mapPin: /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("path", { d: "M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" }), /* @__PURE__ */ react_global_default.createElement("circle", { cx: "12", cy: "10", r: "2.6" })),
    fingerprint: /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("path", { d: "M12 11a2 2 0 0 1 2 2c0 2.5-.4 4.9-1.2 7" }), /* @__PURE__ */ react_global_default.createElement("path", { d: "M8.5 12.5A3.5 3.5 0 0 1 15.5 13c0 1.4-.1 2.7-.4 4" }), /* @__PURE__ */ react_global_default.createElement("path", { d: "M5.6 10.2A6.5 6.5 0 0 1 18.5 13c0 .8 0 1.6-.1 2.4" }), /* @__PURE__ */ react_global_default.createElement("path", { d: "M6.8 20a19 19 0 0 0 1.5-4" }), /* @__PURE__ */ react_global_default.createElement("path", { d: "M12 3.5a9 9 0 0 0-6.7 3" }), /* @__PURE__ */ react_global_default.createElement("path", { d: "M20.8 9A9 9 0 0 0 15 4" })),
    link: /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("path", { d: "M9.5 14.5l5-5" }), /* @__PURE__ */ react_global_default.createElement("path", { d: "M11 7.5l1.2-1.2a3.6 3.6 0 0 1 5.1 5.1L16 12.6" }), /* @__PURE__ */ react_global_default.createElement("path", { d: "M13 16.5l-1.2 1.2a3.6 3.6 0 0 1-5.1-5.1L7.9 11.4" }))
  };
  function Icon({ name, size = 20, className }) {
    return /* @__PURE__ */ react_global_default.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", className }, P[name] || null);
  }

  // components/core/SearchInput.jsx
  function SearchInput({ className = "", iconLabel, ...rest }) {
    return /* @__PURE__ */ react_global_default.createElement("span", { className: `ax-search ${className}` }, /* @__PURE__ */ react_global_default.createElement(Icon, { name: "search", size: 18, className: "ax-search__icon" }), /* @__PURE__ */ react_global_default.createElement("input", { type: "search", className: "ax-input", ...rest }), iconLabel ? /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-sr-only" }, iconLabel) : null);
  }

  // components/core/Segmented.jsx
  var Segmented_exports = {};
  __export(Segmented_exports, {
    Segmented: () => Segmented
  });
  function Segmented({ options = [], value, defaultValue, onChange, className = "" }) {
    const [internal, setInternal] = useState(defaultValue ?? options[0]);
    const current = value ?? internal;
    return /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-segmented " + className, role: "group" }, options.map((o) => /* @__PURE__ */ react_global_default.createElement("button", { key: o, type: "button", "aria-pressed": o === current, onClick: () => {
      setInternal(o);
      onChange && onChange(o);
    } }, o)));
  }

  // components/core/Select.jsx
  var Select_exports = {};
  __export(Select_exports, {
    Select: () => Select
  });
  function Select({ options = [], className = "", children, ...rest }) {
    return /* @__PURE__ */ react_global_default.createElement("select", { className: "ax-select " + className, ...rest }, children || options.map((o) => typeof o === "string" ? /* @__PURE__ */ react_global_default.createElement("option", { key: o, value: o }, o) : /* @__PURE__ */ react_global_default.createElement("option", { key: o.value, value: o.value }, o.label)));
  }

  // components/core/SplitButton.jsx
  var SplitButton_exports = {};
  __export(SplitButton_exports, {
    SplitButton: () => SplitButton
  });
  function SplitButton({ label, onPrimary, variant = "primary", children, ...rest }) {
    return /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-splitbtn", ...rest }, /* @__PURE__ */ react_global_default.createElement(Button, { variant, onClick: onPrimary }, label), /* @__PURE__ */ react_global_default.createElement(Button, { variant, icon: /* @__PURE__ */ react_global_default.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, /* @__PURE__ */ react_global_default.createElement("path", { d: "m8 10 4 4 4-4" })), "aria-label": "More actions" }), children);
  }

  // components/core/Switch.jsx
  var Switch_exports = {};
  __export(Switch_exports, {
    Switch: () => Switch
  });
  function Switch({ label, className = "", ...rest }) {
    const control = /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-switch " + className }, /* @__PURE__ */ react_global_default.createElement("input", { type: "checkbox", role: "switch", ...rest }), /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-switch__track" }));
    return label ? /* @__PURE__ */ react_global_default.createElement("label", { className: "ax-choice" }, control, /* @__PURE__ */ react_global_default.createElement("span", null, label)) : control;
  }

  // components/core/Tabs.jsx
  var Tabs_exports = {};
  __export(Tabs_exports, {
    RouteTabs: () => RouteTabs,
    Tabs: () => Tabs
  });
  function Tabs({
    tabs = [],
    value,
    defaultValue,
    onChange,
    children,
    ariaLabel = "Sections",
    className = ""
  }) {
    const [internal, setInternal] = useState(defaultValue ?? tabs[0]);
    const current = value ?? internal;
    const base = useId();
    const refs = useRef([]);
    const idx = Math.max(0, tabs.indexOf(current));
    const select = (tab) => {
      if (value === void 0) setInternal(tab);
      onChange?.(tab);
    };
    const onKeyDown = (event) => {
      const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
      let next = null;
      if (event.key === "ArrowRight") next = rtl ? idx - 1 : idx + 1;
      else if (event.key === "ArrowLeft") next = rtl ? idx + 1 : idx - 1;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      if (next === null || !tabs.length) return;
      event.preventDefault();
      next = (next + tabs.length) % tabs.length;
      select(tabs[next]);
      refs.current[next]?.focus();
    };
    const panels = react_global_default.Children.toArray(children);
    return /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("div", { className: `ax-tabs ${className}`, role: "tablist", "aria-label": ariaLabel, onKeyDown }, tabs.map((tab, index) => /* @__PURE__ */ react_global_default.createElement(
      "button",
      {
        key: tab,
        ref: (element) => {
          refs.current[index] = element;
        },
        type: "button",
        role: "tab",
        id: `${base}-tab-${index}`,
        "aria-selected": tab === current,
        "aria-controls": `${base}-panel-${index}`,
        tabIndex: tab === current ? 0 : -1,
        onClick: () => select(tab)
      },
      tab
    ))), panels.length ? tabs.map((tab, index) => /* @__PURE__ */ react_global_default.createElement(
      "div",
      {
        key: tab,
        role: "tabpanel",
        id: `${base}-panel-${index}`,
        "aria-labelledby": `${base}-tab-${index}`,
        hidden: tab !== current,
        tabIndex: 0
      },
      panels[index] ?? null
    )) : null);
  }
  function RouteTabs({ items = [], current, ariaLabel = "Sections", className = "" }) {
    return /* @__PURE__ */ react_global_default.createElement("nav", { className: `ax-tabs ax-route-tabs ${className}`, "aria-label": ariaLabel }, items.map((item) => /* @__PURE__ */ react_global_default.createElement("a", { key: item.href, href: item.href, "aria-current": item.href === current ? "page" : void 0 }, item.label)));
  }

  // components/core/Textarea.jsx
  var Textarea_exports = {};
  __export(Textarea_exports, {
    Textarea: () => Textarea
  });
  function Textarea({ className = "", ...rest }) {
    return /* @__PURE__ */ react_global_default.createElement("textarea", { className: "ax-textarea " + className, ...rest });
  }

  // components/core/TypeCards.jsx
  var TypeCards_exports = {};
  __export(TypeCards_exports, {
    TypeCards: () => TypeCards
  });
  function TypeCards({ name = "typecard", options = [], value, onChange, className = "" }) {
    return /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-typecards " + className }, options.map((o) => /* @__PURE__ */ react_global_default.createElement("label", { key: o.value, className: "ax-typecard" + (value === o.value ? " is-selected" : "") }, /* @__PURE__ */ react_global_default.createElement("input", { type: "radio", name, value: o.value, checked: value === o.value, onChange: () => onChange && onChange(o.value), className: "ax-sr-only" }), /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-typecard__title" }, o.title), o.meta ? /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-typecard__meta" }, o.meta) : null)));
  }

  // components/data/BulkBar.jsx
  var BulkBar_exports = {};
  __export(BulkBar_exports, {
    BulkBar: () => BulkBar
  });
  function BulkBar({ count, label = "selected", children, className = "" }) {
    return /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-bulkbar " + className }, /* @__PURE__ */ react_global_default.createElement("span", null, count, " ", label), children);
  }

  // components/data/CommandBar.jsx
  var CommandBar_exports = {};
  __export(CommandBar_exports, {
    CommandBar: () => CommandBar
  });
  function CommandBar({ children, end, className = "" }) {
    return /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-commandbar " + className }, children, /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-commandbar__spacer" }), end);
  }

  // components/data/DataTable.jsx
  var DataTable_exports = {};
  __export(DataTable_exports, {
    DataTable: () => DataTable
  });
  function DataTable({
    columns = [],
    rows = [],
    caption,
    captionHidden = true,
    selectable = false,
    rowKey = (row, index) => index,
    rowLabel,
    rowState,
    onSelectionChange,
    onSort,
    labels = { selectAll: "Select all rows", selectRow: "Select" },
    className = ""
  }) {
    const [selected, setSelected] = useState([]);
    const selectAllRef = useRef(null);
    const keys = useMemo(() => rows.map((row, index) => rowKey(row, index)), [rows, rowKey]);
    useEffect(() => {
      if (selectAllRef.current) {
        selectAllRef.current.indeterminate = selected.length > 0 && selected.length < keys.length;
      }
    }, [selected.length, keys.length]);
    const publishSelection = (next) => {
      setSelected(next);
      onSelectionChange?.(next);
    };
    const toggle = (key) => publishSelection(
      selected.includes(key) ? selected.filter((item) => item !== key) : [...selected, key]
    );
    const toggleAll = () => publishSelection(selected.length === keys.length ? [] : keys);
    return /* @__PURE__ */ react_global_default.createElement("div", { className: `ax-tablewrap ${className}` }, /* @__PURE__ */ react_global_default.createElement("table", { className: "ax-table" }, caption ? /* @__PURE__ */ react_global_default.createElement("caption", { className: captionHidden ? "ax-sr-only" : void 0 }, caption) : null, /* @__PURE__ */ react_global_default.createElement("thead", null, /* @__PURE__ */ react_global_default.createElement("tr", null, selectable ? /* @__PURE__ */ react_global_default.createElement("th", { scope: "col", style: { inlineSize: 36 } }, /* @__PURE__ */ react_global_default.createElement(
      "input",
      {
        ref: selectAllRef,
        type: "checkbox",
        checked: selected.length === keys.length && keys.length > 0,
        onChange: toggleAll,
        "aria-label": labels.selectAll
      }
    )) : null, columns.map((column) => {
      const sortState = column.sortable ? column.sort ?? "none" : void 0;
      return /* @__PURE__ */ react_global_default.createElement(
        "th",
        {
          key: column.key,
          scope: "col",
          "aria-sort": sortState,
          className: column.numeric ? "ax-td-num" : void 0
        },
        column.sortable ? /* @__PURE__ */ react_global_default.createElement(
          "button",
          {
            type: "button",
            className: "ax-table__sort",
            onClick: () => onSort?.(
              column.key,
              column.sort === "ascending" ? "descending" : "ascending"
            )
          },
          column.label
        ) : column.label
      );
    }))), /* @__PURE__ */ react_global_default.createElement("tbody", null, rows.map((row, index) => {
      const key = rowKey(row, index);
      const state = rowState?.(row);
      const identity = rowLabel ? rowLabel(row) : String(key);
      return /* @__PURE__ */ react_global_default.createElement(
        "tr",
        {
          key,
          "aria-selected": selected.includes(key) || void 0,
          className: state === "failed" ? "is-row-failed" : void 0
        },
        selectable ? /* @__PURE__ */ react_global_default.createElement("td", null, /* @__PURE__ */ react_global_default.createElement(
          "input",
          {
            type: "checkbox",
            checked: selected.includes(key),
            onChange: () => toggle(key),
            "aria-label": `${labels.selectRow} ${identity}`
          }
        )) : null,
        columns.map((column) => /* @__PURE__ */ react_global_default.createElement("td", { key: column.key, className: column.numeric ? "ax-td-num" : void 0 }, column.render ? column.render(row) : row[column.key]))
      );
    }))));
  }

  // components/data/FilterChip.jsx
  var FilterChip_exports = {};
  __export(FilterChip_exports, {
    FilterChip: () => FilterChip
  });
  function FilterChip({ active, children, className = "", ...rest }) {
    return /* @__PURE__ */ react_global_default.createElement("button", { type: "button", className: ["ax-filterchip", active && "is-active", className].filter(Boolean).join(" "), ...rest }, children);
  }

  // components/data/KpiCard.jsx
  var KpiCard_exports = {};
  __export(KpiCard_exports, {
    KpiCard: () => KpiCard
  });
  function KpiCard({ label, value, delta, deltaDirection, trace, stale, className = "" }) {
    return /* @__PURE__ */ react_global_default.createElement("div", { className: ["ax-kpi", stale && "is-stale", className].filter(Boolean).join(" "), style: { padding: 0 } }, /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-mstrip__label" }, label), /* @__PURE__ */ react_global_default.createElement("span", { style: { font: "var(--ax-text-metric)", fontVariantNumeric: "tabular-nums" } }, value), delta ? /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-kpi__delta" + (deltaDirection === "up" ? " is-up" : deltaDirection === "down" ? " is-down" : "") }, delta) : null, trace ? /* @__PURE__ */ react_global_default.createElement("a", { href: trace.href || "#", className: "ax-caption ax-link" }, trace.label || "View records") : null);
  }

  // components/domain/EvidenceCard.jsx
  var EvidenceCard_exports = {};
  __export(EvidenceCard_exports, {
    EvidenceCard: () => EvidenceCard
  });
  function EvidenceCard({
    icon,
    kind = "image",
    state,
    linked,
    meta = [],
    className = ""
  }) {
    const visual = icon ?? /* @__PURE__ */ react_global_default.createElement(Icon, { name: kind === "video" ? "video" : "image", size: 28 });
    return /* @__PURE__ */ react_global_default.createElement(
      "figure",
      {
        className: [
          "ax-evidence",
          state === "unsynced" && "is-unsynced",
          state === "quarantined" && "is-quarantined",
          className
        ].filter(Boolean).join(" "),
        style: { margin: 0 }
      },
      /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-evidence__thumb" }, /* @__PURE__ */ react_global_default.createElement("span", { "aria-hidden": "true" }, visual), linked ? /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-evidence__link ax-chip ax-chip--info-tone" }, linked) : null),
      /* @__PURE__ */ react_global_default.createElement("figcaption", { className: "ax-evidence__meta" }, meta.map((line, index) => /* @__PURE__ */ react_global_default.createElement("span", { key: index }, line)))
    );
  }

  // components/domain/MapPanel.jsx
  var MapPanel_exports = {};
  __export(MapPanel_exports, {
    MapPanel: () => MapPanel
  });
  function MapPanel({ pins = [], geofence, chrome, provider = "Provider abstracted (DEC-008)", height = 260, className = "" }) {
    return /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-map " + className, style: { minBlockSize: height } }, geofence ? /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-geofence", style: { insetInlineStart: geofence.x, insetBlockStart: geofence.y, inlineSize: geofence.r * 2, blockSize: geofence.r * 2, translate: "-50% -50%" } }) : null, pins.map((p, i) => /* @__PURE__ */ react_global_default.createElement("span", { key: i, className: ["ax-pin", p.kind && `ax-pin--${p.kind}`].filter(Boolean).join(" "), style: { insetInlineStart: p.x, insetBlockStart: p.y } }, /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-pin__dot" }), p.label ? /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-pin__label" }, p.label) : null)), chrome ? /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-map__chrome" }, chrome) : null, /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-map__provider" }, provider));
  }

  // components/domain/RuleRow.jsx
  var RuleRow_exports = {};
  __export(RuleRow_exports, {
    RuleRow: () => RuleRow
  });
  function RuleRow({ op, children, className = "" }) {
    return /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-rule " + className }, op ? /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-rule__op" }, op) : null, children);
  }

  // components/domain/VisitCard.jsx
  var VisitCard_exports = {};
  __export(VisitCard_exports, {
    VisitCard: () => VisitCard
  });
  function VisitCard({ title, status, meta = [], actions, className = "" }) {
    return /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-surface ax-panel ax-visitcard " + className }, /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-visitcard__row" }, /* @__PURE__ */ react_global_default.createElement("strong", { style: { font: "var(--ax-text-subheading)" } }, title), status), meta.length ? /* @__PURE__ */ react_global_default.createElement("dl", { className: "ax-visitcard__meta", style: { margin: 0 } }, meta.map((mm, i) => /* @__PURE__ */ react_global_default.createElement("div", { key: i }, /* @__PURE__ */ react_global_default.createElement("dt", null, mm.label), /* @__PURE__ */ react_global_default.createElement("dd", null, mm.value)))) : null, actions ? /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-visitcard__row" }, actions) : null);
  }

  // components/domain/WidgetFrame.jsx
  var WidgetFrame_exports = {};
  __export(WidgetFrame_exports, {
    WidgetFrame: () => WidgetFrame
  });
  function WidgetFrame({ title, chrome, failed, fallback, children, className = "" }) {
    return /* @__PURE__ */ react_global_default.createElement("section", { className: ["ax-surface ax-widget", failed && "is-failed", className].filter(Boolean).join(" ") }, /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-widget__head" }, /* @__PURE__ */ react_global_default.createElement("strong", { style: { font: "var(--ax-text-subheading)" } }, title), chrome), /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-widget__body" }, children), /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-widget__fallback ax-state ax-state--inline", style: { flex: 1 } }, fallback || /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-state__glyph" }, "\u26A0"), /* @__PURE__ */ react_global_default.createElement("p", { style: { margin: 0 } }, "Widget failed \u2014 other widgets unaffected."))));
  }

  // components/overlays/Drawer.jsx
  var Drawer_exports = {};
  __export(Drawer_exports, {
    Drawer: () => Drawer
  });
  function Drawer({
    title,
    description,
    modal = false,
    children,
    onClose,
    labels = { close: "Close" },
    initialFocusRef,
    className = ""
  }) {
    const id = useId();
    const drawerRef = useRef(null);
    const invokerRef = useRef(null);
    useEffect(() => {
      invokerRef.current = document.activeElement;
      const drawer = drawerRef.current;
      const focusables = () => Array.from(drawer?.querySelectorAll(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]'
      ) ?? []);
      (initialFocusRef?.current ?? focusables()[0] ?? drawer)?.focus();
      const onKeyDown = (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose?.();
          return;
        }
        if (!modal || event.key !== "Tab") return;
        const nodes = focusables();
        if (!nodes.length) {
          event.preventDefault();
          drawer?.focus();
          return;
        }
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      };
      document.addEventListener("keydown", onKeyDown);
      return () => {
        document.removeEventListener("keydown", onKeyDown);
        invokerRef.current?.focus?.();
      };
    }, [initialFocusRef, modal, onClose]);
    return /* @__PURE__ */ react_global_default.createElement(
      "aside",
      {
        ref: drawerRef,
        className: `ax-drawer ${className}`,
        role: modal ? "dialog" : "complementary",
        "aria-modal": modal || void 0,
        "aria-labelledby": `${id}-title`,
        "aria-describedby": description ? `${id}-description` : void 0,
        tabIndex: -1
      },
      /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-drawer__header" }, /* @__PURE__ */ react_global_default.createElement("h3", { id: `${id}-title` }, title), /* @__PURE__ */ react_global_default.createElement("button", { type: "button", className: "ax-btn ax-btn--subtle ax-btn--icon", "aria-label": labels.close, onClick: onClose }, /* @__PURE__ */ react_global_default.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", "aria-hidden": "true" }, /* @__PURE__ */ react_global_default.createElement("path", { d: "m6 6 12 12M18 6 6 18" })))),
      description ? /* @__PURE__ */ react_global_default.createElement("p", { id: `${id}-description`, className: "ax-caption ax-drawer__description" }, description) : null,
      /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-drawer__body" }, children)
    );
  }

  // components/overlays/Menu.jsx
  var Menu_exports = {};
  __export(Menu_exports, {
    Menu: () => Menu
  });
  function Menu({ items = [], className = "", style }) {
    return /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-menu " + className, role: "menu", style }, items.map((it, i) => /* @__PURE__ */ react_global_default.createElement("button", { key: i, role: "menuitem", className: it.danger ? "is-danger" : "", "aria-disabled": it.disabled || void 0, title: it.disabled ? it.disabledReason : void 0, onClick: it.disabled ? void 0 : it.onClick }, it.icon, it.label, it.disabled ? /* @__PURE__ */ react_global_default.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", "aria-hidden": "true", style: { marginInlineStart: "auto" } }, /* @__PURE__ */ react_global_default.createElement("rect", { x: "5", y: "10.5", width: "14", height: "9.5", rx: "2" }), /* @__PURE__ */ react_global_default.createElement("path", { d: "M8 10.5V8a4 4 0 0 1 8 0v2.5" })) : null)));
  }

  // components/overlays/Modal.jsx
  var Modal_exports = {};
  __export(Modal_exports, {
    Modal: () => Modal
  });
  function Modal({
    title,
    description,
    children,
    footer,
    onClose,
    closeOnBackdrop = true,
    labels = { close: "Close" },
    initialFocusRef,
    className = ""
  }) {
    const id = useId();
    const dialogRef = useRef(null);
    const invokerRef = useRef(null);
    useEffect(() => {
      invokerRef.current = document.activeElement;
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const dialog = dialogRef.current;
      const focusables = () => Array.from(dialog?.querySelectorAll(
        'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]'
      ) ?? []);
      (initialFocusRef?.current ?? focusables()[0] ?? dialog)?.focus();
      const onKeyDown = (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose?.();
          return;
        }
        if (event.key !== "Tab") return;
        const nodes = focusables();
        if (!nodes.length) {
          event.preventDefault();
          dialog?.focus();
          return;
        }
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      };
      document.addEventListener("keydown", onKeyDown);
      return () => {
        document.removeEventListener("keydown", onKeyDown);
        document.body.style.overflow = previousOverflow;
        invokerRef.current?.focus?.();
      };
    }, [initialFocusRef, onClose]);
    return /* @__PURE__ */ react_global_default.createElement(
      "div",
      {
        className: "ax-modal-backdrop",
        onMouseDown: (event) => {
          if (closeOnBackdrop && event.target === event.currentTarget) onClose?.();
        }
      },
      /* @__PURE__ */ react_global_default.createElement(
        "div",
        {
          ref: dialogRef,
          className: `ax-modal ${className}`,
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": `${id}-title`,
          "aria-describedby": description ? `${id}-description` : void 0,
          tabIndex: -1
        },
        /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-modal__header" }, /* @__PURE__ */ react_global_default.createElement("h3", { id: `${id}-title` }, title), /* @__PURE__ */ react_global_default.createElement("button", { type: "button", className: "ax-btn ax-btn--subtle ax-btn--icon", "aria-label": labels.close, onClick: onClose }, /* @__PURE__ */ react_global_default.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", "aria-hidden": "true" }, /* @__PURE__ */ react_global_default.createElement("path", { d: "m6 6 12 12M18 6 6 18" })))),
        /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-modal__body" }, description ? /* @__PURE__ */ react_global_default.createElement("p", { id: `${id}-description`, className: "ax-caption" }, description) : null, children),
        footer ? /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-modal__footer" }, footer) : null
      )
    );
  }

  // components/overlays/Tooltip.jsx
  var Tooltip_exports = {};
  __export(Tooltip_exports, {
    Tooltip: () => Tooltip
  });
  function Tooltip({ tip, children, className = "" }) {
    return /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-tooltip " + className, "data-tip": tip, tabIndex: 0 }, children);
  }

  // components/patterns2/AdminFilterToolbar.jsx
  var AdminFilterToolbar_exports = {};
  __export(AdminFilterToolbar_exports, {
    AdminFilterToolbar: () => AdminFilterToolbar
  });
  function AdminFilterToolbar({ search, chips, end, className = "" }) {
    return /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-commandbar " + className }, search, chips, /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-commandbar__spacer" }), end);
  }

  // components/patterns2/CommandHeader.jsx
  var CommandHeader_exports = {};
  __export(CommandHeader_exports, {
    CommandHeader: () => CommandHeader
  });
  function CommandHeader({ context, search, scope, action, utilities, account, className = "" }) {
    return /* @__PURE__ */ react_global_default.createElement("header", { className: "ax-texture-chrome " + className, style: { display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 24, alignItems: "center", height: 60, padding: "0 32px", backgroundColor: "var(--ax-color-surface)", borderBottom: "1px solid var(--ax-color-border-control)" } }, /* @__PURE__ */ react_global_default.createElement("span", { style: { display: "flex", alignItems: "center", gap: 10 } }, /* @__PURE__ */ react_global_default.createElement("b", { lang: "ar", style: { font: "600 17px/1 var(--ax-font-arabic)" } }, "\u0635\u0642\u064A\u0644"), context ? /* @__PURE__ */ react_global_default.createElement("span", { style: { font: "400 13px/1 var(--ax-font-sans)", color: "var(--ax-color-text-secondary)", borderInlineStart: "1px solid var(--ax-color-border)", paddingInlineStart: 10 } }, context) : null), /* @__PURE__ */ react_global_default.createElement("span", { style: { minWidth: 0 } }, search), /* @__PURE__ */ react_global_default.createElement("span", { style: { display: "flex", alignItems: "center", gap: 14, color: "var(--ax-color-text-secondary)", font: "400 13px/1 var(--ax-font-sans)" } }, scope, action, utilities, account));
  }

  // components/patterns2/ControlGroup.jsx
  var ControlGroup_exports = {};
  __export(ControlGroup_exports, {
    ControlGroup: () => ControlGroup
  });
  function ControlGroup({ legend, children, className = "" }) {
    return /* @__PURE__ */ react_global_default.createElement("fieldset", { className: "ax-fieldset " + className }, /* @__PURE__ */ react_global_default.createElement("legend", null, legend), children);
  }

  // components/patterns2/DateRange.jsx
  var DateRange_exports = {};
  __export(DateRange_exports, {
    DateRange: () => DateRange
  });

  // components/patterns2/DateTime.jsx
  var DateTime_exports = {};
  __export(DateTime_exports, {
    DateTime: () => DateTime
  });
  var RIYADH = "Asia/Riyadh";
  var DAY_MS = 864e5;
  function formatter(locale, options) {
    return new Intl.DateTimeFormat(locale || "en-GB", {
      timeZone: RIYADH,
      calendar: "gregory",
      ...options
    });
  }
  function riyadhDateSerial(value) {
    const parts = formatter("en-GB-u-nu-latn", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(new Date(value));
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day));
  }
  function defaultLabels(locale) {
    const arabic = String(locale || "").toLowerCase().startsWith("ar");
    return arabic ? {
      zone: "\u0627\u0644\u0631\u064A\u0627\u0636",
      overdue: (days) => `\u0645\u062A\u0623\u062E\u0631 ${days} \u064A\u0648\u0645`,
      today: "\u0645\u0633\u062A\u062D\u0642 \u0627\u0644\u064A\u0648\u0645",
      inDays: (days) => `\u0645\u0633\u062A\u062D\u0642 \u062E\u0644\u0627\u0644 ${days} \u064A\u0648\u0645`
    } : {
      zone: "Riyadh",
      overdue: (days) => `${days} days overdue`,
      today: "due today",
      inDays: (days) => `due in ${days} days`
    };
  }
  function DateTime({
    value,
    mode = "date",
    locale = "en-GB",
    showZone,
    now = Date.now(),
    labels,
    className = ""
  }) {
    if (!value) return /* @__PURE__ */ react_global_default.createElement("span", { className }, "\u2014");
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return /* @__PURE__ */ react_global_default.createElement("span", { className }, "\u2014");
    const copy = { ...defaultLabels(locale), ...labels };
    const includeTime = mode === "datetime";
    const text = formatter(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
      ...includeTime ? { hour: "2-digit", minute: "2-digit", hour12: false } : {}
    }).format(date);
    let relative = null;
    if (mode === "due") {
      const days = Math.round((riyadhDateSerial(date) - riyadhDateSerial(now)) / DAY_MS);
      relative = days < 0 ? copy.overdue(Math.abs(days)) : days === 0 ? copy.today : copy.inDays(days);
    }
    return /* @__PURE__ */ react_global_default.createElement("span", { className: `ax-numeric ${className}` }, /* @__PURE__ */ react_global_default.createElement("bdi", null, text), showZone || includeTime ? ` (${copy.zone})` : "", relative ? /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, " \xB7 ", /* @__PURE__ */ react_global_default.createElement("span", null, relative)) : null);
  }

  // components/patterns2/DateRange.jsx
  function DateRange({
    from,
    to,
    mode = "datetime",
    locale = "en-GB",
    labels,
    className = ""
  }) {
    const arabic = String(locale).toLowerCase().startsWith("ar");
    const copy = labels ?? (arabic ? { from: "\u0645\u0646", to: "\u0625\u0644\u0649" } : { from: "From", to: "To" });
    return /* @__PURE__ */ react_global_default.createElement("span", { className }, copy.from, " ", /* @__PURE__ */ react_global_default.createElement(DateTime, { value: from, mode, locale, showZone: false }), " ", copy.to, " ", /* @__PURE__ */ react_global_default.createElement(DateTime, { value: to, mode, locale }));
  }

  // components/patterns2/FieldActionBar.jsx
  var FieldActionBar_exports = {};
  __export(FieldActionBar_exports, {
    FieldActionBar: () => FieldActionBar
  });
  function FieldActionBar({ items = [], primary, className = "" }) {
    return /* @__PURE__ */ react_global_default.createElement("nav", { className: "ax-field-taskbar " + className, "aria-label": "Field tasks" }, items.map((it, i) => /* @__PURE__ */ react_global_default.createElement("a", { key: i, className: "ax-field-taskbar__item", "aria-current": it.current ? "page" : void 0, href: it.href || "#", onClick: it.onClick }, it.label)), primary ? /* @__PURE__ */ react_global_default.createElement("a", { className: "ax-field-taskbar__primary", href: primary.href || "#", onClick: primary.onClick }, primary.label) : null);
  }

  // components/patterns2/MetricStrip.jsx
  var MetricStrip_exports = {};
  __export(MetricStrip_exports, {
    MetricStrip: () => MetricStrip
  });
  function MetricStrip({ items = [], className = "" }) {
    return /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-mstrip ax-numeric " + className }, items.map((m, i) => /* @__PURE__ */ react_global_default.createElement("div", { key: i }, /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-mstrip__label" }, m.label), /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-mstrip__value", style: m.tone ? { color: `var(--ax-color-${m.tone}-strong)` } : void 0 }, m.value), m.sub ? /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-mstrip__sub" }, m.sub) : null)));
  }

  // components/patterns2/PageHeader.jsx
  var PageHeader_exports = {};
  __export(PageHeader_exports, {
    PageHeader: () => PageHeader
  });

  // components/process/Breadcrumb.jsx
  var Breadcrumb_exports = {};
  __export(Breadcrumb_exports, {
    Breadcrumb: () => Breadcrumb
  });
  function Breadcrumb({ items = [], className = "" }) {
    return /* @__PURE__ */ react_global_default.createElement("ol", { className: "ax-breadcrumb " + className }, items.map((it, i) => /* @__PURE__ */ react_global_default.createElement("li", { key: i }, it.href && i < items.length - 1 ? /* @__PURE__ */ react_global_default.createElement("a", { href: it.href, style: { color: "inherit" } }, it.label) : /* @__PURE__ */ react_global_default.createElement("span", { "aria-current": i === items.length - 1 ? "page" : void 0 }, it.label))));
  }

  // components/patterns2/PageHeader.jsx
  function PageHeader({ breadcrumb, title, chips, reference, actions, className = "" }) {
    return /* @__PURE__ */ react_global_default.createElement("div", { className, style: { display: "flex", flexDirection: "column", gap: 6 } }, breadcrumb ? /* @__PURE__ */ react_global_default.createElement(Breadcrumb, { items: breadcrumb }) : null, /* @__PURE__ */ react_global_default.createElement("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 24, flexWrap: "wrap" } }, /* @__PURE__ */ react_global_default.createElement("h1", { style: { margin: 0, font: "500 24px/32px var(--ax-font-sans)" } }, title), reference ? /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-numeric", style: { font: "500 13px/18px var(--ax-font-mono)", color: "var(--ax-color-text-secondary)" } }, /* @__PURE__ */ react_global_default.createElement("bdi", null, reference)) : null), chips || actions ? /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-row", style: { justifyContent: "space-between" } }, /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-row" }, chips), /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-row" }, actions)) : null);
  }

  // components/patterns2/RecordRow.jsx
  var RecordRow_exports = {};
  __export(RecordRow_exports, {
    RecordRow: () => RecordRow
  });
  function RecordRow({ title, chips, meta, selected, onClick, className = "" }) {
    return /* @__PURE__ */ react_global_default.createElement("button", { type: "button", className: "ax-recordrow " + className, "aria-selected": selected || void 0, onClick }, /* @__PURE__ */ react_global_default.createElement("strong", null, title), chips, /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-recordrow__meta", style: { marginInlineStart: "auto" } }, meta));
  }

  // components/patterns2/ReportFooter.jsx
  var ReportFooter_exports = {};
  __export(ReportFooter_exports, {
    ReportFooter: () => ReportFooter
  });
  function ReportFooter({ reference, generated, refreshed, contracts = "M04-215 \xB7 M06-018 \xB7 DEC-009 \xB7 ENG-12", note, className = "" }) {
    return /* @__PURE__ */ react_global_default.createElement("footer", { className, style: { borderBlockStart: "1px solid var(--ax-color-border)", paddingBlockStart: 12, display: "flex", justifyContent: "space-between", gap: 24, flexWrap: "wrap", font: "var(--ax-text-caption)", color: "var(--ax-color-text-secondary)" } }, /* @__PURE__ */ react_global_default.createElement("span", null, note, " Generated ", /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-numeric" }, /* @__PURE__ */ react_global_default.createElement("bdi", null, generated)), refreshed ? /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, " \xB7 data refreshed ", /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-numeric" }, /* @__PURE__ */ react_global_default.createElement("bdi", null, refreshed))) : null), /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-numeric" }, /* @__PURE__ */ react_global_default.createElement("bdi", null, reference), " \xB7 ", contracts));
  }

  // components/patterns2/ReportHeader.jsx
  var ReportHeader_exports = {};
  __export(ReportHeader_exports, {
    ReportHeader: () => ReportHeader
  });
  function ReportHeader({ reference, version, logo = "assets/saqeel-prism.svg", className = "" }) {
    return /* @__PURE__ */ react_global_default.createElement("header", { className: "ax-texture-chrome " + className, style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 56px", backgroundColor: "var(--ax-color-primary)", color: "#fff" } }, /* @__PURE__ */ react_global_default.createElement("span", { style: { display: "flex", alignItems: "center", gap: 14 } }, /* @__PURE__ */ react_global_default.createElement("img", { src: logo, width: "36", height: "36", alt: "", onError: (e) => {
      e.currentTarget.style.display = "none";
    } }), /* @__PURE__ */ react_global_default.createElement("span", null, /* @__PURE__ */ react_global_default.createElement("b", { lang: "ar", style: { font: "600 19px/24px var(--ax-font-arabic)", display: "block" } }, "\u0635\u0642\u064A\u0644"), /* @__PURE__ */ react_global_default.createElement("small", { style: { font: "400 12px/16px var(--ax-font-sans)", color: "#CFE5DC" } }, "Official inspection report"))), /* @__PURE__ */ react_global_default.createElement("span", { style: { textAlign: "end", font: "400 13px/19px var(--ax-font-sans)", color: "#DCEAE4" } }, /* @__PURE__ */ react_global_default.createElement("b", { style: { display: "block", color: "#fff" } }, "Kingdom of Saudi Arabia \xB7 Ministry of Industry and Mineral Resources"), /* @__PURE__ */ react_global_default.createElement("span", { lang: "ar", dir: "rtl" }, "\u0627\u0644\u0645\u0645\u0644\u0643\u0629 \u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0627\u0644\u0633\u0639\u0648\u062F\u064A\u0629 \xB7 \u0648\u0632\u0627\u0631\u0629 \u0627\u0644\u0635\u0646\u0627\u0639\u0629 \u0648\u0627\u0644\u062B\u0631\u0648\u0629 \u0627\u0644\u0645\u0639\u062F\u0646\u064A\u0629"), reference ? /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-numeric", style: { display: "block" } }, /* @__PURE__ */ react_global_default.createElement("bdi", null, reference), version ? /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, " \xB7 ", /* @__PURE__ */ react_global_default.createElement("bdi", null, version)) : null) : null));
  }

  // components/patterns2/Signature.jsx
  var Signature_exports = {};
  __export(Signature_exports, {
    Signature: () => Signature
  });
  function Signature({ name, role, signed, timestamp, preview, className = "" }) {
    return /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-sig-block " + className }, /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-field__label" }, role), /* @__PURE__ */ react_global_default.createElement("p", { style: { margin: "2px 0 0", font: "500 15px/22px var(--ax-font-sans)" } }, name, " ", signed ? /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-chip ax-chip--ok" }, "Signed") : /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-chip" }, "Unsigned")), preview || /* @__PURE__ */ react_global_default.createElement("div", { style: { height: 56, borderBlockEnd: "1px solid var(--ax-color-border-strong)" }, "aria-hidden": "true" }), /* @__PURE__ */ react_global_default.createElement("p", { className: "ax-numeric", style: { margin: "4px 0 0", font: "var(--ax-text-caption)", color: "var(--ax-color-text-secondary)" } }, timestamp));
  }

  // components/patterns2/StatusChip.jsx
  var StatusChip_exports = {};
  __export(StatusChip_exports, {
    StatusChip: () => StatusChip
  });
  function StatusChip({ tone, children, className = "" }) {
    const map = { ok: "ax-chip--ok", warn: "ax-chip--warn", crit: "ax-chip--crit", info: "ax-chip--info-tone", lock: "ax-chip--lock" };
    return /* @__PURE__ */ react_global_default.createElement("span", { className: ["ax-chip", tone && map[tone], className].filter(Boolean).join(" ") }, children);
  }

  // components/patterns2/StatusRail.jsx
  var StatusRail_exports = {};
  __export(StatusRail_exports, {
    StatusRail: () => StatusRail
  });
  function StatusRail({ items = [], end, label = "Record status", className = "" }) {
    return /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-statusrail " + className, role: "navigation", "aria-label": label }, items.map((it, i) => /* @__PURE__ */ react_global_default.createElement("span", { key: i }, it.label ? /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, it.label, " ") : null, /* @__PURE__ */ react_global_default.createElement("b", { style: it.tone ? { color: `var(--ax-color-${it.tone}-strong)` } : void 0 }, it.value))), end ? /* @__PURE__ */ react_global_default.createElement("span", { style: { marginInlineStart: "auto" } }, end) : null);
  }

  // components/patterns2/TonalField.jsx
  var TonalField_exports = {};
  __export(TonalField_exports, {
    TonalField: () => TonalField
  });
  function TonalField({ children, className = "", ...rest }) {
    return /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-field-tonal " + className, ...rest }, children);
  }

  // components/process/ConflictResolver.jsx
  var ConflictResolver_exports = {};
  __export(ConflictResolver_exports, {
    ConflictResolver: () => ConflictResolver
  });
  function ConflictResolver({ title = "Sync conflict \u2014 explicit resolution required", local, server, onKeepLocal, onKeepServer, className = "" }) {
    return /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-conflict " + className }, /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-conflict__head" }, "\u26A0 ", title), /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-conflict__grid" }, /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-conflict__side" }, /* @__PURE__ */ react_global_default.createElement("h5", null, "Your device"), local), /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-conflict__side" }, /* @__PURE__ */ react_global_default.createElement("h5", null, "Server"), server)), /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-conflict__foot" }, /* @__PURE__ */ react_global_default.createElement("button", { type: "button", className: "ax-btn ax-btn--secondary", onClick: onKeepLocal }, "Keep device value"), /* @__PURE__ */ react_global_default.createElement("button", { type: "button", className: "ax-btn", onClick: onKeepServer }, "Keep server value")));
  }

  // components/process/DiffText.jsx
  var DiffText_exports = {};
  __export(DiffText_exports, {
    DiffText: () => DiffText
  });
  function DiffText({ type = "ins", children }) {
    return /* @__PURE__ */ react_global_default.createElement("span", { className: type === "del" ? "ax-diff-del" : "ax-diff-ins" }, children);
  }

  // components/process/Stepper.jsx
  var Stepper_exports = {};
  __export(Stepper_exports, {
    Stepper: () => Stepper
  });
  function Stepper({ steps = [], className = "" }) {
    return /* @__PURE__ */ react_global_default.createElement("ol", { className: "ax-stepper " + className }, steps.map((s, i) => /* @__PURE__ */ react_global_default.createElement("li", { key: i, className: s.state === "done" ? "is-done" : s.state === "active" ? "is-active" : s.state === "blocked" ? "is-blocked" : "" }, /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-step__dot" }, s.state === "done" ? "\u2713" : s.state === "blocked" ? "!" : i + 1), s.label)));
  }

  // components/process/Timeline.jsx
  var Timeline_exports = {};
  __export(Timeline_exports, {
    Timeline: () => Timeline
  });
  function Timeline({ items = [], className = "" }) {
    return /* @__PURE__ */ react_global_default.createElement("ol", { className: "ax-timeline " + className }, items.map((it, i) => /* @__PURE__ */ react_global_default.createElement("li", { key: i, className: it.key ? "is-key" : "" }, /* @__PURE__ */ react_global_default.createElement("div", null, /* @__PURE__ */ react_global_default.createElement("div", null, /* @__PURE__ */ react_global_default.createElement("strong", null, it.actor), " ", it.action, it.version ? /* @__PURE__ */ react_global_default.createElement(react_global_default.Fragment, null, " ", /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-version" }, it.version)) : null), /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-timeline__meta" }, it.time), it.detail ? /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-caption" }, it.detail) : null))));
  }

  // components/process/ValidationSummary.jsx
  var ValidationSummary_exports = {};
  __export(ValidationSummary_exports, {
    ValidationSummary: () => ValidationSummary
  });
  function ValidationSummary({ title, blockers = [], clear, className = "" }) {
    return /* @__PURE__ */ react_global_default.createElement("div", { className: ["ax-validation", clear && "ax-validation--clear", className].filter(Boolean).join(" "), role: clear ? "status" : "alert" }, /* @__PURE__ */ react_global_default.createElement("strong", null, title), blockers.length ? /* @__PURE__ */ react_global_default.createElement("ul", null, blockers.map((b, i) => /* @__PURE__ */ react_global_default.createElement("li", { key: i }, b.href ? /* @__PURE__ */ react_global_default.createElement("a", { href: b.href }, b.label) : b.label || b))) : null);
  }

  // components/status/Avatar.jsx
  var Avatar_exports = {};
  __export(Avatar_exports, {
    Avatar: () => Avatar
  });
  function Avatar({ name = "", className = "" }) {
    const initials = name.split(/[\s._-]+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "S";
    return /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-avatar " + className, "aria-hidden": "true" }, initials);
  }

  // components/status/Badge.jsx
  var Badge_exports = {};
  __export(Badge_exports, {
    Badge: () => Badge
  });
  function Badge({ critical, children, className = "" }) {
    return /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-badge" + (critical ? " ax-badge--critical" : "") + " " + className }, children);
  }

  // components/status/Banner.jsx
  var Banner_exports = {};
  __export(Banner_exports, {
    Banner: () => Banner
  });
  function Banner({ tone = "info", title, children, className = "" }) {
    const mod = tone === "info" ? "" : ` ax-banner--${tone}`;
    return /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-banner" + mod + " " + className, role: tone === "critical" ? "alert" : "status" }, /* @__PURE__ */ react_global_default.createElement("div", null, title ? /* @__PURE__ */ react_global_default.createElement("strong", null, title, " ") : null, children));
  }

  // components/status/Freshness.jsx
  var Freshness_exports = {};
  __export(Freshness_exports, {
    Freshness: () => Freshness
  });
  function Freshness({ state = "live", children, className = "" }) {
    const mod = state === "live" ? "" : ` ax-freshness--${state}`;
    return /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-freshness" + mod + " " + className }, children);
  }

  // components/status/Lozenge.jsx
  var Lozenge_exports = {};
  __export(Lozenge_exports, {
    Lozenge: () => Lozenge
  });
  function Lozenge({ domain, tone, live, children, className = "", ...rest }) {
    const cls = ["ax-lozenge", domain && `ax-lozenge--${domain}`, tone && `ax-lozenge--${tone}`, live && "ax-lozenge--live", className].filter(Boolean).join(" ");
    return /* @__PURE__ */ react_global_default.createElement("span", { className: cls, ...rest }, children);
  }

  // components/status/Skeleton.jsx
  var Skeleton_exports = {};
  __export(Skeleton_exports, {
    Skeleton: () => Skeleton
  });
  function Skeleton({ width, height, className = "", style }) {
    return /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-skeleton " + className, style: { display: "block", inlineSize: width, blockSize: height, ...style }, "aria-hidden": "true" });
  }

  // components/status/StateCard.jsx
  var StateCard_exports = {};
  __export(StateCard_exports, {
    StateCard: () => StateCard
  });
  function StateCard({ glyph = "\u25CB", title, children, action, inline, unauthorized, className = "" }) {
    return /* @__PURE__ */ react_global_default.createElement("div", { className: ["ax-state", inline && "ax-state--inline", unauthorized && "ax-permission", className].filter(Boolean).join(" ") }, /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-state__glyph", "aria-hidden": "true" }, glyph), title ? /* @__PURE__ */ react_global_default.createElement("h4", null, title) : null, children ? /* @__PURE__ */ react_global_default.createElement("p", { style: { margin: 0 } }, children) : null, action);
  }

  // components/status/SyncChip.jsx
  var SyncChip_exports = {};
  __export(SyncChip_exports, {
    SyncChip: () => SyncChip
  });
  function SyncChip({ state = "synced", children, className = "" }) {
    return /* @__PURE__ */ react_global_default.createElement("span", { className: `ax-sync ax-sync--${state} ` + className }, children);
  }

  // components/status/Toast.jsx
  var Toast_exports = {};
  __export(Toast_exports, {
    Toast: () => Toast
  });
  function Toast({ tone, children, className = "" }) {
    const mod = tone ? ` ax-toast--${tone}` : "";
    return /* @__PURE__ */ react_global_default.createElement("div", { className: "ax-toast" + mod + " " + className, role: "status" }, children);
  }

  // components/status/VersionBadge.jsx
  var VersionBadge_exports = {};
  __export(VersionBadge_exports, {
    VersionBadge: () => VersionBadge
  });
  function VersionBadge({ children, className = "" }) {
    return /* @__PURE__ */ react_global_default.createElement("span", { className: "ax-version " + className }, children);
  }

  // _bundle_entry.js
  window.SaqeelDesignSystem_49c57d = Object.assign({}, Accordion_exports, Button_exports, Checkbox_exports, Field_exports, Input_exports, Pagination_exports, Radio_exports, SearchInput_exports, Segmented_exports, Select_exports, SplitButton_exports, Switch_exports, Tabs_exports, Textarea_exports, TypeCards_exports, BulkBar_exports, CommandBar_exports, DataTable_exports, FilterChip_exports, KpiCard_exports, EvidenceCard_exports, MapPanel_exports, RuleRow_exports, VisitCard_exports, WidgetFrame_exports, Icon_exports, Drawer_exports, Menu_exports, Modal_exports, Tooltip_exports, AdminFilterToolbar_exports, CommandHeader_exports, ControlGroup_exports, DateRange_exports, DateTime_exports, FieldActionBar_exports, MetricStrip_exports, PageHeader_exports, RecordRow_exports, ReportFooter_exports, ReportHeader_exports, Signature_exports, StatusChip_exports, StatusRail_exports, TonalField_exports, Breadcrumb_exports, ConflictResolver_exports, DiffText_exports, Stepper_exports, Timeline_exports, ValidationSummary_exports, Avatar_exports, Badge_exports, Banner_exports, Freshness_exports, Lozenge_exports, Skeleton_exports, StateCard_exports, SyncChip_exports, Toast_exports, VersionBadge_exports);
})();
