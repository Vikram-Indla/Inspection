"use client";
import { useActionState } from "react";
import {
  addFactoryDocument, addFactoryMaterial, addFactoryProduct, addRepresentative,
  toggleRepresentativeActive, type F360Result,
} from "./actions";

// Server-built strings (strings-prop pattern — client components cannot call useT()).
export type AddDocumentStrings = {
  typeLabel: string;
  typeOptions: { license: string; cr: string; safety_cert: string; layout: string; other: string };
  titleLabel: string;
  titlePlaceholder: string;
  refLabel: string;
  refPlaceholder: string;
  validFrom: string;
  validTo: string;
  adding: string;
  add: string;
  added: string;
};

export type AddRepresentativeStrings = {
  fullNameLabel: string;
  fullNamePlaceholder: string;
  roleLabel: string;
  rolePlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  emailLabel: string;
  primaryContact: string;
  adding: string;
  add: string;
  added: string;
};

export type ToggleRepStrings = {
  saving: string;
  deactivate: string;
  reactivate: string;
};

export type AddProductStrings = {
  nameLabel: string;
  namePlaceholder: string;
  hsLabel: string;
  unitLabel: string;
  unitPlaceholder: string;
  capacityLabel: string;
  primaryProduct: string;
  adding: string;
  add: string;
  added: string;
};

export type AddMaterialStrings = {
  nameLabel: string;
  namePlaceholder: string;
  sourceLabel: string;
  sourceOptions: { local: string; imported: string };
  hsLabel: string;
  adding: string;
  add: string;
  added: string;
};

// SB11 — add document metadata (no file upload; custody via evidence pipeline).
export function AddDocumentForm({ factoryId, strings }: { factoryId: string; strings: AddDocumentStrings }) {
  const [state, formAction, pending] = useActionState<F360Result, FormData>(addFactoryDocument, {});
  return (
    <form action={formAction} className="ax-row" style={{ gap: "var(--ax-space-150)", alignItems: "flex-end", flexWrap: "wrap", marginBlockStart: "var(--ax-space-200)" }}>
      <input type="hidden" name="factory_id" value={factoryId} />
      <div className="ax-field"><label className="ax-field__label">{strings.typeLabel}</label>
        <select className="ax-select" name="doc_type" required defaultValue="license">
          <option value="license">{strings.typeOptions.license}</option>
          <option value="cr">{strings.typeOptions.cr}</option>
          <option value="safety_cert">{strings.typeOptions.safety_cert}</option>
          <option value="layout">{strings.typeOptions.layout}</option>
          <option value="other">{strings.typeOptions.other}</option>
        </select></div>
      <div className="ax-field" style={{ flex: 1, minInlineSize: 200 }}><label className="ax-field__label">{strings.titleLabel}</label>
        <input className="ax-input" name="title" placeholder={strings.titlePlaceholder} required /></div>
      <div className="ax-field"><label className="ax-field__label">{strings.refLabel}</label>
        <input className="ax-input ax-numeric" name="reference_no" placeholder={strings.refPlaceholder} /></div>
      <div className="ax-field"><label className="ax-field__label">{strings.validFrom}</label>
        <input className="ax-input ax-numeric" type="date" name="valid_from" /></div>
      <div className="ax-field"><label className="ax-field__label">{strings.validTo}</label>
        <input className="ax-input ax-numeric" type="date" name="valid_to" /></div>
      <button className="ax-btn ax-btn--prominent" disabled={pending}>{pending ? strings.adding : strings.add}</button>
      {state.error && <span className="ax-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">{state.error}</span>}
      {state.ok && <span className="ax-lozenge ax-lozenge--success">{strings.added}</span>}
    </form>
  );
}

// SB11 — register a factory representative.
export function AddRepresentativeForm({ factoryId, strings }: { factoryId: string; strings: AddRepresentativeStrings }) {
  const [state, formAction, pending] = useActionState<F360Result, FormData>(addRepresentative, {});
  return (
    <form action={formAction} className="ax-row" style={{ gap: "var(--ax-space-150)", alignItems: "flex-end", flexWrap: "wrap", marginBlockStart: "var(--ax-space-200)" }}>
      <input type="hidden" name="factory_id" value={factoryId} />
      <div className="ax-field" style={{ flex: 1, minInlineSize: 180 }}><label className="ax-field__label">{strings.fullNameLabel}</label>
        <input className="ax-input" name="full_name" placeholder={strings.fullNamePlaceholder} required /></div>
      <div className="ax-field"><label className="ax-field__label">{strings.roleLabel}</label>
        <input className="ax-input" name="role_title" placeholder={strings.rolePlaceholder} /></div>
      <div className="ax-field"><label className="ax-field__label">{strings.phoneLabel}</label>
        <input className="ax-input ax-numeric" name="phone" placeholder={strings.phonePlaceholder} /></div>
      <div className="ax-field"><label className="ax-field__label">{strings.emailLabel}</label>
        <input className="ax-input" type="email" name="email" /></div>
      <label className="ax-choice" style={{ alignSelf: "center" }}>
        <input type="checkbox" name="is_primary" /> {strings.primaryContact}</label>
      <button className="ax-btn ax-btn--prominent" disabled={pending}>{pending ? strings.adding : strings.add}</button>
      {state.error && <span className="ax-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">{state.error}</span>}
      {state.ok && <span className="ax-lozenge ax-lozenge--success">{strings.added}</span>}
    </form>
  );
}

