const { Breadcrumb, Banner, Lozenge, VersionBadge, Tabs, Timeline, Button, Field, Textarea, Radio, ValidationSummary, Drawer, EvidenceCard } = window.SaqeelDesignSystem_49c57d;
function ReviewScreen() {
  const [tab, setTab] = React.useState("Report");
  const [decision, setDecision] = React.useState("approve");
  const [decided, setDecided] = React.useState(false);
  const [audit, setAudit] = React.useState(false);
  return <>
    <Breadcrumb items={[{ label: "Reviews", href: "#" }, { label: "VIS-2026-004821 · Gulf Steel Works" }]} />
    <div className="ax-row">
      <Lozenge domain="review" tone={decided ? "success" : "info"}>{decided ? "Approved" : "Awaiting review"}</Lozenge>
      <Lozenge domain="plan" tone="success">Published</Lozenge>
      <VersionBadge>report v3 · 2026-07-18</VersionBadge>
      <span className="ax-commandbar__spacer" style={{ flex: 1 }}></span>
      <Button variant="subtle" onClick={() => setAudit(true)}>Audit trail</Button>
    </div>
    {decided ? <Banner tone="immutable" title="Decision recorded.">This Level-2 decision is locked forever; resubmission creates a new version (M06-009).</Banner> : null}
    <Tabs tabs={["Report", "Evidence", "Samples"]} value={tab} onChange={setTab} />
    {tab === "Report" ? <div className="ax-grid-2" style={{ alignItems: "start" }}>
      <div className="ax-surface ax-panel" style={{ padding: "var(--ax-space-300)" }}>
        <h3 style={{ margin: "0 0 var(--ax-space-200)", font: "var(--ax-text-heading)" }}>Inspection report — Periodic v3</h3>
        <dl className="ax-visitcard__meta" style={{ margin: 0 }}>
          <div><dt>INSPECTOR</dt><dd>m.qahtani</dd></div>
          <div><dt>CHECK-IN</dt><dd>09:31 · geofenced ✓</dd></div>
          <div><dt>ITEMS</dt><dd>48 / 48 answered</dd></div>
          <div><dt>FINDINGS</dt><dd>2 violations</dd></div>
        </dl>
        <div style={{ marginBlockStart: "var(--ax-space-300)" }}>
          <ValidationSummary clear title="Submission is complete — no blockers." />
        </div>
      </div>
      <div className="ax-surface ax-panel" style={{ padding: "var(--ax-space-300)" }}>
        <h3 style={{ margin: "0 0 var(--ax-space-200)", font: "var(--ax-text-heading)" }}>Level-2 decision</h3>
        {decided ? <p style={{ margin: 0 }}>Approved by <strong>l.alharbi</strong> · 2026-07-20 10:12 <VersionBadge>decision v1</VersionBadge></p> :
        <div className="ax-stack">
          <div className="ax-row">
            <Radio name="dec" label="Approve" checked={decision === "approve"} onChange={() => setDecision("approve")} />
            <Radio name="dec" label="Return with scope" checked={decision === "return"} onChange={() => setDecision("return")} />
            <Radio name="dec" label="Reject" checked={decision === "reject"} onChange={() => setDecision("reject")} />
          </div>
          {decision !== "approve" ? <Field label="Reason (mandatory)" hint={decision === "return" ? "Name the exact items that come back — nothing more." : undefined}><Textarea placeholder="State the reason" /></Field> : null}
          <div className="ax-row" style={{ justifyContent: "flex-end" }}>
            <Button variant={decision === "reject" ? "danger" : "primary"} onClick={() => setDecided(true)}>
              {decision === "approve" ? "Approve report" : decision === "return" ? "Return to inspector" : "Reject report"}
            </Button>
          </div>
          <p style={{ margin: 0, font: "var(--ax-text-caption)", color: "var(--ax-color-text-secondary)" }}>A decision is immutable once recorded (M06-009). Every action is audited (ENG-12).</p>
        </div>}
      </div>
    </div> : null}
    {tab === "Evidence" ? <div className="ax-evidence-grid">
      <EvidenceCard linked="Q12" meta={["IMG_0412.jpg", "m.qahtani · 09:47", "sha256 ✓"]} />
      <EvidenceCard linked="Q12" meta={["IMG_0413.jpg", "m.qahtani · 09:48", "sha256 ✓"]} />
      <EvidenceCard kind="video" linked="Q31" meta={["VID_0414.mp4", "m.qahtani · 10:15", "sha256 ✓"]} />
      <EvidenceCard state="quarantined" meta={["IMG_0415.jpg", "ERR-EVD-002 · limits = DEC-006"]} />
    </div> : null}
    {tab === "Samples" ? <div className="ax-surface"><div className="ax-state ax-state--inline"><span className="ax-state__glyph">◇</span><h4 style={{ margin: 0 }}>No samples recorded</h4><p style={{ margin: 0 }}>This visit's package does not require sampling.</p></div></div> : null}
    {audit ? <Drawer title="Audit trail" onClose={() => setAudit(false)}>
      <Timeline items={[
        ...(decided ? [{ actor: "l.alharbi", action: "approved the report", version: "decision v1", time: "2026-07-20 10:12", key: true }] : []),
        { actor: "m.qahtani", action: "submitted for review", version: "report v3", time: "2026-07-18 11:40", key: true },
        { actor: "m.qahtani", action: "captured 4 evidence items", time: "2026-07-17 10:15" },
        { actor: "system", action: "geofence check-in verified", time: "2026-07-17 09:31", detail: "Within 150 m of official pin" },
        { actor: "l.alharbi", action: "published visit plan", version: "plan v1", time: "2026-07-12 14:02" }]} />
    </Drawer> : null}
  </>;
}
Object.assign(window, { ReviewScreen });
