/* MIM Astryx D2 — admin control-plane demo behaviors (design authority only).
   State switcher, tree selection, item selection, publish simulation. */
(function () {
  "use strict";

  // ---- screen-state switcher ----
  document.querySelectorAll(".adm-statebar").forEach(function (bar) {
    var scope = document.querySelector(bar.getAttribute("data-for")) || document.body;
    bar.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      bar.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      scope.setAttribute("data-screen", b.getAttribute("data-state"));
    });
  });

  // ---- tree node selection ----
  document.querySelectorAll(".adm-tree__body").forEach(function (tree) {
    tree.addEventListener("click", function (e) {
      var n = e.target.closest(".adm-node");
      if (!n || n.classList.contains("adm-node--group")) return;
      tree.querySelectorAll(".adm-node").forEach(function (x) { x.removeAttribute("aria-current"); });
      n.setAttribute("aria-current", "true");
    });
  });

  // ---- designer item selection (updates inspector title if present) ----
  document.querySelectorAll(".adm-designer-section").forEach(function (sec) {
    sec.addEventListener("click", function (e) {
      var it = e.target.closest(".adm-item");
      if (!it) return;
      document.querySelectorAll(".adm-item").forEach(function (x) { x.setAttribute("aria-selected", "false"); });
      it.setAttribute("aria-selected", "true");
      var t = document.querySelector("[data-inspector-title]");
      var lbl = it.querySelector(".adm-item__title");
      if (t && lbl) t.textContent = lbl.textContent.trim();
    });
  });

  // ---- simulated publish flow: validate -> approve -> publish toast ----
  document.querySelectorAll("[data-adm-publish]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var pipe = document.querySelector(btn.getAttribute("data-adm-publish"));
      if (!pipe) return;
      var steps = pipe.querySelectorAll(".adm-pipeline__step");
      var i = Array.prototype.findIndex.call(steps, function (s) { return s.classList.contains("is-active"); });
      if (i >= 0 && i < steps.length - 1) {
        steps[i].classList.remove("is-active"); steps[i].classList.add("is-done");
        steps[i + 1].classList.add("is-active");
        if (i + 1 === steps.length - 1) btn.textContent = "Published ✓ (immutable version created)";
      }
    });
  });
})();
