/* SAQEEL PWA — persistent sticky tab bar (WA-PWA-TAB-r1)
   Two jobs:
   1. If the page already has its own bottom tab bar (a <nav> whose links target the
      field pages), pin THAT one — the page keeps its own localized labels.
   2. Otherwise inject a standard 5-tab bar, labels chosen from the page's dir/lang.
   Fixed positioning, safe-area aware, and it reserves scroll space so nothing hides
   behind it. Idempotent: mounts once per document. */
(function () {
  if (window.__saqeelPwaTabbar) return;
  window.__saqeelPwaTabbar = true;

  var TABS = [
    { file: "SAQEEL PWA-Field Dashboard.dc.html", en: "Home", ar: "الرئيسية", key: "home",
      d: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>' },
    { file: "SAQEEL PWA-Field My Tasks.dc.html", en: "My Tasks", ar: "مهامي", key: "tasks",
      d: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6M9 13h6"/>' },
    { file: "SAQEEL PWA-Field Establishments.dc.html", en: "Establishments", ar: "المنشآت", key: "est",
      d: '<path d="M3 21V10l7 4v-4l7 4V6l4-2v17"/>' },
    { file: "SAQEEL PWA-Field Notifications.dc.html", en: "Notifications", ar: "الإشعارات", key: "notif",
      d: '<path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>' },
    { file: "SAQEEL PWA-Field Account.dc.html", en: "Account", ar: "حسابي", key: "account",
      d: '<circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/>' }
  ];

  var CSS = [
    ".pwa-tabbar{position:fixed;inset-inline:0;bottom:0;z-index:60;display:flex;",
    "background:var(--nav-bg);color:var(--nav-text);",
    "border-block-start:1px solid var(--nav-border,rgba(255,255,255,.10));",
    "box-shadow:0 -6px 22px -10px rgba(0,0,0,.55);",
    "padding-block-end:env(safe-area-inset-bottom);",
    "padding-inline:max(0px,env(safe-area-inset-left)) max(0px,env(safe-area-inset-right));",
    "backdrop-filter:saturate(120%) blur(6px);}",
    ".pwa-tabbar>a{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;",
    "gap:3px;min-height:56px;padding:9px 0 8px;text-decoration:none;color:var(--nav-text);",
    "font:600 11px var(--font-body);transition:color 120ms,background 120ms;}",
    ".pwa-tabbar>a:hover{background:var(--nav-hover,rgba(255,255,255,.05));}",
    ".pwa-tabbar>a[aria-current=page]{color:var(--nav-text-active);}",
    ".pwa-tabbar>a[aria-current=page]::before{content:'';position:absolute;inset-block-start:0;",
    "inline-size:34px;block-size:2px;border-radius:0 0 2px 2px;background:var(--nav-indicator,var(--action-primary));}",
    ".pwa-tabbar>a{position:relative;}",
    ".pwa-tabbar>a:focus-visible{outline:2px solid var(--nav-indicator,var(--action-primary));outline-offset:-3px;}",
    "@media (min-width:834px){.pwa-tabbar>a{min-height:60px;font-size:11.5px;}}",
    "body{padding-block-end:var(--pwa-tabbar-space,0px)!important;}"
  ].join("");

  function injectCss() {
    if (document.getElementById("pwa-tabbar-css")) return;
    var st = document.createElement("style");
    st.id = "pwa-tabbar-css";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  function isArabic() {
    var el = document.querySelector("[dir=rtl],[lang=ar]");
    return !!el || document.documentElement.lang === "ar";
  }

  /* A tab bar the page already authored: a <nav> containing a link to a field page. */
  function findNativeBar() {
    var navs = document.querySelectorAll("nav");
    for (var i = navs.length - 1; i >= 0; i--) {
      var n = navs[i];
      if (n.querySelector('a[href*="PWA-Field%20Dashboard"],a[href*="PWA-Field Dashboard"]')) return n;
    }
    return null;
  }

  function build(active) {
    var ar = isArabic();
    var nav = document.createElement("nav");
    nav.className = "pwa-tabbar";
    nav.setAttribute("aria-label", ar ? "التنقل الرئيسي" : "Primary navigation");
    nav.innerHTML = TABS.map(function (t) {
      var cur = t.key === active ? ' aria-current="page"' : "";
      return '<a href="' + encodeURI(t.file) + '" target="_top"' + cur + '>' +
        '<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" ' +
        'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + t.d + "</svg>" +
        "<span>" + (ar ? t.ar : t.en) + "</span></a>";
    }).join("");
    return nav;
  }

  function activeKey() {
    var f = decodeURIComponent(location.pathname.split("/").pop() || "");
    if (/My Tasks/i.test(f)) return "tasks";
    if (/Establishment/i.test(f)) return "est";
    if (/Notifications/i.test(f)) return "notif";
    if (/Account|Settings|Trusted|Biometric/i.test(f)) return "account";
    if (/Dashboard/i.test(f)) return "home";
    return null;
  }

  function reserve(el) {
    var h = Math.round(el.getBoundingClientRect().height || 60);
    document.documentElement.style.setProperty("--pwa-tabbar-height", h + "px");
    return h;
  }

  /* Pages that own a bottom action bar (wizard Previous/Submit, sync status) keep it —
     it is lifted to sit directly ABOVE the tab bar instead of underneath it, and its
     height is added to the reserved scroll space so content clears both bands. */
  function stackPageFooters(barH) {
    var extra = 0;
    var nodes = document.body ? document.body.querySelectorAll("*") : [];
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.classList.contains("pwa-tabbar") || el.closest(".pwa-tabbar")) continue;
      var known = el.hasAttribute("data-pwa-stacked");
      var cs = getComputedStyle(el);
      if (cs.position !== "sticky" && cs.position !== "fixed") continue;
      if (!known && cs.bottom !== "0px") continue;
      var h = el.getBoundingClientRect().height;
      if (!h || h > 220) continue; /* not an action bar — a full-height overlay */
      /* var() offset: tracks the real bar height, so no re-measure pass is needed. */
      if (el.style.bottom !== "var(--pwa-tabbar-height)") {
        el.style.bottom = "var(--pwa-tabbar-height)";
      }
      el.setAttribute("data-pwa-stacked", "");
      if (h > extra) extra = h;
    }
    document.documentElement.style.setProperty(
      "--pwa-tabbar-space", Math.round(barH + extra) + "px");
  }

  function mount() {
    injectCss();
    var native = findNativeBar();
    var bar;
    if (native) {
      /* Pin the page's own bar — keeps its localized labels and active state. */
      native.classList.add("pwa-tabbar");
      native.style.position = "fixed";
      native.style.insetInlineStart = "0";
      native.style.insetInlineEnd = "0";
      native.style.bottom = "0";
      native.style.zIndex = "60";
      bar = native;
    } else {
      bar = build(activeKey());
      document.body.appendChild(bar);
    }
    var h = reserve(bar);
    stackPageFooters(h);
    if (window.ResizeObserver) {
      new ResizeObserver(function () { stackPageFooters(reserve(bar)); }).observe(bar);
    }
    /* One late pass once fonts/layout settle, so reserved space uses final heights. */
    setTimeout(function () { stackPageFooters(reserve(bar)); }, 400);
  }

  /* DC re-renders can replace the page's own nav — re-run until a bar is present,
     then keep watching cheaply for template swaps. */
  function ensure() {
    if (!document.body) return;
    var bar = document.querySelector(".pwa-tabbar");
    if (!bar) { mount(); return; }
    /* A DC re-render can replace the page's action bar — re-stack any new one. */
    stackPageFooters(reserve(bar));
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
