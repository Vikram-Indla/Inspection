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

  // ---- D8+: cartographic scene injected into every .ax-map ----
  // Real-map look (district blocks, road hierarchy, route) while staying
  // self-contained; runtime provider = Google Maps Platform per DEC-008.
  (function () {
    var NS = "http://www.w3.org/2000/svg";
    function el(t, attrs, cls) {
      var e = document.createElementNS(NS, t);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      if (cls) e.setAttribute("class", cls);
      return e;
    }
    document.querySelectorAll(".ax-map").forEach(function (map, mi) {
      if (map.querySelector(".ax-map__scene")) return;
      var s = el("svg", { viewBox: "0 0 400 260", preserveAspectRatio: "xMidYMid slice", "aria-hidden": "true" }, "ax-map__scene");

      // ground features
      s.appendChild(el("path", { d: "M310,-10 C280,60 330,120 300,190 C285,225 300,250 320,270 L410,270 L410,-10 Z" }, "m-water"));
      s.appendChild(el("ellipse", { cx: 60, cy: 210, rx: 46, ry: 24 }, "m-green"));
      s.appendChild(el("ellipse", { cx: 150, cy: 34, rx: 34, ry: 16 }, "m-green"));

      // city blocks (deterministic grid, some industrial-toned)
      var bi = 0;
      for (var gy = 0; gy < 4; gy++) for (var gx = 0; gx < 6; gx++) {
        var x = 14 + gx * 62 + ((gy * 7 + mi * 3) % 9), y = 16 + gy * 60 + ((gx * 5) % 8);
        if (x > 280 && gy < 2) continue; // water side
        var w = 44 - ((gx + gy) % 3) * 6, h = 40 - ((gx * gy) % 2) * 8;
        var ind = (gx + gy + mi) % 3 === 0;
        s.appendChild(el("rect", { x: x, y: y, width: w, height: h, rx: 3 }, "m-block" + (ind ? " m-block--industrial" : "")));
        bi++;
      }

      // roads: casing then fill
      var roads = [
        { d: "M0,140 L400,128", w: 10, hw: true, name: "King Fahd Industrial Rd" },
        { d: "M76,0 L84,260", w: 7 }, { d: "M200,0 L196,260", w: 7, name: "Street 14" },
        { d: "M292,0 L286,260", w: 6 }, { d: "M0,68 L400,60", w: 6, name: "Street 8" },
        { d: "M0,206 L400,198", w: 6 }
      ];
      roads.forEach(function (r) { s.appendChild(el("path", { d: r.d, "stroke-width": r.w + 3 }, "m-road-casing")); });
      roads.forEach(function (r) { s.appendChild(el("path", { d: r.d, "stroke-width": r.w }, r.hw ? "m-highway" : "m-road")); });

      // active route polyline (only when the panel is a journey/live context)
      if (/journey|route|live|en route|ETA/i.test(map.getAttribute("aria-label") || "") || map.querySelector(".ax-pin--observed")) {
        s.appendChild(el("path", { d: "M18,244 L80,238 L82,134 L198,130 L198,96 L232,92" }, "m-route"));
        var halo = el("circle", { cx: 232, cy: 92, r: 10 }, "m-pos-halo");
        s.appendChild(halo);
        s.appendChild(el("circle", { cx: 232, cy: 92, r: 5 }, "m-pos"));
      }

      // labels
      var l1 = el("text", { x: 12, y: 124 }, "m-label"); l1.textContent = "2ND INDUSTRIAL CITY"; s.appendChild(l1);
      var l2 = el("text", { x: 210, y: 56 }, "m-label m-label--road"); l2.textContent = "Street 8"; s.appendChild(l2);
      var l3 = el("text", { x: 330, y: 246 }, "m-label m-label--road"); l3.textContent = "Wadi channel"; s.appendChild(l3);

      map.prepend(s);
    });
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
