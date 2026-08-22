# Research provenance for the Riyadh test-data master

Every identifier format and coordinate in `factories-riyadh.csv` traces to a
source below. Where a value could not be verified, that is stated rather than
filled in. **All 30 establishments are fictitious.** No real company is named.

## 1. Commercial registration number

**Format: 10 digits, no separator. First four digits are the issuing city code.
Riyadh = `1010`.**

Verified against a primary source: Almarai Company's audited financial
statements give its Riyadh head-office CR as **1010084223** — ten digits,
`1010` prefix, no hyphen.

**Defect this corrects.** `supabase/migrations/0011_factory360_gis_ksa_seed.sql`
issues Riyadh factories CR numbers of the form `4030-201101`. That is wrong
twice over: the hyphen does not exist in a real CR, and `4030` is not Riyadh.
A ministry trainee reading `4030` on a Riyadh factory would see a Jeddah
registration on a Riyadh plant.

Synthetic block used here: `1010600137` … `1010604109`, stepped by 137 so no
value collides with a real registration by accident.

## 2. Unified national number

`commercial_registrations.unified_number` is a separate column from
`cr_number` in `20260720010000_factory360_v2_foundation.sql`, which matches
Saudi practice — the unified number (الرقم الموحد) is a distinct 10-digit
identifier beginning with 7.

Corroborated in-repo: the legacy MIM export catalogued in
`seeding-discovery/LEGACY_SENAI_SOURCE_TO_TARGET_MAP.csv` carries
`inspection_visits.cr_number = 7060138125` — a 7-prefixed 10-digit value, i.e.
a unified number sitting in a CR column. That register already flags the value
as "authenticity vs the live table unverified".

Synthetic block: `7010450911` … `7010477241`.

## 3. Industrial licence number

**Public sources do not document the MIM industrial-licence number format.**
Searches of the Ministry's service pages and the national portal return the
licensing process but never the number structure. This is recorded as unverified
rather than invented.

The best available evidence is in-repo and comes from a real legacy MIM export:
`inspection_flows.number = 4801072799` — a **10-digit numeric** licence
reference. The source-to-target map classifies it as "a municipal/licence
reference number distinct from the ULID id" and explicitly warns: *"do not
overwrite real license_number values with this legacy number."*

Format adopted: 10-digit numeric, `48`-prefixed, matching the observed sample's
shape. Synthetic block: `4810600673` … `4810620163`.

**Defect this corrects.** The current seed uses `IL-9101`. No evidence anywhere
in the repository or in public sources supports that shape.

**Open item:** the true MIM licence format needs confirmation from the Ministry
or the Taadeen portal before this pack is used in a session where trainees may
cross-check a number against a live system.

## 4. Industrial geography

| Site | Coordinates | Confidence | Basis |
|---|---|---|---|
| Riyadh 2nd Industrial City | 24.54444, 46.89806 | **Verified precise** | Published coordinates 24°32′40″N 46°53′53″E; 1,900 ha; Km 17 Al-Kharj Road; established 1976; 1,117+ industrial and service contracts |
| Riyadh 1st Industrial City | 24.6650, 46.7420 | District-level | Sinaiyah al-Qadimah — southwest of al-Malazz, north of al-Khalidiyyah, west of Riyadh Rail Station, in the al-Malaz and al-Batha sub-municipalities; established 1973; 123.5 acres. Coordinate derived from that description, not published directly. |
| Riyadh 3rd Industrial City | 24.1050, 46.9800 | Derived | Described as south of Riyadh, 72 km from the city centre, still expanding. Coordinate derived by projecting 72 km south along the Al-Kharj corridor. |
| Sudair City for Industry and Business | 25.4600, 45.8400 | Derived | 120 km from Riyadh, 258 km², in Al-Majma'ah governorate (Al-Majma'ah is 25.90389, 45.34556). Coordinate derived by projecting 120 km along the Riyadh→Al-Majma'ah bearing. |
| Al-Kharj Industrial City | 24.1550, 47.3050 | Derived | MODON lists Al-Kharj among the Riyadh-region industrial cities; coordinate taken from the Al-Kharj governorate centre. |

