import Link from "next/link";
import { redirect } from "next/navigation";
import FieldNav from "@/components/field/FieldNav";
import FieldHeader from "@/components/field/FieldHeader";
import FieldLocationMap from "@/components/field/FieldLocationMap";
import { supabaseServer } from "@/lib/supabase-server";
import { getVerifiedUser } from "@/lib/verified-user";
import { useT } from "@/lib/i18n";
import { loadFactory360Dossier, resolveFactory360Permissions } from "@/lib/factory360/dossier";
import type { ProductionLine } from "@/lib/factory360/dossier";
import { isTestFixtureEstablishment } from "@/lib/field/fixtures";
import styles from "./my-tasks.module.css";

// SAQEEL Field My Tasks.dc.html — the design's real "My Tasks" screen: a
// master/detail surface (assigned task list → full establishment dossier with
// establishment data, evaluation indicators, license, visit location, governed
// regulatory chips and the start-visit actions). Previously the bottom tab's
// "My Tasks" slot only linked to the visits list; this is the missing native
// screen. Reads are RLS-scoped and every value is real or a governed "—" —
// no fabricated establishment/contact/machine data (project data-integrity law).
//
// Left list reuses the SAME assignments->visits->factories query shape and the
// SAME golden-journey fixture exclusion as /field/drafts. Right detail renders
// from the SHARED lib/factory360 dossier loader (identical business data,
// calculations and permissions as web SCR-WEB-400 and the iPad Factory 360),
// resolved from the selected visit's factory_id -> industrial_license -> CR.

type Assignment = { visit_id: string; visits: VisitRow | null };
type VisitRow = {
  id: string;
  planning_status: string;
  operational_state: string;
  window_start: string;
  visit_type: string;
  execution_mode: string;
  factory_id: string | null;
  factories: {
    id: string;
    name: string;
    factory_code: string | null;
    cr_number: string | null;
    region: string | null;
    city: string | null;
    official_lat: number | null;
    official_lng: number | null;
  } | null;
  inspections: { id: string; status: string } | null;
};
// plant_production_line_items is selected with these flags by the shared loader,
// but the ProductionLine export doesn't declare them — read them via this
// narrow extension rather than casting away the whole row.
type LineFlags = ProductionLine & {
  is_machine?: boolean | null;
  is_end_product?: boolean | null;
  is_raw_material?: boolean | null;
  is_spare_part?: boolean | null;
};
type RegCard = { title: string; lines: [string, string][] };

const REG_CHIPS = ["activities", "manufacturing", "contacts", "machines", "products", "raw", "documents", "license"] as const;
type RegChip = (typeof REG_CHIPS)[number];
// Chips with no governed source contract in MVP1. These never carry records, so
// they must not fall through to the generic "zero records" empty state — that
// would misread as "your scope has none" instead of "no source is wired yet".
const NO_SOURCE_CHIPS: readonly RegChip[] = ["manufacturing", "contacts"];

type SearchParams = { task?: string; reg?: string };

