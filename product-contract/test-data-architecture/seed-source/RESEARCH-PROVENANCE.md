# Research provenance for the establishment master

Every identifier format and coordinate in `factories.csv` traces to a source
below. Where a value could not be verified, that is stated rather than filled
in. **All 73 establishments are fictitious.** No real company is named.

Regenerate with `python3 build_factories.py`.

---

## 0 · Correction to the first version of this document

The first version of this file (commit `0767ef95`) described the Saudi
commercial registration as a 10-digit number whose first four digits encode the
issuing city, and proposed inventing a city prefix per region. **That is the
legacy scheme and it is being retired.**

The **Law of Commercial Register**, Royal Decree **M/83** dated 19/03/1446H, in
force **3 April 2025**, abolishes subsidiary city registers. A single commercial
registration is now valid across the whole Kingdom, the city-of-registration
requirement is eliminated, and **the CR number itself serves as the
establishment's unified number: ten digits beginning with 7**. Existing
city-coded registrations remain valid under a **five-year grace period ending
April 2030**.

Two consequences, both of which improve this pack:

1. **No city prefix is invented for any region.** Only Riyadh's legacy `1010` is
   verified, and no comprehensive public list of the other city codes exists.
   Rather than guess twelve prefixes, every non-Riyadh establishment carries a
   new-law 7-prefixed CR, which by law needs no city code.
2. **A second correction.** The first version described the legacy Ministry
   export's `inspection_visits.cr_number = 7060138125` as "a unified number
   sitting in a CR column", implying a data defect. Under M/83 that is simply a
   correctly-formed new-regime CR. The value is not evidence of a defect.

At the pack's anchor date (August 2026) the Kingdom is sixteen months into a
five-year transition, so **both forms are genuinely in circulation**. The master
carries both — 20 legacy Riyadh registrations and 53 unified — which is itself
worth teaching, because inspectors will encounter both on real establishments
until 2030.

---

## 1 · Commercial registration number

| Regime | Format | Count | Basis |
|---|---|---|---|
| `unified_m83` | 10 digits beginning with 7, no city code | 53 | Royal Decree M/83, in force 3 Apr 2025. SAMA Rulebook records the unified number starting with (7) as the establishment identifier. |
| `legacy_city_coded` | 10 digits, first four = issuing city; Riyadh `1010` | 20 | Verified against a primary source: Almarai Company's audited financial statements give its Riyadh head-office CR as **1010084223**. Valid until the grace period ends April 2030. |

`cr_regime` on every row records which scheme that establishment is under, so a
trainer can point at the difference rather than explain it.

**Defect this corrects.** `supabase/migrations/0011_factory360_gis_ksa_seed.sql`
issues CR numbers of the form `4030-201101`. The hyphen does not exist in a real
CR under either regime, and `4030` is not Riyadh — a trainee reading it on a
Riyadh factory sees a Jeddah registration on a Riyadh plant.

Synthetic blocks are stepped (legacy by 137, unified by 911) so no value
collides with a real registration by accident.

## 2 · Unified number

`commercial_registrations.unified_number` is a distinct column from `cr_number`
in `20260720010000_factory360_v2_foundation.sql`. Under the legacy regime these
differ; under M/83 they are the same value. The master populates both
accordingly, so the Factory 360 identity rail exercises each case.

## 3 · Industrial licence number

**Public sources do not document the MIM industrial-licence number format.**
Searches of the Ministry's service pages and the national portal return the
licensing process but never the number structure. **This remains unverified and
is the single weakest value in the pack.**

The best available evidence is in-repo, from a real legacy MIM export:
`inspection_flows.number = 4801072799` — a 10-digit numeric licence reference.
`seeding-discovery/LEGACY_SENAI_SOURCE_TO_TARGET_MAP.csv` classifies it as "a
municipal/licence reference number distinct from the ULID id" and warns: *"do
not overwrite real license_number values with this legacy number."*

Format adopted: 10-digit numeric, `48`-prefixed, matching the observed sample's
shape.

**Open item.** Confirm with the Ministry or the Taadeen portal before any
session in which trainees may cross-check a licence number against a live
system. A number that does not resolve is worse than an obviously synthetic one.

**Defect this corrects.** The current seed uses `IL-9101`. Nothing in the
repository or in any public source supports that shape.

## 4 · Industrial geography

27 MODON sites across all 13 regions. Site names are taken from MODON's own
industrial-city listings; none is invented.

| Confidence | Rows | Meaning |
|---|---|---|
| `verified` | 9 | Published coordinates for the site itself |
| `district` | 4 | Site described by district and landmark; coordinate placed from that description |
| `derived` | 60 | Site confirmed to exist in that governorate; coordinate taken from the governorate centre, with the industrial estate offset applied |

The one precisely published anchor: **Riyadh 2nd Industrial City at 24.54444,
46.89806** — 24°32′40″N 46°53′53″E, Km 17 Al-Kharj Road, 1,900 ha, established
1976, 1,117+ industrial and service contracts.

Also recorded: Riyadh 1st Industrial City is Sinaiyah al-Qadimah, southwest of
al-Malazz and north of al-Khalidiyyah, west of Riyadh Rail Station, established
1973 across 123.5 acres. Riyadh 3rd Industrial City is south of the city, 72 km
from the centre. Sudair City for Industry and Business is 120 km from Riyadh
across 258 km², in Al-Majma'ah governorate (Al-Majma'ah: 25.90389, 45.34556).

**Defect this corrects.** The current seed places "2nd Industrial City" at
24.706, 46.768 — roughly 20 km away, inside central Riyadh rather than at Km 17
of the Al-Kharj Road. Any geofence or arrival check exercised against that
coordinate is testing the wrong location.

