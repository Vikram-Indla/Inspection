/* SAQEEL PWA — shared shell: hamburger + web side panel (WA-SHELL-r6)

   THE RULE (Product Owner, 2026-07-26). The trigger is the VIEWPORT, never the
   persona and never the channel:
     • Desktop / Mac      — web app. Persistent rail, no burger, no sticky footer.
     • iPad or any shrunk / responsive width — burger AND sticky footer, both,
       for every role.
   The sticky footer is pwa-tabbar.js, already on every field page. This file adds
   the other half: the burger, and the drawer it opens.

   The drawer carries the WEB SIDE PANEL — the four accepted groups from
   SAQEEL Web Shell v5.dc.html (Overview, Operations, Compliance,
   Administration). Nothing here is authored: every label and its Arabic come
   from the shipped navigation. Destinations a role cannot open render locked
   with the reason on the item, exactly as v5 does, rather than being hidden.

   Idempotent, safe-area aware, logical-axis only so RTL mirrors for free.
   Colors are design tokens only — no literals. */
(function () {
  if (window.__saqeelPwaShell) return;
  window.__saqeelPwaShell = true;

  /* Transcribed from the shipped shell navigation. `lock` marks a destination
     that is out of scope for the field role: shown, disabled, reason given. */
  var GROUPS = [
    { en: "Overview", ar: "نظرة عامة", items: [
      { en: "Dashboard", ar: "لوحة القيادة", route: "/dashboard",
        d: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>' },
      { en: "Operations Center", ar: "مركز العمليات", route: "/operations",
        d: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12l6-6M12 3v2M21 12h-2"/>' },
      { en: "Factory 360", ar: "المصنع 360", route: "/factories",
        d: '<path d="M3 21V9l6 3V9l6 3V5h6v16z"/><path d="M7 17h2M13 17h2M18 9h3"/>' }
    ]},
    { en: "Operations", ar: "العمليات", items: [
      { en: "Planning", ar: "التخطيط", route: "/planning",
        d: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>' },
      { en: "Execution", ar: "التنفيذ", route: "/field",
        d: '<path d="M9 11l2 2 4-4"/><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/>' },
      { en: "Review & Approval", ar: "المراجعة والاعتماد", route: "/reviews",
        d: '<path d="M9 5h10v16H5V9z"/><path d="M9 5v4H5M9 14l2 2 4-4"/>' }
    ]},
    { en: "Compliance", ar: "الامتثال", items: [
      { en: "Inspection Rules", ar: "قواعد التفتيش", route: "/admin/regulations",
        d: '<path d="M4 4h6v16H4zM14 4h6v16h-6z"/><path d="M7 8h.01M17 8h.01"/>' },
      { en: "Awaiting Approval", ar: "بانتظار الاعتماد", route: "/admin/compliance-approvals",
        d: '<path d="M9 5h10v16H5V9z"/><path d="M9 5v4H5M9 14l2 2 4-4"/>' },
      { en: "Violations & Penalties", ar: "المخالفات والعقوبات", route: "/admin/violations",
        d: '<path d="M4 20h16M8 17l8-8M10 5l4 4M6 9l4 4"/>' }
    ]},
    { en: "Administration", ar: "الإدارة", admin: true, items: [
      { en: "Users", ar: "المستخدمون", route: "/admin/access", lock: true,
        d: '<circle cx="9" cy="8" r="4"/><path d="M3 21v-2a6 6 0 0112 0v2M17 11h4M19 9v4"/>' },
      { en: "Roles", ar: "الأدوار", route: "/admin/access?view=roles", lock: true,
        d: '<circle cx="9" cy="8" r="4"/><path d="M3 21v-2a6 6 0 0112 0v2M17 11h4M19 9v4"/>' },
      { en: "Reference Lists", ar: "القوائم المرجعية", route: "/admin/localization", lock: true,
        d: '<path d="M4 4h6v16H4zM14 4h6v16h-6z"/>' },
      { en: "Risk Settings", ar: "إعدادات المخاطر", route: "/admin/risk", lock: true,
        d: '<path d="M12 3l10 18H2z"/><path d="M12 9v5M12 18h.01"/>' },
      { en: "Inspection Forms", ar: "نماذج التفتيش", route: "/admin/packages", lock: true,
        d: '<path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 11h6M9 15h6"/>' }
    ]}
  ];

  var STR = {
    open:   { en: "Open menu", ar: "فتح القائمة" },
    close:  { en: "Close menu", ar: "إغلاق القائمة" },
    nav:    { en: "Primary navigation", ar: "التنقل الرئيسي" },
    locked: { en: "Administrator access required.", ar: "يتطلب الوصول صلاحية المسؤول." }
  };

  var CSS = [
    /* Burger: hidden by default, revealed by the viewport rule. Same trigger the
       console uses — the pointer term catches an iPad Pro in landscape (1366px,
       above any width breakpoint, still an iPad). */
    ".pwa-shell-menu{display:none;place-items:center;inline-size:38px;block-size:38px;",
    "flex:0 0 auto;border:0;border-radius:9px;background:transparent;color:inherit;cursor:pointer;}",
    ".pwa-shell-menu:hover{background:var(--nav-bg-hover);}",
    ".pwa-shell-menu:focus-visible{outline:2px solid var(--focus-ring);outline-offset:2px;}",
    "@media (max-width:1024px),(pointer:coarse){.pwa-shell-menu{display:grid;}}",

    ".pwa-shell-backdrop{position:fixed;inset:0;z-index:70;border:0;padding:0;",
    "background:var(--nav-bg);opacity:0;visibility:hidden;cursor:pointer;",
    "transition:opacity 180ms,visibility 180ms;}",
    ".pwa-shell-backdrop[data-open]{opacity:.55;visibility:visible;}",

    ".pwa-shell-drawer{position:fixed;z-index:71;inset-block:0;inset-inline-start:0;",
    "inline-size:min(300px,88vw);display:flex;flex-direction:column;",
    "background:var(--nav-bg);color:var(--nav-text);",
    "border-inline-end:1px solid var(--nav-border);box-shadow:var(--shadow-lg);",
    "transform:translateX(-102%);transition:transform 220ms;",
    "padding-block-start:env(safe-area-inset-top);}",
    "[dir=rtl] .pwa-shell-drawer{transform:translateX(102%);}",
    ".pwa-shell-drawer[data-open]{transform:translateX(0);}",

    ".pwa-shell-drawer__head{display:flex;align-items:center;gap:10px;flex:none;",
    "padding:14px 16px;border-block-end:1px solid var(--nav-border);}",
    ".pwa-shell-drawer__brand{font:700 15px var(--font-body);letter-spacing:.14em;",
    "color:var(--nav-text-active);}",
    ".pwa-shell-close{display:grid;place-items:center;inline-size:34px;block-size:34px;",
    "margin-inline-start:auto;border:0;border-radius:8px;background:transparent;",
    "color:var(--nav-text);cursor:pointer;}",
    ".pwa-shell-close:hover{background:var(--nav-bg-hover);}",
    ".pwa-shell-close:focus-visible{outline:2px solid var(--focus-ring);outline-offset:2px;}",

    /* Scroll area clears the sticky footer using the height the tab bar publishes. */
    ".pwa-shell-drawer__scroll{flex:1;overflow-y:auto;overflow-x:hidden;",
    "padding:10px 10px calc(14px + var(--pwa-tabbar-height,0px));}",
    ".pwa-shell-group{margin-block-end:12px;}",
    ".pwa-shell-group__label{font:700 10.5px var(--font-body);letter-spacing:.08em;",
    "text-transform:uppercase;color:var(--nav-indicator);padding:0 10px;margin-block-end:4px;}",

    /* Fixed 20px icon slot that never shrinks; label ellipses instead of pushing
       the glyph out of place. This is what stops the row overflowing. */
    ".pwa-shell-row{display:flex;align-items:center;gap:12px;min-block-size:38px;",
    "padding:0 10px;border-radius:8px;text-decoration:none;color:var(--nav-text);",
    "font:600 13px var(--font-body);overflow:hidden;}",
    ".pwa-shell-row:hover{background:var(--nav-bg-hover);color:var(--nav-text-active);}",
    ".pwa-shell-row:focus-visible{outline:2px solid var(--focus-ring);outline-offset:-2px;}",
    ".pwa-shell-row__icon{display:grid;place-items:center;inline-size:20px;block-size:20px;flex:none;}",
    ".pwa-shell-row__label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-inline-size:0;}",
    ".pwa-shell-row.is-locked{opacity:.5;cursor:not-allowed;}",
    ".pwa-shell-row.is-locked:hover{background:transparent;color:var(--nav-text);}",
    ".pwa-shell-row__lock{margin-inline-start:auto;display:grid;place-items:center;flex:none;}",
    "@media (prefers-reduced-motion:reduce){.pwa-shell-drawer,.pwa-shell-backdrop{transition:none;}}"
  ].join("");

  function injectCss() {
    if (document.getElementById("pwa-shell-css")) return;
    var st = document.createElement("style");
    st.id = "pwa-shell-css";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function isArabic() {
    var el = document.querySelector("[dir=rtl],[lang=ar]");
    return !!el || document.documentElement.lang === "ar";
  }
  function L(o, ar) { return ar ? o.ar : o.en; }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  var parts = null, btn = null;

  function icon(d) {
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + d + "</svg>";
  }

  function buildDrawer(ar) {
    var backdrop = document.createElement("button");
    backdrop.type = "button";
    backdrop.className = "pwa-shell-backdrop";
    backdrop.setAttribute("aria-label", L(STR.close, ar));

    var drawer = document.createElement("nav");
    drawer.className = "pwa-shell-drawer";
    drawer.id = "saqeel-primary-nav";
    drawer.setAttribute("aria-label", L(STR.nav, ar));

    var head = document.createElement("div");
    head.className = "pwa-shell-drawer__head";
    head.innerHTML =
      '<span class="pwa-shell-drawer__brand">SAQEEL</span>' +
      '<button type="button" class="pwa-shell-close" aria-label="' + esc(L(STR.close, ar)) + '">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg></button>';

    var scroll = document.createElement("div");
    scroll.className = "pwa-shell-drawer__scroll";
    scroll.innerHTML = GROUPS.map(function (g) {
      var rows = g.items.map(function (it) {
        var label = L(it, ar);
        var lockGlyph = '<span class="pwa-shell-row__lock" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" ' +
          'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
          '<rect x="5" y="10" width="14" height="11" rx="2"/>' +
          '<path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></span>';
        var body = '<span class="pwa-shell-row__icon">' + icon(it.d) + "</span>" +
          '<span class="pwa-shell-row__label">' + esc(label) + "</span>";
        if (it.lock) {
          return '<span class="pwa-shell-row is-locked" role="link" aria-disabled="true" tabindex="0"' +
            ' title="' + esc(label + " — " + L(STR.locked, ar)) + '"' +
            ' aria-label="' + esc(label + ". " + L(STR.locked, ar)) + '">' + body + lockGlyph + "</span>";
        }
        /* Design mock: the route is recorded on the row rather than linked, because
           these are application routes and the design set has no page for them. */
        return '<a class="pwa-shell-row" href="#" title="' + esc(label + " — " + it.route) + '">' +
          body + "</a>";
      }).join("");
      return '<div class="pwa-shell-group"><div class="pwa-shell-group__label">' +
        esc(L(g, ar)) + "</div>" + rows + "</div>";
    }).join("");

    drawer.appendChild(head);
    drawer.appendChild(scroll);
    return { backdrop: backdrop, drawer: drawer, close: head.querySelector(".pwa-shell-close") };
  }

  function buildButton(ar) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "pwa-shell-menu";
    b.setAttribute("aria-label", L(STR.open, ar));
    b.setAttribute("aria-controls", "saqeel-primary-nav");
    b.setAttribute("aria-expanded", "false");
    b.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" ' +
      'stroke="currentColor" stroke-width="1.8" stroke-linecap="round">' +
      '<path d="M4 7h16M4 12h16M4 17h16"/></svg>';
    return b;
  }

  /* The page's <header> can arrive after the first pass (DC renders async), so
     placement is re-checked on every pass. Without this the button would sit in
     the floating fallback on top of the page's own back control. */
  function placeButton() {
    var header = document.querySelector("header");
    if (!header) return false;
    if (btn.parentElement === header && header.firstElementChild === btn) return true;
    header.insertBefore(btn, header.firstChild);
    return true;
  }

  function mount() {
    injectCss();
    var ar = isArabic();
    parts = buildDrawer(ar);
    document.body.appendChild(parts.backdrop);
    document.body.appendChild(parts.drawer);
    btn = buildButton(ar);
    placeButton();

    var lastFocus = null;
    function isOpen() { return parts.drawer.hasAttribute("data-open"); }
    function open() {
      lastFocus = document.activeElement;
      parts.drawer.setAttribute("data-open", "");
      parts.backdrop.setAttribute("data-open", "");
      btn.setAttribute("aria-expanded", "true");
      var f = parts.drawer.querySelector("a,button,[tabindex]");
      if (f) f.focus();
    }
    function close() {
      parts.drawer.removeAttribute("data-open");
      parts.backdrop.removeAttribute("data-open");
      btn.setAttribute("aria-expanded", "false");
      if (lastFocus && lastFocus.focus) lastFocus.focus(); else btn.focus();
    }

    btn.addEventListener("click", function () { isOpen() ? close() : open(); });
    parts.backdrop.addEventListener("click", close);
    parts.close.addEventListener("click", close);
    parts.drawer.addEventListener("click", function (e) {
      if (e.target.closest("a.pwa-shell-row")) close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen()) { e.preventDefault(); close(); }
    });
    parts.drawer.addEventListener("keydown", function (e) {
      if (e.key !== "Tab" || !isOpen()) return;
      var f = parts.drawer.querySelectorAll("a,button,[tabindex]");
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  function ensure() {
    if (!document.body) return;
    if (!btn || !document.querySelector(".pwa-shell-menu")) { mount(); return; }
    placeButton();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ensure);
  } else {
    ensure();
  }
  setTimeout(ensure, 120);
  setTimeout(ensure, 600);
  setTimeout(ensure, 1600);
  if (window.MutationObserver && document.documentElement) {
    var pending = 0;
    var mo = new MutationObserver(function () {
      if (pending) return;
      pending = setTimeout(function () { pending = 0; ensure(); }, 250);
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
