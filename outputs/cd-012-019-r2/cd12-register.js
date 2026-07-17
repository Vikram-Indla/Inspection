/* Registers the CD-012 R2 render (window.CD12R2, from cd12.js) into the CDM
   screen registry so the master harness treats all eight screens uniformly. */
(function () {
  "use strict";
  var C = window.CDM;
  C.register("cd12", {
    id: "CD-012", screen: "SCR-ADM-050", title: { en: "Workflow library", ar: "مكتبة سير العمل" },
    states: [
      { id: "published", n: "S01", label: "Published — primary populated" },
      { id: "draft", n: "S02", label: "Draft awaiting approval" },
      { id: "outlier", n: "S03", label: "Outlier — separation of duties (own draft)" },
      { id: "submitted", n: "S04", label: "Published version immutable" },
      { id: "superseded", n: "S05", label: "Superseded (read-only)" },
      { id: "in-use", n: "S06", label: "In-use — blocked health input" },
      { id: "empty", n: "S07", label: "Empty — no definitions" },
      { id: "loading", n: "S08", label: "Loading" },
      { id: "validation", n: "S09", label: "Validation — cannot save/propose" },
      { id: "unauthorized", n: "S10", label: "Unauthorized" },
      { id: "offline", n: "S11", label: "Offline" },
      { id: "stale", n: "S12", label: "Stale detection blocked" }
    ],
    outlier: "outlier",
    render: function (state, lang) { return window.CD12R2.render(state, lang); }
  });
})();
