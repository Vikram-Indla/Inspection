"use client";

import { useEffect, useState, useTransition } from "react";
import {
  extractFieldEvidenceText,
  getFieldOcrAvailability,
  type FieldOcrActionResult,
} from "./ocrEvidenceActions";

type Capture = { b64: string; mime: string; fname: string };

const COPY = {
  en: {
    title: "Attach evidence · OCR scan",
    advisory: "OCR is advisory — the inspector decides.",
    advisoryBody: "Extracted text never fills an inspection field. Review and correct it against the source image before using it.",
    attachment: "1 · Attachment (primary evidence)",
    stored: "Ready to attach as evidence",
    scan: "2 · OCR scan (optional · advisory)",
    run: "Read text with OCR",
    running: "Reading text…",
    retry: "Re-scan",
    unavailable: "OCR is disabled because GEMINI_API_KEY is not configured. The image can still be attached as evidence.",
    failed: "OCR could not be reached or did not complete. No text or confidence was invented. The image can still be attached.",
    timedOut: "OCR timed out. No text or confidence was invented. The image can still be attached.",
    noText: "OCR completed but found no visible text.",
    extracted: "Extracted text (unverified)",
    confidence: "Confidence: unavailable — not inferred",
    editHint: "Correct the text while comparing it with the source image.",
    reviewed: "I reviewed and corrected this text against the source image",
    copy: "Copy reviewed text",
    copied: "Copied",
    note: "Copying does not fill or commit any inspection field. Paste only after verifying the original.",
    skip: "Back",
    attach: "Attach evidence",
  },
  ar: {
    title: "إرفاق دليل · قراءة ضوئية",
    advisory: "القراءة الضوئية استشارية — القرار للمفتش.",
    advisoryBody: "النص المستخرج لا يملأ أي حقل تفتيش. راجعه وصححه مقابل الصورة الأصلية قبل استخدامه.",
    attachment: "١ · المرفق (الدليل الأساسي)",
    stored: "جاهز للإرفاق كدليل",
    scan: "٢ · قراءة ضوئية (اختياري · استشاري)",
    run: "قراءة النص ضوئياً",
    running: "جارٍ قراءة النص…",
    retry: "إعادة القراءة",
    unavailable: "القراءة الضوئية معطلة لأن GEMINI_API_KEY غير مهيأ. لا يزال بالإمكان إرفاق الصورة كدليل.",
    failed: "تعذر الوصول إلى مزود القراءة أو لم تكتمل العملية. لم يُنشأ نص أو مستوى ثقة. لا يزال بالإمكان إرفاق الصورة.",
    timedOut: "انتهت مهلة القراءة الضوئية. لم يُنشأ نص أو مستوى ثقة. لا يزال بالإمكان إرفاق الصورة.",
    noText: "اكتملت القراءة ولم يُعثر على نص ظاهر.",
    extracted: "النص المستخرج (غير متحقق منه)",
    confidence: "الثقة: غير متاحة — لا تُستنتج",
    editHint: "صحح النص أثناء مقارنته بالصورة الأصلية.",
    reviewed: "راجعت هذا النص وصححته مقابل الصورة الأصلية",
    copy: "نسخ النص المراجع",
    copied: "تم النسخ",
    note: "النسخ لا يملأ أو يعتمد أي حقل تفتيش. الصق النص فقط بعد التحقق من الأصل.",
    skip: "رجوع",
    attach: "إرفاق الدليل",
  },
} as const;

export default function OcrEvidenceCapture({
  capture,
  locale,
  onBack,
  onAttach,
  classNames,
}: {
  capture: Capture;
  locale: "en" | "ar";
  onBack: () => void;
  onAttach: () => void;
  classNames: Record<string, string>;
}) {
  const t = COPY[locale];
  const [provider, setProvider] = useState<FieldOcrActionResult>({ status: "unavailable", reason: "missing_api_key" });
  const [checking, startChecking] = useTransition();
  const [running, startOcr] = useTransition();
  const [text, setText] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    startChecking(async () => setProvider(await getFieldOcrAvailability()));
  }, []);

  function runOcr() {
    setReviewed(false);
    setCopied(false);
    startOcr(async () => {
      const result = await extractFieldEvidenceText(capture.b64, capture.mime);
      setProvider(result);
      setText(result.status === "extracted" ? result.text : "");
    });
  }

  async function copyReviewed() {
    if (!reviewed || !text.trim()) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
  }

  const disabled = provider.status === "unavailable";
  const failure = provider.status === "failed";

  return (
    <div className={classNames.ocrOverlay} role="dialog" aria-modal="true" aria-labelledby="field-ocr-title">
      <div className={classNames.ocrSheet} dir={locale === "ar" ? "rtl" : "ltr"}>
        <div className={classNames.ocrHeader}>
          <h2 id="field-ocr-title">{t.title}</h2>
          <span className="badge badge-warning">{locale === "ar" ? "استشاري" : "Advisory"}</span>
        </div>

        <div className={classNames.ocrAdvisory}>
          <strong>{t.advisory}</strong>
          <p>{t.advisoryBody}</p>
        </div>

        <section className={classNames.ocrPanel}>
          <strong>{t.attachment}</strong>
          <img className={classNames.ocrPreview} src={`data:${capture.mime};base64,${capture.b64}`} alt="" />
          <span className="t-caption">{capture.fname} · {t.stored}</span>
        </section>

        <section className={classNames.ocrPanel}>
          <div className={classNames.ocrSectionHead}>
            <strong>{t.scan}</strong>
            <span className="id-code t-caption">{t.confidence}</span>
          </div>

          {disabled && !checking && <p className={classNames.ocrDisabled} role="status">{t.unavailable}</p>}
          {failure && <p className={classNames.ocrError} role="alert">{provider.reason === "gemini_timeout" ? t.timedOut : t.failed}</p>}
          {provider.status === "no_text_found" && <p className={classNames.ocrNotice} role="status">{t.noText}</p>}

          {provider.status === "extracted" && (
            <>
              <label className={classNames.ocrField}>
                <span>{t.extracted}</span>
                <textarea rows={7} value={text} onChange={(event) => { setText(event.target.value); setReviewed(false); setCopied(false); }} />
                <small>{t.editHint}</small>
              </label>
              <label className={classNames.ocrCheck}>
                <input type="checkbox" checked={reviewed} onChange={(event) => setReviewed(event.target.checked)} />
                <span>{t.reviewed}</span>
              </label>
              <button type="button" className="btn btn-secondary btn-lg" disabled={!reviewed || !text.trim()} onClick={copyReviewed}>
                {copied ? t.copied : t.copy}
              </button>
              <p className="t-caption">{t.note}</p>
            </>
          )}

          <button type="button" className="btn btn-secondary btn-lg" disabled={checking || running || disabled} onClick={runOcr}>
            {running ? t.running : (provider.status === "extracted" || failure || provider.status === "no_text_found" ? t.retry : t.run)}
          </button>
        </section>

        <div className={classNames.ocrActions}>
          <button type="button" className="btn btn-secondary btn-lg" onClick={onBack}>{t.skip}</button>
          <button type="button" className="btn btn-primary btn-lg" onClick={onAttach}>{t.attach}</button>
        </div>
      </div>
    </div>
  );
}
