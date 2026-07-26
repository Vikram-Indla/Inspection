"use client";
// SAQEEL Feedback — establishment rating form (WA-M11, WA-DES-028 "Form" state).
import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase";
import SignaturePad, { type SignatureAck, type SignaturePadStrings } from "../../../inspection/[id]/SignaturePad";

export type Aspect = { key: string; label: string };

type Strings = {
  visitRatingSub: string;
  overallSatisfaction: string;
  stepQuestionLabel: string;
  notesAndAttachments: string;
  shareThoughts: string;
  prevQuestion: string;
  nextQuestion: string;
  finishQuestions: string;
  repSignature: string;
  submitRating: string;
  confidentialNote: string;
  sig: SignaturePadStrings;
  submitError: string;
  done: string;
  viewReport: string;
};

function Stars({ value, onChange, size = 30 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          aria-label={`${n}/5`}
          aria-pressed={n <= value}
          disabled={!onChange}
          onClick={onChange ? () => onChange(n) : undefined}
          style={{ background: "none", border: "none", padding: 0, cursor: onChange ? "pointer" : "default", width: size, height: size }}
        >
          <svg viewBox="0 0 24 24" fill={n <= value ? "var(--action-primary)" : "none"} stroke="var(--action-primary)" strokeWidth={1.4} style={{ width: "100%", height: "100%" }}>
            <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function RateForm({ visitId, factoryName, inspectionId, aspects, locale, strings }: {
  visitId: string;
  factoryName: string;
  inspectionId: string | null;
  aspects: Aspect[];
  locale: string;
  strings: Strings;
}) {
  const [overall, setOverall] = useState(0);
  const [step, setStep] = useState(0);
  const [ratings, setRatings] = useState<number[]>(() => aspects.map(() => 0));
  const [notes, setNotes] = useState("");
  const [signing, setSigning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const setRating = (n: number) => setRatings(rs => rs.map((r, i) => (i === step ? n : r)));
  const isFirst = step === 0;
  const isLast = step === aspects.length - 1;
  const canOpenSignature = overall > 0 && ratings.every(r => r > 0);

  async function finalizeSubmit(ack: SignatureAck) {
    setSubmitting(true);
    setError(null);
    const sb = supabaseBrowser();
    const { error: rpcError } = await sb.rpc("submit_visit_feedback", {
      p_visit_id: visitId,
      p_overall_rating: overall,
      p_notes: notes.trim() || null,
      p_signed_name: ack.name,
      p_signature_data_url: ack.signature_data_url,
      p_aspects: aspects.map((a, i) => ({ aspect_key: a.key, rating: ratings[i] })),
    });
    setSubmitting(false);
    if (rpcError) {
      setError(strings.submitError);
      setSigning(false);
      return;
    }
    setSigning(false);
    setDone(true);
  }

  if (done) {
    return (
      <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-4)", maxWidth: 520, width: "100%", margin: "0 auto" }}>
        <div className="card" style={{ padding: 24, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <span className="badge badge-compliant"><span className="dot" />{strings.done}</span>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{factoryName}</div>
          <Stars value={overall} />
          {inspectionId && (
            <Link href={`/reports/inspection/${inspectionId}`} className="btn btn-secondary btn-block" prefetch={false}>
              {strings.viewReport}
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: 20, display: "flex", flexDirection: "column", gap: "var(--space-4)", maxWidth: 520, width: "100%", margin: "0 auto" }}>
      <div className="panel" style={{ padding: 18, textAlign: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 17 }}>{factoryName}</div>
        <div className="t-caption" style={{ marginBlockStart: 4 }}>{strings.visitRatingSub}</div>
      </div>

      <div className="panel" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{strings.overallSatisfaction}</div>
        <Stars value={overall} onChange={setOverall} />
      </div>

      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBlockEnd: "1px solid var(--border-subtle)" }}>
          <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{strings.stepQuestionLabel} {step + 1}/{aspects.length}</span>
          <span className="badge badge-info" style={{ height: 20 }}>{Math.round(((step + 1) / aspects.length) * 100)}%</span>
        </div>
        <div style={{ height: 4, background: "var(--surface-sunken)" }}>
          <div style={{ height: "100%", width: `${((step + 1) / aspects.length) * 100}%`, background: "var(--action-primary)", transition: "width .2s" }} />
        </div>
        <div style={{ padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 15.5, marginBlockEnd: 14 }}>{aspects[step].label}</div>
          <Stars value={ratings[step]} onChange={setRating} size={26} />
          <div style={{ display: "flex", gap: 10, marginBlockStart: 18 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} disabled={isFirst} onClick={() => setStep(s => Math.max(0, s - 1))}>{strings.prevQuestion}</button>
            <button type="button" className="btn btn-primary" style={{ flex: 1 }} disabled={ratings[step] === 0} onClick={() => setStep(s => Math.min(aspects.length - 1, s + 1))}>
              {isLast ? strings.finishQuestions : strings.nextQuestion}
            </button>
          </div>
        </div>
      </div>

      <label className="fld" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span style={{ fontSize: 12.5, fontWeight: 600 }}>{strings.notesAndAttachments}</span>
        <textarea className="input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder={strings.shareThoughts} />
      </label>

      {error && <p className="field-error">{error}</p>}

      <button
        type="button"
        className="btn btn-primary btn-block btn-lg"
        disabled={!canOpenSignature || submitting}
        onClick={() => setSigning(true)}
      >
        {strings.submitRating}
      </button>
      <p className="t-caption" style={{ textAlign: "center", color: "var(--text-muted)" }}>{strings.confidentialNote}</p>

      {signing && (
        <SignaturePad
          strings={strings.sig}
          onCancel={() => setSigning(false)}
          onConfirm={finalizeSubmit}
        />
      )}
    </div>
  );
}
