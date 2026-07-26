/* SAQEEL PWA — shared shell: hamburger + web side panel (WA-SHELL-r6)

   THE RULE (Product Owner, 2026-07-26). The trigger is the VIEWPORT, never the
   persona and never the channel:
     • Desktop / Mac      — web app. Persistent rail, no burger, no sticky footer.
     • iPad or any shrunk / responsive width — burger AND sticky footer, both,
       for every role.
   The sticky footer is pwa-tabbar.js, already on every field page. This file adds
   the other half: the burger, and the drawer it opens.

   ADMINISTRATOR VISIBILITY (Product Owner, 2026-07-26 — supersedes the earlier
   "show it locked" rule). Administrator destinations are NOT shown to every
   persona: a group marked `admin` is OMITTED ENTIRELY unless the signed-in role
   is an administrator. An inspector no longer sees a locked Administration
   group — they see no Administration group at all, and cannot enumerate admin
   surfaces from the drawer. For an administrator the same items render as
   ordinary rows, because for that persona they are not locked.

   Role comes from the page, never from this file: `data-saqeel-role` on <html>
   or <body>, or window.SAQEEL_ROLE. Default is `inspector` — the field PWA's
   persona — so the safe case is the DEFAULT case, not an opt-in. Real
   enforcement is server-side RLS; this is presentation only and must never be
   the only gate.

   HIERARCHY. The drawer reproduces the side panel from SAQEEL Web Shell
   v5.dc.html at its real depth, not flattened:
     • groups collapse, with a chevron and aria-expanded
     • Operations nests an "Inspection" subgroup; Administration nests
       "Advanced Administration" — both indent their children
     • Administration is pinned below the scroll region and closed by default
   Labels, their Arabic, the parent labels and the nesting all come from the
   shipped navigation (shell-navigation.ts parentId / parentLabelEn /
   parentLabelAr). Nothing here is authored.

   Idempotent, safe-area aware, logical-axis only so RTL mirrors for free.
   Colors are design tokens only — no literals. */
