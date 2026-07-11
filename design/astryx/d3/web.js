/* MIM Astryx D3 — web wizard stage switching (design demo only). */
(function () {
  "use strict";
  document.querySelectorAll(".web-wizard").forEach(function (wiz) {
    var rail = wiz.querySelector(".web-wizard__rail");
    if (!rail) return;
    rail.addEventListener("click", function (e) {
      var step = e.target.closest(".web-rail-step");
      if (!step) return;
      var stage = step.getAttribute("data-stage-go");
      if (!stage) return;
      wiz.setAttribute("data-stage", stage);
      var steps = rail.querySelectorAll(".web-rail-step");
      var reached = true;
      steps.forEach(function (s) {
        s.classList.remove("is-active", "is-done");
        if (s === step) { s.classList.add("is-active"); reached = false; }
        else if (reached) s.classList.add("is-done");
      });
    });
  });
  document.querySelectorAll("[data-stage-next]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var wiz = btn.closest(".web-wizard");
      var target = wiz.querySelector('.web-rail-step[data-stage-go="' + btn.getAttribute("data-stage-next") + '"]');
      if (target) target.click();
    });
  });
})();
