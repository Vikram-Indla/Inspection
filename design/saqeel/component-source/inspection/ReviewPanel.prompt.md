The approval/rejection/escalation panel — one primary (Approve), rejection gated on a reason, terminal state replaces controls.

```jsx
<ReviewPanel summary={<ComplianceScore value={78} />} reason={r} onReason={setR}
  onApprove={approve} onReject={reject} onEscalate={escalate} />
```
