# -*- coding: utf-8 -*-
"""Generate the establishment master for the MIM Inspection test-data pack.

Source of truth for identifier formats and coordinates: RESEARCH-PROVENANCE.md.
Every establishment is fictitious. factory_code is identity and is immutable —
renaming a factory never detaches its licence, geofence or journeys.

Run:  python3 build_factories.py
"""
import csv

# (site_key): city_en, city_ar, locality, lat, lng, coord_confidence
SITES = {
 # ---- Riyadh region (verified anchors, see provenance §4)
 "R1": ("Riyadh 1st Industrial City","المدينة الصناعية الأولى بالرياض","Al Malaz, Riyadh",24.6650,46.7420,"district"),
 "R2": ("Riyadh 2nd Industrial City","المدينة الصناعية الثانية بالرياض","Km 17 Al Kharj Road, Riyadh",24.5444,46.8981,"verified"),
 "R3": ("Riyadh 3rd Industrial City","المدينة الصناعية الثالثة بالرياض","South Riyadh, Al Kharj Road",24.1050,46.9800,"derived"),
 "SD": ("Sudair City for Industry and Business","مدينة سدير للصناعة والأعمال","Al Majmaah Governorate",25.4600,45.8400,"derived"),
 "KH": ("Al Kharj Industrial City","المدينة الصناعية بالخرج","Al Kharj Governorate",24.1550,47.3050,"derived"),
 # ---- Makkah
 "J1": ("Jeddah 1st Industrial City","المدينة الصناعية الأولى بجدة","Jeddah",21.4230,39.2660,"derived"),
 "J2": ("Jeddah 2nd Industrial City","المدينة الصناعية الثانية بجدة","Jeddah",21.3980,39.2830,"derived"),
 "MK": ("Makkah Industrial City","المدينة الصناعية بمكة المكرمة","Makkah",21.3891,39.8579,"derived"),
 "TF": ("Taif Industrial City","المدينة الصناعية بالطائف","Taif",21.2703,40.4158,"derived"),
 # ---- Eastern Province
 "D1": ("Dammam 1st Industrial City","المدينة الصناعية الأولى بالدمام","Dammam",26.4340,50.1030,"derived"),
 "D2": ("Dammam 2nd Industrial City","المدينة الصناعية الثانية بالدمام","Dammam",26.3520,50.0350,"derived"),
 "JB": ("Jubail Industrial City","مدينة الجبيل الصناعية","Jubail",27.0046,49.6461,"derived"),
 "AH": ("Al Ahsa Industrial City","المدينة الصناعية بالأحساء","Al Hofuf",25.3833,49.5833,"derived"),
 # ---- Madinah
 "MD": ("Madinah Industrial City","المدينة الصناعية بالمدينة المنورة","Madinah",24.4310,39.5980,"derived"),
 "YB": ("Yanbu Industrial City","مدينة ينبع الصناعية","Yanbu",24.0895,38.0618,"derived"),
 # ---- Qassim
 "QS": ("Qassim 2nd Industrial City","المدينة الصناعية الثانية بالقصيم","Buraydah",26.3260,43.9750,"derived"),
 "UN": ("Unaizah Industrial City","المدينة الصناعية بعنيزة","Unaizah",26.0843,43.9935,"derived"),
 # ---- Asir
 "AB": ("Abha Industrial City","المدينة الصناعية بأبها","Abha",18.2164,42.5053,"derived"),
 "KM": ("Khamis Mushait Industrial City","المدينة الصناعية بخميس مشيط","Khamis Mushait",18.3060,42.7297,"derived"),
 # ---- remaining regions
 "HL": ("Hail Industrial City","المدينة الصناعية بحائل","Hail",27.5114,41.7208,"derived"),
 "TB": ("Tabuk Industrial City","المدينة الصناعية بتبوك","Tabuk",28.3835,36.5662,"derived"),
 "JZ": ("Jazan Industrial City","المدينة الصناعية بجازان","Jazan",16.8892,42.5511,"derived"),
 "NJ": ("Najran Industrial City","المدينة الصناعية بنجران","Najran",17.4933,44.1277,"derived"),
 "BH": ("Al Baha Industrial City","المدينة الصناعية بالباحة","Al Baha",20.0129,41.4677,"derived"),
 "AR": ("Arar Industrial City","المدينة الصناعية بعرعر","Arar",30.9753,41.0381,"derived"),
 "WS": ("Waad Al Shamal Industrial City","مدينة وعد الشمال الصناعية","Turaif, Northern Borders",31.1500,39.0500,"derived"),
 "JF": ("Modon Oasis Al Jouf","واحة مدن بالجوف","Sakaka",29.9697,40.2064,"derived"),
}

