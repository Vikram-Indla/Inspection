Blocking dialog for confirmation and small focused tasks; destructive confirmations pair a danger button with a plain-language consequence sentence.

```jsx
<Modal open={open} title="Reject inspection?" onClose={close}
  actions={<><Button variant="ghost" onClick={close}>Cancel</Button><Button variant="danger">Reject</Button></>}>
  The inspector will be asked to revise and resubmit.
</Modal>
```
