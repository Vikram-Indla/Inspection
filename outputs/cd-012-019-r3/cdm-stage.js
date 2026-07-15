/* CDM master stage — thin web component over the CDM registry. */
(function () {
  "use strict";
  function draw(el) {
    var C = window.CDM;
    if (!C) { el.innerHTML = ""; return; }
    var theme = el.getAttribute("theme") === "light" ? "light" : "dark";
    el.innerHTML = '<div class="cd-body thm-' + theme + '">' +
      C.render(el.getAttribute("screen") || "cd12", el.getAttribute("state") || "", el.getAttribute("lang") || "en") + '</div>';
  }
  class CDMStage extends HTMLElement {
    static get observedAttributes() { return ["screen", "state", "lang", "theme"]; }
    connectedCallback() { draw(this); }
    attributeChangedCallback() { draw(this); }
  }
  if (!customElements.get("cdm-stage")) customElements.define("cdm-stage", CDMStage);
})();
