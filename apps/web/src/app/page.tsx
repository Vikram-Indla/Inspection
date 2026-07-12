import "./landing.css";
import { cookies } from "next/headers";
import { supabaseServer } from "@/lib/supabase-server";
import CoverageMap, { type CoverageRegion } from "./CoverageMap";
import { IconTarget, IconFactory, IconClipboardCheck, IconScale, IconTrendUp } from "./icons";
import GovBar from "./GovBar";

export const dynamic = "force-dynamic";

// SCR-PUB-000 — public landing for the national industrial inspection
// platform. Arabic-first (KSA public entry point); English via the toggle.
// Deliberately silent on internal channels (admin/web/iPad/agent) — those
// are resolved by role after sign-in (/launch), never advertised here.
type Locale = "ar" | "en";

async function resolveLocale(): Promise<Locale> {
  const c = await cookies();
  return c.get("locale")?.value === "en" ? "en" : "ar";
}

const REGIONS: { id: string; lat: number; lng: number; name_ar: string; name_en: string; tone: CoverageRegion["tone"]; facilities: number; inspectors: number }[] = [
  { id: "riyadh", lat: 24.7136, lng: 46.6753, name_ar: "الرياض", name_en: "Riyadh", tone: "medium", facilities: 214, inspectors: 18 },
  { id: "jeddah", lat: 21.4858, lng: 39.1925, name_ar: "جدة", name_en: "Jeddah", tone: "medium", facilities: 176, inspectors: 14 },
  { id: "dammam", lat: 26.4207, lng: 50.0888, name_ar: "الدمام", name_en: "Dammam", tone: "high", facilities: 231, inspectors: 21 },
  { id: "jubail", lat: 27.0046, lng: 49.6605, name_ar: "الجبيل الصناعية", name_en: "Jubail", tone: "high", facilities: 158, inspectors: 16 },
  { id: "yanbu", lat: 24.0895, lng: 38.0618, name_ar: "ينبع الصناعية", name_en: "Yanbu", tone: "medium", facilities: 97, inspectors: 9 },
  { id: "qassim", lat: 26.3260, lng: 43.9750, name_ar: "القصيم", name_en: "Qassim", tone: "low", facilities: 54, inspectors: 6 },
  { id: "jazan", lat: 16.8892, lng: 42.5511, name_ar: "جازان", name_en: "Jazan", tone: "low", facilities: 41, inspectors: 5 },
];

