/* WA-ADMIN-r2 behaviour.
   Listeners are DELEGATED from the document, never bound to the shell node: the
   DC runtime re-creates that subtree after first paint, which orphans anything
   attached directly to it. Per-node STATE (locale, compact rail, stored lists,
   role enforcement) is re-applied whenever a fresh shell appears.

   Every list this file renders is sourced from markup that tools/admin-shell.js
   already filtered by role. It never invents a destination, a count or an
   activity record. */
(function () {
  "use strict";
  var K_COMPACT = "saqeel-admin-rail-compact";
  var K_LOCALE = "saqeel-admin-locale";
  var K_THEME = "saqeel-admin-theme";
  var K_FAV = "saqeel-admin-favorites";
  var K_RECENT = "saqeel-admin-recents";
  var HAS_STORE = (function () { try { localStorage.setItem("__t", "1"); localStorage.removeItem("__t"); return true; } catch (e) { return false; } })();

  function ls(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* no store */ } }
  function shell() { return document.querySelector(".ad-shell"); }

  /* ── recommendation 4 · unauthorized destinations leave the DOM ─────────────
     Re-asserted at render time as well as at build time. Removal, never
     disabling: a greyed row still tells the user the capability exists. A hub
     whose children all disappear is removed with them. */
  function enforce(root) {
    var rail = root.querySelector(".ad-rail");
    var held = ((rail && rail.getAttribute("data-held-roles")) || "").split(/\s+/).filter(Boolean);
    if (!held.length) return;
    root.querySelectorAll("[data-roles]").forEach(function (el) {
      var need = el.getAttribute("data-roles").split(/\s+/).filter(Boolean);
      if (!need.some(function (r) { return held.indexOf(r) !== -1; })) (el.closest("li") || el).remove();
    });
    root.querySelectorAll(".ad-allgroup").forEach(function (g) {
      if (!g.querySelectorAll(".ad-list a").length) g.remove();
    });
  }

  /* ── recommendation 8 · one language per row ────────────────────────────── */
  function applyLocale(loc) {
    var root = shell(); if (!root) return;
    var ar = loc === "ar";
    root.setAttribute("dir", ar ? "rtl" : "ltr");
    root.setAttribute("lang", ar ? "ar" : "en");
    // Mirror onto the document so surfaces mounted outside the shell (the
    // command palette) and page-level observers all read one value.
    document.documentElement.setAttribute("lang", ar ? "ar" : "en");
    document.documentElement.setAttribute("dir", ar ? "rtl" : "ltr");
    // The palette can be mounted outside .ad-shell, so translate over the whole
    // document; hub captions carry their own data-hub-ar.
    document.querySelectorAll("[data-ar]").forEach(function (el) {
      var target = el;
      if (el.classList.contains("ad-hub")) target = el.querySelector(".ad-hub__label");
      else if (el.classList.contains("ad-cmdk")) target = el.querySelector(".ad-cmdk__label");
      else if (el.classList.contains("ad-hubcard")) target = el.querySelector(".ad-hubcard__name");
      else if (el.classList.contains("ad-subnav__up")) target = el.querySelector("span");
      else if (el.classList.contains("ad-viewall")) target = el.querySelector("span");
      else if (el.querySelector(".ad-pal__name")) target = el.querySelector(".ad-pal__name");
      if (!target) target = el;
      if (!target.dataset.en) target.dataset.en = target.textContent.trim();
      target.textContent = ar ? el.getAttribute("data-ar") : target.dataset.en;
      var hub = el.querySelector(".ad-pal__hub");
      if (hub && el.getAttribute("data-hub-ar")) {
        if (!hub.dataset.en) hub.dataset.en = hub.textContent.trim();
        hub.textContent = ar ? el.getAttribute("data-hub-ar") : hub.dataset.en;
      }
    });
    var ph = document.querySelector(".ad-pal__input");
    if (ph) {
      if (!ph.dataset.enPh) ph.dataset.enPh = ph.placeholder;
      ph.placeholder = ar ? ph.getAttribute("data-ar-ph") : ph.dataset.enPh;
    }
    var lb = root.querySelector(".ad-locale");
    if (lb) {
      lb.setAttribute("aria-label", ar ? "Switch to English" : "Switch to Arabic");
      lb.textContent = ar ? "EN" : "ع";
      lb.setAttribute("lang", ar ? "en" : "ar");
    }
    lsSet(K_LOCALE, loc);
  }

  /* ── theme · one attribute, three scopes ─────────────────────────────────
     Theme tokens are scoped to [data-theme]. The attribute goes on the shell
     AND on documentElement/body, so the document background matches the shell
     instead of showing the light :root default under a short page. */
  function applyTheme(mode) {
    var dark = mode !== "light";
    var value = dark ? "dark" : "light";
    var root = document.documentElement;
    root.setAttribute("data-theme", value);
    root.style.colorScheme = value;
    if (document.body) document.body.setAttribute("data-theme", value);
    var sh = shell();
    if (sh) sh.setAttribute("data-theme", value);
    var btn = document.querySelector('.ad-iconbtn[aria-label^="Switch theme"], .ad-theme');
    if (btn) {
      btn.setAttribute("aria-pressed", dark ? "true" : "false");
      btn.setAttribute("aria-label", dark ? "Switch theme to light" : "Switch theme to dark");
    }
    lsSet(K_THEME, value);
  }

  /* ── recommendation 9 · hub-first drawer, focus restored on close ────────── */
  var lastFocus = null;
  function setDrawer(open) {
    var root = shell(); if (!root) return;
    root.classList.toggle("is-drawer-open", open);
    var menu = root.querySelector(".ad-menu");
    if (menu) menu.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      lastFocus = document.activeElement;
      var first = root.querySelector(".ad-rail .ad-cmdk, .ad-rail .ad-hub");
      if (first) first.focus({ preventScroll: true });
    } else if (lastFocus && lastFocus.focus) {
      lastFocus.focus({ preventScroll: true });
    } else if (menu) menu.focus({ preventScroll: true });
  }

  /* Admin has no drawer: it is a desktop surface that simply narrows. The scrim
     and drawer helpers stay only so older markup cannot break. */
  function ensureScrim(root) {
    return;
    if (root.querySelector(".ad-scrim")) return;
    var s = document.createElement("button");
    s.className = "ad-scrim"; s.type = "button";
    s.setAttribute("aria-label", "Close navigation");
    root.appendChild(s);
  }

  /* ── recommendation 6 · palette over authorized destinations only ────────── */
  var palFocus = null, cursor = -1;
  function pal() { return document.getElementById("ad-palette"); }
  function palItems() { var p = pal(); return p ? Array.prototype.slice.call(p.querySelectorAll("li")) : []; }
  function palVisible() { return palItems().filter(function (li) { return !li.hidden; }); }
  function palMark(i) {
    var vis = palVisible(), p = pal();
    palItems().forEach(function (li) { li.classList.remove("is-cursor"); li.setAttribute("aria-selected", "false"); });
    if (!vis.length) { cursor = -1; return; }
    cursor = (i + vis.length) % vis.length;
    vis[cursor].classList.add("is-cursor");
    vis[cursor].setAttribute("aria-selected", "true");
    var a = vis[cursor].querySelector("a");
    if (p) p.querySelector(".ad-pal__input").setAttribute("aria-activedescendant", a ? (a.id || "") : "");
  }
  function palFilter(q) {
    var needle = q.trim().toLowerCase(), shown = 0, p = pal();
    palItems().forEach(function (li) {
      var a = li.querySelector("a");
      var hay = (a.textContent + " " + (a.getAttribute("data-ar") || "") + " " + (a.getAttribute("data-hub-ar") || "")).toLowerCase();
      var hit = !needle || hay.indexOf(needle) !== -1;
      li.hidden = !hit;
      if (hit) shown++;
    });
    if (p) {
      var empty = p.querySelector(".ad-pal__empty");
      if (empty) empty.hidden = shown > 0;
      var live = p.querySelector(".ad-pal__live");
      if (live) live.textContent = shown + (shown === 1 ? " tool matches" : " tools match");
    }
    palMark(0);
  }
  function openPalette() {
    var p = pal(); if (!p) return;
    palFocus = document.activeElement;
    p.hidden = false;
    // The palette can be re-created by a re-render after applyLocale ran, so
    // re-assert the language on open rather than trusting the last sweep.
    applyLocale(ls(K_LOCALE) === "ar" ? "ar" : "en");
    var i = p.querySelector(".ad-pal__input");
    i.value = ""; palFilter("");
    i.focus({ preventScroll: true });
  }
  function closePalette() {
    var p = pal(); if (!p || p.hidden) return;
    p.hidden = true;
    if (palFocus && palFocus.focus) palFocus.focus({ preventScroll: true });
  }

  /* ── recommendation 10 · favorites/recents only if real persistence ──────── */
  function renderStored(root, kind, key) {
    var host = root.querySelector('[data-stored="' + kind + '"]');
    if (!host) return;
    var note = host.querySelector("[data-empty]");
    var box = host.querySelector(".ad-list");
    if (!HAS_STORE) {
      if (note) { note.hidden = false; note.textContent = "Per-user persistence is unavailable in this session, so nothing is remembered here."; }
      return;
    }
    var list = [];
    try { list = JSON.parse(ls(key) || "[]"); } catch (e) { list = []; }
    if (!list.length || !box) return;              // authored empty state stays
    if (note) note.hidden = true;
    box.innerHTML = "";
    var ar = root.getAttribute("dir") === "rtl";
    list.slice(0, 5).forEach(function (x) {
      var a = document.createElement("a");
      a.href = x.href;
      a.textContent = ar && x.ar ? x.ar : x.en;
      box.appendChild(a);
    });
  }

  function recordRecent() {
    if (!HAS_STORE) return;
    var active = document.querySelector(".ad-subnav__item.is-active");
    if (!active) return;
    var entry = { href: active.getAttribute("href"), en: (active.dataset.en || active.textContent).trim(), ar: active.getAttribute("data-ar") };
    var list = [];
    try { list = JSON.parse(ls(K_RECENT) || "[]"); } catch (e) { list = []; }
    list = list.filter(function (x) { return x.href !== entry.href; });
    list.unshift(entry);
    lsSet(K_RECENT, JSON.stringify(list.slice(0, 5)));
  }

  // Re-assert whenever the held role set changes, not only on first mount: a
  // shell served with a different role set must re-filter, and a test must be
  // able to force it.
  function applyState(force) {
    var root = shell();
    if (!root) return;
    var rail = root.querySelector(".ad-rail");
    var held = (rail && rail.getAttribute("data-held-roles")) || "";
    if (!force && root.dataset.adState === "1" && root.dataset.adHeld === held) return;
    root.dataset.adState = "1";
    root.dataset.adHeld = held;
    ensureScrim(root);
    enforce(root);
    if (ls(K_COMPACT) === "1") {
      root.classList.add("is-rail-compact");
      var c = root.querySelector(".ad-collapse");
      if (c) { c.setAttribute("aria-expanded", "false"); c.setAttribute("aria-label", "Expand navigation"); }
    }
    applyTheme(ls(K_THEME) === "light" ? "light" : (root.getAttribute("data-theme") || "dark"));
    applyLocale(ls(K_LOCALE) === "ar" ? "ar" : "en");
    recordRecent();
    renderStored(root, "favorites", K_FAV);
    renderStored(root, "recents", K_RECENT);
  }

  function delegate() {
    if (document.documentElement.dataset.adDelegated === "1") return;
    document.documentElement.dataset.adDelegated = "1";

    document.addEventListener("click", function (e) {
      var root = shell(); if (!root) return;
      if (e.target.closest(".ad-menu")) { setDrawer(!root.classList.contains("is-drawer-open")); return; }
      if (e.target.closest(".ad-scrim")) { setDrawer(false); return; }
      if (e.target.closest(".ad-collapse")) {
        var on = !root.classList.contains("is-rail-compact");
        root.classList.toggle("is-rail-compact", on);
        var c = root.querySelector(".ad-collapse");
        if (c) { c.setAttribute("aria-expanded", on ? "false" : "true"); c.setAttribute("aria-label", on ? "Expand navigation" : "Collapse navigation"); }
        lsSet(K_COMPACT, on ? "1" : "0");
        return;
      }
      // Storage is the single source of truth for locale, not the DOM: a
      // re-render can hand us a shell whose dir has not been applied yet.
      if (e.target.closest(".ad-locale")) { applyLocale(ls(K_LOCALE) === "ar" ? "en" : "ar"); return; }
      if (e.target.closest('.ad-theme, .ad-iconbtn[aria-label^="Switch theme"]')) {
        applyTheme(document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light");
        return;
      }
      if (e.target.closest(".ad-cmdk")) { openPalette(); return; }
      if (e.target.closest(".ad-pal__scrim")) { closePalette(); return; }
      if (e.target.closest(".ad-hub, .ad-viewall") && root.classList.contains("is-drawer-open")) setDrawer(false);
    });

    document.addEventListener("input", function (e) {
      if (e.target.classList && e.target.classList.contains("ad-pal__input")) palFilter(e.target.value);
    });

    document.addEventListener("keydown", function (e) {
      var p = pal();
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        if (p && p.hidden) openPalette(); else closePalette();
        return;
      }
      if (p && !p.hidden) {
        if (e.key === "Escape") { e.preventDefault(); closePalette(); return; }
        if (e.key === "ArrowDown") { e.preventDefault(); palMark(cursor + 1); return; }
        if (e.key === "ArrowUp") { e.preventDefault(); palMark(cursor - 1); return; }
        if (e.key === "Enter") {
          var vis = palVisible();
          if (vis[cursor]) { e.preventDefault(); vis[cursor].querySelector("a").click(); }
          return;
        }
      }
      var root = shell();
      if (e.key === "Escape" && root && root.classList.contains("is-drawer-open")) { e.preventDefault(); setDrawer(false); }
    });
  }

  /* ── a targeted destination must be reachable ────────────────────────────
     The grouped tool list is a <details>. A link to a group inside it (or to
     the disclosure itself) does nothing while it is closed, so opening the
     ancestors is part of following the link — never a scroll hijack. */
  function revealHash() {
    var h = location.hash;
    if (!h || h.length < 2) return;
    var el;
    try { el = document.querySelector(h); } catch (e) { return; }
    if (!el) return;
    if (el.tagName === "DETAILS") el.open = true;
    var d = el.closest("details");
    while (d) { d.open = true; d = d.parentElement && d.parentElement.closest("details"); }
  }

  function tick() { applyState(false); delegate(); revealHash(); }
  // Test/host hook: window.SaqeelAdminShell.reassert() re-runs enforcement.
  window.SaqeelAdminShell = { reassert: function () { applyState(true); }, enforce: enforce };
  window.addEventListener("hashchange", revealHash);
  if (document.readyState !== "loading") tick();
  else document.addEventListener("DOMContentLoaded", tick);
  // The shell can be replaced by a re-render; watch for it rather than binding once.
  var obs = new MutationObserver(tick);
  obs.observe(document.documentElement, { childList: true, subtree: true });
  tick();
})();
