"use client";

import { useActionState } from "react";
import { mutateFactoryMasterData, type FactoryDataResult } from "./actions";

function Result({ state }: { state: FactoryDataResult }) {
  if (state.error) return <span role="alert" style={{ color: "var(--status-critical)" }}>{state.error}</span>;
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
  return <><div className="sq-grid">
    <form action={documentAction} className="panel stack" style={{ padding: "var(--space-4)" }}>
      {common}<input type="hidden" name="operation" value="document" /><h4>Document metadata</h4>
      <label>Type<select className="sq-select" name="doc_type" defaultValue="license"><option value="license">License</option><option value="cr">CR</option><option value="safety_cert">Safety certificate</option><option value="layout">Layout</option><option value="other">Other</option></select></label>
      <label>Title<input className="sq-input" name="title" required /></label>
      <label>Reference number<input className="sq-input numeric" name="reference_no" /></label>
      <label>Valid from<input className="sq-input numeric" type="date" name="valid_from" /></label><label>Valid to<input className="sq-input numeric" type="date" name="valid_to" /></label>
      <button className="btn btn-secondary btn-touch" disabled={documentPending}>Add metadata</button><Result state={documentState} />
    </form>
    <form action={representativeAction} className="panel stack" style={{ padding: "var(--space-4)" }}>
      {common}<input type="hidden" name="operation" value="representative" /><h4>Representative</h4>
      <label>Full name<input className="sq-input" name="full_name" required /></label><label>Role<input className="sq-input" name="role_title" /></label>
      <label>Phone<input className="sq-input" name="phone" /></label><label>Email<input className="sq-input" type="email" name="email" /></label>
      <label className="sq-choice"><input type="checkbox" name="is_primary" /> Primary contact</label>
      <button className="btn btn-secondary btn-touch" disabled={representativePending}>Add representative</button><Result state={representativeState} />
    </form>
    <form action={productAction} className="panel stack" style={{ padding: "var(--space-4)" }}>
      {common}<input type="hidden" name="operation" value="product" /><h4>Product</h4>
      <label>Name<input className="sq-input" name="name" required /></label><label>HS code<input className="sq-input" name="hs_code" /></label><label>Unit<input className="sq-input" name="unit" /></label>
      <label>Annual capacity<input className="sq-input numeric" type="number" min="0" step="0.01" name="annual_capacity" /></label><label className="sq-choice"><input type="checkbox" name="is_primary" /> Primary product</label>
      <button className="btn btn-secondary btn-touch" disabled={productPending}>Add product</button><Result state={productState} />
    </form>
    <form action={materialAction} className="panel stack" style={{ padding: "var(--space-4)" }}>
      {common}<input type="hidden" name="operation" value="material" /><h4>Raw material</h4>
      <label>Name<input className="sq-input" name="name" required /></label><label>Source<select className="sq-select" name="source" defaultValue="local"><option value="local">Local</option><option value="imported">Imported</option></select></label><label>HS code<input className="sq-input" name="hs_code" /></label>
      <button className="btn btn-secondary btn-touch" disabled={materialPending}>Add material</button><Result state={materialState} />
    </form>
  </div><section className="panel stack" style={{ padding: "var(--space-4)", marginBlockStart: "var(--space-4)" }}><h4>Representative status</h4>
    {representatives.map(representative => <RepresentativeToggle key={representative.id} factoryId={factoryId} representative={representative} />)}
    {!representatives.length ? <p className="t-caption">No representatives are recorded for this factory.</p> : null}
  </section></>;
}