export default async function Landing() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  const locale = await resolveLocale();
  const ar = locale === "ar";
  const dir = ar ? "rtl" : "ltr";
  const langHref = ar ? "/locale?set=en" : "/locale?set=ar";
  const langLabel = ar ? "English" : "العربية";

  const regions: CoverageRegion[] = REGIONS.map(({ name_ar, name_en, ...r }) => ({ ...r, name: ar ? name_ar : name_en }));

  const stepIcons = [IconTarget, IconFactory, IconClipboardCheck, IconScale, IconTrendUp];
  const processSteps = (ar ? [
    { title: "التخطيط والاستهداف", body: "تحديد المنشآت الواجب تفتيشها بحسب تقييم المخاطر، وبناء خطة الزيارة قبل أي تحرّك ميداني." },
    { title: "التنفيذ الميداني أو عن بُعد", body: "تنفيذ التفتيش داخل المنشأة أو عبر جلسة تحقق عن بُعد، مع توثيق الملاحظات والأدلة لحظيًا." },
    { title: "الأدلة والمخالفات", body: "ربط كل ملاحظة بدليلها، ومطابقتها بجدول المخالفات، وفتح إجراء تصحيحي عند الحاجة." },
    { title: "المراجعة والقرار", body: "مراجعة مستقلة من مستوى ثانٍ، وقرار معتمد لا يعدَّل — أي تصحيح يفتح نسخة جديدة." },
    { title: "الأثر التشغيلي", body: "تحديث السجل التاريخي للمنشأة ولوحات التشغيل، لتقييم أدق في الجولة التالية." },
  ] : [
    { title: "Planning & targeting", body: "Facilities are selected by risk assessment, and a visit plan is built before anyone leaves the office." },
    { title: "On-site or remote execution", body: "Inspection runs on the factory floor or through a verified remote session, with notes and evidence captured live." },
    { title: "Evidence & violations", body: "Every observation is linked to its evidence, matched against the violation catalogue, and a corrective action opens when required." },
    { title: "Review & decision", body: "An independent second reviewer decides. The decision is locked — any correction opens a new version." },
    { title: "Operational impact", body: "The facility's history and operations dashboards update, sharpening the next round of targeting." },
  ]).map((s, i) => ({ ...s, Icon: stepIcons[i] }));

  const trust = ar ? [
    { title: "الأمان في قاعدة البيانات، لا في الواجهة", body: "كل صلاحية وكل قيد محفوظ كسياسة على مستوى البيانات — لا تعتمد الحماية على الشاشة التي يراها المستخدم." },
    { title: "سجل تدقيق لا يُعدَّل ولا يُحذف", body: "كل إجراء داخل جلسة عمل يُسجَّل بشكل دائم، ولا تقبل قاعدة البيانات أي تعديل أو حذف لاحق عليه." },
    { title: "لا اعتماد ذاتي على قرار", body: "لا يمكن لمُعِدّ أي حزمة أو تقرير أن يعتمده بنفسه — الفصل بين الإعداد والاعتماد مطبّق إلزاميًا." },
    { title: "استمرارية العمل الميداني دون اتصال", body: "يواصل المفتش عمله دون إنترنت؛ تُحفظ الإجابات محليًا وتُزامن لاحقًا دون فقد أو استبدال صامت." },
  ] : [
    { title: "Security lives in the database, not the screen", body: "Every permission and constraint is enforced as a data-level policy — protection never depends on which screen a user happens to be on." },
    { title: "An audit trail that cannot be edited or deleted", body: "Every action inside a work session is recorded permanently; the database rejects any later edit or deletion of it." },
    { title: "No one approves their own work", body: "The person who prepares a package or report can never approve it themselves — separation of duties is enforced, not just requested." },
    { title: "Field work continues without a connection", body: "Inspectors keep working offline; answers are held locally and synced later — never lost, never silently overwritten." },
  ];

  const stats = ar
    ? [{ n: "13", l: "منطقة إدارية مغطاة" }, { n: "100%", l: "من إجراءات الجلسة موثّقة رقميًا" }, { n: "0", l: "قرارات معتمدة قابلة للتعديل" }, { n: "24/7", l: "جاهزية عمل ميداني دون اتصال" }]
    : [{ n: "13", l: "administrative regions covered" }, { n: "100%", l: "of session actions digitally recorded" }, { n: "0", l: "approved decisions that can be edited" }, { n: "24/7", l: "offline-ready field readiness" }];

  return (
    <div className="mk-page" dir={dir} lang={locale}>
      <GovBar
        s={{
          banner: ar ? "موقع حكومي رسمي تابع لحكومة المملكة العربية السعودية" : "Official government website of the Government of the Kingdom of Saudi Arabia",
          howToVerify: ar ? "كيف تتحقق" : "How to verify",
          linkTitle: ar ? "روابط المواقع الحكومية الرسمية تنتهي بـ gov.sa" : "Links to official Saudi websites end with gov.sa",
          linkBody: ar ? "جميع روابط المواقع الرسمية للجهات الحكومية في المملكة العربية السعودية تنتهي بـ gov.sa" : "All links to official websites of government agencies in the Kingdom of Saudi Arabia end with .gov.sa",
          httpsTitle: ar ? "المواقع الحكومية تستخدم بروتوكول HTTPS للتشفير والأمان." : "Government websites use the HTTPS protocol for encryption and security.",
          httpsBody: ar ? "المواقع الآمنة في المملكة العربية السعودية تستخدم بروتوكول HTTPS للتشفير." : "Secure websites in the Kingdom of Saudi Arabia use the HTTPS protocol for encryption.",
        }}
      />
      <nav className="mk-nav" aria-label={ar ? "الرئيسية" : "Primary"}>
        <a className="mk-nav__brand" href="/">
          <span className="ax-shell__brand-mark">IP</span>
          <span className="mk-nav__brandtext">
            <strong>{ar ? "منصّة التفتيش الصناعي" : "Industrial Inspection Platform"}</strong>
            <small>{ar ? "وزارة الصناعة والثروة المعدنية" : "Ministry of Industry & Mineral Resources"}</small>
          </span>
        </a>
        <div className="mk-nav__links">
          <a href="#process">{ar ? "منهجية التفتيش" : "How inspection works"}</a>
          <a href="#coverage">{ar ? "التغطية الجغرافية" : "Coverage"}</a>
          <a href="#remote">{ar ? "التفتيش عن بُعد" : "Remote inspection"}</a>
          <a href="#trust">{ar ? "الثقة والحوكمة" : "Trust & governance"}</a>
          <a href={langHref}>{langLabel}</a>
        </div>
        <a className="mk-btn mk-btn--primary" href={user ? "/launch" : "/login"}>
          {user ? (ar ? "الدخول إلى مساحة العمل" : "Open workspace") : (ar ? "تسجيل الدخول" : "Sign in")}
        </a>
      </nav>

      <header className="mk-hero">
        <span className="mk-hero__eyebrow">{ar ? "وزارة الصناعة والثروة المعدنية" : "Ministry of Industry & Mineral Resources"}</span>
        <h1>{ar ? "تفتيش صناعي أكثر دقة. امتثال أسرع. مصانع أكثر أمانًا." : "Sharper inspection. Faster compliance. Safer factories."}</h1>
        <p className="mk-sub">
          {ar
            ? "منصة وطنية موحّدة لتخطيط التفتيش وتنفيذه ومراجعته على المنشآت الصناعية في المملكة — من تحديد المستهدفين وحتى القرار النهائي، بضوابط رقمية تحفظ سلامة الإجراء وتوثّق كل خطوة."
            : "A unified national platform for planning, executing and reviewing inspections across the Kingdom's industrial facilities — from targeting through final decision, with digital controls that protect the process and document every step."}
        </p>
        <div className="mk-hero__ctas">
          <a className="mk-btn mk-btn--solid" href={user ? "/launch" : "/login"}>
            {user ? (ar ? "الدخول إلى مساحة العمل" : "Open your workspace") : (ar ? "تسجيل الدخول" : "Sign in")}
          </a>
          <a className="mk-btn mk-btn--ghost" href="#process">{ar ? "تعرّف على منهجية التفتيش" : "See how inspection works"}</a>
        </div>

        <div className="mk-hero__mock" aria-hidden="true">
          <div className="mk-mock__bar"><span className="mk-mock__dot" /><span className="mk-mock__dot" /><span className="mk-mock__dot" /></div>
          <div className="mk-mock__body">
            <div className="mk-mock__nav">
              <div className="mk-mock__navitem mk-mock__navitem--active" />
              <div className="mk-mock__navitem" /><div className="mk-mock__navitem" />
              <div className="mk-mock__navitem" /><div className="mk-mock__navitem" />
            </div>
            <div className="mk-mock__main">
              <div className="mk-mock__kpis">
                <div className="mk-mock__kpi"><b>128</b><span>{ar ? "زيارات مكتملة" : "completed visits"}</span></div>
                <div className="mk-mock__kpi"><b>96%</b><span>{ar ? "التزام بالمواعيد" : "on-time delivery"}</span></div>
                <div className="mk-mock__kpi"><b>14</b><span>{ar ? "قيد المراجعة" : "under review"}</span></div>
                <div className="mk-mock__kpi"><b>3</b><span>{ar ? "تنبيهات نشطة" : "active alerts"}</span></div>
              </div>
              <div className="mk-mock__rows">
                <div className="mk-mock__row"><strong>{ar ? "مصنع الأمل للبلاستيك" : "Al Amal Plastics"}</strong> F-2214 <span className="mk-pill mk-pill--ok">{ar ? "معتمد" : "approved"}</span><span style={{ marginInlineStart: "auto" }}>{ar ? "دوري · ميداني" : "periodic · on-site"}</span></div>
                <div className="mk-mock__row"><strong>{ar ? "مصانع الخليج للصلب" : "Gulf Steel Works"}</strong> F-2215 <span className="mk-pill mk-pill--warn">{ar ? "مخاطر مرتفعة" : "high risk"}</span><span style={{ marginInlineStart: "auto" }}>{ar ? "متابعة · ميداني" : "follow-up · on-site"}</span></div>
                <div className="mk-mock__row"><strong>{ar ? "صناعات نجد الغذائية" : "Najd Food Industries"}</strong> F-2216 <span className="mk-pill mk-pill--info">{ar ? "عن بُعد" : "remote"}</span><span style={{ marginInlineStart: "auto" }}>{ar ? "دوري · عن بُعد" : "periodic · remote"}</span></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="mk-section" id="process">
        <span className="mk-kicker">{ar ? "قبل الزيارة وبعدها" : "Before and after the visit"}</span>
        <h2>{ar ? "كل تفتيش يمر بمسار واحد محكوم." : "Every inspection follows one governed path."}</h2>
        <p className="mk-lead">{ar ? "من تحديد المنشأة إلى القرار النهائي، لا تتم خطوة دون توثيق الخطوة التي سبقتها." : "From selecting a facility to the final decision, no step proceeds without the one before it being on record."}</p>
        <ol className="mk-timeline">
          {processSteps.map((s, i) => (
            <li key={s.title} className="mk-timeline__step">
              <span className="mk-timeline__index">{String(i + 1).padStart(2, "0")}</span>
              <span className="mk-timeline__icon" aria-hidden="true"><s.Icon size={22} /></span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mk-section mk-section--tight" id="coverage">
        <span className="mk-kicker">{ar ? "التغطية الجغرافية" : "Geographic coverage"}</span>
        <h2>{ar ? "منشآت خاضعة للتفتيش في كل منطقة صناعية رئيسية." : "Facilities under inspection across every major industrial region."}</h2>
        <p className="mk-lead">{ar ? "توزيع تمثيلي للمنشآت والمفتشين حسب المنطقة ومستوى المخاطر." : "A representative view of facilities and inspectors by region and risk tier."}</p>
        <CoverageMap
          regions={regions}
          strings={{
            loadingTitle: ar ? "جارٍ تحميل الخريطة" : "Loading map",
            loadingBody: ar ? "يُرجى الانتظار" : "Please wait",
            facilities: ar ? "منشأة" : "facilities",
            inspectors: ar ? "مفتش" : "inspectors",
            legendHigh: ar ? "مخاطر مرتفعة" : "High risk",
            legendMedium: ar ? "مخاطر متوسطة" : "Medium risk",
            legendLow: ar ? "مخاطر منخفضة" : "Low risk",
          }}
        />
      </section>

      <section className="mk-section mk-section--split" id="remote">
        <div>
          <span className="mk-kicker">{ar ? "التفتيش عن بُعد" : "Remote inspection"}</span>
          <h2>{ar ? "حين لا تستدعي الحالة زيارة ميدانية." : "When the case doesn't call for a site visit."}</h2>
          <p className="mk-lead">
            {ar
              ? "جلسة تحقّق مباشرة مع مشاركين تم التحقق من هويتهم قبل بدء أي تسجيل، وسجل زمني كامل للجلسة يُحفظ بنفس انضباط الأدلة الميدانية."
              : "A live verification session with participants confirmed before a single frame is recorded, and a full session timeline kept with the same evidence discipline as a physical visit."}
          </p>
        </div>
        <div className="mk-remote" aria-hidden="true">
          <div className="mk-remote__bar"><span className="mk-mock__dot" /><span className="mk-mock__dot" /><span className="mk-mock__dot" /><span className="mk-remote__timer">14:32</span></div>
          <div className="mk-remote__stage">
            <div className="mk-remote__participant">
              <span className="mk-remote__avatar" />
              <span className="mk-remote__badge">{ar ? "تم التحقق من الهوية" : "Identity verified"}</span>
            </div>
            <div className="mk-remote__timeline">
              <span className="mk-remote__evt mk-remote__evt--done">{ar ? "انضمام المشارك" : "Participant joined"}</span>
              <span className="mk-remote__evt mk-remote__evt--done">{ar ? "تحقق برمز لمرة واحدة" : "One-time code verified"}</span>
              <span className="mk-remote__evt mk-remote__evt--active">{ar ? "التفتيش جارٍ" : "Inspection in progress"}</span>
              <span className="mk-remote__evt">{ar ? "التوثيق والإرسال" : "Evidence & submission"}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mk-stats">
        <div className="mk-section">
          {stats.map(s => <div key={s.l} className="mk-stat"><b>{s.n}</b><span>{s.l}</span></div>)}
        </div>
      </div>

      <section className="mk-section" id="trust">
        <span className="mk-kicker">{ar ? "الثقة والحوكمة" : "Trust & governance"}</span>
        <h2>{ar ? "الحوكمة هنا خاصية في قاعدة البيانات، لا شعار." : "Governance here is a database property, not a slogan."}</h2>
        <div className="mk-features">
          {trust.map(f => (
            <div key={f.title} className="mk-feature">
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mk-footer">
        <div className="mk-section mk-footer__grid">
          <div className="mk-footer__col">
            <h4>{ar ? "نظرة عامة" : "Overview"}</h4>
            <a href="#process">{ar ? "منهجية التفتيش" : "Inspection methodology"}</a>
            <a href="#coverage">{ar ? "التغطية الجغرافية" : "Geographic coverage"}</a>
            <a href="#remote">{ar ? "التفتيش عن بُعد" : "Remote inspection"}</a>
            <a href="#trust">{ar ? "الثقة والحوكمة" : "Trust & governance"}</a>
          </div>
          <div className="mk-footer__col">
            <h4>{ar ? "الدعم والمساعدة" : "Support & Help"}</h4>
            <a href="#top">{ar ? "تواصل مع الوزارة" : "Contact the Ministry"}</a>
            <a href="#top">{ar ? "الأسئلة الشائعة" : "FAQs"}</a>
            <a href="#top">{ar ? "بلاغات الوصول الرقمي" : "Accessibility issue reports"}</a>
            <a href="/login">{ar ? "تسجيل الدخول" : "Sign in"}</a>
          </div>
          <div className="mk-footer__col">
            <h4>{ar ? "روابط" : "Links"}</h4>
            <a href="https://www.mim.gov.sa" rel="noopener">{ar ? "وزارة الصناعة والثروة المعدنية" : "Ministry of Industry & Mineral Resources"}</a>
            <a href="https://industry.sa" rel="noopener">{ar ? "منصّة صناعي" : "Senaei Platform"}</a>
            <a href="#top">{ar ? "البيانات المفتوحة" : "Open Data"}</a>
            <a href="#top">{ar ? "المشاركة الإلكترونية" : "E-Participation"}</a>
          </div>
          <div className="mk-footer__col">
            <h4>{ar ? "تابعنا" : "Follow Us"}</h4>
            <a href="#top" aria-label="X">X</a>
            <a href="#top" aria-label="LinkedIn">LinkedIn</a>
            <a href="#top" aria-label="YouTube">YouTube</a>
          </div>
        </div>
        <div className="mk-section mk-footer__legal">
          <div className="mk-footer__legalrow">
            <a href="#top">{ar ? "اتفاقية مستوى الخدمة الإلكترونية" : "Electronic Service Level Agreement"}</a>
            <a href="#top">{ar ? "سياسة الوصول الرقمي" : "Accessibility Policy"}</a>
            <a href="#top">{ar ? "سياسة الاستخدام وإخلاء المسؤولية" : "Usage Policy and Disclaimer"}</a>
            <a href="#top">{ar ? "سياسة الخصوصية" : "Privacy Policy"}</a>
            <a href="#top">{ar ? "خريطة الموقع" : "Sitemap"}</a>
          </div>
          <div className="mk-footer__bottom">
            <p><strong>{ar ? "جميع الحقوق محفوظة © 2026 وزارة الصناعة والثروة المعدنية." : "All rights reserved © 2026 Ministry of Industry & Mineral Resources."}</strong></p>
            <span className="mk-footer__vision">{ar ? "رؤية السعودية 2030" : "Saudi Vision 2030"}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
