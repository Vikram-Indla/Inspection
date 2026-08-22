# -*- coding: utf-8 -*-
"""Generate the compliance reference library the training cohort needs.

The accepted seed in 0003_seed_contract_data.sql carries 1 regulation, 4 clauses,
5 inspection items and 3 violation codes. The 142-item package the cohort assumes
does not exist. This builds it.

Issuing authorities are the real Saudi bodies that regulate industrial facilities,
because an inspector must see the correct authority on a finding. Clause titles and
item wording are SYNTHETIC and marked as such — no real clause text is reproduced.

Writes regulations.csv, clauses.csv, inspection_items.csv, violation_codes.csv,
penalty_mappings.csv, compliance-preview.json.
"""
import csv, json, hashlib
from collections import Counter

def h(*p): return int(hashlib.sha256("|".join(map(str,p)).encode()).hexdigest()[:8], 16)

# (code, authority_en, authority_ar, domain, regulations[(code, title_en, title_ar)])
AUTHORITIES = [
 ("SBC","Saudi Building Code National Committee","اللجنة الوطنية لكود البناء السعودي","fire_and_structure",[
   ("SBC-801","Fire Protection Requirements — Industrial","متطلبات الحماية من الحريق — صناعي"),
   ("SBC-201","Structural Loads and Integrity","الأحمال الإنشائية وسلامة المنشأ")]),
 ("HCIS","High Commission for Industrial Security","الهيئة العليا للأمن الصناعي","industrial_security",[
   ("HCIS-SEC-01","Physical Security of Industrial Facilities","الأمن المادي للمنشآت الصناعية"),
   ("HCIS-PRO-04","Process Safety Management","إدارة سلامة العمليات")]),
 ("CD","Directorate General of Civil Defence","المديرية العامة للدفاع المدني","emergency_readiness",[
   ("CD-EMR-11","Emergency Egress and Evacuation","مخارج الطوارئ والإخلاء"),
   ("CD-HAZ-06","Hazardous Materials Storage","تخزين المواد الخطرة")]),
 ("SFDA","Saudi Food and Drug Authority","الهيئة العامة للغذاء والدواء","food_and_drug",[
   ("SFDA-GMP-02","Good Manufacturing Practice — Food","ممارسات التصنيع الجيدة — الغذاء"),
   ("SFDA-HYG-05","Facility Hygiene and Pest Control","نظافة المنشأة ومكافحة الآفات")]),
 ("SASO","Saudi Standards, Metrology and Quality Organization","الهيئة السعودية للمواصفات والمقاييس والجودة","standards_and_metrology",[
   ("SASO-QMS-03","Quality Management and Traceability","إدارة الجودة والتتبع"),
   ("SASO-MET-07","Measuring Instrument Calibration","معايرة أجهزة القياس")]),
 ("NCEC","National Center for Environmental Compliance","المركز الوطني للرقابة على الالتزام البيئي","environment",[
   ("NCEC-EMS-01","Emissions and Effluent Control","التحكم في الانبعاثات والمخلفات السائلة"),
   ("NCEC-WST-04","Industrial Waste Handling","إدارة النفايات الصناعية")]),
 ("MHRSD","Ministry of Human Resources and Social Development","وزارة الموارد البشرية والتنمية الاجتماعية","occupational_safety",[
   ("MHRSD-OSH-09","Occupational Safety and Health","السلامة والصحة المهنية"),
   ("MHRSD-WRK-02","Worker Accommodation and Welfare","سكن العمال والرعاية")]),
 ("MIM","Ministry of Industry and Mineral Resources","وزارة الصناعة والثروة المعدنية","industrial_licensing",[
   ("MIM-LIC-01","Industrial Licence Conditions","شروط الترخيص الصناعي"),
   ("MIM-PRD-03","Declared Production Lines and Capacity","خطوط الإنتاج والطاقة المعلنة")]),
 ("MOMRAH","Ministry of Municipal and Rural Affairs and Housing","وزارة الشؤون البلدية والقروية والإسكان","municipal",[
   ("MOMRAH-MUN-05","Municipal Operating Permit","رخصة التشغيل البلدية")]),
]