// W3 / M07-006 — add a product row (RLS: planner/ops/compliance_admin, 0017).
export function AddProductForm({ factoryId, strings }: { factoryId: string; strings: AddProductStrings }) {
  const [state, formAction, pending] = useActionState<F360Result, FormData>(addFactoryProduct, {});
  return (
    <form action={formAction} className="ax-row" style={{ gap: "var(--ax-space-150)", alignItems: "flex-end", flexWrap: "wrap", marginBlockStart: "var(--ax-space-200)" }}>
      <input type="hidden" name="factory_id" value={factoryId} />
      <div className="ax-field" style={{ flex: 1, minInlineSize: 200 }}><label className="ax-field__label">{strings.nameLabel}</label>
        <input className="ax-input" name="name" placeholder={strings.namePlaceholder} required /></div>
      <div className="ax-field"><label className="ax-field__label">{strings.hsLabel}</label>
        <input className="ax-input ax-numeric" name="hs_code" placeholder="3920.10" /></div>
      <div className="ax-field"><label className="ax-field__label">{strings.unitLabel}</label>
        <input className="ax-input" name="unit" placeholder={strings.unitPlaceholder} /></div>
      <div className="ax-field"><label className="ax-field__label">{strings.capacityLabel}</label>
        <input className="ax-input ax-numeric" type="number" name="annual_capacity" min="0" step="0.01" /></div>
      <label className="ax-choice" style={{ alignSelf: "center" }}>
        <input type="checkbox" name="is_primary" /> {strings.primaryProduct}</label>
      <button className="ax-btn ax-btn--prominent" disabled={pending}>{pending ? strings.adding : strings.add}</button>
      {state.error && <span className="ax-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">{state.error}</span>}
      {state.ok && <span className="ax-lozenge ax-lozenge--success">{strings.added}</span>}
    </form>
  );
}

// W3 / M07-007 — add a raw-material row (RLS: planner/ops/compliance_admin, 0017).
export function AddMaterialForm({ factoryId, strings }: { factoryId: string; strings: AddMaterialStrings }) {
  const [state, formAction, pending] = useActionState<F360Result, FormData>(addFactoryMaterial, {});
  return (
    <form action={formAction} className="ax-row" style={{ gap: "var(--ax-space-150)", alignItems: "flex-end", flexWrap: "wrap", marginBlockStart: "var(--ax-space-200)" }}>
      <input type="hidden" name="factory_id" value={factoryId} />
      <div className="ax-field" style={{ flex: 1, minInlineSize: 200 }}><label className="ax-field__label">{strings.nameLabel}</label>
        <input className="ax-input" name="name" placeholder={strings.namePlaceholder} required /></div>
      <div className="ax-field"><label className="ax-field__label">{strings.sourceLabel}</label>
        <select className="ax-select" name="source" required defaultValue="local">
          <option value="local">{strings.sourceOptions.local}</option>
          <option value="imported">{strings.sourceOptions.imported}</option>
        </select></div>
      <div className="ax-field"><label className="ax-field__label">{strings.hsLabel}</label>
        <input className="ax-input ax-numeric" name="hs_code" placeholder="3901.10" /></div>
      <button className="ax-btn ax-btn--prominent" disabled={pending}>{pending ? strings.adding : strings.add}</button>
      {state.error && <span className="ax-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">{state.error}</span>}
      {state.ok && <span className="ax-lozenge ax-lozenge--success">{strings.added}</span>}
    </form>
  );
}

// SB11 — activate/deactivate a representative (RLS: planner/ops/compliance_admin).
export function ToggleRepActive({ repId, factoryId, active, strings }: { repId: string; factoryId: string; active: boolean; strings: ToggleRepStrings }) {
  const [state, formAction, pending] = useActionState<F360Result, FormData>(toggleRepresentativeActive, {});
  return (
    <form action={formAction} className="ax-row" style={{ gap: "var(--ax-space-100)", alignItems: "center" }}>
      <input type="hidden" name="rep_id" value={repId} />
      <input type="hidden" name="factory_id" value={factoryId} />
      <input type="hidden" name="next_active" value={active ? "false" : "true"} />
      <button className="ax-btn ax-btn--subtle" disabled={pending}>
        {pending ? strings.saving : active ? strings.deactivate : strings.reactivate}</button>
      {state.error && <span className="ax-caption" style={{ color: "var(--ax-color-critical)" }} role="alert">{state.error}</span>}
    </form>
  );
}
