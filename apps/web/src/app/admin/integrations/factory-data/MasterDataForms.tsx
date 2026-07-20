"use client";

import { useActionState } from "react";
import { mutateFactoryMasterData, type FactoryDataResult } from "./actions";

function Result({ state }: { state: FactoryDataResult }) {
  if (state.error) return <span role="alert" style={{ color: "var(--ax-color-critical)" }}>{state.error}</span>;
  if (state.ok) return <span className="badge badge-compliant">Saved and audit-recorded</span>;
  return null;
}

function RepresentativeToggle({ factoryId, representative }: { factoryId: string; representative: { id: string; full_name: string; active: boolean } }) {
  const [state, action, pending] = useActionState<FactoryDataResult, FormData>(mutateFactoryMasterData, {});
  return <form action={action} className="row" style={{ justifyContent: "space-between" }}>
    <input type="hidden" name="factory_id" value={factoryId} /><input type="hidden" name="operation" value="representative_status" />
    <input type="hidden" name="representative_id" value={representative.id} /><input type="hidden" name="active" value={representative.active ? "false" : "true"} />
    <span>{representative.full_name} <span className="badge">{representative.active ? "active" : "inactive"}</span></span>
    <button className="btn btn-ghost btn-touch" disabled={pending}>{representative.active ? "Deactivate" : "Reactivate"}</button><Result state={state} />
  </form>;
}

export default function MasterDataForms({ factoryId, representatives }: { factoryId: string; representatives: { id: string; full_name: string; active: boolean }[] }) {
  const [documentState, documentAction, documentPending] = useActionState<FactoryDataResult, FormData>(mutateFactoryMasterData, {});
  const [representativeState, representativeAction, representativePending] = useActionState<FactoryDataResult, FormData>(mutateFactoryMasterData, {});
  const [productState, productAction, productPending] = useActionState<FactoryDataResult, FormData>(mutateFactoryMasterData, {});
  const [materialState, materialAction, materialPending] = useActionState<FactoryDataResult, FormData>(mutateFactoryMasterData, {});
  const common = <input type="hidden" name="factory_id" value={factoryId} />;
  return <><div className="ax-grid">
    <form action={documentAction} className="ax-surface stack" style={{ padding: "var(--ax-space-200)" }}>
      {common}<input type="hidden" name="operation" value="document" /><h4>Document metadata</h4>
      <label>Type<select className="ax-select" name="doc_type" defaultValue="license"><option value="license">License</option><option value="cr">CR</option><option value="safety_cert">Safety certificate</option><option value="layout">Layout</option><option value="other">Other</option></select></label>
      <label>Title<input className="ax-input" name="title" required /></label>
      <label>Reference number<input className="ax-input numeric" name="reference_no" /></label>
      <label>Valid from<input className="ax-input numeric" type="date" name="valid_from" /></label><label>Valid to<input className="ax-input numeric" type="date" name="valid_to" /></label>
      <button className="btn btn-secondary btn-touch" disabled={documentPending}>Add metadata</button><Result state={documentState} />
    </form>
    <form action={representativeAction} className="ax-surface stack" style={{ padding: "var(--ax-space-200)" }}>
      {common}<input type="hidden" name="operation" value="representative" /><h4>Representative</h4>
      <label>Full name<input className="ax-input" name="full_name" required /></label><label>Role<input className="ax-input" name="role_title" /></label>
      <label>Phone<input className="ax-input" name="phone" /></label><label>Email<input className="ax-input" type="email" name="email" /></label>
      <label className="ax-choice"><input type="checkbox" name="is_primary" /> Primary contact</label>
      <button className="btn btn-secondary btn-touch" disabled={representativePending}>Add representative</button><Result state={representativeState} />
    </form>
    <form action={productAction} className="ax-surface stack" style={{ padding: "var(--ax-space-200)" }}>
      {common}<input type="hidden" name="operation" value="product" /><h4>Product</h4>
      <label>Name<input className="ax-input" name="name" required /></label><label>HS code<input className="ax-input" name="hs_code" /></label><label>Unit<input className="ax-input" name="unit" /></label>
      <label>Annual capacity<input className="ax-input numeric" type="number" min="0" step="0.01" name="annual_capacity" /></label><label className="ax-choice"><input type="checkbox" name="is_primary" /> Primary product</label>
      <button className="btn btn-secondary btn-touch" disabled={productPending}>Add product</button><Result state={productState} />
    </form>
    <form action={materialAction} className="ax-surface stack" style={{ padding: "var(--ax-space-200)" }}>
      {common}<input type="hidden" name="operation" value="material" /><h4>Raw material</h4>
      <label>Name<input className="ax-input" name="name" required /></label><label>Source<select className="ax-select" name="source" defaultValue="local"><option value="local">Local</option><option value="imported">Imported</option></select></label><label>HS code<input className="ax-input" name="hs_code" /></label>
      <button className="btn btn-secondary btn-touch" disabled={materialPending}>Add material</button><Result state={materialState} />
    </form>
  </div><section className="ax-surface stack" style={{ padding: "var(--ax-space-200)", marginBlockStart: "var(--ax-space-200)" }}><h4>Representative status</h4>
    {representatives.map(representative => <RepresentativeToggle key={representative.id} factoryId={factoryId} representative={representative} />)}
    {!representatives.length ? <p className="t-caption">No representatives are recorded for this factory.</p> : null}
  </section></>;
}