**Honest limitation.** 60 of 73 coordinates are governorate-centre derived. They
are correct to within a few kilometres and correct in region, city and
governorate — enough for the Operations map to show distinct, plausibly-placed
pins in the right places. They are **not** surveyed plot locations. If a session
involves navigating to a plot, the coordinates need replacing with real ones.

## 5 · Establishment names

`0011_factory360_gis_ksa_seed.sql` names **real Saudi companies** and attaches
regulatory outcomes to them:

- `Saudi Dairy & Foodstuff (SADAFCO) Plant 2`
- `Alkhorayef Industrial Equipment`
- `Jubail Fertilizer Co. (SAFCO IV)` — carrying `risk_score 88.25`, band `high`
- `Al Watania Plastics`
- a representative contact at `safco.example`

Shown to a training audience that reads as real regulatory intelligence about
named real businesses — a high risk score, findings and violations attributed to
an identifiable company. Every name in this pack is fictitious and built from
local place names in its own region (Wadi Hanifah, Tuwaiq, Manfouhah and
Thumamah in Riyadh; Obhur and Bahrah in Jeddah; Qatif and Half Moon in the
Eastern Province; Quba and Uhud in Madinah; Sarawat in Asir), which keeps each
one locally plausible without naming anyone.

## 6 · Activity classes

Each establishment carries an ISIC Rev. 4 four-digit class in `isic4` alongside
the repo's existing free-text `activity_class`. ISIC 4 is the classification the
Saudi industrial registry uses. `isic4` is additive — no existing column changes
meaning. Sector mix is matched to each region's real industrial base: fisheries
in Jazan and Jeddah, dates in Madinah and Al-Ahsa, petrochemical support in
Jubail and Yanbu, phosphate support at Waad Al-Shamal, olive oil in Al-Jouf.

## 7 · What is deliberately absent

- **Risk scores.** `risk_band_seed` is an input for the risk engine to consume,
  not a value written to `factories.risk_score`. Score, band and version are
  ENG-04 outputs; writing them directly would fabricate an engine result and the
  methodology drawer would then present it as governed.
- **Penalty amounts.** Deferred to approved `penalty_mappings`.
- **Health Score.** No source exists; STR-KPI-002 stays blocked regardless of
  how many establishments are loaded.

## 8 · Identity and the round trip

`factory_code` is identity and is **immutable**. Renaming an establishment,
changing its CR, its coordinates or its sector never detaches its licence,
geofence or journeys, because every downstream UUID derives from the code and
not from any attribute. Changing a code creates a new establishment and orphans
the old one.

Codes changed in this revision from `F-RUH-nnn` to `F-<site>-nnn`
(e.g. `F-R2-001`, `F-JB-035`) so the code names the industrial site. This is
safe **only because nothing has been loaded yet**. Once a batch exists, codes
are frozen.

## Sources

- [SAMA Rulebook — unified number starting with (7) as the establishment identifier](https://rulebook.sama.gov.sa/en/approval-unified-number-starting-7-issued-national-information-center-serve-unified-number-non)
- [SAMA Rulebook — implementation of the Commercial Register Law and Law of Tradenames](https://rulebook.sama.gov.sa/en/implementation-provisions-commercial-register-law-and-law-tradenames)
- [Commercial Register Law (MISA, full text PDF)](https://misa.gov.sa/app/uploads/2025/07/Commercial-Register-Law.pdf)
- [Saudi Press Agency — new Commercial Register and Trade Names laws effective](https://www.spa.gov.sa/en/N2292296)
- [DWF — Saudi Commercial Register Law and Law of Trade Names](https://dwfgroup.com/en/news-and-insights/insights/2025/4/saudi-commercial-register-law-and-law-of-trade-names)
- [Pinsent Masons — commercial register and trade names laws](https://www.pinsentmasons.com/out-law/news/saudi-arabia-commercial-register-trade-names-laws-transform-business)
- [Almarai Company financial statements (CR 1010084223, Riyadh)](http://argaamplus.s3.amazonaws.com/826e94c8-1ace-4836-a3c4-10e620d7a297.pdf)
- [MODON — Industrial Cities](https://modon.gov.sa/en/Cities/IndustrialCities/Pages/default.aspx)
- [MODON — Riyadh 2nd Industrial City](https://modon.gov.sa/en/Cities/IndustrialCities/Pages/IndustrialCity.aspx?CityId=20b51c2e-200a-46dc-ab02-a18bfe5d4c15)
- [Saudipedia — industrial cities in Saudi Arabia](https://saudipedia.com/en/what-are-the-industrial-cities-in-saudi-arabia)
- [Sinaiyah al-Jadidah, Riyadh 2nd Industrial City](https://en.wikipedia.org/wiki/Sinaiyah_al-Jadidah_(Riyadh))
- [Sinaiyah al-Qadimah, Riyadh 1st Industrial City](https://en.wikipedia.org/wiki/Sinaiyah_al-Qadimah_(Riyadh))
- [Sudair Industrial City](https://en.wikipedia.org/wiki/Sudair_Industrial_City)
- [Al-Majma'ah coordinates](https://latitude.to/articles-by-country/sa/saudi-arabia/71117/al-majmaah)
- [Ministry of Industry and Mineral Resources — Issuance of Industrial License](https://www.mim.gov.sa/en/services/issuance-of-industrial-license)
- In-repo: `product-contract/seeding-discovery/LEGACY_SENAI_SOURCE_TO_TARGET_MAP.csv`
- In-repo: `supabase/migrations/20260720010000_factory360_v2_foundation.sql`
