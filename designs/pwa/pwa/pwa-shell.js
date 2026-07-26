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
   from the shipped navigation.

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

   Idempotent, safe-area aware, logical-axis only so RTL mirrors for free.
   Colors are design tokens only — no literals. */
(function () {
  if (window.__saqeelPwaShell) return;
  window.__saqeelPwaShell = true;

  /* Transcribed from the shipped shell navigation. `admin: true` on a group
     means administrator-only — hidden from every other persona. `lock` marks an
     item that is administrator-governed; it is never rendered to a non-admin
     (the group carrying it is already gone) and renders unlocked to an admin. */
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

    /* Pages with no <header> of their own (login, biometric, the index and the
       reference diagrams) still need a way into the side panel, so the button
       floats in the top inline-start corner instead of being placed in a header.
       Tokens only, safe-area aware, logical axis so RTL mirrors for free. */
    ".pwa-shell-menu.is-floating{position:fixed;z-index:72;",
    "inset-block-start:max(12px,env(safe-area-inset-top));",
    "inset-inline-start:max(12px,env(safe-area-inset-left));",
    "background:var(--surface-primary);color:var(--text-primary);",
    "border:1px solid var(--border-subtle);box-shadow:var(--shadow-card);}",
    ".pwa-shell-menu.is-floating:hover{background:var(--surface-sunken);}",

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
    /* WA-BRAND lockup: shield mark + bilingual wordmark, matching the sign-in screen. */
    ".pwa-shell-drawer__lockup{display:flex;align-items:center;gap:9px;min-inline-size:0;}",
    ".pwa-shell-drawer__mark{inline-size:22px;block-size:22px;flex:none;color:var(--nav-indicator);}",
    ".pwa-shell-drawer__brand{font:700 15px var(--font-body);letter-spacing:.14em;",
    "color:var(--nav-text-active);}",
    ".pwa-shell-drawer__brand-ar{font:700 14px var(--font-body);color:var(--nav-text-active);}",
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

  /* Language comes from the PAGE, so the drawer's own bilingual lockup (which
     carries a lang="ar" span) must not be read back as evidence the page is
     Arabic — nodes inside the shell are skipped. */
  function isArabic() {
    var els = document.querySelectorAll("[dir=rtl],[lang=ar]");
    for (var i = 0; i < els.length; i++) {
      if (!els[i].closest(".pwa-shell-drawer")) return true;
    }
    return document.documentElement.lang === "ar";
  }
  function L(o, ar) { return ar ? o.ar : o.en; }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  var parts = null, btn = null, builtRole = null, builtLang = null;

  function icon(d) {
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + d + "</svg>";
  }

  /* Group markup for the current persona. Extracted so the drawer can be rebuilt
     in place when the role changes, without re-mounting the burger. */
  function groupsHtml(ar) {
    var admin = isAdmin();
    builtRole = currentRole();
    builtLang = ar ? "ar" : "en";
    return visibleGroups().map(function (g) {
      var rows = g.items.map(function (it) {
        var label = L(it, ar);
        var lockGlyph = '<span class="pwa-shell-row__lock" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" ' +
          'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
          '<rect x="5" y="10" width="14" height="11" rx="2"/>' +
          '<path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></span>';
        var body = '<span class="pwa-shell-row__icon">' + icon(it.d) + "</span>" +
          '<span class="pwa-shell-row__label">' + esc(label) + "</span>";
        if (it.lock && !admin) {
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
  }

  function rebuild() {
    if (!parts || !parts.drawer) return;
    var ar = isArabic();
    var sc = parts.drawer.querySelector(".pwa-shell-drawer__scroll");
    if (sc) sc.innerHTML = groupsHtml(ar);
    parts.drawer.setAttribute("aria-label", L(STR.nav, ar));
    parts.backdrop.setAttribute("aria-label", L(STR.close, ar));
    if (parts.close) parts.close.setAttribute("aria-label", L(STR.close, ar));
    if (btn) btn.setAttribute("aria-label", L(STR.open, ar));
  }

  function buildDrawerScroll(ar) {
    var scroll = document.createElement("div");
    scroll.className = "pwa-shell-drawer__scroll";
    scroll.innerHTML = groupsHtml(ar);
    return scroll;
  }

  function buildDrawerParts(ar) {
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
      '<span class="pwa-shell-drawer__lockup">' +
      '<svg class="pwa-shell-drawer__mark" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>' +
      '<span class="pwa-shell-drawer__brand">SAQEEL</span>' +
      '<span class="pwa-shell-drawer__brand-ar" lang="ar">\u0635\u0642\u064a\u0644</span>' +
      '</span>' +
      '<button type="button" class="pwa-shell-close" aria-label="' + esc(L(STR.close, ar)) + '">' +
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" ' +
      'stroke-width="1.8" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg></button>';

    drawer.appendChild(head);
    drawer.appendChild(buildDrawerScroll(ar));
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
    if (!header) {
      /* No header on this page — float it. Re-checked on every pass, so if a
         header streams in later the button moves into it and drops the class. */
      btn.classList.add("is-floating");
      if (btn.parentElement !== document.body) document.body.appendChild(btn);
      return true;
    }
    btn.classList.remove("is-floating");
    if (btn.parentElement === header && header.firstElementChild === btn) return true;
    header.insertBefore(btn, header.firstChild);
    return true;
  }

  function mount() {
    injectCss();
    var ar = isArabic();
    parts = buildDrawerParts(ar);
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
      /* A floating burger sits over the drawer's own brand row, so it steps
         aside while the drawer is open; a header-placed one is covered anyway. */
      if (btn.classList.contains("is-floating")) btn.style.visibility = "hidden";
      var f = parts.drawer.querySelector("a,button,[tabindex]");
      if (f) f.focus();
    }
    function close() {
      parts.drawer.removeAttribute("data-open");
      parts.backdrop.removeAttribute("data-open");
      btn.setAttribute("aria-expanded", "false");
      btn.style.visibility = "";
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
    /* A page may declare its persona or its language after the shell mounts (DC
       renders async), so the drawer is rebuilt when either actually changes —
       otherwise an inspector could keep an Administration group built for an
       earlier role, or an Arabic page could keep English labels. */
    if (currentRole() !== builtRole || (isArabic() ? "ar" : "en") !== builtLang) rebuild();
    placeButton();
  }

  /* Lets a design flip persona (a Tweak, a demo control) and have the drawer
     honour it immediately. Presentation only — never an authorisation path. */
  window.saqeelSetRole = function (role) {
    document.documentElement.setAttribute("data-saqeel-role", String(role || "inspector"));
    rebuild();
  };

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
