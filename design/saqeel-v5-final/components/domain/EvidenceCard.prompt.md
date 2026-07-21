Evidence card in `.ax-evidence-grid`. Use canonical SVG icons; never emoji.

```jsx
<div className="ax-evidence-grid">
  <EvidenceCard kind="image" linked="Q4" meta={["IMG_0412.jpg", "l.alharbi · 14:02", "sha256 verified"]} />
  <EvidenceCard kind="video" state="unsynced" meta={["VID_0413.mp4", "pending sync"]} />
</div>
```