export default async function FieldMyTasks({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const sb = await supabaseServer();
  const { t, locale } = await useT();
  const tr = (key: string, en: string, ar: string) => (locale === "ar" ? ar : t(key, en));
  const { data: { user }, error: authError } = await getVerifiedUser(sb);
  if (authError || !user) redirect("/login"); // ERR-AUTH-001: never proceed with a null session

  const dt = (value: string | null | undefined) =>
    value ? new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-SA", { dateStyle: "medium" }).format(new Date(value)) : "—";
  const text = (value: string | number | null | undefined) => (value == null || value === "" ? "—" : String(value));
  const label = (value: string | null | undefined) => (value ? t(`enum.${value}`, value.replaceAll("_", " ")) : "—");

  const nav = (
    <FieldNav active="myTasks" labels={{
      home: tr("field.tabs.home", "Home", "الرئيسية"),
      myTasks: tr("field.tabs.myTasks", "My Tasks", "مهامي"),
      establishments: tr("field.tabs.establishments", "Establishments", "المنشآت"),
      notifications: tr("field.tabs.notifications", "Notifications", "الإشعارات"),
      account: tr("field.tabs.account", "Account", "الحساب"),
    }} />
  );
  const langHref = locale === "ar" ? "/locale?set=en" : "/locale?set=ar";
  const langLabel = locale === "ar" ? "EN" : "AR";

  const { data: asg, error } = await sb.from("assignments")
    .select("visit_id, visits(id, planning_status, operational_state, window_start, visit_type, execution_mode, factory_id, factories(id, name, factory_code, cr_number, region, city, official_lat, official_lng), inspections(id, status))")
    .eq("inspector_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[field my-tasks]", error.message);
    return (
      <>
        <FieldHeader title={tr("field.myTasks.title", "My Tasks", "مهامي")}
          langHref={langHref} langLabel={langLabel} />
        <div style={{ flex: 1, padding: 20 }}>
          <div role="alert" style={{ padding: 16, borderRadius: "var(--radius-md)", background: "var(--status-critical-soft)", color: "var(--status-critical-text)", borderInlineStart: "3px solid var(--status-critical)" }}>
            {t("field.dashboard.serviceUnavailable", "Field data is temporarily unavailable (ERR-OPS-001). Try again.")}
          </div>
        </div>
        {nav}
      </>
    );
  }

  const tasks = (asg as unknown as Assignment[] ?? [])
    .map(a => a.visits)
    .filter((v): v is VisitRow => !!v && !!v.factories && ["published", "expired"].includes(v.planning_status))
    .filter(v => !isTestFixtureEstablishment(v.factories));

  const selected = tasks.find(v => v.id === params.task) ?? tasks[0] ?? null;
  const activeReg: RegChip = (REG_CHIPS as readonly string[]).includes(params.reg ?? "")
    ? (params.reg as RegChip) : "activities";
  const pane = params.task ? styles.paneDetail : styles.paneList;

  // status tone: expired planning wins; otherwise map the operational state.
  // Uses SAQEEL DS badge classes (badge-compliant/warning/critical/info).
  const statusTone = (v: VisitRow) => {
    if (v.planning_status === "expired") return "badge-warning";
    switch (v.operational_state) {
      case "submitted": case "approved": case "completed": case "closed": return "badge-compliant";
      case "cancelled": case "rejected": return "badge-critical";
      case "in_progress": case "arrived": case "checked_in": case "started": return "badge-info";
      default: return "badge-info";
    }
  };
  const statusLabel = (v: VisitRow) => (v.planning_status === "expired" ? label("expired") : label(v.operational_state));

  // Resolve the selected visit's factory -> industrial license -> CR, then load
  // the shared dossier. Identical resolution to /field/establishments.
  const permissions = selected?.factory_id ? await resolveFactory360Permissions(sb) : null;
  let dossier: Awaited<ReturnType<typeof loadFactory360Dossier>> | null = null;
  if (selected?.factory_id && permissions?.["view_factory_360"]) {
    const { data: licRows } = await sb.from("industrial_licenses")
      .select("id, commercial_registration_id, license_number")
      .eq("factory_id", selected.factory_id)
      .order("license_number");
    const lic = (licRows ?? []).find(r => (r as { commercial_registration_id: string | null }).commercial_registration_id) as
      { id: string; commercial_registration_id: string } | undefined;
    if (lic?.commercial_registration_id) {
      dossier = await loadFactory360Dossier(sb, lic.commercial_registration_id, lic.id, permissions);
    }
  }

  const cr = dossier?.cr ?? null;
  const factory = dossier?.factory ?? null;
  const selLicense = dossier?.selected ?? null;
  const address = dossier?.address ?? null;
  const lines = (dossier?.lines ?? []) as LineFlags[];
  const currentCompliance = dossier?.currentCompliance;

  const crTitle = cr
    ? (locale === "ar" ? cr.legal_name_ar ?? cr.legal_name ?? cr.legal_name_en ?? cr.cr_number
      : cr.legal_name_en ?? cr.legal_name ?? cr.legal_name_ar ?? cr.cr_number)
    : selected?.factories?.name ?? "—";

  const investment = selLicense?.investment_size != null
    ? new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(selLicense.investment_size)
    : "—";

  const addressText = address
    ? [address.address_line_1, locale === "ar" ? address.street_name_ar : address.street_name_en,
       locale === "ar" ? address.city_ar : address.city_en, locale === "ar" ? address.region_ar : address.region_en]
      .filter(Boolean).join(" · ") || "—"
    : "—";

  const lat = factory?.official_lat ?? selected?.factories?.official_lat ?? null;
  const lng = factory?.official_lng ?? selected?.factories?.official_lng ?? null;

  const showLineName = (row: LineFlags) => (locale === "ar" ? row.name_ar ?? row.name_en ?? "—" : row.name_en ?? row.name_ar ?? "—");
  const lineCard = (row: LineFlags): RegCard => ({
    title: showLineName(row),
    lines: [
      [tr("field.myTasks.hs", "HS / activity", "الترميز / النشاط"), text(row.hs_code ?? row.activity_code)],
      [tr("field.myTasks.qty", "Qty / capacity", "الكمية / الطاقة"), `${text(row.quantity)} / ${text(row.capacity)}`],
    ],
  });

  // Every card is built strictly from real, RLS-scoped dossier data. Chips with
  // no governed backing (contacts, manufacturing-status) resolve to an empty
  // array and render the governed "no records" state — never invented rows.
  const regCards: RegCard[] = (() => {
    if (!dossier) return [];
    switch (activeReg) {
      case "machines":
        return lines.filter(l => l.is_machine).map(lineCard);
      case "products":
        return lines.filter(l => l.is_end_product).map(lineCard);
      case "raw":
        return lines.filter(l => l.is_raw_material).map(lineCard);
      case "activities": {
        const withActivity = lines.filter(l => l.activity_code);
        if (withActivity.length) return withActivity.map(l => ({
          title: (locale === "ar" ? l.activity_name_ar ?? l.activity_name_en : l.activity_name_en ?? l.activity_name_ar) ?? showLineName(l),
          lines: [[tr("field.myTasks.activityNo", "Activity code", "رمز النشاط"), text(l.activity_code)]],
        }));
        return factory?.activity_class
          ? [{ title: label(factory.activity_class), lines: [[tr("field.myTasks.activityClass", "Activity class", "تصنيف النشاط"), label(factory.activity_class)]] }]
          : [];
      }
      case "documents":
        return dossier.docs.map(doc => ({
          title: doc.title,
          lines: [
            [tr("common.type", "Type", "النوع"), label(doc.business_category ?? doc.doc_type)],
            [tr("common.reference", "Reference", "المرجع"), text(doc.reference_no)],
            [tr("field.myTasks.validTo", "Valid to", "ساري حتى"), dt(doc.valid_to)],
          ],
        }));
      case "license": {
        const cards: RegCard[] = [];
        if (selLicense) cards.push({
          title: tr("field.myTasks.licenseCert", "Industrial license certificate", "شهادة الترخيص الصناعي"),
          lines: [
            [tr("field.myTasks.licenseNumber", "License number", "رقم الرخصة"), text(selLicense.license_number)],
            [tr("field.myTasks.expiryDate", "Expiry date", "تاريخ الانتهاء"), dt(selLicense.expiry_date)],
          ],
        });
        for (const rec of dossier.government) cards.push({
          title: text(rec.title ?? rec.record_type),
          lines: [
            [tr("common.reference", "Reference", "المرجع"), text(rec.external_record_id)],
            [tr("common.status", "Status", "الحالة"), label(rec.status)],
          ],
        });
        return cards;
      }
      // manufacturing status & contacts have no governed source contract here.
      default:
        return [];
    }
  })();

  const regChipLabel: Record<RegChip, string> = {
    activities: tr("field.myTasks.reg.activities", "Factory Activities", "أنشطة المصنع"),
    manufacturing: tr("field.myTasks.reg.manufacturing", "Manufacturing Status", "حالات التصنيع"),
    contacts: tr("field.myTasks.reg.contacts", "Contacts", "جهات الاتصال"),
    machines: tr("field.myTasks.reg.machines", "Machines", "الآلات"),
    products: tr("field.myTasks.reg.products", "Products", "المنتجات"),
    raw: tr("field.myTasks.reg.raw", "Raw Materials", "المواد الأولية"),
    documents: tr("field.myTasks.reg.documents", "Documents", "الوثائق"),
    license: tr("field.myTasks.reg.license", "License Documents", "وثائق الرخصة"),
  };

  // Start-visit wiring — identical to the dashboard's resolved start href:
  // resume the real inspection if one is under way, else open the governed
  // visit startup/check-in route. No invented route.
  const startHref = selected
    ? (selected.inspections && selected.inspections.status !== "not_started"
        ? `/field/inspection/${selected.inspections.id}`
        : `/field/${selected.id}`)
    : "/field#visits";
  const remoteHref = selected ? `/field/${selected.id}` : "/field#visits";

  const backBtn = selected ? (
    <Link href="/field/my-tasks" prefetch={false} className={`btn btn-icon btn-ghost ${styles.back}`}
      aria-label={tr("common.back", "Back", "رجوع")}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" data-directional><path d="m9 6 6 6-6 6" /></svg>
    </Link>
  ) : undefined;

  return (
    <>
      <FieldHeader
        leading={backBtn}
        title={tr("field.myTasks.title", "My Tasks", "مهامي")}
        subtitle={tr("field.myTasks.sub", "Tasks assigned to you · authority-scoped", "المهام المسندة إليك · نطاق محكوم بالصلاحية")}
        langHref={langHref} langLabel={langLabel}
      />
      <div className={`${styles.grid} ${pane}`}>
        {/* LEFT — assigned task list */}
        <div className={styles.list}>
          {tasks.length === 0 ? (
            <div style={{ padding: 20 }}>
              <div style={{ fontWeight: 600, marginBlockEnd: 6 }}>{tr("field.myTasks.empty", "No assigned tasks", "لا توجد مهام مسندة")}</div>
              <p className="t-caption">{tr("field.myTasks.emptyBody", "Only your own assignments appear here (RBAC-009). New assignments arrive with a notification.", "تظهر هنا مهامك المسندة فقط (RBAC-009). تصل المهام الجديدة مع إشعار.")}</p>
            </div>
          ) : tasks.map(v => (
            <Link key={v.id} href={`/field/my-tasks?task=${v.id}`} prefetch={false}
              className={`${styles.item} ${selected?.id === v.id ? styles.itemActive : ""}`}
              aria-current={selected?.id === v.id ? "true" : undefined}>
              <span className={styles.kv} style={{ flex: 1 }}>
                <span className="id-code" style={{ fontSize: 12, color: "var(--text-muted)" }}>#{v.id.slice(0, 8)}</span>
                <span className="v" style={{ fontWeight: 600, fontSize: "14.5px" }}><bdi>{v.factories?.name ?? "—"}</bdi></span>
                <span className="k">{dt(v.window_start)}</span>
              </span>
              <span className={`badge ${statusTone(v)}`} style={{ height: 20 }}>{statusLabel(v)}</span>
            </Link>
          ))}
        </div>

        {/* RIGHT — selected task establishment detail */}
        <div className={styles.detail}>
          {!selected ? (
            <div style={{ padding: 20 }}>
              <div style={{ fontWeight: 600, marginBlockEnd: 6 }}>{tr("field.myTasks.selectPrompt", "Select a task", "اختر مهمة")}</div>
              <p className="t-caption">{tr("field.myTasks.selectBody", "Pick a task from the list to see the establishment dossier.", "اختر مهمة من القائمة لعرض ملف المنشأة.")}</p>
            </div>
          ) : (
            <>
              <div className={styles.hero} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ width: 40, height: 40 }}>
                  <path d="M3 21V10l7 4v-4l7 4V6l4-2v17" /><path d="M3 21h18" />
                </svg>
              </div>

              {!dossier ? (
                <div className={styles.sec}>
                  <div className={styles.secHead}>
                    <h3 style={{ margin: 0 }}><bdi>{crTitle}</bdi></h3>
                  </div>
                  <p className="t-caption">{tr(
                    "field.myTasks.noDossier",
                    "The full establishment dossier is unavailable until a commercial-registration/licence mapping exists for this factory, or Factory 360 access is granted.",
                    "ملف المنشأة الكامل غير متاح حتى يتوفر ربط بالسجل التجاري/الترخيص لهذا المصنع أو تُمنح صلاحية المصنع 360.",
                  )}</p>
                  <dl className={styles.row2} style={{ marginBlockStart: 16 }}>
                    <div className={styles.kv}><dt className="k">{tr("field.myTasks.window", "Visit window", "نافذة الزيارة")}</dt><dd className="v id-code">{dt(selected.window_start)}</dd></div>
                    <div className={styles.kv}><dt className="k">{tr("field.myTasks.factoryCode", "Factory code", "رمز المصنع")}</dt><dd className="v"><bdi>{text(selected.factories?.factory_code)}</bdi></dd></div>
                  </dl>
                </div>
              ) : (
                <>
                  {/* 1 — Establishment Data */}
                  <div className={styles.sec}>
                    <div className={styles.secHead}>
                      <h3 style={{ margin: 0 }}>{tr("field.myTasks.estData", "Establishment Data", "بيانات المنشأة")}</h3>
                      <span className="badge badge-info">{tr("field.myTasks.licensedEst", "Licensed establishment", "منشأة مرخصة")}</span>
                    </div>
                    <div className={styles.title}><bdi>{crTitle}</bdi></div>
                    <dl className={styles.row2}>
                      <div className={styles.kv}><dt className="k">{tr("field.myTasks.regNumber", "Registration no.", "رقم السجل")}</dt><dd className="v id-code"><bdi>{text(cr?.cr_number)}</bdi></dd></div>
                      <div className={styles.kv}><dt className="k">{tr("field.myTasks.phone", "Phone", "رقم الهاتف")}</dt><dd className="v id-code">—</dd></div>
                      <div className={styles.kv}><dt className="k">{tr("field.myTasks.investment", "Investment size", "حجم الاستثمار")}</dt><dd className="v"><bdi>{investment}</bdi></dd></div>
                      <div className={styles.kv}><dt className="k">{tr("field.myTasks.requestDate", "Request created on", "تاريخ إنشاء الطلب")}</dt><dd className="v id-code">{dt(cr?.issue_date)}</dd></div>
                      <div className={styles.kv}><dt className="k">{tr("field.myTasks.estType", "Establishment type", "نوع المنشأة")}</dt><dd className="v">{tr("field.myTasks.factory", "Factory", "مصنع")}</dd></div>
                      <div className={styles.kv}><dt className="k">{tr("field.myTasks.estStatus", "Establishment status", "حالة المنشأة")}</dt><dd className="v">{label(cr?.status)}</dd></div>
                    </dl>
                  </div>

                  {/* 2 — Evaluation Indicators */}
                  <div className={styles.sec}>
                    <h3>{tr("field.myTasks.evalIndicators", "Evaluation Indicators", "مؤشرات التقييم")}</h3>
                    <dl className={styles.row2}>
                      <div className={styles.kv}>
                        <dt className="k">{tr("field.myTasks.complianceRate", "Compliance rate", "نسبة الامتثال")}</dt>
                        <dd className="v id-code">{currentCompliance?.rate == null ? t("f360.compliance.notAvailable", "Not Available") : `${currentCompliance.rate}%`}</dd>
                      </div>
                      <div className={styles.kv}>
                        <dt className="k">{tr("field.myTasks.riskScore", "Risk score", "درجة الخطورة")}</dt>
                        <dd>
                          {permissions?.["view_risk_details"]
                            ? <span className={`badge ${factory?.risk_band === "high" ? "badge-critical" : factory?.risk_band === "medium" ? "badge-warning" : factory?.risk_band ? "badge-compliant" : "badge-outline"}`}>{text(factory?.risk_score)}{factory?.risk_band ? ` · ${label(factory.risk_band)}` : ""}</span>
                            : <span className="badge badge-outline">{t("f360.restricted", "restricted")}</span>}
                        </dd>
                      </div>
                    </dl>
                    <p className="t-caption" style={{ marginBlockStart: 10 }}>
                      {tr("field.myTasks.healthRiskNote", "Health score and risk score are separate, governed concepts.", "درجة الصحة ودرجة الخطورة مفهومان منفصلان محكومان.")}
                    </p>
                  </div>

                  {/* 3 — License Data */}
                  <div className={styles.sec}>
                    <h3>{tr("field.myTasks.licenseData", "License Data", "بيانات الترخيص")}</h3>
                    <dl className={styles.row2}>
                      <div className={styles.kv}><dt className="k">{tr("field.myTasks.licenseType", "License type", "نوع الترخيص")}</dt><dd className="v">{label(selLicense?.license_type)}</dd></div>
                      <div className={styles.kv}><dt className="k">{tr("field.myTasks.licenseStatus", "License status", "حالة الترخيص")}</dt><dd><span className="badge badge-compliant">{label(selLicense?.status)}</span></dd></div>
                      <div className={styles.kv}><dt className="k">{tr("field.myTasks.expiryDate", "Expiry date", "تاريخ الانتهاء")}</dt><dd className="v id-code">{dt(selLicense?.expiry_date)}</dd></div>
                      <div className={styles.kv}><dt className="k">{tr("field.myTasks.licenseNumber", "License number", "رقم الرخصة")}</dt><dd className="v id-code"><bdi>{text(selLicense?.license_number)}</bdi></dd></div>
                      <div className={styles.kv}><dt className="k">{tr("field.myTasks.region", "Region", "المنطقة")}</dt><dd className="v">{label(factory?.region)}</dd></div>
                      <div className={styles.kv}><dt className="k">{tr("field.myTasks.city", "City", "المدينة")}</dt><dd className="v">{label(factory?.city)}</dd></div>
                    </dl>
                  </div>

                  {/* 4 — Visit Location */}
                  <div className={styles.sec}>
                    <h3>{tr("field.myTasks.visitLocation", "Visit Location", "موقع الزيارة")}</h3>
                    <div className={styles.kv} style={{ marginBlockEnd: 12 }}>
                      <span className="k">{tr("field.myTasks.address", "Address", "العنوان")}</span>
                      <span className="v"><bdi>{addressText}</bdi></span>
                    </div>
                    <div className={styles.map}>
                      {lat != null && lng != null ? (
                        <FieldLocationMap lat={lat} lng={lng} label={factory?.name ?? crTitle} />
                      ) : (
                        <>
                          <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(var(--border-subtle) 1px, transparent 1px)", backgroundSize: "22px 22px", opacity: 0.6 }} />
                          <span className="t-caption" style={{ position: "relative" }}>{tr("field.myTasks.locUnavailable", "Official location unavailable", "الموقع الرسمي غير متاح")}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 5 — Regulatory Data */}
                  <div className={styles.sec}>
                    <h3>{tr("field.myTasks.regData", "Regulatory Data", "البيانات التنظيمية")}</h3>
                    <div className={styles.chiprow}>
                      {REG_CHIPS.map(chip => (
                        <Link key={chip} href={`/field/my-tasks?task=${selected.id}&reg=${chip}`} prefetch={false}
                          className={`${styles.chip} ${activeReg === chip ? styles.chipActive : ""}`}
                          aria-pressed={activeReg === chip ? "true" : "false"}>
                          {regChipLabel[chip]}
                        </Link>
                      ))}
                    </div>
                    {regCards.length === 0 && NO_SOURCE_CHIPS.includes(activeReg) ? (
                      <div className={styles.regstack}>
                        <div className={styles.regcard}>
                          <span className="badge badge-pending"><span className="dot" />{tr("field.myTasks.noSourceTag", "No governed source", "لا يوجد مصدر محكوم")}</span>
                          <p className="t-caption" style={{ marginBlockStart: 8 }}>
                            {tr("field.myTasks.noSource", "No governed source connected yet for", "لا يوجد مصدر محكوم متصل بعد لـ")} <bdi>{regChipLabel[activeReg]}</bdi>
                          </p>
                        </div>
                      </div>
                    ) : regCards.length === 0 ? (
                      <p className="t-caption">{tr("field.myTasks.noRecords", "No source-backed records are available in your scope for this section.", "لا توجد سجلات من مصدر موثوق ضمن نطاقك لهذا القسم.")}</p>
                    ) : (
                      <div className={styles.regstack}>
                        {regCards.map((c, i) => (
                          <div key={i} className={styles.regcard}>
                            <div style={{ fontWeight: 600, fontSize: 14, marginBlockEnd: 8 }}><bdi>{c.title}</bdi></div>
                            <dl className={styles.row2}>
                              {c.lines.map(([k, val], j) => (
                                <div key={j} className={styles.kv}><dt className="k">{k}</dt><dd className="v"><bdi>{val}</bdi></dd></div>
                              ))}
                            </dl>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* 6 — Sticky action bar */}
              <div className={styles.actionbar} role="group" aria-label={t("common.actions", "Actions")}>
                <a className="btn btn-secondary" style={{ flex: 1 }} href={remoteHref}>
                  {tr("field.myTasks.startRemote", "Start remote visit", "بدء زيارة عن بُعد")}
                </a>
                <a className="btn btn-primary" style={{ flex: 1 }} href={startHref}>
                  {tr("field.myTasks.startVisit", "Start visit execution", "بدء تنفيذ الزيارة")}
                </a>
              </div>
            </>
          )}
        </div>
      </div>
      {/* No local nav spacer: FieldNav is position:fixed and renders its own
          .field-nav-spacer. Keeping the design's static 58px div here shrank
          the master/detail grid and floated the action bar above the tab bar. */}
      {nav}
    </>
  );
}