REGION = {
 "R1":"Riyadh","R2":"Riyadh","R3":"Riyadh","SD":"Riyadh","KH":"Riyadh",
 "J1":"Makkah","J2":"Makkah","MK":"Makkah","TF":"Makkah",
 "D1":"Eastern","D2":"Eastern","JB":"Eastern","AH":"Eastern",
 "MD":"Madinah","YB":"Madinah",
 "QS":"Qassim","UN":"Qassim",
 "AB":"Asir","KM":"Asir",
 "HL":"Hail","TB":"Tabuk","JZ":"Jazan","NJ":"Najran","BH":"Al Baha",
 "AR":"Northern Borders","WS":"Northern Borders","JF":"Al Jouf",
}

# name_en, name_ar, site, activity_class, isic4, risk_band_seed, employees, stage, status
F = [
 # ---------------------------------------------------------------- Riyadh (30)
 ("Najd Advanced Plastics Factory","مصنع نجد للبلاستيك المتطور","R2","plastics","2220","medium",180,"operating","active"),
 ("Wadi Hanifah Food Industries","مصانع وادي حنيفة للصناعات الغذائية","R2","food","1079","low",240,"operating","active"),
 ("Al Yamamah Steel Fabrication","اليمامة لتشكيل المعادن","R2","steel","2410","high",320,"operating","active"),
 ("Riyadh Precision Machinery Works","الرياض للمعدات الدقيقة","R2","machinery","2819","medium",145,"operating","active"),
 ("Tuwaiq Chemical Products Co.","طويق للمنتجات الكيميائية","R2","chemical","2029","high",210,"operating","active"),
 ("Al Kharj Dairy Processing Plant","مصنع الخرج لمنتجات الألبان","KH","food","1050","low",410,"operating","active"),
 ("Sudair Pharmaceutical Industries","سدير للصناعات الدوائية","SD","pharmaceutical","2100","medium",260,"operating","active"),
 ("Sudair Building Materials Co.","سدير لمواد البناء","SD","building_materials","2395","medium",190,"operating","active"),
 ("Al Malaz Metal Workshop","ورشة الملز للمعادن","R1","steel","2599","low",42,"operating","active"),
 ("Al Batha Furniture Manufacturing","البطحاء لصناعة الأثاث","R1","furniture","3100","low",68,"operating","active"),
 ("Rawdah Packaging Solutions","الروضة لحلول التغليف","R2","packaging","1702","medium",155,"operating","active"),
 ("Diriyah Textile Mills","الدرعية لصناعة النسيج","R3","textiles","1312","medium",230,"operating","active"),
 ("Al Kharj Beverage Bottling Co.","الخرج لتعبئة المشروبات","KH","beverages","1104","low",175,"operating","active"),
 ("Nofa Aluminium Extrusions","نوفا لسحب الألمنيوم","R3","aluminium","2420","high",285,"operating","active"),
 ("Riyadh Cement Products Factory","الرياض لمنتجات الأسمنت","R3","building_materials","2395","medium",130,"operating","active"),
 ("Al Uyaynah Paper Converting","العيينة لتحويل الورق","R3","paper","1701","low",95,"operating","active"),
 ("Thumamah Electrical Cables Co.","الثمامة للكابلات الكهربائية","R2","electrical","2732","high",340,"operating","active"),
 ("Manfouhah Rubber Products","منفوحة للمنتجات المطاطية","R1","rubber","2219","medium",78,"operating","active"),
 ("Al Kharj Poultry Processing","الخرج لتصنيع الدواجن","KH","food","1010","high",520,"operating","active"),
 ("Sudair Solar Panel Assembly","سدير لتجميع الألواح الشمسية","SD","electrical","2710","low",165,"operating","active"),
 ("Al Ammariyah Glass Works","العمارية لصناعة الزجاج","R3","glass","2310","medium",205,"operating","active"),
 ("Shifa Medical Consumables Co.","الشفاء للمستلزمات الطبية","R2","medical_devices","3250","medium",120,"operating","active"),
 ("Riyadh Paints and Coatings","الرياض للدهانات والطلاءات","R2","chemical","2022","high",148,"operating","active"),
 ("Al Kharj Animal Feed Mills","مطاحن الخرج للأعلاف","KH","food","1080","low",88,"operating","active"),
 ("Sudair Cold Storage Industries","سدير لصناعات التبريد","SD","machinery","2825","medium",112,"operating","active"),
 ("Irqah Cosmetics Manufacturing","عرقة لصناعة مستحضرات التجميل","R1","chemical","2023","low",56,"operating","active"),
 ("Al Kharj Date Processing Factory","مصنع الخرج للتمور","KH","food","1030","low",74,"operating","active"),
 ("Riyadh Wire and Mesh Co.","الرياض للأسلاك والشبك","R3","steel","2593","medium",160,"operating","active"),
 ("Hair Industrial Gases Plant","الهير للغازات الصناعية","R3","chemical","2011","high",95,"expired","expired"),
 ("Sudair Auto Components Factory","سدير لمكونات المركبات","SD","automotive","2930","medium",275,"under_construction","pending"),
 # ---------------------------------------------------------------- Makkah (8)
 ("Al Balad Marine Foods Processing","البلد لتصنيع الأغذية البحرية","J1","food","1020","medium",310,"operating","active"),
 ("Obhur Plastic Packaging Co.","أبحر للتغليف البلاستيكي","J1","packaging","2220","low",145,"operating","active"),
 ("Bahrah Chemical Works","بحرة للصناعات الكيميائية","J2","chemical","2029","high",265,"operating","active"),
 ("Al Hamra Paper Mills","الحمراء لمطاحن الورق","J2","paper","1701","medium",190,"operating","active"),
 ("Hira Construction Products","حراء لمنتجات البناء","MK","building_materials","2395","medium",120,"operating","active"),
 ("Ajyad Bottled Water Plant","أجياد لتعبئة المياه","MK","beverages","1104","low",88,"operating","active"),
 ("Shafa Highland Fruit Processing","الشفا لتصنيع الفواكه","TF","food","1030","low",96,"operating","active"),
 ("Taif Rose Extracts Factory","مصنع ورد الطائف للمستخلصات","TF","chemical","2023","low",54,"operating","active"),
 # ---------------------------------------------------------- Eastern Province (8)
 ("Al Khobar Steel Structures","الخبر للمنشآت المعدنية","D1","steel","2511","high",380,"operating","active"),
 ("Qatif Marine Equipment Co.","القطيف للمعدات البحرية","D1","machinery","2811","medium",165,"operating","active"),
 ("Dhahran Industrial Valves Factory","الظهران لصناعة الصمامات","D2","machinery","2813","medium",210,"operating","active"),
 ("Half Moon Insulation Products","نصف القمر لمنتجات العزل","D2","building_materials","2399","low",102,"operating","active"),
 ("Jubail Polymer Compounding Co.","الجبيل لخلط البوليمرات","JB","petrochemical","2013","high",445,"operating","active"),
 ("Jubail Industrial Coatings Plant","الجبيل للطلاءات الصناعية","JB","chemical","2022","high",188,"operating","active"),
 ("Hofuf Date Packing Industries","الهفوف لتعبئة التمور","AH","food","1030","low",134,"operating","active"),
 ("Al Ahsa Poultry Feed Mills","الأحساء لمطاحن أعلاف الدواجن","AH","food","1080","medium",118,"operating","active"),
 # ---------------------------------------------------------------- Madinah (6)
 ("Quba Dates Processing Co.","قباء لتصنيع التمور","MD","food","1030","low",142,"operating","active"),
 ("Uhud Building Blocks Factory","أحد لمصنع البلوك","MD","building_materials","2395","low",76,"operating","active"),
 ("Madinah Printing and Binding Works","المدينة للطباعة والتجليد","MD","paper","1811","low",64,"operating","active"),
 ("Yanbu Petrochemical Support Industries","ينبع للصناعات البتروكيماوية المساندة","YB","petrochemical","2011","high",395,"operating","active"),
 ("Yanbu Marine Fabrication Yard","ينبع للتصنيع البحري","YB","steel","2511","medium",225,"operating","active"),
 ("Red Sea Desalination Components Co.","البحر الأحمر لمكونات التحلية","YB","machinery","2819","medium",158,"under_construction","pending"),
 # ----------------------------------------------------------------- Qassim (5)
 ("Buraydah Grain Milling Co.","بريدة لمطاحن الحبوب","QS","food","1061","low",186,"operating","active"),
 ("Qassim Agricultural Equipment Works","القصيم للمعدات الزراعية","QS","machinery","2821","medium",148,"operating","active"),
 ("Uyun Al Jawa Plastic Pipes Factory","عيون الجواء لأنابيب البلاستيك","QS","plastics","2220","medium",112,"operating","active"),
 ("Unaizah Dairy Products Plant","عنيزة لمنتجات الألبان","UN","food","1050","low",204,"operating","active"),
 ("Unaizah Metal Containers Co.","عنيزة للعبوات المعدنية","UN","steel","2592","low",82,"operating","active"),
 # ------------------------------------------------------------------- Asir (5)
 ("Abha Highland Water Bottling","أبها لتعبئة مياه المرتفعات","AB","beverages","1104","low",94,"operating","active"),
 ("Asir Honey Processing Co.","عسير لتصنيع العسل","AB","food","1079","low",38,"operating","active"),
 ("Khamis Mushait Concrete Products","خميس مشيط لمنتجات الخرسانة","KM","building_materials","2395","medium",126,"operating","active"),
 ("Sarawat Furniture Industries","السروات لصناعة الأثاث","KM","furniture","3100","low",71,"operating","active"),
 ("Asir Leather Tanning Works","عسير لدباغة الجلود","KM","leather","1511","high",58,"suspended","suspended"),
 # ------------------------------------------------------- remaining regions (10)
 ("Hail Cement Additives Factory","حائل لإضافات الأسمنت","HL","building_materials","2394","medium",108,"operating","active"),
 ("Hail Wheat Processing Mills","حائل لمطاحن القمح","HL","food","1061","low",162,"operating","active"),
 ("Tabuk Cold Chain Logistics Plant","تبوك لسلسلة التبريد","TB","food","1030","low",134,"operating","active"),
 ("Tabuk Solar Component Assembly","تبوك لتجميع مكونات الطاقة الشمسية","TB","electrical","2710","medium",212,"operating","active"),
 ("Jazan Fisheries Processing Co.","جازان لتصنيع الأسماك","JZ","food","1020","medium",248,"operating","active"),
 ("Jazan Aluminium Profiles Factory","جازان لقطاعات الألمنيوم","JZ","aluminium","2420","high",296,"operating","active"),
 ("Najran Cement Products Works","نجران لمنتجات الأسمنت","NJ","building_materials","2394","medium",144,"operating","active"),
 ("Al Baha Mountain Spring Bottling","الباحة لتعبئة مياه الينابيع","BH","beverages","1104","low",62,"operating","active"),
 ("Arar Border Logistics Packaging","عرعر للتغليف اللوجستي","AR","packaging","1702","low",86,"operating","active"),
 ("Waad Al Shamal Phosphate Support Industries","وعد الشمال للصناعات المساندة للفوسفات","WS","chemical","2012","high",410,"operating","active"),
 ("Al Jouf Olive Oil Pressing Co.","الجوف لعصر زيت الزيتون","JF","food","1040","low",78,"operating","active"),
]

