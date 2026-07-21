SAQEEL signature — one exception language across tables, markers, cards, timelines and charts: shape (▲ critical, ◆ major, ■ warning, ○ pending, ▨ on hold, ● compliant) + colour + label. RailCell adds the 4px severity edge to table rows without flooding them.

```jsx
<ExceptionMark tone="critical" />
<td className="rail-td"><RailCell tone="major" /></td>
```