# Clause themes per domain — each becomes a clause, then 4-9 checklist items.
THEMES = {
 "fire_and_structure":[("Portable fire extinguisher provision and servicing","توفير وصيانة طفايات الحريق اليدوية"),
   ("Fixed suppression system readiness","جاهزية أنظمة الإطفاء الثابتة"),
   ("Fire detection and alarm coverage","تغطية أنظمة كشف الحريق والإنذار"),
   ("Structural fire separation and compartmentation","الفصل الإنشائي ضد الحريق"),
   ("Load-bearing element condition","حالة العناصر الحاملة")],
 "industrial_security":[("Perimeter control and access points","التحكم في المحيط ونقاط الدخول"),
   ("Access authorisation records","سجلات تصاريح الدخول"),
   ("Surveillance coverage of critical areas","تغطية المراقبة للمناطق الحرجة"),
   ("Process hazard analysis currency","حداثة تحليل مخاطر العمليات"),
   ("Management of change records","سجلات إدارة التغيير")],
 "emergency_readiness":[("Exit route availability and signage","توفر مسارات الخروج واللوحات الإرشادية"),
   ("Assembly point designation","تحديد نقاط التجمع"),
   ("Evacuation drill records","سجلات تمارين الإخلاء"),
   ("Hazardous material segregation by class","فصل المواد الخطرة حسب الفئة"),
   ("Safety data sheet availability","توفر صحائف بيانات السلامة")],
 "food_and_drug":[("Personnel hygiene controls","ضوابط النظافة الشخصية للعاملين"),
   ("Production area cleaning verification","التحقق من نظافة مناطق الإنتاج"),
   ("Cold chain temperature records","سجلات درجات حرارة سلسلة التبريد"),
   ("Pest control programme evidence","إثبات برنامج مكافحة الآفات"),
   ("Batch traceability records","سجلات تتبع التشغيلات")],
 "standards_and_metrology":[("Quality management documentation","توثيق إدارة الجودة"),
   ("Product conformity marking","علامات مطابقة المنتج"),
   ("Instrument calibration certificates","شهادات معايرة الأجهزة"),
   ("Calibration interval adherence","الالتزام بفترات المعايرة")],
 "environment":[("Stack emission monitoring records","سجلات مراقبة انبعاثات المداخن"),
   ("Effluent discharge compliance","الالتزام بتصريف المخلفات السائلة"),
   ("Waste segregation at source","فصل النفايات من المصدر"),
   ("Licensed waste contractor manifests","بيانات مقاولي النفايات المرخصين")],
 "occupational_safety":[("Personal protective equipment provision","توفير معدات الوقاية الشخصية"),
   ("Machine guarding condition","حالة حواجز حماية الآلات"),
   ("Incident reporting records","سجلات الإبلاغ عن الحوادث"),
   ("First aid provision and training","الإسعافات الأولية والتدريب"),
   ("Worker accommodation standards","معايير سكن العمال")],
 "industrial_licensing":[("Licence validity and displayed copy","سريان الترخيص والنسخة المعروضة"),
   ("Activity matches licensed scope","مطابقة النشاط لنطاق الترخيص"),
   ("Declared production capacity accuracy","دقة الطاقة الإنتاجية المعلنة"),
   ("Raw material declarations","إقرارات المواد الخام")],
 "municipal":[("Municipal permit validity","سريان الرخصة البلدية"),
   ("Site boundary and signage compliance","الالتزام بحدود الموقع واللوحات")],
}
ITEM_FORMS = [
 ("{t} — current and verifiable","{a} — سارٍ وقابل للتحقق"),
 ("{t} — records available on site","{a} — السجلات متوفرة في الموقع"),
 ("{t} — no observed defect","{a} — لا توجد مخالفة ملحوظة"),
 ("{t} — responsible person identified","{a} — تحديد الشخص المسؤول"),
 ("{t} — matches approved documentation","{a} — مطابق للوثائق المعتمدة"),
 ("{t} — inspected within required interval","{a} — تم فحصه خلال الفترة المطلوبة"),
 ("{t} — corrective actions closed","{a} — إغلاق الإجراءات التصحيحية"),
 ("{t} — accessible and unobstructed","{a} — يمكن الوصول إليه دون عوائق"),
 ("{t} — labelled in Arabic and English","{a} — موسوم بالعربية والإنجليزية"),
]
SEVERITY = ["L1","L2","L3"]

regs, clauses, items, vcodes, pmaps = [], [], [], [], []
TARGET_ITEMS = 142
for auth_code, auth_en, auth_ar, domain, rlist in AUTHORITIES:
    for rcode, rt_en, rt_ar in rlist:
        regs.append({"regulation_code":rcode,"title_en":rt_en,"title_ar":rt_ar,
            "issuing_authority_code":auth_code,"issuing_authority_en":auth_en,
            "issuing_authority_ar":auth_ar,"domain":domain,"status":"published",
            "content_origin":"synthetic — authority is real, clause wording is not"})
        for ci,(ct_en, ct_ar) in enumerate(THEMES[domain], start=1):
            cref = f"{ci}.{1 + (h(rcode,ci) % 8)}"
            cid = f"{rcode}-{cref}"
            clauses.append({"clause_id":cid,"regulation_code":rcode,"clause_ref":cref,
                "title_en":ct_en,"title_ar":ct_ar,"issuing_authority_code":auth_code,
                "applicability":"all industrial establishments" if ci % 3 else "condition-specific",
                "legal_source":f"{rcode} §{cref}"})

# Distribute 142 items evenly across clauses, deterministically.
per = TARGET_ITEMS // len(clauses); extra = TARGET_ITEMS - per * len(clauses)
seq = 0
for idx, c in enumerate(clauses):
    count = per + (1 if idx < extra else 0)
    for k in range(count):
        seq += 1
        fe, fa = ITEM_FORMS[(h(c["clause_id"], k) % len(ITEM_FORMS))]
        items.append({
            "item_code": f"{c['issuing_authority_code']}-{seq:03d}",
            "clause_id": c["clause_id"], "regulation_code": c["regulation_code"],
            "issuing_authority_code": c["issuing_authority_code"],
            "title_en": fe.format(t=c["title_en"]), "title_ar": fa.format(a=c["title_ar"]),
            "response_model": "compliant|non_compliant|na",
            "evidence_rule": "photo required on non_compliant",
            "score_weight": 3 + (h("w", c["clause_id"], k) % 6),
            "active": "true"})

