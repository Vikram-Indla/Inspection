/* MIM Astryx — Wave D1 demo behaviors.
   Design-authority interactions only (tabs, segmented, modal, drawer, toast,
   RTL/language toggle, widget-failure simulation, sync-state cycling).
   NOT product code. No data, no network, no business logic. */

(function () {
  "use strict";

  // ---- D8: global floating RTL/LTR toggle on every frame ----
  // Capability demo only — Arabic SCOPE remains DEC-004 (open decision).
  (function () {
    var b = document.createElement("button");
    b.textContent = "⇄ RTL";
    b.setAttribute("aria-pressed", "false");
    b.setAttribute("aria-label", "Toggle right-to-left preview (DEC-004 capability demo)");
    b.style.cssText = "position:fixed;inset-block-end:16px;inset-inline-start:16px;z-index:80;" +
      "min-height:36px;padding-inline:12px;border-radius:999px;border:1px solid var(--ax-color-border-strong);" +
      "background:var(--ax-color-surface);font:600 12px/1 var(--ax-font-sans);cursor:pointer;box-shadow:var(--ax-shadow-raised)";
    b.addEventListener("click", function () {
      var rtl = document.documentElement.getAttribute("dir") === "rtl";
      document.documentElement.setAttribute("dir", rtl ? "ltr" : "rtl");
      document.documentElement.setAttribute("lang", rtl ? "en" : "ar");
      b.setAttribute("aria-pressed", String(!rtl));
      b.textContent = rtl ? "⇄ RTL" : "⇄ LTR";
    });
    if (document.body) document.body.appendChild(b);
  })();

  // ---- RTL / language toggle (DEC-004 prepared, not committed) ----
  document.querySelectorAll("[data-ax-rtl-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var scope = document.querySelector(btn.getAttribute("data-ax-rtl-toggle")) || document.documentElement;
      var rtl = scope.getAttribute("dir") === "rtl";
      scope.setAttribute("dir", rtl ? "ltr" : "rtl");
      scope.setAttribute("lang", rtl ? "en" : "ar");
      btn.setAttribute("aria-pressed", String(!rtl));
    });
  });

  // ---- Tabs ----
  document.querySelectorAll(".ax-tabs").forEach(function (tabs) {
    tabs.addEventListener("click", function (e) {
      var tab = e.target.closest("[role=tab]");
      if (!tab) return;
      tabs.querySelectorAll("[role=tab]").forEach(function (t) {
        t.setAttribute("aria-selected", String(t === tab));
        var panel = document.getElementById(t.getAttribute("aria-controls") || "");
        if (panel) panel.hidden = t !== tab;
      });
    });
  });

  // ---- Segmented control ----
  document.querySelectorAll(".ax-segmented").forEach(function (seg) {
    seg.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      seg.querySelectorAll("button").forEach(function (x) {
        x.setAttribute("aria-pressed", String(x === b));
      });
    });
  });

  // ---- Modal ----
  document.querySelectorAll("[data-ax-modal-open]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var m = document.querySelector(btn.getAttribute("data-ax-modal-open"));
      if (m) m.hidden = false;
    });
  });
  document.querySelectorAll("[data-ax-modal-close]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      btn.closest(".ax-modal-backdrop").hidden = true;
    });
  });
  document.querySelectorAll(".ax-modal-backdrop").forEach(function (bd) {
    bd.addEventListener("click", function (e) { if (e.target === bd) bd.hidden = true; });
  });

  // ---- Drawer ----
  document.querySelectorAll("[data-ax-drawer-open]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var d = document.querySelector(btn.getAttribute("data-ax-drawer-open"));
      if (d) d.hidden = false;
    });
  });
  document.querySelectorAll("[data-ax-drawer-close]").forEach(function (btn) {
    btn.addEventListener("click", function () { btn.closest(".ax-drawer").hidden = true; });
  });

  // ---- Toast ----
  var region = document.querySelector(".ax-toast-region");
  document.querySelectorAll("[data-ax-toast]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!region) return;
      var t = document.createElement("div");
      t.className = "ax-toast ax-toast--" + (btn.getAttribute("data-ax-toast-kind") || "success");
      t.setAttribute("role", "status");
      t.textContent = btn.getAttribute("data-ax-toast");
      region.appendChild(t);
      setTimeout(function () { t.remove(); }, 4000);
    });
  });

  // ---- Widget failure simulation (MVP1-FND-012 fault isolation) ----
  document.querySelectorAll("[data-ax-fail-widget]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var w = document.querySelector(btn.getAttribute("data-ax-fail-widget"));
      if (w) w.classList.toggle("is-failed");
    });
  });

  // ---- Sync state cycling (iPad spec §4 mandatory visible states) ----
  var SYNC = ["synced", "offline", "pending", "syncing", "conflict", "failed"];
  var LABEL = { synced: "Synced", offline: "Offline — work saved locally", pending: "3 pending", syncing: "Syncing 2 of 3…", conflict: "Conflict — action required", failed: "Sync failed — retry" };
  document.querySelectorAll("[data-ax-sync-cycle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var el = document.querySelector(btn.getAttribute("data-ax-sync-cycle"));
      if (!el) return;
      var i = (parseInt(el.dataset.i || "0", 10) + 1) % SYNC.length;
      el.dataset.i = String(i);
      el.className = "ax-sync ax-sync--" + SYNC[i];
      el.textContent = LABEL[SYNC[i]];
    });
  });

  // ---- Bulk select demo ----
  document.querySelectorAll("[data-ax-select-all]").forEach(function (head) {
    head.addEventListener("change", function () {
      var table = head.closest("table");
      table.querySelectorAll("tbody input[type=checkbox]").forEach(function (cb) {
        cb.checked = head.checked;
        cb.closest("tr").setAttribute("aria-selected", String(head.checked));
      });
    });
  });
})();