(function () {
  if (window.__saqeelPwaShell) return;
  window.__saqeelPwaShell = true;

  var ICON = {
    dashboard: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    ops: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12l6-6M12 3v2M21 12h-2"/>',
    factory: '<path d="M3 21V9l6 3V9l6 3V5h6v16z"/><path d="M7 17h2M13 17h2M18 9h3"/>',
    planning: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    shield: '<path d="M9 11l2 2 4-4"/><path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/>',
    review: '<path d="M9 5h10v16H5V9z"/><path d="M9 5v4H5M9 14l2 2 4-4"/>',
    book: '<path d="M4 4h6v16H4zM14 4h6v16h-6z"/><path d="M7 8h.01M17 8h.01"/>',
    gavel: '<path d="M4 20h16M8 17l8-8M10 5l4 4M6 9l4 4"/>',
    users: '<circle cx="9" cy="8" r="4"/><path d="M3 21v-2a6 6 0 0112 0v2M17 11h4M19 9v4"/>',
    lists: '<path d="M4 4h6v16H4zM14 4h6v16h-6z"/>',
    risk: '<path d="M12 3l10 18H2z"/><path d="M12 9v5M12 18h.01"/>',
    forms: '<path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 11h6M9 15h6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87A2 2 0 1 1 16.9 19.7a1.7 1.7 0 0 0-2.87 1.3 2 2 0 0 1-4 0 1.7 1.7 0 0 0-2.87-1.3A2 2 0 1 1 4.3 16.87 1.7 1.7 0 0 0 3 14H3a2 2 0 0 1 0-4 1.7 1.7 0 0 0 1.3-2.87A2 2 0 1 1 7.13 4.3 1.7 1.7 0 0 0 10 3a2 2 0 0 1 4 0 1.7 1.7 0 0 0 2.87 1.3A2 2 0 1 1 19.7 7.13 1.7 1.7 0 0 0 21 10a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z"/>',
    nodes: '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M8 6h8M17 8l-4 8M7 8l4 8"/>'
  };

  /* The v5 tree. `sub: true` marks a subgroup parent — a label, not a link, with
     indented children beneath it. `admin: true` on a GROUP means
     administrator-only: omitted entirely from every other persona's markup. */
  var GROUPS = [
    { en: "Overview", ar: "نظرة عامة", open: true, items: [
      { en: "Dashboard", ar: "لوحة القيادة", route: "/dashboard", d: ICON.dashboard },
      { en: "Operations Center", ar: "مركز العمليات", route: "/operations", d: ICON.ops },
      { en: "Factory 360", ar: "المصنع 360", route: "/factories", d: ICON.factory }
    ]},
    { en: "Operations", ar: "العمليات", open: true, items: [
      { en: "Planning", ar: "التخطيط", route: "/planning", d: ICON.planning },
      { sub: true, en: "Inspection", ar: "التفتيش", d: ICON.shield, children: [
        { en: "Execution", ar: "التنفيذ", route: "/field", d: ICON.shield },
        { en: "Review & Approval", ar: "المراجعة والاعتماد", route: "/reviews", d: ICON.review }
      ]}
    ]},
    { en: "Compliance", ar: "الامتثال", open: true, items: [
      { en: "Inspection Rules", ar: "قواعد التفتيش", route: "/admin/regulations", d: ICON.book },
      { en: "Awaiting Approval", ar: "بانتظار الاعتماد", route: "/admin/compliance-approvals", d: ICON.review },
      { en: "Violations & Penalties", ar: "المخالفات والعقوبات", route: "/admin/violations", d: ICON.gavel }
    ]},
    /* Administrator-only, and pinned below the scroll region closed by default,
       as v5 renders it. An inspector never receives this markup at all. */
    { en: "Administration", ar: "الإدارة", admin: true, pinned: true, open: false, d: ICON.gear, items: [
      { en: "Users", ar: "المستخدمون", route: "/admin/access", d: ICON.users },
      { en: "Roles", ar: "الأدوار", route: "/admin/access?view=roles", d: ICON.users },
      { en: "Reference Lists", ar: "القوائم المرجعية", route: "/admin/localization", d: ICON.lists },
      { en: "Risk Settings", ar: "إعدادات المخاطر", route: "/admin/risk", d: ICON.risk },
      { en: "Inspection Forms", ar: "نماذج التفتيش", route: "/admin/packages", d: ICON.forms },
      { sub: true, en: "Advanced Administration", ar: "الإدارة المتقدمة", d: ICON.nodes, children: [
        { en: "Execution Settings", ar: "إعدادات التنفيذ", route: "/admin/execution" },
        { en: "Workflow Settings", ar: "إعدادات سير العمل", route: "/admin/workflows" },
        { en: "Map Settings", ar: "إعدادات الخرائط", route: "/admin/gis" },
        { en: "Activity Log", ar: "سجل النشاط", route: "/admin/audit" },
        { en: "Issue Multiple Violations", ar: "إصدار عدة مخالفات", route: "/admin/bulk-violations" }
      ]}
    ]}
  ];

  var STR = {
    open:  { en: "Open menu", ar: "فتح القائمة" },
    close: { en: "Close menu", ar: "إغلاق القائمة" },
    nav:   { en: "Primary navigation", ar: "التنقل الرئيسي" }
  };

  /* Administrator roles, per the shipped role vocabulary. Anything else — and
     the absence of any declaration — is treated as non-admin. */
  var ADMIN_ROLES = ["administrator", "admin", "system_admin", "super_admin"];

  function currentRole() {
    var el = document.documentElement, b = document.body;
    var r = (el && el.getAttribute("data-saqeel-role")) ||
      (b && b.getAttribute("data-saqeel-role")) || window.SAQEEL_ROLE || "inspector";
    return String(r).trim().toLowerCase();
  }
  function isAdmin() { return ADMIN_ROLES.indexOf(currentRole()) !== -1; }

  /* Groups this persona may see. Non-admins never receive the admin groups in
     their markup at all — not hidden with CSS, not disabled: absent. */
  function visibleGroups() {
    var admin = isAdmin();
    return GROUPS.filter(function (g) { return !g.admin || admin; });
  }

  var CSS = [
    /* ALWAYS shown. The field PWA has one target — an inspector's iPad — so
       there is no width at which a desktop side panel takes over and the burger
       becomes redundant. It previously carried the console's
       (max-width:1024px),(pointer:coarse) gate, which hid it whenever the page
       was viewed on a wide fine-pointer screen (any desktop preview) and left
       these pages with no way into the side panel at all. */
    ".pwa-shell-menu{display:grid;place-items:center;inline-size:38px;block-size:38px;",
    "flex:0 0 auto;border:0;border-radius:9px;background:transparent;color:inherit;cursor:pointer;}",
    ".pwa-shell-menu:hover{background:var(--nav-bg-hover);}",
    ".pwa-shell-menu:focus-visible{outline:2px solid var(--focus-ring);outline-offset:2px;}",
    /* Pages that render no <header> of their own (Account, Biometric) still need
       the burger, so it floats at the start edge instead of being dropped. */
    ".pwa-shell-menu--floating{position:fixed;z-index:62;",
    "inset-block-start:max(10px,env(safe-area-inset-top));",
    "inset-inline-start:max(10px,env(safe-area-inset-left));",
    "background:var(--nav-bg);box-shadow:var(--shadow-md);}",

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

    ".pwa-shell-drawer__scroll{flex:1;overflow-y:auto;overflow-x:hidden;padding:8px 10px;}",
    /* Administration is pinned below the scroll region and clears the footer. */
    ".pwa-shell-drawer__pin{flex:none;border-block-start:1px solid var(--nav-border);",
    "padding:6px 10px calc(10px + var(--pwa-tabbar-height,0px));}",
    ".pwa-shell-drawer__pin:empty{display:none;}",

    /* Group header — collapsible, chevron rotates when closed. */
    ".pwa-shell-trigger{inline-size:100%;display:flex;align-items:center;gap:8px;",
    "padding:8px 10px 5px;border:0;background:none;cursor:pointer;text-align:start;",
    "color:color-mix(in srgb, var(--nav-text) 65%, transparent);",
    "font:600 10.5px var(--font-body);letter-spacing:.08em;text-transform:uppercase;",
    "border-radius:6px;overflow:hidden;}",
    ".pwa-shell-trigger:hover{color:var(--nav-text-active);background:var(--nav-bg-hover);}",
    ".pwa-shell-trigger:focus-visible{outline:2px solid var(--focus-ring);outline-offset:2px;}",
    ".pwa-shell-chev{margin-inline-start:auto;flex:none;transition:transform 140ms;}",
    ".pwa-shell-trigger[aria-expanded=false] .pwa-shell-chev{transform:rotate(-90deg);}",
    "[dir=rtl] .pwa-shell-trigger[aria-expanded=false] .pwa-shell-chev{transform:rotate(90deg);}",
    ".pwa-shell-body[hidden]{display:none;}",

    /* Subgroup parent: a label, not a link. Children indent beneath it. */
    ".pwa-shell-sub{display:flex;align-items:center;gap:12px;min-block-size:36px;",
    "padding:0 10px;color:var(--nav-text-active);font:600 13px var(--font-body);overflow:hidden;}",
    ".pwa-shell-child{margin-inline-start:24px;inline-size:calc(100% - 24px);}",

    /* Fixed 20px icon slot that never shrinks; label ellipses instead of pushing
       the glyph out of place. This is what stops the row overflowing. */
    ".pwa-shell-row{display:flex;align-items:center;gap:12px;min-block-size:38px;",
    "padding:0 10px;border-radius:8px;text-decoration:none;color:var(--nav-text);",
    "font:600 13px var(--font-body);overflow:hidden;}",
    ".pwa-shell-row:hover{background:var(--nav-bg-hover);color:var(--nav-text-active);}",
    ".pwa-shell-row:focus-visible{outline:2px solid var(--focus-ring);outline-offset:-2px;}",
    ".pwa-shell-row__icon,.pwa-shell-sub__icon{display:grid;place-items:center;",
    "inline-size:20px;block-size:20px;flex:none;}",
    ".pwa-shell-row__label,.pwa-shell-sub__label{overflow:hidden;text-overflow:ellipsis;",
    "white-space:nowrap;min-inline-size:0;}",
    "@media (prefers-reduced-motion:reduce){.pwa-shell-drawer,.pwa-shell-backdrop,",
    ".pwa-shell-chev{transition:none;}}"
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
  function icon(d) {
    if (!d) return "";
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + d + "</svg>";
  }

  var parts = null, btn = null, builtRole = null, uid = 0;

  /* Design mock: the route is recorded on the row rather than linked, because
     these are application routes and the design set has no page for them. */
  function row(it, ar, child) {
    var label = L(it, ar);
    return '<a class="pwa-shell-row' + (child ? " pwa-shell-child" : "") +
      '" href="#" title="' + esc(label + " — " + it.route) + '">' +
      '<span class="pwa-shell-row__icon">' + icon(it.d) + "</span>" +
      '<span class="pwa-shell-row__label">' + esc(label) + "</span></a>";
  }

  function itemsHtml(items, ar) {
    return items.map(function (it) {
      if (!it.sub) return row(it, ar, false);
      var pid = "pwa-sub-" + (++uid);
      return '<div role="group" aria-labelledby="' + pid + '">' +
        '<div class="pwa-shell-sub" id="' + pid + '">' +
        '<span class="pwa-shell-sub__icon">' + icon(it.d) + "</span>" +
        '<span class="pwa-shell-sub__label">' + esc(L(it, ar)) + "</span></div>" +
        it.children.map(function (c) { return row(c, ar, true); }).join("") +
        "</div>";
    }).join("");
  }

  function groupHtml(g, ar) {
    var gid = "pwa-grp-" + (++uid);
    return "<section>" +
      '<button type="button" class="pwa-shell-trigger" aria-expanded="' +
      (g.open ? "true" : "false") + '" aria-controls="' + gid + '">' +
      (g.d ? '<span class="pwa-shell-row__icon">' + icon(g.d) + "</span>" : "") +
      '<span class="pwa-shell-row__label">' + esc(L(g, ar)) + "</span>" +
      '<svg class="pwa-shell-chev" viewBox="0 0 24 24" width="15" height="15" fill="none" ' +
      'stroke="currentColor" stroke-width="1.8" stroke-linecap="round">' +
      '<path d="m8 10 4 4 4-4"/></svg></button>' +
      '<div class="pwa-shell-body" id="' + gid + '"' + (g.open ? "" : " hidden") + ">" +
      itemsHtml(g.items, ar) + "</div></section>";
  }

  /* Markup for the current persona. Extracted so the drawer can be rebuilt in
     place when the role changes, without re-mounting the burger. */
  function scrollHtml(ar) {
    builtRole = currentRole();
    return visibleGroups().filter(function (g) { return !g.pinned; })
      .map(function (g) { return groupHtml(g, ar); }).join("");
  }
  function pinHtml(ar) {
    return visibleGroups().filter(function (g) { return g.pinned; })
      .map(function (g) { return groupHtml(g, ar); }).join("");
  }

  function rebuild() {
    if (!parts || !parts.drawer) return;
    var ar = isArabic();
    var sc = parts.drawer.querySelector(".pwa-shell-drawer__scroll");
    var pin = parts.drawer.querySelector(".pwa-shell-drawer__pin");
    if (sc) sc.innerHTML = scrollHtml(ar);
    if (pin) pin.innerHTML = pinHtml(ar);
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
    scroll.innerHTML = scrollHtml(ar);

    var pin = document.createElement("div");
    pin.className = "pwa-shell-drawer__pin";
    pin.innerHTML = pinHtml(ar);

    drawer.appendChild(head);
    drawer.appendChild(scroll);
    drawer.appendChild(pin);
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
     placement is re-checked on every pass. Pages that render no <header> at all
     get the floating variant rather than losing the burger. */
  function placeButton() {
    var header = document.querySelector("header");
    if (!header) {
      if (btn.parentElement !== document.body) document.body.appendChild(btn);
      btn.classList.add("pwa-shell-menu--floating");
      return false;
    }
    if (btn.parentElement === header && header.firstElementChild === btn) return true;
    btn.classList.remove("pwa-shell-menu--floating");
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
      var f = parts.drawer.querySelector("a,button");
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
      var trigger = e.target.closest(".pwa-shell-trigger");
      if (trigger) {
        var expanded = trigger.getAttribute("aria-expanded") === "true";
        trigger.setAttribute("aria-expanded", expanded ? "false" : "true");
        var body = document.getElementById(trigger.getAttribute("aria-controls"));
        if (body) body.hidden = expanded;
        return;
      }
      if (e.target.closest("a.pwa-shell-row")) close();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen()) { e.preventDefault(); close(); }
    });
    parts.drawer.addEventListener("keydown", function (e) {
      if (e.key !== "Tab" || !isOpen()) return;
      var f = parts.drawer.querySelectorAll("a,button");
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
    /* A DC re-render can swap the role attribute — rebuild if the persona moved. */
    if (builtRole !== null && builtRole !== currentRole()) rebuild();
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
