import React from "react";
export function ReportHeader({ reference, version, logo = "assets/saqeel-prism.svg", className = "" }) {
  return <header className={"ax-texture-chrome " + className} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 56px", backgroundColor: "var(--ax-color-primary)", color: "#fff" }}>
    <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <img src={logo} width="36" height="36" alt="" onError={e => { e.currentTarget.style.display = "none"; }} />
      <span><b lang="ar" style={{ font: "600 19px/24px var(--ax-font-arabic)", display: "block" }}>صقيل</b><small style={{ font: "400 12px/16px var(--ax-font-sans)", color: "#CFE5DC" }}>Official inspection report</small></span>
    </span>
    <span style={{ textAlign: "end", font: "400 13px/19px var(--ax-font-sans)", color: "#DCEAE4" }}>
      <b style={{ display: "block", color: "#fff" }}>Kingdom of Saudi Arabia · Ministry of Industry and Mineral Resources</b>
      <span lang="ar" dir="rtl">المملكة العربية السعودية · وزارة الصناعة والثروة المعدنية</span>
      {reference ? <span className="ax-numeric" style={{ display: "block" }}><bdi>{reference}</bdi>{version ? <> · <bdi>{version}</bdi></> : null}</span> : null}
    </span>
  </header>;
}