# --- Identifier derivation. See RESEARCH-PROVENANCE.md §1–§3. -----------------
# Under the Law of Commercial Register (Royal Decree M/83, in force 3 Apr 2025)
# the CR number IS the unified number: 10 digits beginning with 7, with no city
# code. Legacy city-coded registrations stay valid through a five-year grace
# period ending April 2030. This master carries BOTH, because in August 2026
# both are in circulation — which is itself worth teaching.
#
# Only the Riyadh legacy prefix (1010) is verified. No city prefix is invented
# for any other region: every non-Riyadh establishment carries a new-law
# 7-prefixed CR, which needs no city code.
LEGACY_RIYADH_PREFIX = "1010"

def unified_cr(i):  return f"7{101_500_000 + i*911:09d}"[:10]
def legacy_cr(i):   return f"{LEGACY_RIYADH_PREFIX}{600000 + i*137:06d}"
def licence(i):     return f"48{10600000 + i*673:08d}"

rows = []
for i, (en, ar, site, act, isic, band, emp, stage, status) in enumerate(F, start=1):
    city_en, city_ar, locality, lat, lng, conf = SITES[site]
    region = REGION[site]
    # Legacy registration: Riyadh only (verified prefix), every third establishment.
    legacy = region == "Riyadh" and i % 3 != 0
    uni = unified_cr(i)
    rows.append({
        "factory_code": f"F-{site}-{i:03d}",
        "name_en": en, "name_ar": ar,
        "region": region, "city_en": city_en, "city_ar": city_ar, "locality": locality,
        "cr_number": legacy_cr(i) if legacy else uni,
        "unified_number": uni,
        "cr_regime": "legacy_city_coded" if legacy else "unified_m83",
        "license_number": licence(i), "plant_number": f"PLT-{site}-{i:04d}",
        "license_stage": stage, "license_status": status,
        "license_issue_date": f"20{20 + (i % 5)}-{1 + (i % 9):02d}-{1 + (i % 27):02d}",
        "license_expiry_date": ("2025-11-30" if status == "expired"
                                else f"20{27 + (i % 2)}-{1 + (i % 9):02d}-{1 + (i % 27):02d}"),
        "activity_class": act, "isic4": isic,
        "official_lat": round(lat + ((i % 7) - 3) * 0.0045, 7),
        "official_lng": round(lng + ((i % 5) - 2) * 0.0052, 7),
        "coord_confidence": conf,
        "geofence_radius_m": 150 if emp < 150 else 250,
        "employees": emp,
        "risk_band_seed": band,
        "source_system": "senaei_stub",
        "is_synthetic": "true",
    })

with open("factories.csv", "w", encoding="utf-8", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
    w.writeheader()
    w.writerows(rows)

from collections import Counter
print(f"{len(rows)} establishments")
print("regions:", dict(sorted(Counter(r["region"] for r in rows).items())))
print("cr regime:", dict(Counter(r["cr_regime"] for r in rows)))
print("coord confidence:", dict(Counter(r["coord_confidence"] for r in rows)))
assert len({r["factory_code"] for r in rows}) == len(rows), "duplicate factory_code"
assert len({r["cr_number"] for r in rows}) == len(rows), "duplicate cr_number"
assert len({r["license_number"] for r in rows}) == len(rows), "duplicate license_number"
print("uniqueness: factory_code, cr_number, license_number all distinct")