# One violation code per clause that can produce one; penalty mapping where a
# schedule is approved. Amounts are NOT invented — the schedule reference is.
for i, c in enumerate(clauses):
    if i % 2: continue
    vc = f"V-{c['issuing_authority_code']}-{i//2 + 1:02d}"
    vcodes.append({"violation_code":vc,"title_en":c["title_en"] + " — breach",
        "title_ar":c["title_ar"] + " — مخالفة","level":SEVERITY[h("s", vc) % 3],
        "clause_id":c["clause_id"],"regulation_code":c["regulation_code"],
        "issuing_authority_code":c["issuing_authority_code"],"active_from":"2026-01-01"})
    if h("p", vc) % 3:
        pmaps.append({"violation_code":vc,"penalty_ref":f"P-{h('pr', vc) % 900 + 100}",
            "penalty_schedule":"approved schedule — amount not reproduced here",
            "repeat_rule":"repeat within 12 months escalates one level",
            "legal_basis":c["legal_source"],"mapping_version":"v3"})

for name, rows in [("regulations.csv",regs),("clauses.csv",clauses),("inspection_items.csv",items),
                   ("violation_codes.csv",vcodes),("penalty_mappings.csv",pmaps)]:
    with open(name,"w",encoding="utf-8",newline="") as fh:
        w=csv.DictWriter(fh,fieldnames=list(rows[0].keys())); w.writeheader(); w.writerows(rows)

by_auth = Counter(i["issuing_authority_code"] for i in items)
prev = {
 "authorities": len(AUTHORITIES), "regulations": len(regs), "clauses": len(clauses),
 "items": len(items), "violation_codes": len(vcodes), "penalty_mappings": len(pmaps),
 "items_by_authority": dict(sorted(by_auth.items(), key=lambda kv: -kv[1])),
 "authority_rows": [{"code":a[0],"en":a[1],"ar":a[2],"domain":a[3],
    "regulations":len(a[4]),"items":by_auth[a[0]]} for a in AUTHORITIES],
 "sample_items": items[:6], "sample_violations": vcodes[:6], "sample_clauses": clauses[:5],
}
json.dump(prev, open("compliance-preview.json","w",encoding="utf-8"), indent=1, ensure_ascii=False)
print(f"authorities {len(AUTHORITIES)} · regulations {len(regs)} · clauses {len(clauses)}")
print(f"items {len(items)} · violation codes {len(vcodes)} · penalty mappings {len(pmaps)}")
print("items by authority:", dict(sorted(by_auth.items(), key=lambda kv:-kv[1])))
assert len(items) == TARGET_ITEMS, f"item count {len(items)} != {TARGET_ITEMS}"
assert len({i["item_code"] for i in items}) == len(items), "duplicate item_code"
print(f"OK — exactly {TARGET_ITEMS} items, all codes unique, matches the cohort's package size")

# ---------------------------------------------------------------- config requests
# Approval Queue rows: change requests against the library above, at every step.
REQ_STATES = [("draft","Draft",4),("submitted","Awaiting review",7),
              ("under_review","Under review",5),("approved","Approved",6),
              ("rejected","Rejected",3),("published","Published",5)]
KINDS = ["Add checklist item","Amend clause wording","Retire violation code",
         "Change penalty mapping","Add regulation","Change evidence rule"]
reqs, rn = [], 0
for state, label, count in REQ_STATES:
    for k in range(count):
        rn += 1
        c = clauses[h("rq", state, k) % len(clauses)]
        reqs.append({
          "request_ref": f"CCR-2026-{rn:03d}", "kind": KINDS[h("kd", state, k) % len(KINDS)],
          "regulation_code": c["regulation_code"], "clause_ref": c["clause_ref"],
          "issuing_authority_code": c["issuing_authority_code"],
          "status": state, "status_label": label,
          "raised_by": f"admin{1 + (h('rb', state, k) % 5)}",
          "decided_by": f"admin{1 + (h('db', state, k) % 5)}" if state in ("approved","rejected","published") else "",
          "raised_on": f"2026-0{1 + (h('rd', state, k) % 8)}-{1 + (h('rd2', state, k) % 27):02d}",
          "components": 1 + (h("cp", state, k) % 4),
        })
with open("config_requests.csv","w",encoding="utf-8",newline="") as fh:
    w=csv.DictWriter(fh,fieldnames=list(reqs[0].keys())); w.writeheader(); w.writerows(reqs)
prev["config_requests"] = {"total": len(reqs),
  "by_status": {s: sum(1 for r in reqs if r["status"] == s) for s, _, _ in REQ_STATES},
  "rows": reqs}
json.dump(prev, open("compliance-preview.json","w",encoding="utf-8"), indent=1, ensure_ascii=False)
print(f"config requests {len(reqs)} across {len(REQ_STATES)} states")
