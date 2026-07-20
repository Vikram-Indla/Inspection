Modal; render conditionally.

```jsx
{open && <Modal title="Cancel visit?" onClose={close} footer={<><Button variant="secondary" onClick={close}>Keep</Button><Button variant="danger">Cancel visit</Button></>}>…impact + reason field…</Modal>}
```