**Defect this corrects.** The current seed places "2nd Industrial City" at
24.706, 46.768 — roughly 20 km off, inside central Riyadh rather than at Km 17
of the Al-Kharj Road. Geofence arrival checks tested against that coordinate are
testing the wrong place.

Per-factory plots are spread deterministically around each anchor
(±0.0135° lat, ±0.0104° lng), which keeps every plot inside its estate's
footprint while giving the Operations map genuinely distinct pins.

## 5. Establishment names — a defect worth naming separately

`0011_factory360_gis_ksa_seed.sql` names **real Saudi companies** and attaches
regulatory outcomes to them:

- `Saudi Dairy & Foodstuff (SADAFCO) Plant 2`
- `Alkhorayef Industrial Equipment`
- `Jubail Fertilizer Co. (SAFCO IV)` — carrying `risk_score 88.25`, band `high`
- `Al Watania Plastics`
- a representative contact at `safco.example`

Shown to a training audience, that reads as real regulatory intelligence about
named real companies — a high risk score, inspection findings and violations
attributed to an identifiable business. Every name in this pack is fictitious
and constructed from Riyadh place names (Wadi Hanifah, Tuwaiq, Al Malaz,
Diriyah, Irqah, Manfouhah, Thumamah, Nofa, Al Uyaynah, Al Ammariyah), which
keeps them locally plausible without naming anyone.

## 6. Activity classes

Each factory carries an ISIC Rev. 4 four-digit class in `isic4` alongside the
repo's existing free-text `activity_class`. ISIC 4 is the classification the
Saudi industrial registry uses. The `isic4` column is additive — no existing
column changes meaning.

## 7. What is deliberately absent

- **Risk scores.** `risk_band_seed` is an input for the risk engine to consume,
  not a score written to `factories.risk_score`. Score, band and version are
  ENG-04 outputs; writing them directly would fabricate an engine result.
- **Penalty amounts.** Deferred to approved `penalty_mappings`.
- **Health Score.** No source exists; STR-KPI-002 stays blocked regardless of
  how many factories are loaded.

## Sources

- [Almarai Company financial statements (CR 1010084223, Riyadh)](http://argaamplus.s3.amazonaws.com/826e94c8-1ace-4836-a3c4-10e620d7a297.pdf)
- [Batic Law Firm — Commercial Register in Saudi Arabia](https://baticfirm.com/commercial-register-saudi-arabia/)
- [MODON — Industrial Cities](https://modon.gov.sa/en/Cities/IndustrialCities/Pages/default.aspx)
- [MODON — Riyadh 2nd Industrial City](https://modon.gov.sa/en/Cities/IndustrialCities/Pages/IndustrialCity.aspx?CityId=20b51c2e-200a-46dc-ab02-a18bfe5d4c15)
- [MODON — Riyadh 1st Industrial City](https://modon.gov.sa/en/Cities/IndustrialCities/Pages/IndustrialCity.aspx?CityId=813b5e10-5431-47de-87ca-501ac0a524c8)
- [MODON — Riyadh 3rd Industrial City](https://modon.gov.sa/en/Cities/IndustrialCities/Pages/IndustrialCity.aspx?CityId=106fd109-aabe-45c2-ab22-d3d5c49df371)
- [Sinaiyah al-Jadidah, Riyadh 2nd Industrial City](https://en.wikipedia.org/wiki/Sinaiyah_al-Jadidah_(Riyadh))
- [Sinaiyah al-Qadimah, Riyadh 1st Industrial City](https://en.wikipedia.org/wiki/Sinaiyah_al-Qadimah_(Riyadh))
- [Sudair Industrial City](https://en.wikipedia.org/wiki/Sudair_Industrial_City)
- [Al-Majma'ah coordinates](https://latitude.to/articles-by-country/sa/saudi-arabia/71117/al-majmaah)
- [Ministry of Industry and Mineral Resources — Issuance of Industrial License](https://www.mim.gov.sa/en/services/issuance-of-industrial-license)
- In-repo: `product-contract/seeding-discovery/LEGACY_SENAI_SOURCE_TO_TARGET_MAP.csv` (real legacy MIM export samples)
- In-repo: `supabase/migrations/20260720010000_factory360_v2_foundation.sql` (CR / licence schema)
