/* MIM Astryx D4 — iPad field demo behaviors (design authority only). */
(function () {
  "use strict";
  // orientation toggle
  document.querySelectorAll("[data-orient-toggle]").forEach(function (bar) {
    bar.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      var frame = document.querySelector(bar.getAttribute("data-orient-toggle"));
      if (!frame) return;
      frame.setAttribute("data-orient", b.getAttribute("data-orient-set"));
      bar.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
    });
  });
  // big response buttons
  document.querySelectorAll(".ipad-resp").forEach(function (grp) {
    grp.addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      grp.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      var card = grp.closest(".ipad-q");
      if (card) { card.classList.add("is-answered"); card.classList.remove("is-blocked"); }
    });
  });
  // section rail selection
  document.querySelectorAll(".ipad-sections").forEach(function (rail) {
    rail.addEventListener("click", function (e) {
      var s = e.target.closest(".ipad-section"); if (!s || s.classList.contains("is-locked")) return;
      rail.querySelectorAll(".ipad-section").forEach(function (x) { x.removeAttribute("aria-current"); });
      s.setAttribute("aria-current", "true");
    });
  });
})();
