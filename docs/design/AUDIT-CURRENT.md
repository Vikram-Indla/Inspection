# AUDIT-CURRENT.md

Structural audit of the SAQEEL web app, extracted directly from JSX source (not from a running browser, not from screenshots). One entry per route: file list, structure tree, undefined-class check against `saqeel-components.css`/`saqeel-runtime.css`, and every visible string literal.

Generated 2026-07-27. Routes audited: /dashboard, /operations, /factory-360, /planning, /execution, /reviews, /compliance, /compliance/approvals, /enforcement-library, /analytics, /admin/* (21 sub-routes).

Note on CSS-module classes: routes built on `_components/AdminDestinationFrame.tsx` and similar (admin/access, admin/localization, admin/integrations, admin/packages) use `styles.*` references into their own scoped `*.module.css` files. Those are flagged in undefined-classes lists only when genuinely absent from all sources; scoped module classes are noted separately from real design-system gaps against the two global stylesheets.

---

## /dashboard
file: apps/web/src/app/(app)/dashboard/page.tsx, apps/web/src/app/(app)/dashboard/DashboardView.tsx, apps/web/src/app/(app)/dashboard/RevampStrategicView.tsx, apps/web/src/app/(app)/dashboard/RevampOperationalView.tsx, apps/web/src/app/(app)/dashboard/MetricStrip.tsx
structure:
  Shell
    Suspense[fallback=div.panel[aria-busy="true"][role="status"] "Loading dashboard data…"]
      DashboardDataSections (async)
        [if unsupportedView]
          section.panel[role="status"]
            h2.panel-title "Dashboard view not configured"
            p.t-body "The "${unsupportedView}" perspective is not an approved M1 view. Choose an available perspective."
            div.row
              a.sq-btn.sq-btn--primary[href="/dashboard?view=strategic"] "Open Strategic View"
              a.sq-btn.sq-btn--secondary[href="/dashboard?view=operational"] "Open Operational View"
        [else]
          div[style]
            div.sq-banner.sq-banner--critical[role="alert"]
              div
                strong "Submission verification · DEC-032"
                " — "
                "The submission_versions digest repair is deployed and its backend probes pass. Post-PR Gatekeeper evidence for a real end-to-end submission is still pending; Dashboard counts describe RLS-visible stored records and are not that final runtime proof."
            [if failedSources.length > 0]
              div.sq-banner.sq-banner--critical[role="alert"]
                div
                  strong "Partial dashboard"
                  " — "
                  "these sources are temporarily unavailable:"
                  " "
                  {failedSources.join(" · ")}
                  ". "
                  "Other panels remain usable; refresh to retry."
            DashboardControls
              header.styles.command
                form[action="/dashboard"][method="get"].styles.seg[role="tablist"][aria-label="Dashboard perspective"]
                  input[type="hidden"][name="group"]
                  [if query] input[type="hidden"][name="q"]
                  input[type="hidden"][name="from"]
                  input[type="hidden"][name="to"]
                  [if region] input[type="hidden"][name="region"]
                  button.styles.segOpt[type="submit"][name="view"][value="strategic"][role="tab"][id="dashboard-tab-strategic"][aria-controls="dashboard-strategic"] "Strategic View"
                  button.styles.segOpt[type="submit"][name="view"][value="operational"][role="tab"][id="dashboard-tab-operational"][aria-controls="dashboard-operational"] "Operational View"
                [if partialSources.length > 0]
                  div.styles.partialDetail[role="alert"]
                    strong "Partial dashboard"
                    span {partialSources.join(" · ")}
            SearchResults
              [if needle (query.trim())]
                section.styles.results[aria-labelledby="dashboard-search-results"]
                  h3#dashboard-search-results "Search results for "${query}""
                  [if !total]
                    p[role="status"] "No RLS-visible factory, visit or inspection matched."
                  [else]
                    div.styles.resultGrid
                      div.styles.resultGroup
                        h4 "Factories"
                        [for each row in factoryMatches]
                          a.styles.result[href="/factories/${row.id}"]
                            strong[dir="auto"] {row.name}
                            br
                            span.styles.detail
                              bdi {row.factory_code ?? "—"}
                              " · "
                              {[row.region, row.city].filter(Boolean).join(" · ")}
                      div.styles.resultGroup
                        h4 "Visits"
                        [for each row in visitMatches]
                          a.styles.result[href="/visits/${row.id}"]
                            strong[dir="auto"] {row.factories?.name ?? "Visit"}
                            br
                            span.styles.detail
                              bdi {row.id.slice(0, 8)}
                              " · "
                              {row.operational_state}
                      div.styles.resultGroup
                        h4 "Inspections"
                        [for each row in inspectionMatches]
                          a.styles.result[href="/reports/inspection/${row.id}"]
                            strong[dir="auto"] {row.visits?.factories?.name ?? "Inspection"}
                            br
                            span.styles.detail
                              bdi {row.id.slice(0, 8)}
            [if view === "strategic"]
              StrategicView
                RevampStrategicView
                  div.styles.view
                    section
                      h2.styles.overline "National performance"
                      div.styles.metricGrid
                        MetricCard (instance 1 of 3, literal siblings)
                          article.styles.metricCard
                            span.styles.question "Are we achieving the national inspection strategy?"
                            h3 "Inspection coverage against annual target"
                            strong.styles.metricValue "Not configured"
                            p.styles.definition
                              b "Definition"
                              " (Completed inspections ÷ annual inspection target) × 100"
                            p.styles.example "${strategic.completedInspections} completed inspections; no governed annual target is configured."
                            p.styles.interpretation "Coverage remains withheld until Administration publishes the governed inspection-cycle target."
                            a.styles.action[href="/planning"] "Open Planning"
                        MetricCard (instance 2 of 3)
                          article.styles.metricCard
                            span.styles.question "How compliant is the industrial sector?"
                            h3 "National compliance rate"
                            strong.styles.metricValue {valueOrUnavailable(locale, strategic.complianceRate, "%")}
                            p.styles.definition
                              b "Definition"
                              " (Compliant answered items ÷ total eligible answered items) × 100"
                            p.styles.example "${strategic.approvedCompliant} compliant of ${strategic.approvedAnsweredForCompliance} eligible answers."
                            p.styles.interpretation "Calculated only from approved inspection work; pending reports are excluded."
                            a.styles.action[href="/analytics"] "Open Analytics"
                        MetricCard (instance 3 of 3)
                          article.styles.metricCard
                            span.styles.question "Are inspection reports approved without excessive rework?"
                            h3 "Inspection approval rate"
                            strong.styles.metricValue {valueOrUnavailable(locale, strategic.decisionApprovalRate, "%")}
                            p.styles.definition
                              b "Definition"
                              " Approved Level-2 decisions ÷ all decided Level-2 outcomes"
                            p.styles.example "${strategic.approvedScoped} approved of ${strategic.decidedScoped} decided outcomes."
                            p.styles.interpretation "Approval is a review outcome and is not presented as compliance."
                            a.styles.action[href="/reviews"] "Open Review & Approval"
                    section.styles.explorer
                      div.styles.sectionHead
                        div
                          h2 "Compliance performance explorer"
                          p "One compliance-rate formula, four lenses. Every row drills to the factories behind it."
                        nav.styles.lenses[aria-label="Lens"]
                          [for each [id, en, ar] in [["region","Region","المنطقة"],["city","City","المدينة"],["sector","Sector","القطاع"],["authority","Authority","الجهة"]]]
                            a[href={paramsHref(id)}][aria-current={group === id}] {copy(locale, en, ar)}
                      div.styles.bars
                        [if grouped.length]
                          [for each row in grouped.slice(0, 8)]
                            a.styles.barRow[href="/factories?${group}=${encodeURIComponent(row.label)}"]
                              span {row.label}
                              span.styles.track
                                span[style]
                              strong {row.rate == null ? "—" : `${row.rate}%`}
                        [else]
                          p.styles.empty "No eligible approved answers in scope."
                    section
                      h2.styles.overline "Strategic intervention"
                      div.styles.metricGrid
                        MetricCard (instance 4 of 6)
                          article.styles.metricCard
                            span.styles.question "Which regulations generate the most violations?"
                            h3 "Top violated regulation"
                            strong.styles.metricValue {topViolation?.label ?? "Not available"}
                            p.styles.definition
                              b "Definition"
                              " Count of violations grouped by regulation"
                            p.styles.example {topViolation ? `${topViolation.value} linked violations in the current scope.` : "No regulation-linked violations in scope."}
                            p.styles.interpretation "Only violations carrying a governed regulation relationship are counted."
                            a.styles.action[href="/admin/regulations"] "Open the regulation"
                        MetricCard (instance 5 of 6)
                          article.styles.metricCard
                            span.styles.question "Which factories require immediate intervention?"
                            h3 "Critical factories requiring intervention"
                            strong.styles.metricValue {String(strategic.criticalFactories.length)}
                            p.styles.definition
                              b "Definition"
                              " Factories carrying a recorded high-risk band or active critical violation"
                            p.styles.example "${strategic.criticalFactories.length} factories match the governed recorded conditions."
                            p.styles.interpretation "No substitute threshold is introduced by this screen."
                            a.styles.action[href="/factories"] "Open Factory 360"
                        MetricCard (instance 6 of 6)
                          article.styles.metricCard
                            span.styles.question "Which factories still require inspection this year?"
                            h3 "Factories pending annual inspection"
                            strong.styles.metricValue "Not configured"
                            p.styles.definition
                              b "Definition"
                              " Active factories with no completed inspection in the governed inspection year"
                            p.styles.example "${factories.length} factories are visible, but the annual-cycle policy is not configured."
                            p.styles.interpretation "The screen withholds a count until the inspection-year policy is published."
                            a.styles.action[href="/planning"] "Open Planning"
                    section.styles.bottomGrid
                      article.styles.trendCard
                        h2 "Enforcement action trend"
                        div.styles.unavailable
                          strong "Trend unavailable"
                          p "The repository does not store a governed official violation issue date. No quarterly series is inferred."
                        a.styles.action[href="/admin/violations"]
                          "Open Enforcement Library"
                          span[aria-hidden="true"] "→"
                      article.styles.aiCard
                        span.styles.aiLabel "Executive AI brief"
                        h2 "Provider output withheld"
                        p "No generated claim is shown until a configured provider returns evidence-linked output for this scope."
                        span.styles.provenance "Authoritative dashboard records remain available."
                    section.styles.requirementCoverage[aria-labelledby="strategic-requirement-coverage"]
                      div.styles.sectionHead
                        div
                          h2#strategic-requirement-coverage "Strategic requirement coverage"
                          p "All dashboard.xlsx strategic measures are shown with their governed live or blocked state and auditable methodology."
                      MetricStrip
                        div.styles.metricStrip[role="group"][aria-label={s.methodology}]
                          [for each m in metrics]
                            div.styles.metricTile
                              div.styles.kpiLabel {m.title}
                              [if m.kind === "status"]
                                div.`${styles.statusChip} ${styles[`tone_${m.tone}`]}`
                                  span.styles.dot[aria-hidden="true"]
                                  {m.text}
                              [else]
                                div.`${styles.kpiValue} ${styles[`tone_${m.tone}`]}` {m.text}
                              [if m.sub]
                                div.styles.kpiDelta {m.sub}
                              [if hasMethod]
                                button[type="button"].styles.methodBtn[aria-haspopup="dialog"] {m.kind === "status" ? s.why : s.methodology}
                          [if entry]
                            div.styles.scrim[aria-hidden="true"]
                            div.styles.drawer[role="dialog"][aria-modal="true"][aria-labelledby="method-title"]
                              div.styles.drawerHead
                                div
                                  div#method-title.styles.drawerTitle {entry.title}
                                  div.styles.idCode {entry.formulaId}
                                button[type="button"].styles.methodClose[aria-label={s.close}] "✕"
                              div.styles.drawerBody
                                [if entry.blockedNote]
                                  div.`${styles.statusChip} ${styles.tone_warning} ${styles.drawerBlocked}`[role="note"]
                                    span.styles.dot[aria-hidden="true"]
                                    span {s.blockedTitle}": "{entry.blockedNote}
                                dl.styles.methodList
                                  [for each row in entry.rows]
                                    div.styles.methodRow
                                      dt {row.label}
                                      dd {row.value}
                              [if entry.drillRoute]
                                div.styles.drawerFoot
                                  a.`${styles.btn} ${styles.btnSecondary}`[href={entry.drillRoute}] {entry.drillLabel || s.drillFallback}
            [else]
              OperationalView
                RevampOperationalView
                  div.styles.view[id="dashboard-operational"][role="tabpanel"][aria-labelledby="dashboard-tab-operational"]
                    section.styles.aiPriority
                      strong "Deterministic operational priorities"
                      p "${operational.highPriorityRows.length} high-priority visits are pending execution; ${operational.overdueRows.length} published visits are past their recorded window."
                      span "Live governed records · AI provider output withheld · no generated recommendation"
                    [for each block in blocks]
                      section
                        h2.styles.overline {block.label}
                        div.styles.operationalGrid
                          [for each metric in block.metrics]
                            OperationalCard
                              article.styles.operationalCard
                                span.styles.question {question}
                                h3 {title}
                                strong.styles.operationalValue {value}
                                p.styles.operationalDefinition
                                  b "Definition"
                                  " " {definition}
                                a.styles.secondaryAction[href={href}] {action}
                    section.styles.capacityCard
                      div.styles.capacityHead
                        h2 "Inspector capacity"
                        span "Planned + in progress; declared daily capacity is not configured"
                      div.styles.capacityRows
                        [if operational.workload.length]
                          [for each row in operational.workload.slice(0, 8)]
                            div.styles.capacityRow
                              span {row.name}
                              span.styles.capacityTrack
                                span[style]
                              strong {row.active}
                        [else]
                          p.styles.empty "No inspector assignments are visible in this scope."
                      a.styles.secondaryAction[href="/execution"] "Open Execution, grouped by inspector"
                    section.styles.requirementCoverage[aria-labelledby="operational-requirement-coverage"]
                      div.styles.sectionHead
                        div
                          h2#operational-requirement-coverage "Operational requirement coverage"
                          p "All dashboard.xlsx operational measures are shown with their governed live or blocked state and auditable methodology."
                      MetricStrip (same structure as documented above)

undefined-classes: t-body, sq-btn--primary

text-content:
Loading dashboard data…
Dashboard view not configured
The "${unsupportedView}" perspective is not an approved M1 view. Choose an available perspective.
Open Strategic View
Open Operational View
Submission verification · DEC-032
 — 
The submission_versions digest repair is deployed and its backend probes pass. Post-PR Gatekeeper evidence for a real end-to-end submission is still pending; Dashboard counts describe RLS-visible stored records and are not that final runtime proof.
Partial dashboard
these sources are temporarily unavailable:
. 
Other panels remain usable; refresh to retry.
Dashboard perspective
Strategic View
Operational View
Partial dashboard
Search results for "${query}"
No RLS-visible factory, visit or inspection matched.
Factories
—
Visit
Inspections
Inspection
National performance
Are we achieving the national inspection strategy?
Inspection coverage against annual target
Not configured
Definition
(Completed inspections ÷ annual inspection target) × 100
completed inspections; no governed annual target is configured.
Coverage remains withheld until Administration publishes the governed inspection-cycle target.
Open Planning
How compliant is the industrial sector?
National compliance rate
Not available
(Compliant answered items ÷ total eligible answered items) × 100
compliant of
eligible answers.
Calculated only from approved inspection work; pending reports are excluded.
Open Analytics
Are inspection reports approved without excessive rework?
Inspection approval rate
Approved Level-2 decisions ÷ all decided Level-2 outcomes
approved of
decided outcomes.
Approval is a review outcome and is not presented as compliance.
Open Review & Approval
Compliance performance explorer
One compliance-rate formula, four lenses. Every row drills to the factories behind it.
Lens
Region
City
Sector
Authority
—
No eligible approved answers in scope.
Strategic intervention
Which regulations generate the most violations?
Top violated regulation
Not available
Count of violations grouped by regulation
linked violations in the current scope.
No regulation-linked violations in scope.
Only violations carrying a governed regulation relationship are counted.
Open the regulation
Which factories require immediate intervention?
Critical factories requiring intervention
Factories carrying a recorded high-risk band or active critical violation
factories match the governed recorded conditions.
No substitute threshold is introduced by this screen.
Open Factory 360
Which factories still require inspection this year?
Factories pending annual inspection
Active factories with no completed inspection in the governed inspection year
factories are visible, but the annual-cycle policy is not configured.
The screen withholds a count until the inspection-year policy is published.
Enforcement action trend
Trend unavailable
The repository does not store a governed official violation issue date. No quarterly series is inferred.
Open Enforcement Library
→
Executive AI brief
Provider output withheld
No generated claim is shown until a configured provider returns evidence-linked output for this scope.
Authoritative dashboard records remain available.
Strategic requirement coverage
All dashboard.xlsx strategic measures are shown with their governed live or blocked state and auditable methodology.
Methodology
Why unavailable?
Close
Advisory only · traceable
Governed boundary
Open records
✕
Today's operations
What needs to be executed today?
Today's planned visits
Count of visits scheduled for today
Open Execution
How much work has been completed today?
Today's visit completion rate
(Completed visits today ÷ planned visits today) × 100
Execution status
What inspections are currently active?
Active field inspections
Count of inspections with operational state = executing
Open Operations Center
Which visits are delayed?
Overdue planned visits
Planned date earlier than today and status not completed or cancelled
Open Planning
Approvals
Which inspection reports require review?
Inspection reports awaiting approval
Count of submitted reports awaiting a review decision
Open Review & Approval
Which inspections require rework?
Returned inspection reports
Count of reports returned to inspectors
Open Execution
Operational exceptions
Which factories should be inspected next?
High-priority visits pending execution
Planned visits at high or critical risk, not yet executed
Open Planning
Deterministic operational priorities
high-priority visits are pending execution;
published visits are past their recorded window.
Live governed records · AI provider output withheld · no generated recommendation
Inspector capacity
Planned + in progress; declared daily capacity is not configured
No inspector assignments are visible in this scope.
Open Execution, grouped by inspector
Operational requirement coverage
All dashboard.xlsx operational measures are shown with their governed live or blocked state and auditable methodology.

---

## /operations
file: apps/web/src/app/(app)/operations/page.tsx, apps/web/src/app/(app)/operations/RevampOperationsCenter.tsx, apps/web/src/app/(app)/operations/OperationsMapWorkspace.tsx, apps/web/src/app/(app)/operations/OperationsPreview.tsx, apps/web/src/app/(app)/operations/OperationsScopeFilter.tsx, apps/web/src/app/(app)/operations/Monitoring.tsx, apps/web/src/app/(app)/operations/Controls.tsx, apps/web/src/app/(app)/operations/OverrideQueue.tsx, apps/web/src/app/(app)/operations/CancellationQueue.tsx, apps/web/src/app/(app)/operations/OpsExport.tsx
NOTE: card "operations" is leased to codex (LEASE-SAQEEL-OPERATIONS-001) — audited read-only, not modified.
structure:
  Shell.current="/operations" title=""
    [if loadErrors.length > 0]
      div.sq-banner sq-banner--critical  role="alert"
        div
          strong  "Some information could not be loaded."
          " " (loadErrors.join(" · ")) "."
          a.sq-link href="/operations"  "Retry"
    [if outOfScopeRecordCount > 0]
      div.sq-sr-only  role="status"
        div  "Records outside your authorized region are excluded from this view. Excluded records:"
          strong  {outOfScopeRecordCount}
    [if !mayViewOperations] (early return, replaces entire tree below)
      Shell.current="/operations" title="Operations Center"
        EmptyState glyph="⛨" title="Operations access required" body="No operational data has been loaded because this destination is not enabled in your assigned navigation."
          a.sq-btn sq-btn--secondary href="/launch"  "Return to my workspace"
    RevampOperationsCenter
      div.{styles.revampPage}
        div.{styles.revampCommand}
          nav.{styles.viewSwitch} aria-label="Operations perspective"
            a.`${styles.viewLink} ${view === "map" ? styles.viewLinkActive : ""}` href={mapViewHref}  "Operations map"
            a.`${styles.viewLink} ${view === "performance" ? styles.viewLinkActive : ""}` href={performanceViewHref}  "National performance"
          div.{styles.revampFreshness}
            a href="/operations/live"
              i aria-hidden="true"
              "Live governed positions"
            button.{styles.revampSecondary} type="button" onClick=toggle showList
              [if showList] "Show map"
              [else] "Show list equivalent"
        [if showList]
          section.{styles.revampTableWrap}
            table.{styles.revampTable}
              caption  "Accessible equivalent of the live map. Same records, same actions, no map dependency."
              thead
                tr
                  th  "Inspector"
                  th  "Operational state"
                  th  "Visit"
                  th  "Factory"
                  th  "Region / city"
                  th  "Risk"
                  th  "Last update"
                  th  "Actions"
              tbody
                [for each entry in activeMapEntries]
                  tr
                    th.scope="row" data-label="Inspector"  {entry.inspectorName ?? "—"}
                    td data-label="Operational state"
                      span.{styles.revampLozenge}  {entry.state}
                    td data-label="Visit"  {entry.visitId?.slice(0,8) ?? "—"}
                    td data-label="Factory"  {entry.factoryName}
                    td data-label="Region / city"  {[entry.region, entry.city].filter(Boolean).join(" / ") || "—"}
                    td data-label="Risk"  {entry.riskScore ?? "—"}
                    td data-label="Last update"  {entry.lastGeoAt ?? "—"}
                    td data-label="Actions"
                      a.{styles.revampSecondary} href={entry.href}  "Open record"
        [else]
          section.{styles.revampMap}
            div.{styles.revampMapCrumb}  "Saudi Arabia"
            OperationsMapWorkspace entries={activeMapEntries} strings={mapStrings} mapOnly
              [entries.length === 0]
                EmptyState bare title={s.emptyTitle} body={s.emptyBody}
              [else]
                div.`${styles.workspace} ${mapOnly ? styles.workspaceMapOnly : ""}`
                  section.{styles.mapFrame} aria-label={s.mapLabel}
                    Suspense fallback=EmptyState bare role="status" ariaBusy title={s.loadingTitle} body={s.loadingBody}
                      GeoMap (dynamic, ssr:false) center zoom markers selectedId onMarkerClick height
                  [if !mapOnly]
                    section.{styles.mapList} aria-labelledby="operations-map-list-heading"
                      div.{styles.mapListHeader}
                        div
                          h4#operations-map-list-heading  {s.listHeading}
                          p.sq-caption  {s.listDescription}
                        span.sq-lozenge sq-numeric  {entries.length}
                      ul.{styles.mapListItems}
                        [for each entry in entries]
                          li
                            button.{styles.mapListButton} type="button" aria-pressed data-entry-kind data-has-inspector onClick
                              span
                                strong  {entry.label}
                                br
                                span.sq-caption  {[entry.region, entry.city].filter(Boolean).join(" · ") || "—"}
                              span.sq-lozenge  {entry.state}
                      [if selected]
                        div.{styles.selectionCard} role="status" aria-live="polite"
                          p.sq-caption  {s.selected}
                          p
                            strong  {selected.label}
                          div.sq-row
                            button.sq-btn sq-btn--secondary type="button" onClick  {s.preview}
                            a.sq-link href={selected.href}  {s.open} " " {selected.kind === "visit" ? s.visit : s.factory}
                  OperationsPreview entry={preview} strings={s.previewStrings} onClose
                    [if !entry] (returns null)
                    [else]
                      div.{styles.previewBackdrop} onMouseDown=close-if-backdrop
                        aside.`${styles.previewPanel} ${inspectorPreview ? styles.previewDrawer : styles.previewCard}` role="dialog" aria-modal="true" aria-labelledby data-testid
                          header.{styles.previewHeader}
                            div
                              span.sq-caption  {inspectorPreview ? s.inspectorTitle : s.factoryTitle}
                              h3#titleId  {inspectorPreview ? entry.inspectorName : entry.factoryName}
                            button.sq-btn sq-btn--secondary sq-btn--icon type="button" aria-label={s.close} onClick=onClose  "×"
                          [if inspectorPreview]
                            dl.{styles.previewFacts}
                              div
                                dt  {s.currentVisit}
                                dd.sq-numeric  {entry.visitId?.slice(0,8) ?? "—"}
                              div
                                dt  {s.operationalState}
                                dd  {entry.state}
                              div
                                dt  {s.assignments}
                                dd.sq-numeric  {entry.assignmentCount}
                              div
                                dt  {s.lastGeoEvent}
                                dd.sq-numeric  {entry.lastGeoAt ?? s.noGeoEvent}
                          [else]
                            dl.{styles.previewFacts}
                              div
                                dt  {s.location}
                                dd  {[entry.region, entry.city].filter(Boolean).join(" · ") || "—"}
                              div
                                dt  {s.riskScore}
                                dd.sq-numeric  {entry.riskScore ?? s.riskUnavailable}
                              div
                                dt  {s.riskRank}
                                dd.sq-numeric  {entry.riskRank ? `${entry.riskRank} / ${entry.riskRankTotal}` : s.riskUnavailable}
                              div
                                dt  {s.activeVisits}
                                dd.sq-numeric  {entry.activeVisitCount}
                              div
                                dt  {s.openActions}
                                dd.sq-numeric  {entry.openActionCount}
                          footer.{styles.previewFooter}
                            a.sq-btn sq-btn--primary href={inspectorPreview && entry.visitId ? `/visits/${entry.visitId}` : entry.href}  {inspectorPreview ? s.openVisit : s.openFactory}
        [if view === "performance"]
          section.{styles.revampRegions}
            div.{styles.revampSectionHead}
              h2  "National performance by region"
              p  "Selecting a region drills to its factories and active visits."
            div.{styles.revampRegionGrid}
              [for each region in regions]
                a.{styles.revampRegionCard} href={region.href}
                  span
                    strong  {region.name}
                    b  "—"
                  em  "Compliance unavailable"
                  i
                    span style=inlineSize
                  small  {region.factories} " " "factories" " · " {region.active} " " "active visits"
        section
          h2.{styles.revampOverline}  "Operational summary"
          div.{styles.revampKpiRow}
            [for each [label,value,href,action] in summary]
              article.{styles.revampKpi}
                span  {label}
                strong  {value}
                a href={href}  {action}
        section.{styles.revampExceptions}
          div.{styles.revampSectionHead}
            h2  "Live operational exceptions"
            span  "Current RLS-scoped records"
          [if highlights.length]
            [for each item in highlights.slice(0,8)]
              article
                em  "Open"
                div
                  strong  {item.label}
                  p  {item.description}
                a.{styles.revampSecondary} href={item.href}  "Open record"
          [else]
            p.{styles.revampEmpty}  "No open operational exceptions in this scope."

    div.{styles.operationalDetails}
      section.sq-surface aria-labelledby="operations-monitoring-heading"
        div.{styles.detailHeading}
          div
            h2#operations-monitoring-heading  "Visit and inspector monitoring"
            p  "Current RLS-scoped operational states, assignments and latest recorded geofence results."
          OperationsScopeFilter view region city regions cities labels
            div.sq-row
              div.sq-field
                label.sq-field__label htmlFor="operations-region"  {labels.region}
                select.sq-select id="operations-region" value onChange
                  option value=""  {labels.allRegions}
                  [for each option in regions]
                    option value={option}  {option}
              div.sq-field
                label.sq-field__label htmlFor="operations-city"  {labels.city}
                select.sq-select id="operations-city" value onChange
                  option value=""  {labels.allCities}
                  [for each option in cities]
                    option value={option}  {option}
        MonitoringTable initialRows initialAt region city enumLabels strings
          div.stack
            [if rows.length === 0]
              EmptyState icon={IconSatellite} title={s.emptyTitle} body={s.emptyDesc} bare
            [else]
              div.sq-tablewrap
                table.sq-table
                  thead
                    tr
                      th  {s.thVisit}
                      th  {s.thFactory}
                      th  {s.thOperational}
                      th  {s.thGeofence}
                      th  {s.thInspector}
                  tbody
                    [for each v in rows]
                      tr
                        td
                          a.sq-link href={`/visits/${v.id}`}  {v.id.slice(0,8)}
                        td
                          [if v.factory_id]
                            a.sq-link href={`/factories/${v.factory_id}`}  {v.factory_name ?? "—"}
                          [else] {v.factory_name ?? "—"}
                        td
                          span.`sq-lozenge sq-lozenge--ops ${v.operational_state === "executing" ? "sq-lozenge--success" : ""}`  {label(v.operational_state)}
                        td
                          [if v.geofence]
                            span.`sq-lozenge ${GEOFENCE_TONE[v.geofence] ?? "sq-lozenge--critical"}`  {label(v.geofence)}
                          [else]
                            span.t-caption  "—"
                        td  {v.inspector ?? "—"}
            p.t-caption  {s.refreshedAt} " " [if at] span.numeric {at.slice(11,19)} " · " {s.autoNote}

      section.sq-surface aria-labelledby="operations-sla-heading"
        div.{styles.detailHeading}
          div
            h2#operations-sla-heading  "SLA and resubmission monitoring"
            p  "Deadlines use server timestamps and governed SLA configuration. Missing configuration remains unavailable."
        [if slaFlags.length === 0 && resubFlags.length === 0]
          EmptyState glyph="✓" title="No governed deadline alerts in this scope" inline bare
        [else]
          div.sq-tablewrap
            table.sq-table
              thead
                tr
                  th  "Visit"
                  th  "Factory"
                  th  "Deadline"
                  th  "Deadline status"
                  th  "Escalation"
              tbody
                [for each flag in slaFlags]
                  tr
                    td
                      a.sq-link href={`/visits/${flag.visit.id}`}  {flag.visit.id.slice(0,8)}
                    td  {flag.visit.factories?.name ?? "—"}
                    td  {fmtTs(flag.deadlineMs)}
                    td  {slaKindLabel(flag)}
                    td  {flag.escalation ?? "—"}
                [for each flag in resubFlags]
                  tr
                    td
                      a.sq-link href={`/visits/${flag.visit_id}`}  {flag.visit_id.slice(0,8)}
                    td  {flag.factory_name ?? "—"}
                    td  {fmtTs(flag.deadlineMs)}
                    td  [if flag.overdue] "Resubmission overdue" [else] "Resubmission pending"
                    td  [if resubSlaAvailable] "—" [else] "Not configured"

      section.sq-surface aria-labelledby="operations-kpi-contract-heading"
        div.{styles.detailHeading}
          div
            h2#operations-kpi-contract-heading  "Governed Operations KPI contract"
            p  [if operationsKpiContract?.configured] "Published DEC-028 policy metadata and metric definitions are active." [else] "DEC-028 policy or published metric definitions are not configured; undefined formulas remain unavailable."
        [if kpiContractRpc.error]
          EmptyState glyph="!" title="KPI contract service unavailable" body="Retry" inline bare
        [elseif operationsKpiContract?.authorized === false]
          EmptyState glyph="⛨" title="KPI contract access is not authorized for this role" inline bare
        [else]
          dl.{styles.contractFacts}
            div
              dt  "Calculation period"
              dd  {contractValue(operationsKpiContract?.period)}
            div
              dt  "Timezone"
              dd  {contractValue(operationsKpiContract?.timezone)}
            div
              dt  "Policy version"
              dd  {contractValue(operationsKpiContract?.policy_version)}
            div
              dt  "Decision authority"
              dd  {operationsKpiContract?.decision ?? "DEC-028"}
          div.sq-tablewrap
            table.sq-table
              thead
                tr
                  th  "Metric"
                  th  "Source status"
                  th  "Published formula"
              tbody
                [for each definition in operationsKpiContract?.definitions ?? []]
                  tr
                    th.scope="row"  {kpiMetricLabel(definition.metric_key)}
                    td  {enumLabel(definition.source_status)}
                    td  {definition.formula ?? "Not configured"}

      section.sq-surface aria-labelledby="operations-workload-heading"
        div.{styles.detailHeading}
          div
            h2#operations-workload-heading  "Inspector workload"
            p  "Assigned and active visits in the current authorized geography."
        [if workloadRows.length === 0]
          EmptyState glyph="—" title="No inspector workload in this scope" inline bare
        [else]
          div.sq-tablewrap
            table.sq-table
              thead
                tr
                  th  {monitoringStrings.thInspector}
                  th  "Assigned"
                  th  "Active"
              tbody
                [for each row in workloadRows]
                  tr
                    th.scope="row"
                      bdi dir="auto"  {row.inspector}
                    td  {row.assigned}
                    td  {row.active}

      section.sq-surface aria-labelledby="operations-risk-heading"
        div.{styles.detailHeading}
          div
            h2#operations-risk-heading  "Risk monitoring"
            p  "Read-only Risk Engine outputs in the current authorized scope."
        [if highRisk.length === 0]
          EmptyState glyph="—" title="No configured risk scores in this scope" inline bare
        [else]
          div.sq-tablewrap
            table.sq-table
              thead
                tr
                  th  "Factory"
                  th  "Location"
                  th  "Score"
                  th  "Band"
              tbody
                [for each factory in highRisk]
                  tr
                    th.scope="row"
                      a.sq-link href={`/factories/${factory.id}`}  {factory.name}
                    td  {[factory.region, factory.city].filter(Boolean).join(" · ") || "—"}
                    td  {factory.risk_score ?? "Not configured"}
                    td  [if factory.risk_band] {enumLabel(factory.risk_band)} [else] "Not configured"

      section.sq-surface aria-labelledby="operations-alerts-heading"
        div.{styles.detailHeading}
          div
            h2#operations-alerts-heading  "Operational alerts and corrective actions"
            p  "Current RLS-scoped action forms and notification delivery states. Changes remain guarded by database policy."
        [if actions.length === 0 && notifs.length === 0]
          EmptyState glyph="✓" title="No operational alerts in this scope" inline bare
        [else]
          div.{styles.alertColumns}
            div
              h3  "Corrective actions"
              [if actions.length === 0]
                p.sq-caption  "No open corrective actions."
              [else]
                div.sq-stack
                  [for each action in actions]
                    article.{styles.alertCard}
                      div
                        strong  {action.inspections?.visits?.factories?.name ?? action.form_type}
                        p  {action.required_correction ?? enumLabel(action.status)}
                        small  [if action.due_at] {formatDateTime(...)} [else] "No governed due date"
                      [if mayManageOperations]
                        ActionFormControls actionFormId status strings
                          form.row action=formAction
                            input type="hidden" name="action_form_id"
                            [if status === "open"]
                              button.btn btn-primary btn-touch name="next_status" value="acknowledged" disabled  [if pending] "…" [else] {strings.acknowledge}
                            button.btn btn-primary btn-lg btn-touch name="next_status" value="closed" disabled  [if pending] "…" [else] {strings.close}
                            [if state.error]
                              span.t-caption role="alert" style-color  {state.error}
                            [if state.ok]
                              span.badge badge-compliant  {strings.updated}
                      [else]
                        span.sq-lozenge sq-lozenge--neutral  "Read only"
            div
              h3  "Notification delivery"
              [if notifs.length === 0]
                p.sq-caption  "No notification events."
              [else]
                div.sq-stack
                  [for each notification in notifs]
                    article.{styles.alertCard}
                      div
                        strong  {enumLabel(notification.event_key)}
                        p  {notification.channel} " · " time dateTime={notification.created_at}  {formatDateTime(...)}
                      div.sq-row
                        span.`sq-lozenge ${NOTIF_TONE[notification.delivery_state] ?? "sq-lozenge--neutral"}`  {enumLabel(notification.delivery_state)}
                        [if mayManageOperations && notification.delivery_state !== "handled"]
                          MarkNotificationHandled notificationId strings
                            form.row action=formAction
                              input type="hidden" name="notification_id"
                              button.btn btn-primary btn-touch disabled  [if pending] "…" [else] {strings.markHandled}
                              [if state.error]
                                span.t-caption role="alert" style-color  {state.error}
                              [if state.ok]
                                span.badge badge-compliant  {strings.handled}
                        [else] null

      section.sq-surface aria-labelledby="operations-cancellations-heading"
        div.{styles.detailHeading}
          div
            h2#operations-cancellations-heading  "Cancellation monitoring"
            p  "Recent RLS-scoped cancellation requests, reasons and immutable decision outcomes."
        [if cancellationHistoryRows.length === 0]
          EmptyState glyph="—" title="No cancellation history in this scope" inline bare
        [else]
          div.sq-tablewrap
            table.sq-table
              thead
                tr
                  th  {monitoringStrings.thVisit}
                  th  {monitoringStrings.thFactory}
                  th  "Reason"
                  th  "Status"
                  th  "Requested"
                  th  "Decided"
              tbody
                [for each row in cancellationHistoryRows]
                  tr
                    td
                      a.sq-link href={`/visits/${row.visit_id}`}  {row.visit_id.slice(0,8)}
                    td  {row.factory_name ?? "—"}
                    td  {row.reason_label} [if row.decision_reason] ` · ${row.decision_reason}`
                    td  {enumLabel(row.status)}
                    td
                      time dateTime={row.requested_at}  {formatDateTime(...)}
                    td  [if row.decided_at] time dateTime={row.decided_at} {formatDateTime(...)} [else] "—"

      [if mayManageOperations]
        OverrideQueue rows strings locale
          section.sq-surface aria-labelledby="geo-override-queue-heading"
            h4#geo-override-queue-heading  {strings.heading}
            p.sq-caption  {strings.caption}
            [if rows.length === 0]
              EmptyState glyph="✓" title={strings.emptyTitle} body={strings.emptyDesc} inline bare
            [else]
              div.sq-stack
                [for each row in rows]
                  div.sq-surface
                    div.sq-row
                      div
                        strong  {row.factory_name ?? row.visit_id.slice(0,8)}
                        p.sq-caption  {strings.inspector} ": " {row.inspector_name ?? "—"} " · " {row.reason_label}
                      span.sq-lozenge sq-lozenge--warning  {strings.expires} ": " {stamp(row.expires_at)}
                    p  {row.explanation}
                    div.sq-row sq-caption
                      span  {strings.captured} ": " span.sq-numeric {stamp(row.device_occurred_at)}
                      span.sq-numeric  {row.observed_lat.toFixed(6)} ", " {row.observed_lng.toFixed(6)}
                      span  {strings.accuracy} ": " span.sq-numeric "±" {Number(row.accuracy_m).toFixed(1)} " m"
                      span  {strings.distance} ": " span.sq-numeric {Number(row.distance_m).toFixed(0)} " m"
                      [if row.safety_security_exception]
                        span  {strings.safetyException}
                      [else]
                        span
                          {strings.evidence} ": " {row.evidence_count} " "
                          [if row.evidence_url]
                            a href={row.evidence_url} target="_blank" rel="noreferrer"  {strings.viewEvidence}
                          [elseif row.evidence_count > 0]
                            span  "(" {strings.evidenceUnavailable} ")"
                    div.sq-row
                      label.sq-field
                        span.sq-field__label  {strings.rejectReason}
                        input.sq-input value onChange
                      button.sq-btn sq-btn--secondary disabled onClick  {strings.reject}
                      button.sq-btn sq-btn--field disabled onClick  {strings.approve}
                    [if message[row.id]]
                      p.sq-caption role="status"  [if pending] {strings.deciding} [else] {message[row.id]}

        CancellationQueue rows strings locale
          section.sq-surface aria-labelledby="cancellation-queue-heading"
            h4#cancellation-queue-heading  {strings.heading}
            p.sq-caption  {strings.caption}
            [if rows.length === 0]
              EmptyState glyph="✓" title={strings.emptyTitle} body={strings.emptyDesc} inline bare
            [else]
              div.sq-stack
                [for each row in rows]
                  div.sq-surface
                    div.sq-row
                      div
                        strong  {row.factory_name ?? row.visit_id.slice(0,8)}
                        p.sq-caption  {strings.inspector} ": " {row.inspector_name ?? "—"} " · " {row.reason_label}
                      span.sq-lozenge sq-lozenge--warning  {strings.requested} ": " {stamp(row.requested_at)}
                    [if row.comment]
                      p  {row.comment}
                    div.sq-row sq-caption
                      span  {strings.phase} ": " {row.phase.replace(/_/g," ")}
                      span
                        {strings.evidence} ": "
                        [if row.evidence_url]
                          a href={row.evidence_url} target="_blank" rel="noreferrer"  {strings.viewEvidence}
                        [else] "—"
                    [if confirming === row.id]
                      div.sq-banner sq-banner--critical role="alert"
                        div
                          strong  {strings.confirmTitle}
                          " " {strings.confirmBody}
                          div.sq-row
                            button.sq-btn sq-btn--subtle disabled onClick  {strings.confirmBack}
                            button.sq-btn sq-btn--danger disabled onClick  {strings.confirmApprove}
                    [else]
                      div.sq-row
                        label.sq-field
                          span.sq-field__label  {strings.rejectReason}
                          input.sq-input value onChange
                        button.sq-btn sq-btn--secondary disabled onClick  {strings.reject}
                        button.sq-btn sq-btn--field disabled onClick  {strings.approve}
                    [if message[row.id]]
                      p.sq-caption role="status"  [if pending] {strings.deciding} [else] {message[row.id]}
      [else]
        section.sq-surface aria-labelledby="operations-decisions-heading"
          EmptyState glyph="⛨" title="Operational decisions are read-only for your role" body="Only an authorized Operations supervisor can decide location exceptions or active-session cancellations." inline bare

      section.sq-surface aria-labelledby="operations-timeline-heading"
        div.{styles.detailHeading}
          div
            h2#operations-timeline-heading  "Operational timeline"
            p  "Canonical chronology from planning through lifecycle, inspection, review and Compliance handoff."
        form.{styles.timelineVisitPicker} method="get" action="/operations"
          [if view === "performance"]
            input type="hidden" name="view" value="performance"
          [if region]
            input type="hidden" name="region" value={region}
          [if city]
            input type="hidden" name="city" value={city}
          label.sq-field htmlFor="operations-timeline-visit"
            span.sq-field__label  "Choose a visit timeline"
            select.sq-select id="operations-timeline-visit" name="timelineVisit" defaultValue
              option value=""  "Select visit"
              [for each visit in monitored]
                option value={visit.id}  {visit.factories?.name ?? visit.id.slice(0,8)} " · " {visit.id.slice(0,8)}
          button.sq-btn sq-btn--secondary type="submit"  "Load timeline"
        [if !timelineVisitId]
          EmptyState glyph="↗" title="Select a visit to load its governed timeline" inline bare
        [elseif timelineRpc.error]
          EmptyState glyph="!" title="Operational timeline unavailable" body="Retry" inline bare
        [elseif operationsTimeline.length === 0]
          EmptyState glyph="—" title="No authorized timeline events for this visit" inline bare
        [else]
          ol.{styles.timelineList}
            [for each event in operationsTimeline]
              li
                time dateTime={event.occurred_at}  {formatDateTime(...)}
                div
                  strong  {enumLabel(event.event_key)}
                  span  {event.object_type}
                code  {JSON.stringify(event.payload)}

      section.sq-surface aria-labelledby="operations-history-heading"
        div.{styles.detailHeading}
          div
            h2#operations-history-heading  "Immutable location and operational history"
            p  "Latest 100 events from the append-only, RLS-scoped geo-event ledger. The source rows are never edited here."
        [if geoHistoryRows.length === 0]
          EmptyState glyph="—" title="No recorded location history in this scope" inline bare
        [else]
          div.sq-tablewrap
            table.sq-table
              thead
                tr
                  th  "Recorded at"
                  th  {monitoringStrings.thVisit}
                  th  "Event"
                  th  {monitoringStrings.thGeofence}
                  th  "Recorded position"
              tbody
                [for each event in geoHistoryRows]
                  tr
                    td
                      time dateTime={event.occurred_at}  {formatDateTime(...)}
                    td
                      a.sq-link href={`/visits/${event.visit_id}`}  {event.visit_id.slice(0,8)}
                    td  {enumLabel(event.kind)}
                    td  [if event.geofence_result] {enumLabel(event.geofence_result)} [else] "—"
                    td  [if finite lat/lng] `${lat}, ${lng}` [else] "—"

      section.sq-surface aria-labelledby="operations-export-heading"
        div.{styles.detailHeading}
          div
            h2#operations-export-heading  "Export operational data"
            p  "Every file requires a matching role- and region-scoped database receipt plus an atomic audit event before download."
        [if routeRoleKeys.some(role => ["ops","leadership"].includes(role))]
          OpsExport datasets strings
            div.row
              strong  {strings.heading}
              [for each ds in datasets]
                button.btn btn-ghost btn-touch disabled onClick
                  {ds.label} " " span.numeric {ds.rows.length}
              span.t-caption  {strings.scopeNote}
              [if message]
                span.t-caption role="status"  {message}
        [else]
          EmptyState glyph="⛨" title="Export is not authorized for this role" inline bare

undefined-classes: sq-lozenge--neutral, sq-btn--primary

text-content:
Operations Center
Operations access required
No operational data has been loaded because this destination is not enabled in your assigned navigation.
Return to my workspace
Some information could not be loaded.
Retry
Records outside your authorized region are excluded from this view. Excluded records:
Operations perspective
Operations map
National performance
Live governed positions
Show map
Show list equivalent
Accessible equivalent of the live map. Same records, same actions, no map dependency.
Inspector
Operational state
Visit
Factory
Region / city
Risk
Last update
Actions
Open record
Saudi Arabia
National performance by region
Selecting a region drills to its factories and active visits.
—
Compliance unavailable
factories
active visits
Operational summary
Live operational exceptions
Current RLS-scoped records
Open
No open operational exceptions in this scope.
Visit and inspector monitoring
Current RLS-scoped operational states, assignments and latest recorded geofence results.
Region
City
All regions
All cities
Visit
Factory
Visit status
Geofence
Inspector
No published visits to monitor
Visits appear here once planning publishes them (FLD-VIS-005).
Refreshed
Refreshing…
RLS-scoped monitoring records
—
SLA and resubmission monitoring
Deadlines use server timestamps and governed SLA configuration. Missing configuration remains unavailable.
No governed deadline alerts in this scope
Visit
Factory
Deadline
Deadline status
Escalation
Reminder
Overdue to start
Overdue to submit
Resubmission overdue
Resubmission pending
Not configured
—
Governed Operations KPI contract
Published DEC-028 policy metadata and metric definitions are active.
DEC-028 policy or published metric definitions are not configured; undefined formulas remain unavailable.
KPI contract service unavailable
Retry
KPI contract access is not authorized for this role
Calculation period
Timezone
Policy version
Decision authority
DEC-028
Metric
Source status
Published formula
Not configured
Inspector workload
Assigned and active visits in the current authorized geography.
No inspector workload in this scope
Assigned
Active
Risk monitoring
Read-only Risk Engine outputs in the current authorized scope.
No configured risk scores in this scope
Factory
Location
Score
Band
Not configured
—
Operational alerts and corrective actions
Current RLS-scoped action forms and notification delivery states. Changes remain guarded by database policy.
No operational alerts in this scope
Corrective actions
No open corrective actions.
No governed due date
Acknowledge
Close
updated
Read only
Notification delivery
No notification events.
Mark handled
handled
Cancellation monitoring
Recent RLS-scoped cancellation requests, reasons and immutable decision outcomes.
No cancellation history in this scope
Visit
Factory
Reason
Status
Requested
Decided
—
Location exception requests
Approve only the exact captured arrival attempt. The requester cannot decide; a pending request expires after 30 minutes or when the visit closes.
No override approvals pending
Outside-fence requests with their evidence appear here for Operations review.
Factory
Inspector
Captured
Accuracy
Distance
Photo evidence
Safety/security photo exception declared
Expires
View photo
photo link unavailable
Approve override
Reject
Rejection reason (mandatory to reject)
Saving decision…
Decision saved and the queue will refresh.
The decision could not be saved. Nothing changed.
Cancellation requests
Active-session cancellation requests from inspectors. Approval is terminal: the visit is cancelled, captured responses, evidence and location history are preserved for audit, and the assignment is freed. The requester cannot decide their own request.
No cancellation requests pending
Cancellation requests filed during a journey or inspection appear here for Operations review.
Factory
Inspector
Phase
Requested
Evidence
View
Approve cancellation
Reject
Rejection reason (mandatory to reject)
Approve this cancellation?
This is terminal: the visit is cancelled and cannot be reopened. Everything captured so far is preserved for audit.
Confirm — cancel the visit
Back
Saving decision…
Decision saved and the queue will refresh.
The decision could not be saved. Nothing changed.
Operational decisions are read-only for your role
Only an authorized Operations supervisor can decide location exceptions or active-session cancellations.
Operational timeline
Canonical chronology from planning through lifecycle, inspection, review and Compliance handoff.
Choose a visit timeline
Select visit
Load timeline
Select a visit to load its governed timeline
Operational timeline unavailable
Retry
No authorized timeline events for this visit
Immutable location and operational history
Latest 100 events from the append-only, RLS-scoped geo-event ledger. The source rows are never edited here.
No recorded location history in this scope
Recorded at
Visit
Event
Geofence
Recorded position
Export operational data
Every file requires a matching role- and region-scoped database receipt plus an atomic audit event before download.
Export is not authorized for this role
Export CSV:
The receipt and CSV use this exact region/city scope and row count.
Authorizing and recording export…
Export authorized. Receipt:
Export authorization is unavailable. No file was generated.
Location exception requests
Approve only the exact captured arrival attempt. The requester cannot decide; a pending request expires after 30 minutes or when the visit closes.
No override approvals pending
Outside-fence requests with their evidence appear here for Operations review.
Cancellation requests
Active-session cancellation requests from inspectors. Approval is terminal: the visit is cancelled, captured responses, evidence and location history are preserved for audit, and the assignment is freed. The requester cannot decide their own request.
No cancellation requests pending
Cancellation requests filed during a journey or inspection appear here for Operations review.
Live monitoring
Operational alerts
KPI contract
Deadline breach
Corrective action overdue
Notification failed
Override decision required
Cancellation decision required
Visits planned
Visits completed
Visits cancelled
Visits overdue
Active inspectors
Average duration
SLA breach rate
Alert type
Summary
Recorded at
Destination
Metric
Source status
Published formula
Policy version
Operations map
Loading KSA map
Mapbox renders in the browser only.
Map records
The list and map use the same RLS-scoped records.
No mappable factories in scope
Factories gain map positions when GIS Admin records official coordinates (FLD-FACT-005/006).
Open
Selected on map and list
Factory 360
visit
Preview
Inspector preview
Factory quick card
Close preview
Current visit
Operational state
Assignments in current scope
Last geo event
No recorded position
Open full visit
Location
Raw risk score
RLS-visible rank
Unavailable
Active visits
Open corrective actions
Open Factory 360
×
Selected on map and list

---

## /factory-360
file: apps/web/src/app/(app)/factories/page.tsx, apps/web/src/app/(app)/factories/RevampFactory360Portfolio.tsx, apps/web/src/app/(app)/factories/[id]/page.tsx, apps/web/src/app/(app)/factories/[id]/FactorySpatialMap.tsx
structure (list):
  [if !permissions["view_factory_360"]]
    Shell.current="/factories" title={t("f360.title","Factory 360")}
      EmptyState.glyph="⛔" title={t("f360.permission.title","Factory 360 access required")} body={t("f360.permission.body","You do not have access to factory profiles.")}
  Shell.current="/factories" title=""
    [if error]
      div.sq-banner.sq-banner--critical role="alert"
        div
          strong "Couldn't load factories."
          " " "The Factory list is temporarily unavailable. Nothing was changed." " — " "retry" "."
    [if !error && isEmpty]
      EmptyState.glyph="🏭" title={t("f360.empty.title","No factories in the list")} body={t("f360.empty.desc","Factory identity records sync from the national source (M07-002).")}
    [if !error && !isEmpty]
      RevampFactory360Portfolio.factories={selectedPortfolio} crNumber={selectedCr || "—"} canCreateInspection={permissions["create_inspection"]} locale={locale}
        [if !selected] return null
        div.sq-f360
          aside.sq-f360__portfolio
            section.sq-f360__summary
              span "Portfolio · CR " bdi{crNumber}
              div
                [for each [value, label, tone] in summary (["Factories"],["High risk"],["Open violations"],["Active penalties"])]
                  div[data-tone]
                    strong {value}
                    small "Factories"
            [for each factory in factories]
              button.sq-f360__license type="button" aria-pressed={factory.id === selected.id}
                strong {factory.name}
                dl
                  div: dt "Licence" / dd bdi{license_number ?? "—"}
                  div: dt "Plant" / dd bdi{plant_number ?? "—"}
                  div: dt "Type" / dd {titleCase(license_type ?? activity_class)}
                  div: dt "Stage" / dd {titleCase(stage ?? status)}
                  div: dt "Compliance" / dd "—"
                  div: dt "Open violations" / dd "—"
                span
                  em {titleCase(status)}
                  em[data-risk] {titleCase(risk_band)}
          main.sq-f360__main
            section.sq-f360__hero
              div
                h1 {selected.name}
                p bdi{factory_code} " · CR " bdi{cr_number} " · " {[region,city] joined} "Location unavailable"
                span "Opened from Factory 360"
                span "Reason · portfolio selection"
              nav
                [if canCreateInspection]
                  a href={`/planning/single?cr=${...}`} "Create inspection"
                a href={`/operations?region=${...}`} "View on map"
                a href={selected.dossier_href} "Open full dossier"
              [if canCreateInspection]
                p role="status" "Inspection submission remains unavailable while DEC-032 is unresolved."
              dl
                div: dt "Industrial licence" / dd bdi{license_number ?? "—"}
                div: dt "Plant number" / dd bdi{plant_number ?? "—"}
                div: dt "Activity" / dd {activity_class ?? "—"}
                div: dt "Source record" / dd {formatted date or "—"}
            section.sq-f360__condition
              div[data-risk]
                span "Overall condition"
                strong {condition}
                p "Based only on the saved governed risk band. Compliance and enforcement are shown separately and are never inferred."
              dl
                div: dt "Saved risk" / dd {risk_score ?? "—"}
                div: dt "Risk band" / dd {titleCase(risk_band)}
                div: dt "Approved compliance" / dd "Not available"
                div: dt "Open violations" / dd "Not available"
            section.sq-f360__snapshot
              h2 "Factory snapshot"
              dl
                div: dt "Factory code" / dd bdi{factory_code}
                div: dt "Commercial registration" / dd bdi{cr_number}
                div: dt "Region" / dd {region ?? "—"}
                div: dt "City" / dd {city ?? "—"}
                div: dt "Activity" / dd {activity_class ?? "—"}
                div: dt "Licence state" / dd {titleCase(status)}
            [for each [title, description, href] in ["Inspection history"/"Approved and submitted inspection records, immutable versions and report outcomes.", "Violations & enforcement"/"Violation, corrective-action and penalty records attached to approved inspection evidence.", "Industrial information"/"Products, materials, production lines, machinery and source reconciliation.", "Documents & media"/"Governed factory documents and official media, separated from inspection evidence."] (href = selected.dossier_href each)]
              details.sq-f360__section
                summary
                  span
                    strong {title}
                    small {description}
                  b "+"
                p "This section is available in the source-backed full dossier."
                a href={href} "Open " {title}
          aside.sq-f360__context
            section
              span "Selected context"
              strong {selected.name}
              p "CR " bdi{cr_number}
              p "Licence " bdi{license_number ?? "—"}
              p "Plant " bdi{plant_number ?? "—"}
            section
              span "Source status & freshness"
              strong {source_synced_at ? "Source record available" : "Freshness unavailable"}
              p {formatted date or "No recorded synchronization timestamp."}
            section.sq-f360__ai
              span "Contextual AI"
              strong "Provider output withheld"
              p "No generated factory claim is shown without an evidence-linked provider response."
              a href={selected.dossier_href} "Review authoritative evidence"

structure (detail):
  [if !permissions["view_factory_360"]]
    Shell.current="/factories" title={t("f360.title","Factory 360")}
      EmptyState.glyph="⛔" title={t("f360.permission.title","Factory 360 access required")} body={t("f360.permission.body","You do not have access to this factory profile.")}
  [if compat !== "legacy" && normalizedLicense?.commercial_registration_id]
    redirect(`/factories/cr/${...}?license=${...}`)  (no JSX rendered)
  [if !f]
    Shell.current="/factories" title={t("f360.notFound.title","Factory not found")}
      EmptyState.glyph="∅" title={t("f360.notFound.desc","Factory registration not found or not available to you.")} body={fErr ? mapFactoryError(fErr,"load") : undefined}
  Shell.current="/factories" title={`${f.name} — ${identity(f.factory_code)}`} context={<> ... </>}
    context (prop, not children):
      span.sq-lozenge.sq-lozenge--info "SB11"
      span[className=`sq-lozenge ${bandTone}`] {f.risk_band ? enumLabel(risk_band) : "—"} " · " {f.risk_score}
      span.sq-freshness "source" {f.source} " · " "synced" {formatted date or "—"}
    children:
      div.sq-row style={...}
        [if permissions["create_inspection"]]
          a.sq-btn.sq-btn--secondary href={`/planning/single?factory=...`} "Plan single visit"
        [if permissions["create_inspection"]]
          a.sq-btn.sq-btn--secondary href={`/planning/immediate?factory=...`} "Start inspection plan"
        [if permissions["create_inspection"]]
          span.sq-caption role="status" "Inspection submission remains unavailable while DEC-032 is unresolved."
      div.cd-w3
        aside.cd-side3
          div.sq-surface.cd-idcard
            h4 "Identity — read-only from source (M07-002)"
            span.cd-idcard__code bdi{identity(factory_code)}
            p.cd-idrow: span.cd-idk "CR" / span.cd-idv bdi{identity(cr_number)}
            p.cd-idrow: span.cd-idk "license" / span.cd-idv bdi{identity(license_number)}
            p.cd-idrow: span.cd-idk "license status / stage" / span.cd-idv {identity(status)} " · " {identity(stage)}
            p.cd-idrow: span.cd-idk "issued / expires" / span.cd-idv.sq-numeric {identity(issue_date)} " → " {identity(expiry_date)}
            p.cd-idrow: span.cd-idk "license holder" / span.cd-idv {identity(license_holder)}
            p.cd-idrow: span.cd-idk "CR legal name" / span.cd-idv {identity(legal_name)}
            p.cd-idrow: span.cd-idk "CR status / owner" / span.cd-idv {identity(cr_status)} " · " {identity(cr_owner_details)}
            p.cd-idrow {activity_class} " · " {region} " · " {city}
          div.sq-surface.cd-fresh
            span.cd-fresh__g aria-hidden="true" "⏱"
            span "source" strong{f.source} " · " "synced" bdi.cd-idv{formatted date or "—"}
          div.sq-surface.cd-riskcard
            h4 "Risk — reproducible (EV-004)"
            span[className=`cd-riskscore ${riskTone}`] {f.risk_score}
            p "band" strong{risk_band label or "—"} " · " span.sq-version{risk_version}
            p.sq-caption "Recomputable from stored normalized inputs + this version; every calculation is retained."
            p.sq-caption.sq-numeric "last recalculated" {formatted date or "—"}
            [if driverEntries.length]
              ul.sq-caption
                [for each [key, raw] in driverEntries]
                  li {key label}: {value ?? "—"} × {weight ?? "—"} = {contribution ?? "—"}
            [else]
              p.sq-caption.cd-warn "No driver snapshot exists for this legacy score; the absence is preserved, not reconstructed."
          div.sq-surface.cd-maplens
            h4 "Location"
            p.cd-coords bdi{f.official_lat}, {f.official_lng} span.sq-caption "(GIS-Admin-owned, FND-007)"
            p.sq-caption "Geofence (G-MAP):" {f.geofence_radius_m != null ? <span.sq-numeric>{radius} "m"</span> " — " "per-factory override" : "engine default (engine_settings gis.geofence_default_radius_m)"}
            [if f.official_lat != null && f.official_lng != null]
              FactorySpatialMap.officialLat officialLng geofenceRadius events strings locale
                div.stack style={gap:8}
                  div style={...} dir="ltr"
                    GeoMap.center zoom markers height (external component, not recursed)
                  div.row style={...}
                    span.badge.badge-info {s.officialPin}
                    span.badge.badge-compliant {s.observedArrival}
                    span.badge.badge-critical {s.gpsOverride}
                  [if events.length === 0]
                    p.t-caption {s.noLocations}
            [else]
              div.cd-mapph
                span.cd-mapph__t "Official coordinates are unavailable from the source."
        div.cd-main3
          nav.cd-secstrip aria-label={t("f360.nav.sections","Factory 360 sections")}
            [for each s in SECTIONS]
              a.cd-secitem href={`#${s.id}`} {s.label}
          section#location.sq-surface style={padding:...}
            h4 "Official, planned and observed locations (M07-005)"
            p.sq-caption "Official coordinates remain source-owned. Arrival, check-in and override coordinates are locked inspection observations and never overwrite the Factory list."
            [if locationEvents.length]
              div.sq-tablewrap
                table.sq-table
                  thead: tr: th"When" th"Kind" th"Observed coordinates" th"Mismatch / reason" th"Visit"
                  tbody
                    [for each e in locationEvents]
                      tr
                        td.sq-numeric {formatted datetime}
                        td span[className] {kind label}
                        td.sq-numeric bdi{lat.toFixed(6)}, {lng.toFixed(6)}
                        td {e.kind === "override" ? <strong>{overrideReason ?? "override reason unavailable"}</strong> : "—"}
                        td a.sq-link href={`/visits/${visitId}`} {visitId.slice(0,8)}
            [else]
              p.sq-caption "No observed locations are visible in your authorized scope."
          section#risk.sq-surface style={padding:...}
            h4 "Factory health score and risk history (M07-014/015)"
            p.sq-caption "Each row freezes the DEC-001 model version, normalized driver values, weights and contributions used at recalculation time."
            ContextualAiPanel.surface="factory_risk_explanation" title="Explain health score and risk drivers" description="Advisory only. Explains the saved score, band, model version and driver snapshot; it cannot recalculate or change risk." context evidenceRefs targetRef locale generateLabel="Explain recorded drivers" unavailableLabel="AI explanation unavailable" evidenceLabel="Source references" advisoryLabel="Human decision required" (external component, not recursed)
            [if riskHistory.length]
              div.sq-tablewrap
                table.sq-table
                  thead: tr: th"Calculated" th"Score" th"Band" th"Model" th"Drivers"
                  tbody
                    [for each s in riskHistory]
                      tr
                        td.sq-numeric {formatted date}
                        td.sq-numeric strong{s.score}
                        td {band label}
                        td span.sq-version{s.model_version}
                        td.sq-caption {entries joined or "Legacy score — driver snapshot unavailable"}
            [else]
              p.sq-caption "No risk calculation history is available."
            h5 style={...} "Related violations"
            [if canSeeSensitiveHistory && sortedVisits.some(v => violations.length > 0)]
              div.sq-row style={gap:8, flexWrap:"wrap"}
                [for each x in sortedVisits.flatMap(v => v.inspections?.violations ?? [])]
                  span.sq-lozenge.sq-lozenge--critical {x.violation_codes.code} " · " {x.violation_codes.title}
            [else]
              p.sq-caption {canSeeSensitiveHistory ? "No related violations are recorded." : "Violation detail is restricted for this role."}
          section#timeline.sq-surface style={padding:...} aria-labelledby="cd-tl-h"
            h4#cd-tl-h "Spatial Case Timeline"
            p.sq-caption "Source-labelled facts linking location context, inspections, findings, actions, reviews and the current risk version. Connective, not causal."
            [if sortedVisits.length === 0]
              div.sq-state.sq-state--inline
                span.sq-state__glyph "🗺"
                h4 "No case events recorded"
                p.sq-caption "The timeline populates once visits are planned and executed."
            [else]
              ol.cd-timeline
                [for each v in sortedVisits]
                  li.cd-tl
                    span.cd-tl__when.sq-numeric {formatted date}
                    span.cd-tl__spine aria-hidden="true"
                      span.cd-tl__dot.is-visit "◉"
                      span.cd-tl__line
                    div.cd-tl__card
                      div.cd-tl__head
                        span.cd-tl__kind {visit_type label}
                        span.cd-tl__title "Visit" a.sq-link href={`/visits/${v.id}`} {v.id.slice(0,8)}
                      p.cd-tl__src "planning" {planning_status label} " · " "operational" {operational_state label}
                      [if ins]
                        <>
                          p.cd-tl__src "Inspection" {status label}
                            [for each s in ins.submission_versions]
                              span.sq-version style={marginInlineStart:4} "v"{s.version_number}
                            [if ins.submission_versions.length > 0]
                              <> " · " a.sq-link href={`/reports/inspection/${ins.id}`} "report" </>
                          [if canSeeSensitiveHistory && ins.violations.length > 0]
                            p.cd-tl__src "findings"
                              [for each x in ins.violations]
                                span.sq-lozenge.sq-lozenge--critical style={marginInlineEnd:4} {x.violation_codes.code}
                          [if canSeeSensitiveHistory && ins.action_forms.length > 0]
                            p.cd-tl__src "Actions"
                              [for each a in ins.action_forms] template: `${status label} · ${owner_name} · due ${date or "—"}` joined by "; "
                          [if canSeeSensitiveHistory && ins.reviews.filter(decision).length > 0]
                            p.cd-tl__src "Review"
                              [for each r,i in ins.reviews.filter(r => r.decision)]
                                span[className] {decision label}
                        </>
              ol.cd-timeline style={marginBlockStart:...}
                [if f.source_synced_at]
                  li.cd-tl key="source-sync"
                    span.cd-tl__when.sq-numeric {formatted date}
                    span.cd-tl__spine aria-hidden="true" span.cd-tl__dot.is-location "↻"
                    div.cd-tl__card
                      span.cd-tl__kind "Factory list synced"
                      span {f.source}
                [for each s in riskHistory]
                  li.cd-tl
                    span.cd-tl__when.sq-numeric {formatted date}
                    span.cd-tl__spine aria-hidden="true" span.cd-tl__dot.is-risk "◆"
                    div.cd-tl__card
                      span.cd-tl__kind "Score updated"
                      span {s.score} " · " {band label} " · " span.sq-version{s.model_version}
                [for each p in penaltyRows]
                  li.cd-tl
                    span.cd-tl__when.sq-numeric {formatted date}
                    span.cd-tl__spine aria-hidden="true" span.cd-tl__dot.is-risk "§"
                    div.cd-tl__card
                      span.cd-tl__kind "Penalty issued"
                      span {p.notice_number} " · " {status label}
                [for each e in evidenceRows]
                  li.cd-tl
                    span.cd-tl__when.sq-numeric {formatted date}
                    span.cd-tl__spine aria-hidden="true" span.cd-tl__dot.is-location "●"
                    div.cd-tl__card
                      span.cd-tl__kind "Evidence captured"
                      span {evidence_type label} " · " {linked_type label}
          section#history.sq-surface style={padding:...}
            h4 style={marginBlockEnd:...} "Inspection history — official records only (M07-011/012)"
            [if sortedVisits.length === 0]
              div.sq-state.sq-state--inline
                span.sq-state__glyph "🗓"
                h4 "No visits recorded for this factory"
                p.sq-caption "History appears once visits are planned and executed."
            [else]
              div.sq-tablewrap
                table.sq-table
                  thead: tr: th"Visit" th.sq-td-num"Window" th"Planning" th"Operational" th"Inspection" th"Versions" th"Violations" th"Actions" th"Review"
                  tbody
                    [for each v in sortedVisits]
                      tr
                        td a.sq-link href={`/visits/${v.id}`} {v.id.slice(0,8)} span.sq-caption {visit_type label}
                        td.sq-td-num.sq-numeric {formatted date}
                        td span.sq-lozenge.sq-lozenge--plan {planning_status label}
                        td span.sq-lozenge.sq-lozenge--ops {operational_status label}
                        td {ins ? <span.sq-lozenge.sq-lozenge--info>{status label}</span> : <span.sq-caption>"—"</span>}
                        td
                          [for each s in ins?.submission_versions]
                            span.sq-version style={marginInlineEnd:4} "v"{s.version_number}
                          [if ins && ins.submission_versions.length > 0]
                            a.sq-link href={`/reports/inspection/${ins.id}`} "report"
                        td {canSeeSensitiveHistory ? [for each x in ins?.violations] <span.sq-lozenge.sq-lozenge--critical style={marginInlineEnd:4}>{x.violation_codes.code}</span> : <span.sq-caption>"restricted"</span>}
                        td.sq-caption {canSeeSensitiveHistory ? [for each a in ins?.action_forms] joined string : "restricted"}
                        td {canSeeSensitiveHistory ? [for each r,i in ins?.reviews.filter(decision)] <span[className]>{decision label}</span> : <span.sq-caption>"restricted"</span>}
          [if canSeeDocuments]
            section#documents.sq-surface style={padding:...}
              h4 style={marginBlockEnd:...} "Documents — metadata registry (SB11)"
              [if dErr]
                div.sq-banner.sq-banner--critical
                  div strong"Couldn't load documents." {mapFactoryError(dErr,"load")} " — " {retry} "."
              [if !dErr && docsEmpty]
                div.sq-state.sq-state--inline
                  span.sq-state__glyph "📄"
                  h4 "No documents recorded"
                  p.sq-caption "No source-backed document metadata is available."
              [if !dErr && !docsEmpty]
                <>
                  div.sq-tablewrap
                    table.sq-table
                      thead: tr: th"Type" th"Title" th"Reference" th.sq-td-num"Valid from" th.sq-td-num"Valid to" th"Status"
                      tbody
                        [for each d in docs]
                          tr
                            td span.sq-lozenge.sq-lozenge--info {docTypeLabel(d.doc_type)}
                            td strong{d.title}
                            td.sq-numeric {d.reference_no ?? "—"}
                            td.sq-td-num.sq-numeric {d.valid_from ?? "—"}
                            td.sq-td-num.sq-numeric {d.valid_to ?? "—"}
                            td span[badge.cls] {badge.label}
                  div.cd-docrow.is-unavail role="status"
                    span.cd-docrow__icon aria-hidden="true" "📄"
                    span "Document preview is unavailable — this surface exposes metadata and storage path only, with no signed URL, viewer or custody retrieval (HANDOFF_BLOCKED_DOCUMENT_VIEWER)."
                </>
          [if canSeeContacts]
            section#representatives.sq-surface style={padding:...}
              h4 style={marginBlockEnd:...} "Representatives (SB11)"
              [if rErr]
                div.sq-banner.sq-banner--critical
                  div strong"Couldn't load representatives." {mapFactoryError(rErr,"load")} " — " {retry} "."
              [if !rErr && repsEmpty]
                div.sq-state.sq-state--inline
                  span.sq-state__glyph "👤"
                  h4 "No representatives on record"
                  p.sq-caption "No source-backed factory contacts are available."
              [if !rErr && maskContacts && !repsEmpty]
                div.cd-masked role="status"
                  span aria-hidden="true" "🔒"
                  "Contact details are role-restricted for this persona (HANDOFF_BLOCKED_ROLE)."
              [if !rErr && !repsEmpty]
                div.sq-tablewrap
                  table.sq-table
                    thead: tr: th"Name" th"Role" [if !maskContacts] <>th"Phone" th"Email"</> th"Flags"
                    tbody
                      [for each r in reps]
                        tr
                          td strong{r.full_name}
                          td {r.role_title ?? "—"}
                          [if !maskContacts] <>td.sq-numeric{r.phone ?? "—"} td{r.email ?? "—"}</>
                          td
                            [if r.is_primary]
                              span.sq-lozenge.sq-lozenge--info style={marginInlineEnd:4} "primary"
                            span[className] {r.active ? "active" : "inactive"}
          section#products.sq-surface style={padding:...}
            h4 style={marginBlockEnd:...} "Products & HS codes (M07-006)"
            [if pErr]
              div.sq-banner.sq-banner--critical
                div strong"Couldn't load products." {mapFactoryError(pErr,"load")} " — " {retry} "."
            [if !pErr && productsEmpty]
              div.sq-state.sq-state--inline
                span.sq-state__glyph "📦"
                h4 "No products recorded"
                p.sq-caption "No source-backed products are available."
            [if !pErr && !productsEmpty]
              div.sq-tablewrap
                table.sq-table
                  thead: tr: th"Product" th.sq-td-num"HS code" th"Unit" th.sq-td-num"Annual capacity" th"Flags"
                  tbody
                    [for each p in products]
                      tr
                        td strong{p.name}
                        td.sq-td-num.sq-numeric {p.hs_code ?? "—"}
                        td {p.unit ?? "—"}
                        td.sq-td-num.sq-numeric {formatted capacity or "—"}
                        td {p.is_primary && <span.sq-lozenge.sq-lozenge--info>"primary"</span>}
          section#materials.sq-surface style={padding:...}
            h4 style={marginBlockEnd:...} "Raw materials (M07-007)"
            [if mErr]
              div.sq-banner.sq-banner--critical
                div strong"Couldn't load materials." {mapFactoryError(mErr,"load")} " — " {retry} "."
            [if !mErr && materialsEmpty]
              div.sq-state.sq-state--inline
                span.sq-state__glyph "🧱"
                h4 "No raw materials recorded"
                p.sq-caption "No source-backed raw materials are available."
            [if !mErr && !materialsEmpty]
              div.sq-tablewrap
                table.sq-table
                  thead: tr: th"Material" th"Source" th.sq-td-num"HS code"
                  tbody
                    [for each m in materials]
                      tr
                        td strong{m.name}
                        td span[className] {m.source === "local" ? "local" : "imported"}
                        td.sq-td-num.sq-numeric {m.hs_code ?? "—"}
          section#workforce.sq-surface style={padding:...}
            h4 style={marginBlockEnd:...} "Workforce & indicators — read-only from source (M07-008/009)"
            [if employees_total == null && capital_invested == null && production_capacity_note == null]
              div.sq-state.sq-state--inline
                span.sq-state__glyph "🏭"
                h4 "No workforce or indicator data synced"
                p.sq-caption "These figures arrive from the Factory list sync; they are not editable here."
            [else]
              <>
                div.sq-kpi-row
                  div.sq-surface.sq-kpi
                    span.sq-caption "Employees — total"
                    span.sq-kpi__value {formatted or "—"}
                  div.sq-surface.sq-kpi
                    span.sq-caption "Employees — Saudi"
                    span.sq-kpi__value {formatted or "—"}
                    [if saudization != null]
                      span.sq-kpi__delta "Saudization" {formatted}"%"
                  div.sq-surface.sq-kpi
                    span.sq-caption "Capital invested (SAR)"
                    span.sq-kpi__value {formatted or "—"}
                [if f.production_capacity_note]
                  p style={marginBlockStart:...}
                    strong "Production capacity"
                    " — " {f.production_capacity_note}
              </>
            p.sq-caption style={marginBlockStart:...} "Source-owned figures (Factory list sync), like identity — displayed only, never edited here." "synced" {formatted date or "—"}

undefined-classes: none

text-content:
Region
All regions
City
All cities
Filter by license status
All
Licensed
Unlicensed
of
factories
No factories in this region
Clear the filter to see the full Factory list.
Factory
CR
Region
City
Risk
View factory
Factory portfolio
Licensed factories
Unlicensed establishments
Regions represented
high
medium
low
Couldn't load factories.
The Factory list is temporarily unavailable. Nothing was changed.
retry
No factories in the list
Factory identity records sync from the national source (M07-002).
Factory 360
Factory 360 access required
You do not have access to factory profiles.
Portfolio · CR
Factories
High risk
Open violations
Active penalties
Licence
Plant
Type
Stage
Compliance
Open violations
Opened from Factory 360
Reason · portfolio selection
Create inspection
View on map
Open full dossier
Inspection submission remains unavailable while DEC-032 is unresolved.
Industrial licence
Plant number
Activity
Source record
Overall condition
Based only on the saved governed risk band. Compliance and enforcement are shown separately and are never inferred.
Saved risk
Risk band
Approved compliance
Not available
Open violations
Not available
Factory snapshot
Factory code
Commercial registration
Region
City
Activity
Licence state
Inspection history
Approved and submitted inspection records, immutable versions and report outcomes.
Violations & enforcement
Violation, corrective-action and penalty records attached to approved inspection evidence.
Industrial information
Products, materials, production lines, machinery and source reconciliation.
Documents & media
Governed factory documents and official media, separated from inspection evidence.
+
This section is available in the source-backed full dossier.
Open
Selected context
CR
Licence
Plant
Source status & freshness
Source record available
Freshness unavailable
No recorded synchronization timestamp.
Contextual AI
Provider output withheld
No generated factory claim is shown without an evidence-linked provider response.
Review authoritative evidence
Industrial license
Commercial registration
Safety certificate
Site layout
Other
Factory 360
Factory 360 access required
You do not have access to this factory profile.
Factory not found
Factory registration not found or not available to you.
retry
no expiry
expired
valid
Location & map
Health & risk
Case timeline
Inspection history
Documents
Representatives
Products
Materials
Workforce & Indicators
—
SB11
source
synced
Plan single visit
Start inspection plan
Inspection submission remains unavailable while DEC-032 is unresolved.
Identity — read-only from source (M07-002)
CR
license
license status / stage
issued / expires
license holder
CR legal name
CR status / owner
source
synced
Risk — reproducible (EV-004)
band
Recomputable from stored normalized inputs + this version; every calculation is retained.
last recalculated
No driver snapshot exists for this legacy score; the absence is preserved, not reconstructed.
Location
(GIS-Admin-owned, FND-007)
Geofence (G-MAP):
m
per-factory override
engine default (engine_settings gis.geofence_default_radius_m)
official / planned pin
observed arrival
GPS override
No observed inspection locations are recorded in your authorized scope.
Official coordinates are unavailable from the source.
Factory 360 sections
Official, planned and observed locations (M07-005)
Official coordinates remain source-owned. Arrival, check-in and override coordinates are locked inspection observations and never overwrite the Factory list.
When
Kind
Observed coordinates
Mismatch / reason
Visit
override reason unavailable
No observed locations are visible in your authorized scope.
Factory health score and risk history (M07-014/015)
Each row freezes the DEC-001 model version, normalized driver values, weights and contributions used at recalculation time.
Explain health score and risk drivers
Advisory only. Explains the saved score, band, model version and driver snapshot; it cannot recalculate or change risk.
Explain recorded drivers
AI explanation unavailable
Source references
Human decision required
Calculated
Score
Band
Model
Drivers
Legacy score — driver snapshot unavailable
No risk calculation history is available.
Related violations
No related violations are recorded.
Violation detail is restricted for this role.
Spatial Case Timeline
Source-labelled facts linking location context, inspections, findings, actions, reviews and the current risk version. Connective, not causal.
No case events recorded
The timeline populates once visits are planned and executed.
◉
Visit
planning
operational
Inspection
v
report
findings
Actions
due
Review
↻
Factory list synced
◆
Score updated
§
Penalty issued
●
Evidence captured
Inspection history — official records only (M07-011/012)
No visits recorded for this factory
History appears once visits are planned and executed.
Visit
Window
Planning
Operational
Inspection
Versions
Violations
Actions
Review
v
report
restricted
restricted
restricted
Documents — metadata registry (SB11)
Couldn't load documents.
No documents recorded
No source-backed document metadata is available.
Type
Title
Reference
Valid from
Valid to
Status
Document preview is unavailable — this surface exposes metadata and storage path only, with no signed URL, viewer or custody retrieval (HANDOFF_BLOCKED_DOCUMENT_VIEWER).
Representatives (SB11)
Couldn't load representatives.
No representatives on record
No source-backed factory contacts are available.
Contact details are role-restricted for this persona (HANDOFF_BLOCKED_ROLE).
Name
Role
Phone
Email
Flags
primary
active
inactive
Products & HS codes (M07-006)
Couldn't load products.
No products recorded
No source-backed products are available.
Product
HS code
Unit
Annual capacity
Flags
primary
Raw materials (M07-007)
Couldn't load materials.
No raw materials recorded
No source-backed raw materials are available.
Material
Source
HS code
local
imported
Workforce & indicators — read-only from source (M07-008/009)
No workforce or indicator data synced
These figures arrive from the Factory list sync; they are not editable here.
Employees — total
Employees — Saudi
Saudization
%
Capital invested (SAR)
Production capacity
Source-owned figures (Factory list sync), like identity — displayed only, never edited here.
synced

---

## /planning
file: apps/web/src/app/(app)/planning/page.tsx, apps/web/src/app/(app)/planning/PlanningPreview.tsx, apps/web/src/app/(app)/planning/RevampPlanningInsights.tsx, apps/web/src/app/(app)/planning/CreateVisitSection.tsx, apps/web/src/app/(app)/planning/DiscardDraftButton.tsx, apps/web/src/app/(app)/planning/ExportButton.tsx, apps/web/src/app/(app)/planning/RefreshButton.tsx, apps/web/src/app/(app)/planning/SavedViewsButton.tsx
structure:
  Shell.current="/planning" title=title (title="Planning" or "" — see below)
    [if access.error]
      EmptyState.glyph="⚠" title="Planning data unavailable" body="The planning workspace could not be loaded (ERR-OPS-001). Nothing was created or changed. Try again."
    [if access.accessClass !== "business_staff" || !access.can("planning.view")]
      EmptyState.glyph="⛔" title="Authorized role required" body="Visit Planning (SCR-WEB-100) is available to internal business staff. Inspector and administration accounts use their own workspaces."
    [if !list.ok || optionError]
      EmptyState.glyph="⚠" title="Planning data unavailable" body="The planning workspace could not be loaded (ERR-OPS-001). Nothing was created or changed. Try again."
    [if targetPreview]
      PlanningPreview.methods=methods drafts=... effectivePackage=... canCreate=... locale=locale
        (Shell context: span.sq-caption.sq-numeric "CR-001..CR-098 · WA-DES-036")
        div.sq-stack (data-saqeel-design="WA-DES-036")
          h1.sq-sr-only "Visit planning"
          [if effectivePackage !== undefined]
            div.sq-banner.sq-banner--success|sq-banner--warning (role="status")
              div
                strong "Effective package present" / "No effective package — publishing remains unavailable until configured"
                [if effectivePackage] " — " span.sq-numeric{effectivePackage} " · " {drafts.length} "drafts in progress"
          div.sq-row
            h2 "Planning methods"
            [if showVisits !== false]
              Link.sq-btn.sq-btn--subtle href="/planning/visits" "Visit management"
          div."wa-planning-methods ${styles.methods}"
            [for each method in methods]
              Link."sq-surface wa-planning-method ${styles.method}" href=method.href
                span."wa-planning-method__icon ${styles.icon}"
                  PlanningMethodIcon.href=method.href
                    svg (no text)
                span."wa-planning-method__copy ${styles.copy}"
                  strong {method.title}
                  span.sq-caption {method.desc}
          [if showPlans !== false]
            section.sq-surface
              div.panel-header
                h2#wa-m2-plans-heading "Visit plans"
                span.sq-lozenge.sq-lozenge--warning {drafts.length} "drafts in progress"
              [if drafts.length === 0]
                p.sq-caption "No planning drafts are visible in your authorized scope."
              [else]
                div.sq-tablewrap
                  table.sq-table
                    thead
                      tr
                        th "Plan"
                        th "Method"
                        th "Status"
                        th "Created"
                        th "Planner"
                        th (empty)
                    tbody
                      [for each draft in drafts]
                        tr
                          td.sq-numeric
                            strong {draft.planReference ?? draft.id.slice(0,8)}
                          td {draft.method}
                          td
                            span.sq-lozenge.sq-lozenge--info {draft.status}
                          td.sq-numeric {formatted draft.createdAt}
                          td {draft.planner}
                          td
                            Link.sq-link href=draft.href "Continue"
    [else — main render]
      div.sq-planning-heading
        h1 {title="Planning"}
        span "Create inspection visits — bulk, single or immediate"
      div.sq-planning-commandbar
        RefreshButton.label="Refresh" busyLabel="Refreshing…"
          button.sq-btn.sq-btn--secondary "Refresh" / "Refreshing…"
        [if access.can("planning.export")]
          ExportButton.params=params strings={label:"Export (CSV)", busyLabel:"Exporting…", unauthorized:"Export is not authorized for your account.", unavailable:"Export failed — nothing was downloaded. Try again.", cappedNote:"Exported the first {n} matching rows — refine the filters for the rest."}
            span.sq-row
              button.sq-btn.sq-btn--secondary "Export (CSV)" / "Exporting…"
              [if message] span.sq-caption (role="status") {message}
        SavedViewsButton.label="Saved views"
          div.sq-saved-views
            button.sq-btn.sq-btn--secondary "Saved views"
            [if open]
              section.sq-saved-views__menu
                header
                  strong "Saved views"
                  button "Save current view"
                [if views.length] [for each view in views]
                  div
                    a {view.name}
                    button aria-label="Delete {view.name}" "×"
                [else]
                  p "No saved views on this device."
        span (empty)
        [if access.can("planning.create")]
          CreateVisitSection.methods=methods strings={createLabel:"Create visit", oneMethodNote:"One planning method per creation session (M01-011 · REF-001)."}
            button.sq-btn (aria-expanded=open) "Create visit"
            [if open]
              section aria-label="Create visit"
                div.web-methods
                  [for each m in methods]
                    a.sq-surface.sq-panel href=m.href
                      span {m.glyph}
                      h3 {m.title}
                      p.sq-caption {m.desc}
                p.sq-caption "One planning method per creation session (M01-011 · REF-001)."
      RevampPlanningInsights.rows=visibleRows total=list.total returned=... strings={...}
        section.sq-planning-insights
          div
            strong "AI insights"
            p "Provider output is withheld; current governed planning records show:"
            ul
              li "{n} high-priority visits in the loaded planning page."
              li "{n} returned visits require planner attention."
              li "{n} loaded visits reach their recorded window end within 72 hours."
              li "{n} visits match the current RLS-scoped filters."
            div.sq-planning-insights__meta
              span "AI provider unavailable"
              small "Live record facts remain available"
          div
            strong "AI recommendations"
            [if recommendations.length] [for each row in recommendations]
              article.panel
                div
                  strong {row.factoryName ?? row.visitReference ?? row.id.slice(0,8)}
                  span "Governed priority" " · " {row.priority}
                p {row.region ?? "Region unavailable"} " · " "window ends" {formatted row.windowEnd}
                div
                  a.btn.btn-secondary href="/planning/single" "Plan"
                  a.btn.btn-ghost href="/visits/{row.id}" "Review"
            [else]
              p.desc "No high-priority recommendation candidate is visible in this page."
          div
            strong "Quick actions"
            a.btn.btn-secondary href="/planning?tab=returned"
              span "Returned visits"
              span.badge {returned}
            a.btn.btn-secondary href="/planning?priority=high"
              span "High-priority visits"
              span.badge {highRisk.length}
            a.btn.btn-secondary href="/planning?sort=window_asc"
              span "Nearest window expiry"
              span.badge {expiring.length}
            a.btn.btn-secondary href="/planning/bulk"
              span "Bulk planning"
              span.badge "→"
            a.btn.btn-secondary href="/planning/single"
              span "Single visit"
              span.badge "→"
            a.btn.btn-secondary href="/planning/immediate"
              span "Immediate visit"
              span.badge "→"
      div.sq-kpi-row (role="group" aria-label="Planning status tabs")
        [for each tab in PLANNING_TABS]
          a.sq-surface.sq-kpi (aria-current=params.tab===tab?"page":undefined)
            span.sq-overline {tabLabels[tab]}
            span.sq-kpi__value.sq-numeric {list.countsAvailable ? list.counts[tab] : "—"}
      form.sq-surface.sq-panel (method="get" action="/planning")
        [if params.tab !== "all"]
          input type="hidden" name="tab"
        label.sq-field
          span.sq-field__label "Search"
          input.sq-input type="search" name="q" placeholder="Visit reference, plan reference, CR, licence, factory or inspector…"
        label.sq-field
          span.sq-field__label "Planning type"
          select.sq-select name="method"
            option value="" "All"
            [for each m in ["bulk","single","immediate"]]
              option {enum label, fallback m}
        label.sq-field
          span.sq-field__label "Visit type"
          select.sq-select name="visitType"
            option value="" "All"
            [for each o in visitTypeOptions]
              option {lookupLabel(o)}
        label.sq-field
          span.sq-field__label "Priority"
          select.sq-select name="priority"
            option value="" "All"
            [for each o in priorityOptions]
              option {lookupLabel(o)}
        label.sq-field
          span.sq-field__label "Region"
          select.sq-select name="region"
            option value="" "All"
            [for each r in regionOptions]
              option {r}
        label.sq-field
          span.sq-field__label "City"
          select.sq-select name="city"
            option value="" "All"
            [for each c in cityOptions]
              option {c}
        label.sq-field
          span.sq-field__label "Inspector"
          select.sq-select name="inspectorId"
            option value="" "All"
            [for each i in inspectors]
              option {i.full_name}
        label.sq-field
          span.sq-field__label "Report package"
          select.sq-select name="packageVersionId"
            option value="" "All"
            [for each p in packageOptions]
              option {p.label}
        label.sq-field
          span.sq-field__label "Window from"
          input.sq-input.sq-numeric type="date" name="windowFrom"
        label.sq-field
          span.sq-field__label "Window to"
          input.sq-input.sq-numeric type="date" name="windowTo"
        label.sq-field
          span.sq-field__label "Created from"
          input.sq-input.sq-numeric type="date" name="createdFrom"
        label.sq-field
          span.sq-field__label "Created to"
          input.sq-input.sq-numeric type="date" name="createdTo"
        label.sq-field
          span.sq-field__label "Bulk plan reference"
          input.sq-input type="text" name="bulkPlanRef" placeholder="BP-…"
        label.sq-field
          span.sq-field__label "Sort"
          select.sq-select name="sort"
            [for each k in PLANNING_SORT_KEYS]
              option {sortLabels[k]}
        div.sq-row
          button.sq-btn.sq-btn--secondary type="submit" "Apply"
          a.sq-btn.sq-btn--subtle href="/planning" "Reset"
      [if visibleRows.length === 0]
        EmptyState.glyph="🗓" title="No visits match" body="No visits match the current tab, search and filters. Reset to see everything in your scope."
      [else]
        div.sq-tablewrap.planning-table-wrap
          table.sq-table.planning-visit-table (data-testid="planning-visit-table")
            thead
              tr
                th "Visit Reference"
                th "Planning Type"
                th "Planning Status"
                th "Operational State"
                th "Visit Type"
                th "Visit Mode"
                th "Priority"
                th "CR Number"
                th "Licence Number"
                th "Factory Name"
                th "Region"
                th "City"
                th "Assigned Inspector"
                th.sq-td-num "Window Start"
                th.sq-td-num "Window End"
                th.sq-td-num "Execution Date"
                th "Report Packages"
                th "Created By"
                th.sq-td-num "Created Date"
                th "Source Channel"
                th "Return Status"
                th "Bulk Plan Reference"
                th.sq-td-num "Last Update"
            tbody
              [for each row in visibleRows]
                tr
                  td.sq-numeric
                    a.sq-link href="/visits/{row.id}"
                      strong {row.visitReference ?? row.id.slice(0,8)}
                  td
                    span.planning-method {enum method label}
                  td
                    span."badge planning-status ${STATUS_TONE[row.planningStatus] ?? "badge-pending"}"
                      span.dot (aria-hidden)
                      {row.planningStatus === "validated" ? "draft" : enum label}
                  td {enum operationalState label, fallback spaces-for-underscore}
                  td {enum visitType label}
                  td {enum executionMode label}
                  td {row.priority ? enum priority label : "—"}
                  td.sq-numeric {row.crNumber or "—"}
                  td.sq-numeric {row.licenseNumber or "—"}
                  td.planning-cell-wrap {row.factoryName or "—"}
                  td {row.region or "—"}
                  td {row.city or "—"}
                  td.planning-cell-wrap {row.inspectorName or "—"}
                  td.sq-td-num.sq-numeric {formatted row.windowStart}
                  td.sq-td-num.sq-numeric {formatted row.windowEnd}
                  td.sq-td-num.sq-numeric {row.executionDate ? formatted : "—"}
                  td.planning-cell-wrap {row.packageTitles.join(", ") or "—"}
                  td {row.createdBy or "—"}
                  td.sq-td-num.sq-numeric {formatted row.createdAt}
                  td {row.sourceChannel or "—"}
                  td {row.returnReason ?? (returned ? "returned" : null) or "—"}
                  td.sq-numeric {row.method === "bulk" ? row.planReference or "—" : "—"}
                  td.sq-td-num.sq-numeric {lastUpdates[row.id] formatted or "—"}
      [if list.total > 0]
        div.sq-row
          span.sq-caption.sq-numeric "Showing {shown} of {total} · page {page} of {pages}"
          div.sq-row
            [if page > 1]
              a.sq-btn.sq-btn--subtle href=hrefWith(...) "← Previous"
            [if page < totalPages]
              a.sq-btn.sq-btn--subtle href=hrefWith(...) "Next →"
      [if drafts.length > 0]
        section.sq-surface.sq-panel
          h3 "Draft plans — continue where you left off"
          div.sq-tablewrap
            table.sq-table.planning-draft-table
              thead
                tr
                  th "Plan Reference"
                  th "Planning Type"
                  th "Planning Status"
                  th "Created By"
                  th.sq-td-num "Created Date"
                  th "Continue"
                  th "Discard"
              tbody
                [for each d in drafts]
                  tr
                    td.sq-numeric
                      strong {d.plan_reference ?? d.id.slice(0,8)}
                    td
                      span.planning-method {enum method label}
                    td
                      span.badge.badge-draft.planning-status
                        span.dot (aria-hidden)
                        "draft"
                    td {d.profiles?.full_name ?? "—"}
                    td.sq-td-num.sq-numeric {formatted d.created_at}
                    td
                      a.sq-link href=continueHref(d) "Continue"
                    td
                      [if user && d.created_by === user.id]
                        DiscardDraftButton.planId=d.id label="Discard" discardAria="Discard draft {ref}"
                          span
                            form
                              input type="hidden" name="plan_id"
                              button.sq-btn.sq-btn--subtle (aria-label=discardAria, disabled=busy) "Discard"
                            [if state.error]
                              span.sq-caption (role="alert") {state.error}
                      [else]
                        "—"
      p
        a.sq-link href="/planning/plans" "Visit plans — status, child visits and progress of every plan (M02-035)"
      p
        a.sq-link href="/visits" "Visit management — bulk actions and lenses over the same visits (/visits)"
undefined-classes: wa-planning-methods, wa-planning-method, wa-planning-method__icon, wa-planning-method__copy, web-methods
text-content:
Planning
The planning workspace could not be loaded (ERR-OPS-001). Nothing was created or changed. Try again.
Authorized role required
Visit Planning (SCR-WEB-100) is available to internal business staff. Inspector and administration accounts use their own workspaces.
Planning data unavailable
CR-001..CR-098 · WA-DES-036
Visit planning
Effective package present
No effective package — publishing remains unavailable until configured
drafts in progress
Planning methods
Visit management
Plan multiple visits
AND/OR criteria over the Factory list; many visits under one plan (M01-002).
Plan one visit
One registered factory via CR / Industrial License; one plan, one visit (M01-034/042).
Create an urgent visit
Unregistered factory allowed with mandatory location (M01-045/046).
Visit plans
Plan
Method
Status
Created
Planner
No planning drafts are visible in your authorized scope.
Continue
Create inspection visits — bulk, single or immediate
Refresh
Refreshing…
Export (CSV)
Exporting…
Export is not authorized for your account.
Export failed — nothing was downloaded. Try again.
Exported the first {n} matching rows — refine the filters for the rest.
Saved views
Save current view
No saved views on this device.
Create visit
One planning method per creation session (M01-011 · REF-001).
AI insights
Provider output is withheld; current governed planning records show:
{n} high-priority visits in the loaded planning page.
{n} returned visits require planner attention.
{n} loaded visits reach their recorded window end within 72 hours.
{n} visits match the current RLS-scoped filters.
AI provider unavailable
Live record facts remain available
AI recommendations
Governed priority
Region unavailable
window ends
Plan
Review
No high-priority recommendation candidate is visible in this page.
Quick actions
Returned visits
High-priority visits
Nearest window expiry
Bulk planning
Single visit
Immediate visit
Planning status tabs
All
Draft
Published
Returned
Cancelled
Expired
Search
Visit reference, plan reference, CR, licence, factory or inspector…
Planning type
All
Visit type
All
Priority
All
Region
All
City
All
Inspector
All
Report package
All
Window from
Window to
Created from
Created to
Bulk plan reference
BP-…
Sort
Apply
Reset
No visits match
No visits match the current tab, search and filters. Reset to see everything in your scope.
Visit Reference
Planning Type
Planning Status
Operational State
Visit Type
Visit Mode
Priority
CR Number
Licence Number
Factory Name
Region
City
Assigned Inspector
Window Start
Window End
Execution Date
Report Packages
Created By
Created Date
Source Channel
Return Status
Bulk Plan Reference
Last Update
draft
Showing {shown} of {total} · page {page} of {pages}
← Previous
Next →
Draft plans — continue where you left off
Plan Reference
Planning Type
Planning Status
Created By
Created Date
Continue
Discard
draft
Discard draft {ref}
Visit plans — status, child visits and progress of every plan (M02-035)
Visit management — bulk actions and lenses over the same visits (/visits)

---

## /execution
file: apps/web/src/app/(app)/execution/page.tsx, apps/web/src/app/(app)/execution/RevampExecutionWorkspace.tsx, apps/web/src/app/(app)/execution/error.tsx, apps/web/src/app/(app)/execution/loading.tsx, apps/web/src/components/saqeel/feedback/StateSurface.tsx, apps/web/src/components/saqeel/feedback/Skeleton.tsx
structure:
  Shell.current="/execution".title=""
    [if isAdminOnlyPersona(roleKeys) || !canReadExecution]
      section.sq-access-refusal role="alert"
        span aria-hidden="true"   "🔒"
        h1   "You do not have access to this destination"
        p   "The destination stays visible so the platform remains legible, and access is refused here, at the boundary."
        div
          a.sq-btn href="/profile"   "Request access"
          a.sq-btn.sq-btn--secondary href="/dashboard"   "Back to default state"
        small   "Execution is refused for an Administrator-only persona. Backend RLS remains authoritative."
    [if executionError]
      div.sq-banner.sq-banner--critical role="alert"
        div
          strong   "Execution data is temporarily unavailable."
          text   "Nothing was changed; retry this destination."
    [else, default success render]
      RevampExecutionWorkspace.rows currentUserId locale totalVisibleRows
        div.sq-execution
          h1.sq-sr-only   "Inspection Execution"
          div.sq-banner.sq-banner--critical role="status"
            div
              strong   "Submission service unavailable."
              text   "Inspection preparation and execution records remain available, but real submission is blocked by DEC-032. No successful submission is claimed from this destination."
          [if totalVisibleRows > rows.length]
            div.sq-banner role="status"
              div
                strong   "Bounded result set."
                text   "Showing `${rows.length.toLocaleString("en-GB")}` non-fixture rows from a 1,000-row bounded fetch; `${totalVisibleRows.toLocaleString("en-GB")}` visits are RLS-visible. Fixtures and records beyond the bound are not claimed visible here."
          section.sq-execution__week
            div
              strong   "Week" (or "Five-week view") " " (formatted date range text)
              span
                button aria-pressed={calendarMode === "week"}   "Week"
                button aria-pressed={calendarMode === "month"}   "Month"
            div.sq-execution__days
              [for each day in calendarDays]
                article key={key} onDragOver onDrop
                  header
                    span   (formatShort(locale, day))
                    span   "`${dayRows.length}` visit`${dayRows.length === 1 ? "" : "s"}`" (or empty string if no dayRows)
                  [for each row in dayRows.slice(0, 4)]
                    a href={row.inspectorId === currentUserId ? `/field/${row.id}` : `/visits/${row.id}`} data-risk draggable onDragStart   {row.factory}
            p   "Dragging a visit onto a day opens the configuration drawer with the planning window enforced — it never silently reschedules."
          div.sq-execution__viewbar
            nav aria-label="Execution view"
              button aria-pressed={view === "mine"}   "My inspections"
              button aria-pressed={view === "all"}   "All inspections"
              button aria-pressed={view === "map"}   "Location context"
            span
              i (empty)
              text   "Map markers use recorded official factory coordinates—not live inspector tracking."
          div.sq-execution__filters
            input type="search" placeholder="Search factory, CR, licence…"
            button aria-pressed={!!filters.inspector}   "Inspector" (or "Inspector: {value}")
            button aria-pressed={!!filters.region}   "Region" (or "Region: {value}")
            button aria-pressed={!!filters.risk}   "Risk" (or "Risk: {value}")
            button aria-pressed={!!filters.visitMode}   "Visit mode" (or "Visit mode: {value}")
            button aria-pressed={!!filters.operationalState}   "Operational state" (or "Operational state: {value}")
            button aria-pressed={!!filters.priority}   "Priority" (or "Priority: {value}")
            [if Object.keys(filters).some(key => filters[key])]
              button   "Clear filters"
          [if view === "map"]
            section.sq-execution__map
              [if markers.length]
                GeoMap.center=[23.8859, 45.0792] zoom=5 markers height="100%" ariaLabel="Official factory location map"
              [else]
                div
                  strong   "No governed coordinates in this view"
                  p   "The table views remain fully usable."
          [else]
            section.sq-execution__tablewrap
              table
                thead
                  tr
                    th   "Visit ref"
                    th   "Factory"
                    th   "Planning window"
                    th   "Execution date"
                    th   "Visit type"
                    th   "Visit mode"
                    th   "Risk"
                    [if view === "all"]
                      th   "Inspector"
                      th   "Region / city"
                    th   "Operational state"
                    [if view === "mine"]
                      th   "Preparation"
                      th   "Report type"
                    [if view === "all"]
                      th   "Location data"
                    th   "Action"
                tbody
                  [for each row in visibleRows]
                    tr key={row.id}
                      th scope="row" data-label="Visit ref"   {row.visitReference}
                      td data-label="Factory"   {row.factory}
                      td data-label="Planning window"   (formatDate windowStart) " – " (formatDate windowEnd)
                      td data-label="Execution date"   (formatDate executionDate)
                      td data-label="Visit type"   (titleCase visitType)
                      td data-label="Visit mode"   (titleCase visitMode)
                      td data-label="Risk"
                        span data-tone={row.risk ?? ""}   (titleCase risk)
                      [if view === "all"]
                        td data-label="Inspector"   {row.inspector ?? "Unassigned"}
                        td data-label="Region / city"   ([row.region, row.city] joined or "—")
                      td data-label="Operational state"
                        span   (titleCase operationalState)
                      [if view === "mine"]
                        td data-label="Preparation"   (titleCase planningStatus)
                        td data-label="Report type"   {row.reportType ?? "Not configured"}
                      [if view === "all"]
                        td data-label="Location data"   "Official factory coordinates recorded" (or "No official coordinates")
                      td data-label="Action"
                        a href={row.inspectorId === currentUserId ? `/field/${row.id}` : `/visits/${row.id}`}   "Prepare" (or "Open" or "View")
              [if !visibleRows.length]
                p   "No RLS-visible inspections match this view and filter."
          [if reschedule]
            div.sq-execution__drawer role="dialog" aria-modal="true" aria-labelledby="reschedule-title"
              button aria-label="Close configuration drawer"   "×"
              p.sq-overline   "Planning window guard"
              h2 id="reschedule-title"   "Configure" " " {reschedule.row.visitReference}
              p
                strong   {reschedule.row.factory}
                text   "was dropped on `${formatDate(locale, reschedule.date)}`. No date has been changed."
              div.sq-banner
                strong   "Current governed window:"
                text   (formatDate windowStart) " – " (formatDate windowEnd) ". " "The planning workflow validates conflicts and records the change."
              a.sq-btn href={`/planning/visits/${reschedule.row.id}?proposedDate=${encodeURIComponent(reschedule.date)}`}   "Continue in Planning"
              button.sq-btn.sq-btn--secondary type="button"   "Cancel"

## /execution/error (error.tsx)
  StateSurface.kind="error" title="Execution unavailable" body body={`No inspection state was changed.${error.digest ? \` Reference ${error.digest}.\` : ""}`} action={button}
    section.saqeel-state.saqeel-state--error role="alert" data-state-kind="error"
      span.saqeel-state__glyph
        StateGlyph.kind="error"
          svg (circle + path, aria-hidden)
      div.saqeel-state__content
        h2   "Execution unavailable"
        p   "No inspection state was changed.` Reference ${error.digest}.`" (digest suffix conditional)
        div.saqeel-state__action
          button.sq-btn.sq-btn--secondary type="button"   "Retry"

## /execution/loading (loading.tsx)
  StateSurface.kind="loading" title="Loading Execution" body="Loading the governed calendar, assignments, and operational states in your scope."
    section.saqeel-state.saqeel-state--loading aria-busy="true" aria-label="Loading Execution" data-state-kind="loading"
      Skeleton.width="38%" height=22
        span.skeleton
      div.saqeel-state__skeletons aria-hidden="true"
        Skeleton.height=28
          span.skeleton
        Skeleton.height=28
          span.skeleton
        Skeleton.height=28
          span.skeleton
        Skeleton.width="72%" height=28
          span.skeleton
      p.t-caption   "Loading the governed calendar, assignments, and operational states in your scope."

undefined-classes: none
text-content:
🔒
You do not have access to this destination
The destination stays visible so the platform remains legible, and access is refused here, at the boundary.
Request access
Back to default state
Execution is refused for an Administrator-only persona. Backend RLS remains authoritative.
Execution data is temporarily unavailable.
Nothing was changed; retry this destination.
Inspection Execution
Submission service unavailable.
Inspection preparation and execution records remain available, but real submission is blocked by DEC-032. No successful submission is claimed from this destination.
Bounded result set.
Showing `${rows.length.toLocaleString("en-GB")}` non-fixture rows from a 1,000-row bounded fetch; `${totalVisibleRows.toLocaleString("en-GB")}` visits are RLS-visible. Fixtures and records beyond the bound are not claimed visible here.
Week
Five-week view
Week
Month
Dragging a visit onto a day opens the configuration drawer with the planning window enforced — it never silently reschedules.
Execution view
My inspections
All inspections
Location context
Map markers use recorded official factory coordinates—not live inspector tracking.
Search factory, CR, licence…
Inspector
Region
Risk
Visit mode
Operational state
Priority
Clear filters
No governed coordinates in this view
The table views remain fully usable.
Official factory location map
Visit ref
Factory
Planning window
Execution date
Visit type
Visit mode
Risk
Inspector
Region / city
Operational state
Preparation
Report type
Location data
Action
Unassigned
—
Official factory coordinates recorded
No official coordinates
Prepare
Open
View
No RLS-visible inspections match this view and filter.
×
Planning window guard
Configure
was dropped on `${formatDate(locale, reschedule.date)}`. No date has been changed.
Current governed window:
The planning workflow validates conflicts and records the change.
Continue in Planning
Cancel
Close configuration drawer
Execution unavailable
No inspection state was changed.
Retry
Loading Execution
Loading the governed calendar, assignments, and operational states in your scope.

---

## /reviews
file: apps/web/src/app/(app)/reviews/page.tsx, apps/web/src/app/(app)/reviews/ReviewQueue.tsx, apps/web/src/app/(app)/reviews/[id]/page.tsx, apps/web/src/app/(app)/reviews/[id]/DecisionPanel.tsx, apps/web/src/app/(app)/reviews/[id]/RecordTabs.tsx, apps/web/src/app/(app)/reviews/[id]/StartReview.tsx, apps/web/src/app/(app)/reviews/[id]/VersionCompare.tsx, apps/web/src/app/(app)/reviews/[id]/FindingTraceChain.tsx
structure (list):
  Shell current="/reviews" title="Inspection review queue"
    context: span.sq-lozenge.sq-lozenge--info                "Read-only queue"
    [if !authorized]
      main.{styles.reviewRoot}
        section.sq-surface.cd-panelpad.cd-result role="alert"
          div.cd-result__row
            div.cd-result__icon.cd-result__icon--critical aria-hidden="true"   "⛔"
            div.cd-stack
              h2                "You don't have access to the review queue"
              p                 "This queue requires the Level 2 Reviewer role and matching scope. Navigation visibility is not authorization."
    [else, authorized]
      main.{styles.reviewRoot}
        div.sq-banner role="note"
          div
            strong             "Review overview"
            text               " — "
            text               "Opening is read-only. Starting and deciding are explicit audited actions in the workspace."
        [if reviewDays == null]
          div.sq-banner.sq-banner--warning role="note"
            div
              strong           "SLA configuration missing"
              text             " — "
              text             "No review deadline is derived. Rows remain unavailable rather than being reported on time."
        [if degraded]
          div.sq-banner.sq-banner--warning role="alert"
            div
              strong           "Some linked information is unavailable"
              text             " — "
              text             "The queue loaded, but one or more RLS-scoped linked sources could not be read. Those facts remain unavailable."
        [if rows.length === 0] section.sq-surface.cd-panelpad.cd-result role="status"
          div.cd-result__row
            div.cd-result__icon.cd-result__icon--ok aria-hidden="true"   "✓"
            div.cd-stack
              h2               "No inspections awaiting review"
              p                "No reviews in your scope await a Level 2 decision."
        [else] ReviewQueue rows={queueRows} statusOptions={statusOptions} riskOptions={riskOptions} strings={strings}
          div.cd-queue
            section.panel.cd-panelpad
              div.cd-sectionhead
                h2             "Review readiness"
              p.cd-sub          "Facts come from RLS-scoped records. Unreadable facts remain unavailable."
            div.panel.cd-filters
              label.cd-fl.cd-fl--search
                span.cd-fl__k   "factory, code or inspector…"
                input.sq-input placeholder="factory, code or inspector…" aria-label="Search the review queue"
              div.seg role="group" aria-label="All statuses"
                [for each option in statusOptions]
                  button.seg-opt type="button" aria-pressed={status === option.value}   "<option.label>"
              label.cd-fl
                span.cd-fl__k   "All risk levels"
                select.sq-select aria-label="All risk levels"
                  option value=""  "All risk levels"
                  [for each option in riskOptions]
                    option value={option.value}   "<option.label>"
              label.cd-choice
                input type="checkbox"
                span              "Overdue only"
              [if hasFilter]
                button.btn.btn-ghost.btn-touch type="button"   "Clear filters"
              span.t-caption.numeric style={{marginInlineStart:"auto"}}   "{shown} of {total}"
              [if filtered.length === 0]
                section.panel.cd-panelpad.cd-result role="status"
                  div.cd-result__row
                    div.cd-result__icon.cd-result__icon--neutral aria-hidden="true"   "⌕"
                    div.cd-stack
                      h2         "No reviews match the filters"
                      p          "Adjust or clear the search, status, risk and overdue filters."
              [else]
                div.sq-tablewrap
                  table.sq-table.cd-table
                    thead
                      tr
                        th scope="col"   "Factory"
                        th scope="col"   "Inspector"
                        th scope="col"   "Type · mode"
                        th scope="col"   "Version"
                        th scope="col"   "Review readiness"
                        th scope="col"   "Status"
                        th scope="col"   "Review"
                    tbody
                      [for each row in filtered]
                        tr.{!row.readable || row.unassigned ? "cd-row--flag" : ""}
                          td
                            div.cd-fname                   (row.factoryName)
                            div.cd-sub.cd-mono
                              bdi                           (row.factoryCode)
                              text                          " · "
                              bdi                           (row.id.slice(0,8))
                            [if row.unassigned]
                              div.cd-sub.cd-warn             "Unassigned reviewer"
                                span.cd-tag.cd-tag--blocked  "claim/reassign unavailable"
                          td                                (row.inspectorName || "—")
                          td.cd-sub                          (row.typeLabel) " · " (row.modeLabel)
                          td
                            span.sq-version                  "v" (row.versionNumber ?? "—")
                            div.cd-sub.cd-mono.numeric       (row.submittedDisplay)
                          td: Fingerprint row={row} strings={strings.fp}
                            [if !row.readable]
                              div.cd-fp.cd-fp--flag
                                span.cd-tag.cd-tag--warn     "Evidence not yet readable"
                                span.cd-sub                  "A linked source could not be read. It is not counted as ready."
                            [else]
                              div.cd-fp
                                div.cd-fp__row
                                  [if row.slaState === "none"]
                                    span.cd-fpchip.cd-fpchip--unknown title="Deadline unavailable — required configuration or timestamp is missing"
                                      span.cd-fpchip__g aria-hidden="true"   "◇"
                                      text                    "Deadline: unavailable"
                                  [else]
                                    span.{`cd-fpchip cd-fpchip--${row.slaState === "overdue" ? "bad" : "ok"}`}
                                      span.cd-fpchip__g aria-hidden="true"   (row.slaState === "overdue" ? "▲" : "✓")
                                      text                    "Deadline: " (row.slaState === "overdue" ? "overdue" : "on time")
                                  span.{`sq-lozenge ${row.riskBand ? row.riskTone : ""}`}   "Risk: " (row.riskBand ? row.riskLabel : "unavailable")
                                  [if row.criticalCount > 0]
                                    span.badge.badge-critical   (row.criticalCount) " " "critical (L1)"
                                  [else]
                                    span.cd-sub               "0 " "critical (L1)"
                                  [if row.priorityLabel]
                                    span.badge.badge-info      "priority: " (row.priorityLabel)
                                div.cd-fp__row
                                  [for each fact in [checklist,evidence,ack,factory]] FactChip label=... fact=row.readiness.<fact> valueLabel=...
                                    span.{`cd-fpchip cd-fpchip--${FACT_KIND[fact]}`}
                                      span.cd-fpchip__g aria-hidden="true"   (glyph)
                                      text                      "<label>: <valueLabel>"
                          td
                            span.{`sq-lozenge sq-lozenge--review ${row.statusTone}`}   (row.statusLabel)
                          td
                            a.btn.btn-secondary.btn-touch href={row.href} title="Opens the review read-only. Starting and deciding happen there as explicit audited actions."   "Open review"
        div.sq-banner.sq-banner--warning role="note"
          div
            strong             "Submission integrity blocker"
            text               " — "
            text               "DEC-032 blocks claims that new real inspection submissions are available end to end. Existing RLS-visible review records remain readable; this queue does not bypass that platform blocker."
        div.sq-banner.sq-banner--immutable
          div
            strong             "Decisions are immutable"
            text               " — decided reviews cannot be edited. Every resubmission creates a new preserved version."
structure (detail):
  [if authError]
    Shell current="/reviews" title="Could not load"
      section.sq-surface.cd-panelpad.cd-result role="alert"
        h3 tabIndex={-1}         "Could not load"
        p                        "The record could not be fetched — the data source may be degraded. Try again."
  [else if roleReadError]
    Shell current="/reviews" title="Could not load"
      section.sq-surface.cd-panelpad.cd-result role="alert"
        h3 tabIndex={-1}         "Could not load"
        p                        "The record could not be fetched — the data source may be degraded. Try again."
  [else if !authorized]
    Shell current="/reviews" title="You don't have access to this review"
      section.sq-surface.cd-panelpad.cd-result role="alert"
        div.cd-result__row
          div.cd-result__icon.cd-result__icon--critical aria-hidden="true"
            IconBlocked size={24}
          div.cd-stack
            h3 tabIndex={-1}     "You don't have access to this review"
            p                    "This workspace requires the Level 2 Reviewer role and matching scope. Navigation visibility is not authorization."
  [else if !ins]
    Shell current="/reviews" title={insErr ? "Could not load" : "Not found"}
      EmptyState glyph="…" title={insErr ? "Could not load" : "Not found"} body={insErr ? "The record could not be fetched — the data source may be degraded. Try again." : "No record matches this ID or it is outside your permitted scope."}
  [else, main render]
    Shell current="/reviews" title="Review — {factory}"
      context:
        span.sq-version          "v" (latest?.version_number) " · " "latest"
        span.sq-lozenge.sq-lozenge--review.sq-lozenge--info   (status label)
        [if !canDecide]
          span.sq-lozenge.sq-lozenge--warning   "{role} · read-only"
        a.btn.btn-secondary.btn-sm href={/factories/${f.id}}   "Open Factory 360"
        a.btn.btn-secondary.btn-sm href={/reports/inspection/${ins.id}}   "Inspection report PDF"
      div.{responsive.reviewRoot} data-saqeel-migration="review-approvals" data-saqeel-screen="SCR-WEB-310"
        h1.{responsive.semanticTitle}   "Review — {factory}"
        [if receiptCorrelation && receiptDecision]
          div.sq-banner.sq-banner--success role="status"
            div
              strong              "Decision recorded atomically."
              text                (receiptDecision label)
              text                " · " "correlation" " "
              bdi.sq-numeric      (receiptCorrelation)
              [if receiptComment]
                text              " · " "comment" " "
                bdi.sq-numeric    (receiptComment)
              [if receiptHandoff]
                text              " · " "Compliance handoff" " "
                bdi.sq-numeric    (receiptHandoff)
              [if !receiptHandoff && receiptDecision === "approve"]
                text              " · " "Compliance handoff ID unavailable — do not claim handoff completion."
        div.sq-banner.sq-banner--immutable
          div
            strong                "Read-only submitted version."
            text                  "Content edits are impossible — the database rejects them (proven B3). Corrections happen only via Return with exact scope."
        FindingTraceChain traces={traceRows} strings={traceStrings}
          section.panel.sq-trace aria-labelledby="finding-trace-heading"
            h2 id="finding-trace-heading"   "Finding trace chain"
            p.t-caption           "Question → response → evidence → clause → violation → corrective action → decision comment. Each link is labelled by its source and version; unavailable links are never inferred."
            [if traces.length === 0]
              div.sq-banner role="status"
                div               "No checklist answers are available to build the trace chain."
            [else]
              ol.sq-trace__list
                [for each trace in traces]
                  li.sq-trace__item
                    details open
                      summary.sq-trace__summary
                        span.numeric   (trace.key)
                        span           (trace.question.value)
                      dl.sq-trace__nodes
                        [for each node in [question,response,evidence,clause,violation,action,decision]] Node node={{...trace.<field>, label: strings.<field>}}
                          div.sq-trace__node
                            dt.sq-overline   (node.label ?? "")
                            dd
                              [if node.unavailable] span.badge.badge-warning   "○ " (node.value)
                              [else] (node.value)
                              span.t-caption.sq-trace__source   (node.source)
        div.cd-review-workspace-grid
          div.sq-stack
            RecordTabs tabs={recordTabs} panels={[7 panel blocks]}
              div.tabs role="tablist"
                [for each tab, index in tabs]
                  button.{`tab${index===active?" is-active":""}`} type="button" role="tab" aria-selected={index===active}
                    text          (tab.label) " "
                    span.tab-count   (tab.count)
              [panels[active] — one of the 7 blocks below is shown at a time]

              PANEL 1 "checklist":
                div.sq-surface style={{padding:"var(--space-6)"}} key="checklist"
                  h2 style={{marginBlockEnd:"var(--space-3)"}}   "Checklist — v{n}"
                  div.sq-tablewrap
                    table.sq-table
                      thead
                        tr
                          th scope="col"   "Item"
                          th scope="col"   "Response"
                      tbody
                        [for each [k,v] in Object.entries(latest?.snapshot?.answers ?? {})]
                          tr
                            td: strong   (k)
                            td: span.{`sq-lozenge ${v==="non_compliant"?"sq-lozenge--critical":"sq-lozenge--success"}`}   (enum label of v)

              PANEL 2 "evidence":
                div.sq-surface style={{padding:"var(--space-6)"}} key="evidence"
                  h2 style={{marginBlockEnd:"var(--space-3)"}}   "Violations · actions · evidence (read-only)"
                  [for each v,i in ins.violations]
                    p
                      span.sq-lozenge.sq-lozenge--critical   (v.violation_codes.code) " · " (level label)
                      text        " " (v.violation_codes.title) " "
                      span.sq-version   "mapping" " " (v.mapping_version)
                  [for each a,i in ins.action_forms]
                    p.sq-caption style={{marginBlockStart:8}}
                      text        "action:" " " (a.required_correction) " — " (a.owner_name) ", " "due" " " (formatted due date) " · " (status label)
                  [if evidenceRows.length === 0]
                    div.sq-banner role="status"
                      div         "No evidence records are attached to this submitted inspection."
                  [else]
                    div.sq-tablewrap
                      table.sq-table
                        thead
                          tr
                            th scope="col"   "Source"
                            th scope="col"   "Type"
                            th scope="col"   "Immutable reference"
                        tbody
                          [for each e,index in evidenceRows]
                            tr
                              td   (linked-type label) " · " bdi.sq-numeric (e.linked_id)
                              td   (evidence-type label)
                              td.sq-numeric
                                IconPaperclip size={16}
                                text " "
                                bdi   (e.storage_path)
                                br
                                text "sha256 " (e.content_sha256 ?? "unavailable")
                  p.sq-caption   "Media bytes cannot be previewed because no authorized signed-URL contract is available on this route. Metadata remains read-only; the UI does not expose or guess a public URL."

              PANEL 3 "factory":
                div.sq-surface style={{padding:"var(--space-6)"}} key="factory"
                  h2 style={{marginBlockEnd:"var(--space-3)"}}
                    text        "Factory data verification (Senaei source vs observed)"
                    span.{`sq-lozenge ${fvUpdated?"sq-lozenge--warning":"sq-lozenge--success"}`}
                      text      (fvUpdated ? "{n} field(s) updated" : "no changes vs source")
                  [if fv.error]
                    p.sq-caption   "Verification data is temporarily unavailable. Source-versus-observed comparison cannot be shown yet."
                  [else if fv.checks.length === 0]
                    p.sq-caption   "No factory-field checks recorded for this inspection."
                  [else]
                    div.sq-tablewrap
                      table.sq-table
                        thead
                          tr
                            th scope="col"   "Field"
                            th scope="col"   "Before — source (Senaei)"
                            th scope="col"   "After — observed"
                            th scope="col"   "Status"
                            th scope="col"   "Evidence"
                        tbody
                          [for each c in fv.checks]
                            tr style={c.status==="updated" ? {background:"var(--surface-sunken)"} : undefined}
                              td style={c.status==="updated" ? {borderInlineStart:"4px solid var(--status-warning)"} : undefined}
                                strong   (field label)
                              td   (c.source_value ?? "—")
                              td   (c.observed_value ?? "—")
                              td: span.{`sq-lozenge ${c.status==="verified"?"sq-lozenge--success":"sq-lozenge--warning"}`}   (status label)
                              td.sq-numeric
                                text   (fvEvCount(c.id) || "—")
                                [if c.evidence_note]
                                  div.sq-caption   (c.evidence_note)
                  p.sq-caption style={{marginBlockStart:"var(--space-3)"}}   "Observations never modify the Senaei source record; checks are audit-logged with before/after values."

              PANEL 4 "ack":
                div.sq-surface style={{padding:"var(--space-6)"}} key="ack"
                  [if latest?.acknowledgement != null]
                    h2 style={{marginBlockEnd:"var(--space-3)"}}   "Acknowledgement signature (DEC-009)"
                    p
                      strong   (ack.name ?? "—")
                      text     " · "
                      span.sq-numeric   (formatted signed date or "—")
                      text     " "
                      span.sq-version   "v" (latest.version_number)
                    [if ack.signature_data_url]
                      img src={ack.signature_data_url} alt="Representative signature" style={{maxInlineSize:280,maxBlockSize:120,background:"var(--surface-sunken)",border:"1px solid var(--border-subtle)",borderRadius:"var(--radius-sm)"}}
                    [else]
                      p.sq-caption   "No drawn signature stored with this version (acknowledged by name only)."
                  [else]
                    h2 style={{marginBlockEnd:"var(--space-3)"}}   "Acknowledgement signature (DEC-009)"
                    p.sq-caption   "No drawn signature stored with this version (acknowledged by name only)."

              PANEL 5 "compare":
                [if latest]
                  VersionCompare key="compare" versions={compareVersions} itemSection={itemSection} returnedScope={returnedScope} scopeLabel={scopeLabel} strings={compareStrings}
                    div.panel.cd-version-compare style={{padding:"var(--space-6)"}}
                      h2 style={{marginBlockEnd:"var(--space-3)"}}   "Version comparison — Tamper-evident Scope Rail"
                      [if staleAt != null]
                        div.sq-banner.sq-banner--warning role="alert" style={{marginBlockEnd:"var(--space-3)"}}
                          div
                            strong   "A newer version was submitted."
                            text     " " "Version v{n} arrived while you had this open — refresh before relying on this comparison." " "
                            button.btn.btn-ghost.btn-touch type="button"   "Refresh"
                      div.row style={{gap:"var(--space-4)",flexWrap:"wrap",marginBlockEnd:"var(--space-4)"}}
                        div.sq-field style={{maxInlineSize:220}}
                          label.sq-field__label htmlFor="cmp-from"   "Compare from"
                          select.sq-select id="cmp-from"
                            [for each n in numbers] option   "v" (n)
                        div.sq-field style={{maxInlineSize:220}}
                          label.sq-field__label htmlFor="cmp-to"   "Compare to"
                          select.sq-select id="cmp-to"
                            [for each n in numbers] option   "v" (n)
                      p.t-caption style={{marginBlockEnd:"var(--space-3)"}}   (scopeKnown ? "Returned-scope authority (stored): {label}. Classification is never inferred from the diff." : "No returned scope on record — expected/unexpected cannot be established, so changes are shown 'unavailable', never 'unchanged'.")
                      p.t-caption style={{marginBlockEnd:"var(--space-3)"}}   "Comparison is navigation-only — there is no accept/merge action. When a diff is shown, selecting a scope-rail row scrolls to its answer."
                      [if fromN === undefined]
                        div.sq-banner role="status"
                          div   "No prior version to compare — this is the first submitted version."
                      [else]
                        [if tamper]
                          div.sq-banner.sq-banner--critical role="alert"
                            div: strong   "Out-of-scope change detected."   text " " "An answer changed outside the sections the reviewer returned. Read every flagged row before deciding."
                        [else if scopeKnown && changedRows.length > 0]
                          div.sq-banner.sq-banner--success role="status"
                            div: strong   "Changes within returned scope."   text " " "Every changed answer falls inside the returned sections. Non-answer comparisons remain unavailable below."
                        div.stack style={{gap:"var(--space-2)",marginBlock:"var(--space-4)"}} aria-label="Version comparison — Tamper-evident Scope Rail"
                          [for each cat in [unexpected,expected,unavailable,unchanged]]
                            div.panel style={{padding:"var(--space-3)"}}
                              button.btn.btn-ghost.btn-touch type="button" aria-expanded={open[cat]} aria-controls={panelId} style={{inlineSize:"100%",justifyContent:"flex-start",gap:"var(--space-3)"}}
                                span.{LOZ[cat]} aria-hidden="true"   (glyph)
                                span   (category label)
                                span.numeric style={{marginInlineStart:"auto"}}   (count)
                              [if open[cat]]
                                ul id={panelId} style={{listStyle:"none",margin:0,padding:"var(--space-2) 0 0",display:"flex",flexDirection:"column",gap:2}}
                                  [if items.length === 0]
                                    li.t-caption   (cat==="unavailable" && !scopeKnown ? "No returned scope on record — expected/unexpected cannot be established, so changes are shown 'unavailable', never 'unchanged'." : "—")
                                  [else, for each r in items]
                                    li
                                      button.btn.btn-ghost.btn-touch type="button" style={{inlineSize:"100%",justifyContent:"flex-start",gap:"var(--space-3)"}}
                                        span.numeric   (r.key)
                                        [if r.section] span.t-caption   (r.section.title)
                        [if changedRows.length === 0]
                          div.sq-banner role="status"
                            div   "No answer changed between these two versions (computed from stored snapshots — not a failure)."
                        [else]
                          div.sq-tablewrap
                            table.sq-table.cd-compare-table
                              thead
                                tr
                                  th scope="col"   "Item"
                                  th scope="col"   "Section"
                                  th scope="col"   "v" (fromN)
                                  th scope="col"   "v" (toN)
                                  th scope="col"   "Scope classification"
                              tbody
                                [for each r in rows]
                                  tr id={`cmp-${r.key}`} data-changed={...} tabIndex={-1} style={r.category==="unexpected" ? {borderInlineStart:"4px solid var(--status-critical)"} : undefined}
                                    td: strong.numeric   (r.key)
                                    td   [if r.section] (r.section.title) [else] span.badge.badge-warning aria-hidden="false"   (glyph) " " "Unavailable"
                                    td   (r.prev != null ? enumLabel : "—")
                                    td   (r.latest != null ? enumLabel : "—")
                                    td: span.{LOZ[r.category]}
                                      span aria-hidden="true"   (glyph)
                                      text   " " (category label)
                      div.panel style={{padding:"var(--space-3)",marginBlockStart:"var(--space-4)"}}
                        h3   "Immutable collection comparison"
                        [for each [label,diff] in [[evidenceCollection,evidenceDiff],[actionCollection,actionDiff]]]
                          p.t-caption
                            strong   (label) ":"
                            text     " " (diff ? "added {n} · removed {n} · changed {n}" : "Unavailable in one or both immutable snapshots — not treated as unchanged.")
                      div.panel style={{padding:"var(--space-3)",marginBlockStart:"var(--space-4)"}}
                        p.sq-overline style={{marginBlockEnd:8}}   "Comparisons not derived in the runtime"
                        [if !evidenceDiff]
                          p.t-caption
                            span.badge.badge-warning aria-hidden="true"   (glyph)
                            text   " " "Evidence / media comparison — not derived; shown unavailable, never 'unchanged'."
                        p.t-caption
                          span.badge.badge-warning aria-hidden="true"   (glyph)
                          text   " " "Package-semantic comparison — answer meaning across package versions is not reconciled."
                        [if !actionDiff]
                          p.t-caption
                            span.badge.badge-warning aria-hidden="true"   (glyph)
                            text   " " "Metadata / section-order comparison — not diffed."
                        p.t-caption style={{marginBlockStart:8}}   "These are honestly unavailable (HANDOFF_BLOCKED_MEDIADIFF/_PKGSEMANTIC/_METADIFF), not equal."
                [else]
                  div.sq-surface style={{padding:"var(--space-6)"}} key="compare"
                    div.sq-banner.sq-banner--warning role="status"
                      div: strong   "Comparison source unavailable."   text " " "Submitted-version data could not be loaded for this record, so no comparison can be shown — this is unavailable, not an empty result."

              PANEL 6 "timeline":
                div.sq-surface style={{padding:"var(--space-6)"}} key="timeline"
                  h2 style={{marginBlockEnd:"var(--space-3)"}}   "Canonical review timeline"
                  [if timelineError]
                    div.sq-banner.sq-banner--warning role="alert"
                      div: strong   "Canonical timeline unavailable."   text " " "The review timeline contract is not available in this environment; no fallback chronology is invented."
                  [else if (trail ?? []).length > 0]
                    [for each ev in trail]
                      p.sq-caption style={{marginBlockStart:4}}
                        span.sq-numeric   (formatted occurred_at)
                        text   " · "
                        strong   (object_type label)
                        text   " · " (event_key label)
                        [if typeof ev.payload.comment === "string"] text " · " (ev.payload.comment)
                        [if typeof ev.payload.handoff_id === "string"] text " · " "Compliance handoff" " " bdi.sq-numeric (ev.payload.handoff_id)
                    p.sq-caption style={{marginBlockStart:"var(--space-3)"}}   "Canonical submission, resubmission, review, comment and Compliance handoff events from review_timeline()."
                  [else]
                    p.sq-caption   "Unavailable"

              PANEL 7 "prior":
                div.sq-surface style={{padding:"var(--space-6)"}} key="prior"
                  h2 style={{marginBlockEnd:"var(--space-3)"}}   "Prior decision:"
                  [if decidedCount === 0]
                    p.sq-caption   "Unavailable"
                  [else, for each r in reviews.filter(decided)]
                    div.sq-banner.sq-banner--warning
                      div
                        strong   "Prior decision:"
                        text     " " (r.decision ? enum label : "—") " · " (r.decision_reason) " "
                        [if r.returned_sections] text   "· " "sections" " " (r.returned_sections.join(", "))
                        span.sq-caption   "(" "immutable" ")"

          [decision-controls slot]
          [if !canDecide]
            div.sq-surface style={{padding:"var(--space-6)"}}
              p.sq-caption   "Read-only for this role — decision controls are limited to Level 2 Reviewer / Operations."
          [else if open && ins.status === "under_review"]
            DecisionPanel reviewId={open.id} sections={...} summary={...} strings={panelStrings}
              form.panel action={formAction} style={{padding:"var(--space-6)",position:"sticky",insetBlockStart:16,display:"flex",flexDirection:"column",gap:"var(--space-4)"}}
                h2   "Decision — irreversible once confirmed"
                input type="hidden" name="review_id"
                input type="hidden" name="correlation_id"
                div.row role="radiogroup" aria-label="Decision — irreversible once confirmed"
                  [for each d in ["approve","return","reject"]]
                    label.sq-choice
                      input type="radio" name="decision"
                      text   " " (decisions[d] label)
                [if decision === "return" && !confirming]
                  div.panel style={{padding:"var(--space-4)"}}
                    p.sq-overline style={{marginBlockEnd:8}}   "Exact return scope (STM-REV-003)"
                    [for each s in sections]
                      label.sq-choice style={{display:"flex"}}
                        input type="checkbox" name="returned_section"
                        text   " " (s.title)
                    p.t-caption   "Only selected sections unlock; the rest stays locked."
                [if !confirming]
                  div.sq-field style={{maxInlineSize:"none"}}
                    label.sq-field__label htmlFor={reasonId}
                      text   "Reason" " "
                      [if decision !== "approve"] span.sq-req   "*"
                    textarea.sq-textarea name="reason" placeholder="mandatory for return/reject — recorded immutably" aria-required={decision!=="approve"}
                [if !confirming]
                  div.sq-field style={{maxInlineSize:"none"}}
                    label.sq-field__label htmlFor={`${reasonId}-comment`}   "Reviewer comment (immutable once recorded)"
                    textarea.sq-textarea name="comment" placeholder="Optional comment stored as a distinct immutable record"
                [if confirming]
                  section.panel style={{padding:"var(--space-4)"}} aria-labelledby={`${reasonId}-confirmation`}
                    h3 id={`${reasonId}-confirmation`}   "Review confirmation"
                    dl.sq-trace__nodes
                      div.sq-trace__node: dt "Version" / dd "v" (summary.version)
                      div.sq-trace__node: dt "Violations" / dd (summary.violationCount)
                      div.sq-trace__node: dt "Critical violations" / dd (summary.criticalViolationCount)
                      div.sq-trace__node: dt "Action forms" / dd (summary.actionFormCount)
                      div.sq-trace__node: dt "Evidence records" / dd (summary.evidenceCount)
                      div.sq-trace__node: dt "Factory updates" / dd (summary.factoryUpdateCount)
                    [if decision === "return"]
                      p: strong "Exact return scope (STM-REV-003):"   text " " (selected section titles joined)
                    [if reason]
                      p: strong "Reason:"   text " " (reason)
                    [if comment]
                      p: strong "Reviewer comment (immutable once recorded):"   text " " (comment)
                    div.{`sq-banner ${decision==="reject"?"sq-banner--critical":"sq-banner--warning"}`} role="note"
                      div: strong "Compliance consequence preview:"   text " " (decision==="approve" ? "Approval permanently locks this version and hands the approved inspection to the configured compliance chain. Penalty and document values are not invented here." : decision==="return" ? "Return preserves this submitted version and unlocks only the selected sections for the assigned inspector." : "Reject is final, keeps the inspection read-only, and does not start Compliance Management. A new inspection requires a new visit.")
                input type="hidden" name="reason"
                input type="hidden" name="comment"
                [for each section in returnedSections] input type="hidden" name="returned_section"
                [if state.error]
                  div.sq-banner.sq-banner--critical role="alert" tabIndex={-1}
                    div   (state.error)
                [if !confirming && decision === "approve"]
                  div.sq-banner.sq-banner--warning
                    div: strong "Irreversible:"   text " " "locks the version, triggers compliance chain."
                [if !confirming && decision === "reject"]
                  div.sq-banner.sq-banner--critical
                    div: strong "Final:"   text " " "no compliance trigger; new inspection needs a new visit."
                [if confirming]
                  div.row
                    button.btn.btn-secondary.btn-touch type="button" disabled={pending}   "Back"
                    button.{`btn ${decision==="reject"?"btn-danger":"btn-primary"} btn-lg btn-touch`} disabled={pending}   (pending ? "Recording…" : "Confirm {decision}")
                [else]
                  button.{`btn ${decision==="reject"?"btn-danger":"btn-primary"} btn-lg btn-touch`} type="button" disabled={...}   "Review confirmation"
                p.t-caption   "Audited: reviewer, reason, sections, prior/new status, version, timestamp."
          [else if canStart]
            StartReview inspectionId={ins.id} submissionVersionId={latest!.id} strings={startStrings}
              form.panel action={formAction} style={{padding:"var(--space-6)",position:"sticky",insetBlockStart:16,display:"flex",flexDirection:"column",gap:"var(--space-4)"}}
                h2   "Start Level 2 review"
                p.t-caption   "Opening this record does not change anything (CD-028). Starting the review claims it for you and moves the inspection to under review — an explicit, audited action."
                input type="hidden" name="inspection_id"
                input type="hidden" name="submission_version_id"
                [if state.error]
                  div.sq-banner.sq-banner--critical role="alert"
                    div   (state.error)
                button.btn.btn-primary.btn-lg.btn-touch disabled={pending}   (pending ? "Starting…" : "Start review")
          [else]
            div.sq-surface style={{padding:"var(--space-6)"}}
              p.sq-caption   "No open decision — status {status}."
undefined-classes: none
text-content:
Read-only queue
You don't have access to the review queue
This queue requires the Level 2 Reviewer role and matching scope. Navigation visibility is not authorization.
Review overview
Opening is read-only. Starting and deciding are explicit audited actions in the workspace.
SLA configuration missing
No review deadline is derived. Rows remain unavailable rather than being reported on time.
Some linked information is unavailable
The queue loaded, but one or more RLS-scoped linked sources could not be read. Those facts remain unavailable.
No inspections awaiting review
No reviews in your scope await a Level 2 decision.
Review readiness
Facts come from RLS-scoped records. Unreadable facts remain unavailable.
factory, code or inspector…
Search the review queue
All statuses
All risk levels
Overdue only
Clear filters
No reviews match the filters
Adjust or clear the search, status, risk and overdue filters.
Factory
Inspector
Type · mode
Version
Review readiness
Status
Review
Evidence not yet readable
A linked source could not be read. It is not counted as ready.
Deadline unavailable — required configuration or timestamp is missing
Deadline: unavailable
Deadline: overdue
Deadline: on time
Risk: unavailable
critical (L1)
priority
Checklist
Evidence
Acknowledgement
Factory verify
present
missing
verified
updated
unavailable
Opens the review read-only. Starting and deciding happen there as explicit audited actions.
Open review
Submitted
In review
Returned
Approved
Rejected
Submission integrity blocker
DEC-032 blocks claims that new real inspection submissions are available end to end. Existing RLS-visible review records remain readable; this queue does not bypass that platform blocker.
Decisions are immutable
— decided reviews cannot be edited. Every resubmission creates a new preserved version.
Could not load
The record could not be fetched — the data source may be degraded. Try again.
You don't have access to this review
This workspace requires the Level 2 Reviewer role and matching scope. Navigation visibility is not authorization.
Not found
No record matches this ID or it is outside your permitted scope.
Review — {factory}
latest
{role} · read-only
Open Factory 360
Inspection report PDF
Decision recorded atomically.
correlation
comment
Compliance handoff
Compliance handoff ID unavailable — do not claim handoff completion.
Read-only submitted version.
Content edits are impossible — the database rejects them (proven B3). Corrections happen only via Return with exact scope.
Finding trace chain
Question → response → evidence → clause → violation → corrective action → decision comment. Each link is labelled by its source and version; unavailable links are never inferred.
No checklist answers are available to build the trace chain.
Question
Response
Evidence
Clause
Violation
Corrective action
Decision comment
Unavailable
Checklist — v{n}
Violations · actions · evidence (read-only)
Factory data verification (Senaei source vs observed)
Acknowledgement signature (DEC-009)
Version comparison — Tamper-evident Scope Rail
Canonical review timeline
Prior decision:
Item
Response
action:
due
No evidence records are attached to this submitted inspection.
Source
Type
Immutable reference
Media bytes cannot be previewed because no authorized signed-URL contract is available on this route. Metadata remains read-only; the UI does not expose or guess a public URL.
{n} field(s) updated
no changes vs source
Verification data is temporarily unavailable. Source-versus-observed comparison cannot be shown yet.
No factory-field checks recorded for this inspection.
Field
Before — source (Senaei)
After — observed
Status
Evidence
Observations never modify the Senaei source record; checks are audit-logged with before/after values.
Representative signature
No drawn signature stored with this version (acknowledged by name only).
A newer version was submitted.
Version v{n} arrived while you had this open — refresh before relying on this comparison.
Refresh
Compare from
Compare to
Returned-scope authority (stored): {label}. Classification is never inferred from the diff.
No returned scope on record — expected/unexpected cannot be established, so changes are shown 'unavailable', never 'unchanged'.
Comparison is navigation-only — there is no accept/merge action. When a diff is shown, selecting a scope-rail row scrolls to its answer.
No prior version to compare — this is the first submitted version.
Out-of-scope change detected.
An answer changed outside the sections the reviewer returned. Read every flagged row before deciding.
Changes within returned scope.
Every changed answer falls inside the returned sections. Non-answer comparisons remain unavailable below.
Expected (in returned scope)
Unexpected — locked-section change
Unchanged
Unavailable
No answer changed between these two versions (computed from stored snapshots — not a failure).
Item
Section
Scope classification
Unavailable
Immutable collection comparison
Evidence manifest (ID + SHA metadata)
Action forms
added
removed
changed
Unavailable in one or both immutable snapshots — not treated as unchanged.
Comparisons not derived in the runtime
Evidence / media comparison — not derived; shown unavailable, never 'unchanged'.
Package-semantic comparison — answer meaning across package versions is not reconciled.
Metadata / section-order comparison — not diffed.
These are honestly unavailable (HANDOFF_BLOCKED_MEDIADIFF/_PKGSEMANTIC/_METADIFF), not equal.
Comparison source unavailable.
Submitted-version data could not be loaded for this record, so no comparison can be shown — this is unavailable, not an empty result.
Canonical review timeline
Canonical timeline unavailable.
The review timeline contract is not available in this environment; no fallback chronology is invented.
Compliance handoff
Canonical submission, resubmission, review, comment and Compliance handoff events from review_timeline().
Unavailable
Prior decision:
Unavailable
Prior decision:
sections
(immutable)
Read-only for this role — decision controls are limited to Level 2 Reviewer / Operations.
Decision — irreversible once confirmed
Exact return scope (STM-REV-003)
Only selected sections unlock; the rest stays locked.
Reason
mandatory for return/reject — recorded immutably
Reviewer comment (immutable once recorded)
Optional comment stored as a distinct immutable record
Review confirmation
Version
Violations
Critical violations
Action forms
Evidence records
Factory updates
Exact return scope (STM-REV-003):
Reason:
Reviewer comment (immutable once recorded):
Compliance consequence preview:
Approval permanently locks this version and hands the approved inspection to the configured compliance chain. Penalty and document values are not invented here.
Return preserves this submitted version and unlocks only the selected sections for the assigned inspector.
Reject is final, keeps the inspection read-only, and does not start Compliance Management. A new inspection requires a new visit.
Irreversible:
locks the version, triggers compliance chain.
Final:
no compliance trigger; new inspection needs a new visit.
Back
Recording…
Audited: reviewer, reason, sections, prior/new status, version, timestamp.
Start Level 2 review
Opening this record does not change anything (CD-028). Starting the review claims it for you and moves the inspection to under review — an explicit, audited action.
Starting…
Start review
No open decision — status {status}.

---

## /compliance
file: apps/web/src/app/(app)/compliance/page.tsx, apps/web/src/app/(app)/compliance/LibraryTabs.tsx
structure:
  Shell current={routeBase} title=""
    div.rv-library
      aside.rv-library__rail  aria-label="Compliance library navigation"
        form.rv-library__search
          span  aria-hidden="true"  "⌕"
          input name="q" placeholder="Search library…" aria-label="Search library"
        a.{!authority ? "is-active" : ""}  href={routeBase}
          span  "All regulations"
          span.badge  {rows.length}
        [for each name in authorities]
          a.{authority === name ? "is-active" : ""}  key={name}  href={`${routeBase}?authority=${encodeURIComponent(name)}`}
            span  {name}
            span.badge  {rows.filter(...).length}
        p.rv-library__eyebrow  "Recently opened"
        [for each row in rows.slice(0, 2)]
          a.rv-library__recent  key={row.id}  href={`${routeBase}?libraryId=${row.id}`}  {row.title}
      main.rv-library__workspace
        [if error]
          div.sq-banner.sq-banner--critical  role="alert"
            strong  "Compliance Library unavailable."
            (text)  " The read failed; no empty result is claimed."
        [else if !selected]
          section.sq-state
            h2  "No regulations in scope"
            p  "The RLS-scoped read succeeded and returned no regulations."
        [else]
          Fragment
            header.rv-library__header
              div
                p.sq-overline  "{selected.code} · {selected.issuing_authority ?? "Authority not recorded"}"
                h1  {selected.title}
                p  "Version {selected.version_label} · {selected.status}"
              a.sq-btn.sq-btn--secondary  href={`/admin/regulations?id=${selected.id}`}  "Open governed dossier"
            section.rv-library__facts
              div
                span  "Clauses"
                strong  {selected.regulation_clauses?.length ?? 0}
              div
                span  "Inspection items"
                strong  {itemCount}
              div
                span  "Effective from"
                strong  {selected.effective_from?.slice(0, 10) ?? "Not recorded"}
            div.rv-library__split
              section.rv-library__list
                h2  "Regulations"
                form.grid-toolbar  method="get" action={routeBase}
                  [if authority]
                    input type="hidden" name="authority" value={authority}
                  div.input-affix
                    input.input type="search" name="q" placeholder="Search catalogue…" aria-label="Search catalogue"
                  select.select  name="status" aria-label="Status"
                    option value=""  "Status"
                    [for each value in statuses]
                      option value={value} key={value}  {value}
                  button.filter-chip  type="button" disabled title="No governed inspection-type field exists on this data yet"  "Inspection type"
                  button.btn.btn-secondary.btn-sm  type="submit"  "Apply"
                  a.btn.btn-primary.btn-sm  href="/admin/compliance-requests/new" style={{ marginInlineStart: "auto" }}  "Create"
                [for each row in filtered]
                  a.{row.id === selected.id ? "is-selected" : ""}  key={row.id}  href={`${routeBase}?libraryId=${row.id}${authority ? `&authority=${encodeURIComponent(authority)}` : ""}`}
                    div
                      strong  {row.title}
                      span
                        span.id-code  {row.code}
                        (text)  " · "
                        span.badge  {row.version_label}
                    span  aria-hidden="true"  "›"
              section.rv-library__detail
                p.rv-library__eyebrow  "Source-controlled compliance"
                h2  "Regulation workspace"
                LibraryTabs tabs={libraryTabs} panels={libraryPanels}
                  div.tabs  role="tablist"
                    [for each (tab, index) in tabs]
                      button.{`tab${index === active ? " is-active" : ""}`}  type="button" role="tab" aria-selected={index === active}
                        (text)  "{tab.label} "
                        span.tab-count  {tab.count}
                  {panels[active]} — panels array, 6 literal blocks:
                    [panel 0 — "overview"]
                    dl.desc
                      dt  "Authority"
                      dd  {selected?.issuing_authority ?? "Authority not recorded"}
                      dt  "Status"
                      dd  {selected?.status ?? "—"}
                      dt  "Version"
                      dd  {selected?.version_label ?? "—"}
                      dt  "Effective from"
                      dd  {selected?.effective_from?.slice(0, 10) ?? "Not recorded"}
                      dt  "Clauses"
                      dd  {selected?.regulation_clauses?.length ?? 0}
                    [panel 1 — "items"]
                    [if inspectionItems.length === 0]
                      p.desc  "No records."
                    [else]
                      div.stack
                        [for each item in inspectionItems]
                          div.row  key={item.id} style={{ justifyContent: "space-between" }}
                            span
                              span.id-code  {item.code}
                              (text)  " · "
                              (text)  {item.title}
                            span.desc  {item.clauseRef}
                    [panel 2 — "violations"]
                    [if violationCodes.length === 0]
                      p.desc  "No records."
                    [else]
                      div.stack
                        [for each v in violationCodes]
                          div.row  key={v.id} style={{ justifyContent: "space-between" }}
                            span
                              span.id-code  {v.code}
                              (text)  " · "
                              (text)  {v.title}
                            span.{`badge ${v.level === "L1" ? "badge-critical" : v.level === "L2" ? "badge-major" : "badge-warning"}`}  {v.level}
                    [panel 3 — "penalties"]
                    [if penalties.length === 0]
                      p.desc  "No records."
                    [else]
                      div.stack
                        [for each p in penalties]
                          div.row  key={p.id} style={{ justifyContent: "space-between" }}
                            span  {p.penalty_ref}
                            span.badge  {p.mapping_version}
                    [panel 4 — "versions"]
                    [if !selected]
                      p.desc  "No records."
                    [else]
                      div.stack
                        div.row  style={{ justifyContent: "space-between" }}
                          span
                            span.id-code  {selected.version_label}
                            (text)  " · current"
                          span.badge  {selected.effective_from?.slice(0, 10) ?? "Not recorded"}
                        p.desc  "Only the current version is on record — no version-history contract is available."
                    [panel 5 — "audit"]
                    [if auditEvents.length === 0]
                      p.desc  "No records."
                    [else]
                      ul.timeline
                        [for each event in auditEvents]
                          li  key={event.id}
                            p.tl-title  {event.action}
                            p.tl-meta  "{new Date(event.occurred_at).toISOString()}{event.actor ? ` · ${event.actor}` : ""}"
                div.sq-banner
                  strong  "Read-only presentation."
                  (text)  " Authoring and maker-checker publication remain in the governed dossier and its database guards."
undefined-classes: none
text-content:
⌕
Search library…
Search library
All regulations
Recently opened
Compliance Library unavailable.
 The read failed; no empty result is claimed.
No regulations in scope
The RLS-scoped read succeeded and returned no regulations.
Open governed dossier
Clauses
Inspection items
Effective from
Regulations
Search catalogue…
Search catalogue
Status
Inspection type
No governed inspection-type field exists on this data yet
Apply
Create
›
Source-controlled compliance
Regulation workspace
Authority not recorded
—
—
Not recorded
No records.
No records.
No records.
No records.
· current
Only the current version is on record — no version-history contract is available.
No records.
Read-only presentation.
 Authoring and maker-checker publication remain in the governed dossier and its database guards.

## /compliance/approvals
file: apps/web/src/app/(app)/compliance/approvals/page.tsx, apps/web/src/app/(app)/admin/compliance-requests/ActionForm.tsx
structure:
  Shell current={current} title=""
    div.rv-approval
      [if error || componentRead.error]
        div.sq-banner.sq-banner--critical  role="alert"
          strong  "Approval Queue unavailable."
          (text)  " No workload claim is made."
      header.rv-approval__heading
        div
          p.sq-overline  "Compliance configuration"
          h1  "Approval Queue"
          p  "Object-level maker-checker decisions and governed publication readiness."
        span.sq-lozenge.sq-lozenge--warning  "{rows.length} pending"
      div.sq-grid-2
        div.rv-approval__cards
          [for each (row, index) in rows]
            article.{`rv-approval__card ${index === 0 ? "is-selected" : ""}`}  key={row.id}
              div
                p.sq-overline  "{row.request_type === "create" ? "Create" : "Modify"} regulation"
                h2  {row.title}
                p  "{row.request_number} · Version {row.current_revision}"
                div.rv-approval__chips
                  [for each kind in kinds]
                    span  key={kind}  "◇ {current.filter(...).length} {kind.replace("_", " ")}"
                small  {row.submitted_at ? new Date(row.submitted_at).toLocaleString("en-SA") : "Submission time not recorded"}
              span.sq-lozenge.sq-lozenge--warning  "• {row.status.replaceAll("_", " ")}"
              a  aria-label={`Review ${row.title}`}  href={`/admin/compliance-requests/${row.id}?from=approval-queue`}  "Open review"
          [if !error && !componentRead.error && rows.length === 0]
            section.sq-state  role="status"
              h2  "No eligible requests in your scope"
              p  "The RLS-scoped maker-checker read succeeded and returned zero requests. Requests owned by you remain excluded from your decision queue."
        section.panel  aria-label="Object review"
          div.panel-header
            span.panel-title  "Object review"
            [if currentRequest]
              span.badge  {currentRequest.request_number}
          div.panel-body
            [if !currentRequest]
              p.desc  "No request selected — the list is empty."
            [else if currentComponentsError]
              div.sq-banner.sq-banner--critical  role="alert"
                strong  "Object review unavailable."
                (text)  " The component read failed."
            [else if currentComponentRows.length === 0]
              p.desc  "No records."
            [else]
              div.stack
                [for each component in currentComponentRows]
                  div.row  key={component.id} style={{ justifyContent: "space-between" }}
                    span
                      span.id-code  {component.entity_kind}
                      (text)  " · "
                      (text)  {String(snapshotTitle)}
                    span.{`badge ${component.component_status === "approved" ? "badge-completed" : component.component_status === "rejected" ? "badge-critical" : "badge-pending"}`}  {component.component_status.replaceAll("_", " ")}
        section.panel  aria-label="Decision"
          div.panel-header
            span.panel-title  "Decision"
          div.panel-body
            [if !currentRequest]
              p.desc  "No records."
            [else]
              div.stack
                ActionForm action={publishComplianceRequest} className="stack"
                  form.stack  action={formAction} aria-busy={pending}
                    input type="hidden" name="request_id" value={currentRequest.id}
                    button.btn  type="submit"  "Approve configuration request"
                    [if state.error]
                      p.t-caption.ccr-error  role="alert"  {state.error}
                    [if state.ok && !state.requestId]
                      p.t-caption.ccr-success  role="status"  "Saved."
                ActionForm action={returnComplianceRequest} className="stack"
                  form.stack  action={formAction} aria-busy={pending}
                    input type="hidden" name="request_id" value={currentRequest.id}
                    textarea.input  name="comments" required placeholder="Return reason (required)" rows={3}
                    button.btn.btn-secondary  type="submit"  "Return package"
                    [if state.error]
                      p.t-caption.ccr-error  role="alert"  {state.error}
                    [if state.ok && !state.requestId]
                      p.t-caption.ccr-success  role="status"  "Saved."
                ActionForm action={rejectComplianceRequest} className="stack"
                  form.stack  action={formAction} aria-busy={pending}
                    input type="hidden" name="request_id" value={currentRequest.id}
                    textarea.input  name="comments" required placeholder="Rejection reason (required)" rows={3}
                    button.btn.btn-danger  type="submit"  "Reject package"
                    [if state.error]
                      p.t-caption.ccr-error  role="alert"  {state.error}
                    [if state.ok && !state.requestId]
                      p.t-caption.ccr-success  role="status"  "Saved."
      nav.rv-approval__steps  aria-label="Review object sequence"
        [for each ([label, meta], index) in steps-array]
          span.{index === 0 ? "is-current" : ""}  key={label}
            strong  {label}
            small  {meta}
undefined-classes: none
text-content:
Approval Queue unavailable.
 No workload claim is made.
Compliance configuration
Approval Queue
Object-level maker-checker decisions and governed publication readiness.
Open review
No eligible requests in your scope
The RLS-scoped maker-checker read succeeded and returned zero requests. Requests owned by you remain excluded from your decision queue.
Object review
No request selected — the list is empty.
Object review unavailable.
 The component read failed.
No records.
Decision
No records.
Approve configuration request
Saved.
Return reason (required)
Return package
Saved.
Rejection reason (required)
Reject package
Saved.
Overview
Read
Regulation
decided
Inspection items
decided
Violations
decided
Penalties
decided
Summary
Blocked

---

## /enforcement-library
file: apps/web/src/app/(app)/enforcement-library/page.tsx
structure:
  Shell.current={current}.title=""
    div.rv-enforcement
      form.rv-enforcement__toolbar[method="get" action={current}]
        label
          span[aria-hidden="true"]            "⌕"
          input[name="q" defaultValue={...} placeholder="Search factory, licence…" aria-label="Search enforcement library"]
        select[name="status" defaultValue={status} aria-label="Status"]
          option[value=""]            "Status"
          option[value="open"]            "Open"
          option[value="closed"]            "Closed"
        select[name="range" defaultValue={range || ""} aria-label="Date range"]
          option[value=""]            "Date range"
          option[value="30"]            "Last 30 days"
          option[value="90"]            "Last 90 days"
          option[value="365"]            "Last year"
        select[name="region" defaultValue={region} aria-label="Region"]
          option[value=""]            "Region"
          [for each value in regions]
            option[value={value} key={value}]            "{value}"
        button[type="submit"]            "Apply"
        a[href={export url}]            "Export"
      [if violationRead.error || penaltyRead.error]
        div.sq-banner.sq-banner--critical[role="alert"]
          strong            "Enforcement Library unavailable."
          " No case count is claimed."
      section.rv-enforcement__list
        [for each row in rows]
          article[key={row.id}]
            header
              div
                h2            "{row.violation_codes?.title ?? "Violation"}"
                p            "{factory?.name ?? "Factory unavailable"} · {row.violation_codes?.code ?? row.id.slice(0, 8)}"
              span.`sq-lozenge ${closed ? "sq-lozenge--success" : "sq-lozenge--critical"}`            "• {closed ? "Closed" : "Open"}"
            dl
              div
                dt            "Licence"
                dd            "{factory?.license_number ?? "—"}"
              div
                dt            "Penalty"
                dd            "{penalty?.mapping_snapshot?.penalty_type ?? penalty?.status ?? "Not issued"}"
              div
                dt            "Issue date"
                dd            "{row.inspections?.submitted_at?.slice(0, 10) ?? "—"}"
              div
                dt            "Action form"
                dd            "{action?.form_type?.replaceAll("_", " ") ?? "—"}"
            a[href={`/enforcement?violation=${row.id}`}]            "Open case"
        [if !violationRead.error && rows.length === 0]
          section.sq-state
            h2            "No RLS-visible enforcement records"
            p            "The read succeeded and returned zero records."
undefined-classes: none
text-content:
⌕
Search factory, licence…
Search enforcement library
Status
Status
Open
Closed
Date range
Date range
Last 30 days
Last 90 days
Last year
Region
Region
Apply
Export
Enforcement Library unavailable.
 No case count is claimed.
Licence
Penalty
Issue date
Action form
Open case
No RLS-visible enforcement records
The read succeeded and returned zero records.

## /analytics
file: apps/web/src/app/(app)/analytics/page.tsx, apps/web/src/app/(app)/analytics/error.tsx, apps/web/src/app/(app)/analytics/loading.tsx
structure:

[STATE: loading — loading.tsx]
  StateSurface.kind="loading".title="Loading analytics"

[STATE: error (route-level error boundary) — error.tsx]
  StateSurface.kind="error".action={<button className="btn btn-secondary" onClick={reset}>Try again</button>}

[STATE: page — page.tsx]
  [if !parsed.ok]
    StateSurface.kind="error".title="Invalid analytics query".body={parsed.issues.join(" ")}
  [else]
    [if result.kind === "unauthorized"]
      StateSurface.kind="unauthorized"
    [if result.kind === "error"]
      StateSurface.kind="error".body={result.message}
    [else]
      main.sq-stack[aria-labelledby="analytics-title"]
        header.page-header
          div
            h1[id="analytics-title"]            "Analytics"
            p.desc            "Governed aggregates for {parsed.value.periodFrom} through {parsed.value.periodTo}. Values reflect only records visible to your role and scope."
            [if parsed.value.compareFrom && parsed.value.compareTo]
              p.desc            "Comparison period {parsed.value.compareFrom} through {parsed.value.compareTo}: Decision required before numeric comparison is enabled."
          button[type="button" className="btn btn-secondary btn-sm" disabled]            "Export · unavailable"
        [if result.kind === "degraded"]
          StateSurface.kind="degraded".body={`Affected source: ${result.affectedSource}. Available governed results remain visible.`}
        [if result.stale]
          StateSurface.kind="stale".title="Stale analytics result".body={`Last successful refresh: ${result.refreshedAt}.`}
        [if result.rows.length === 0]
          StateSurface.kind="rls-denied"
        [else]
          section[aria-labelledby="configured-metrics"]
            h2[id="configured-metrics"]            "Configured metrics"
            div.kpi-grid
              [for each metric in ANALYTICS_METRICS]
                article.panel.kpi[key={metric.key}]
                  span.id-code            "{metric.trace}"
                  h3.kpi-label            "{metric.title}"
                  p.kpi-value
                    [if governed]
                      "{display}"
                    [else]
                      span.badge.badge-pending            "{display}"
                  p.desc            "{metric.definition}"
                  [if row?.breakdown]
                    dl
                      [for each [label,value] in Object.entries(row.breakdown)]
                        div[key={label}]
                          dt            "{label.replaceAll("_"," ")}"
                          dd            "{String(value)}"
                  Link.btn.btn-ghost.btn-sm[href={analyticsDrillHref(metric.key, parsed.value)}]            "View governed records"
        section[aria-labelledby="unconfigured-metrics"]
          h2[id="unconfigured-metrics"]            "Governance-dependent analytics"
          div.stack
            [for each item in UNCONFIGURED_ANALYTICS]
              div.panel.row[style={{ padding: "var(--space-3) var(--space-4)", justifyContent: "space-between" }} key={item.title}]
                strong            "{item.title}"
                span.badge.badge-pending            "{item.state}"
            div.panel.row[style={{ padding: "var(--space-3) var(--space-4)", justifyContent: "space-between" }}]
              strong            "AI assistance"
              span.badge.badge-pending            "Not configured. No live AI request is made."
            div.panel.row[style={{ padding: "var(--space-3) var(--space-4)", justifyContent: "space-between" }}]
              strong            "Export"
              span.badge.badge-pending            "Unavailable pending a canonical audit and correlation contract."

undefined-classes: saqeel-state--rls-denied, saqeel-state--unauthorized (StateSurface-internal classes generated as `saqeel-state--${kind}`, verified absent from both saqeel-components.css and saqeel-runtime.css)
text-content:
Loading analytics
Try again
Invalid analytics query
Analytics
Governed aggregates for {periodFrom} through {periodTo}. Values reflect only records visible to your role and scope.
Comparison period {compareFrom} through {compareTo}: Decision required before numeric comparison is enabled.
Export · unavailable
Configured metrics
View governed records
Governance-dependent analytics
AI assistance
Not configured. No live AI request is made.
Export
Unavailable pending a canonical audit and correlation contract.

---

# Administration (/admin/*)

## /admin
file: apps/web/src/app/(app)/admin/page.tsx, apps/web/src/app/(app)/admin/layout.tsx, apps/web/src/components/AdminRouteBoundary.tsx, apps/web/src/components/Shell.tsx
structure:
AdministrationLayout (layout.tsx)
  AdminRouteBoundary.allowedRoles=[admin,compliance_admin,form_admin,workflow_admin,security_admin,gis_admin,risk_owner,reviewer,ops,auditor,leadership]
    [if !user || authError.name === "AuthSessionMissingError"] redirect("/login")
    [if authError] throw Error
    [if allowedRoles.some(role => roles.has(role))] return children
      AdminHome (page.tsx)
        Shell.current="/admin" title="Control Panel"/"لوحة التحكم" context=<span>
          span.t-caption            "What is waiting on you, and what changed recently. Move between areas from the side navigation. Only the areas your roles authorize are shown."
          [inside Shell's own JSX:]
          Fragment
            [if topbar] div.sq-pagehead__route-tools
            [if title] header.sq-pagehead.sq-pagehead--route
              div.sq-pagehead__row
                div.sq-pagehead__context
                  h2                "Control Panel"
                  {context}
            div.sq-content
              [if roleRead.error] div.sq-banner.sq-banner--warning role="alert"
                div
                  strong           "Authorization could not be verified."
                  text             "No approval or audit workload is shown."
              [if noAuthorizedPanels] div.sq-state.panel role="status"
                span.sq-state__glyph aria-hidden="true"   "✓"
                h3                 "No administration work panels are assigned to this role"
                p.t-caption        "Use the authorized destinations in the navigation rail."
              div.{styles.panels}
                [if canReview] section.`panel ${styles.panel}` aria-labelledby="waiting-on-you-title"
                  header.{styles.panelHeader}
                    div
                      h3#waiting-on-you-title   "Waiting on you"
                      p.t-caption               "Submitted configuration requests you are authorized to approve. Your own requests never appear here; decisions remain protected by maker-checker guards."
                    Link.btn.btn-secondary.btn-touch href="/admin/compliance-approvals?view=pending"
                      text                       "Open approval queue"
                  [if requestRead.error || componentRead.error] div.sq-banner.sq-banner--warning role="alert"
                    div
                      strong                     "Approval workload is partially unavailable."
                      [if requestRead.error] text "The request source could not be read; no empty-queue claim is made."
                      [else] text                "Request areas could not be read; the returned requests remain visible."
                  [if !requestRead.error && requests.length === 0] div.sq-state role="status" aria-live="polite"
                    span.sq-state__glyph aria-hidden="true"  "✓"
                    h4                          "No requests are waiting on your approval"
                  [if !requestRead.error && requests.length > 0] div.sq-tablewrap
                    table.`sq-table ${styles.workTable}`
                      thead
                        tr
                          th scope="col"        "Request"
                          th scope="col"        "Area"
                          th scope="col"        "Requested by"
                          th scope="col"        "Waiting"
                          th scope="col"        "Next action"
                      tbody
                        [for each row in requests]
                          tr
                            th scope="row"
                              strong             {row.title}
                              span.t-caption
                                bdi dir="ltr"     {row.request_number}
                            td                   {areaLabel(row)}
                            td
                              bdi dir="ltr"       {row.owner_id}
                            td
                              bdi dir="ltr"       {waitingLabel(row.submitted_at)}
                            td
                              Link.btn.btn-primary.btn-touch href={`/admin/compliance-requests/${row.id}?from=approval-queue`}
                                text             "Review"
                [if canAudit] section.`panel ${styles.panel}` aria-labelledby="recent-changes-title"
                  header.{styles.panelHeader}
                    div
                      h3#recent-changes-title   "Recent configuration changes"
                      p.t-caption               "Approved changes inside your authorized scope, read from the append-only Activity Log. No event is summarized or inferred here."
                    Link.btn.btn-secondary.btn-touch href="/admin/audit?view=recorder&q=compliance_configuration_request"
                      text                       "Open Activity Log"
                  [if auditRead.error] div.sq-banner.sq-banner--warning role="alert"
                    div
                      strong                     "Recent changes are unavailable."
                      text                       "The append-only audit source could not be read; no empty-state claim is made."
                  [else if auditRows.length === 0] div.sq-state role="status" aria-live="polite"
                    span.sq-state__glyph aria-hidden="true"  "✓"
                    h4                          "No changes returned for this scope"
                  [else] div.sq-tablewrap
                    table.`sq-table ${styles.workTable}`
                      thead
                        tr
                          th scope="col"        "Change"
                          th scope="col"        "Area"
                          th scope="col"        "Actor"
                          th scope="col"        "When"
                      tbody
                        [for each row in auditRows]
                          tr
                            th scope="row"
                              strong             "Configuration published"
                              span.t-caption
                                bdi dir="ltr"    {row.action}
                                text             " · "
                                bdi dir="ltr"    {row.object_id ?? notConfigured}
                                text             " · #"
                                bdi dir="ltr"    {row.id}
                            td                   "Compliance configuration"
                            td
                              bdi dir="ltr"      {row.actor ?? "System"}
                            td
                              bdi dir="ltr"      {row.occurred_at ? new Date(...).toLocaleString(...) : notConfigured}
    [else] (unauthorized branch of AdminRouteBoundary)
      Shell current="/admin" title=""
        section.sq-access-refusal role="alert"
          span aria-hidden="true"      "🔒"
          h1                           "You do not have access to this destination"
          p                            "The destination stays visible so the platform remains legible, and access is refused here, at the boundary."
          div
            a.sq-btn href="/profile"   "Request access"
            a.sq-btn.sq-btn--secondary href="/dashboard"   "Back to default state"
          small                        "Administration routes are guarded by the admin role family (security_admin / compliance_admin / risk_owner / form_admin / workflow_admin). A Planner reaches the destination and is refused at the boundary."

undefined-classes: sq-pagehead__route-tools, sq-pagehead--route
text-content:
What is waiting on you, and what changed recently. Move between areas from the side navigation. Only the areas your roles authorize are shown.
Authorization could not be verified.
No approval or audit workload is shown.
No administration work panels are assigned to this role
Use the authorized destinations in the navigation rail.
Waiting on you
Submitted configuration requests you are authorized to approve. Your own requests never appear here; decisions remain protected by maker-checker guards.
Open approval queue
Approval workload is partially unavailable.
The request source could not be read; no empty-queue claim is made.
Request areas could not be read; the returned requests remain visible.
No requests are waiting on your approval
Request
Area
Requested by
Waiting
Next action
Review
Recent configuration changes
Approved changes inside your authorized scope, read from the append-only Activity Log. No event is summarized or inferred here.
Open Activity Log
Recent changes are unavailable.
The append-only audit source could not be read; no empty-state claim is made.
No changes returned for this scope
Change
Area
Actor
When
Configuration published
Compliance configuration
System
You do not have access to this destination
The destination stays visible so the platform remains legible, and access is refused here, at the boundary.
Request access
Back to default state
🔒
Administration routes are guarded by the admin role family (security_admin / compliance_admin / risk_owner / form_admin / workflow_admin). A Planner reaches the destination and is refused at the boundary.

## /admin/access
file: apps/web/src/app/(app)/admin/access/page.tsx, apps/web/src/app/(app)/admin/_components/AdminDestinationFrame.tsx, apps/web/src/app/(app)/admin/_components/AdminRecordDrawer.tsx, apps/web/src/app/(app)/admin/access/AccessManager.tsx, apps/web/src/app/(app)/admin/access/RoleCapabilityPanel.tsx, apps/web/src/components/Shell.tsx
structure:
Access (page.tsx)
  AdminDestinationFrame current="/admin/access" title="Users & Roles" subtitle="Accounts, role assignment and access review" hub="People & access" routeLabel="/admin/access" designId="frame-19-admin-users-roles" drawerLabels=... labels={administration,breadcrumb,governance,reconstruction} metrics=[3 items] tabs=[4 items] gate={title,body} governance=[3 strings] reconstructionNote="..." context=<span.sq-lozenge.sq-lozenge--info>
    [AdminDestinationFrame's own JSX:]
    Shell current="/admin/access" title="" context={context}
      [Shell's own JSX:]
      Fragment
        [title is "" so header branch skipped]
        div.sq-content
          AdminRecordDrawerProvider labels=drawerLabels
            [AdminRecordDrawerProvider's own JSX:]
            DrawerLabelsContext.Provider value=labels
              {children}
            div.{styles.workspace} data-saqeel-admin-destination="frame-19-admin-users-roles"
              div.{styles.main}
                header.{styles.heading}
                  div
                    nav.{styles.breadcrumb} aria-label="Breadcrumb"
                      ol
                        li               "Administration"
                        li               "People & access"
                    h1.{styles.title}     "Users & Roles"
                    p.{styles.subtitle}   "Accounts, role assignment and access review"
                  span.sq-version
                    bdi dir="ltr"        "/admin/access"
                section.{styles.metrics} aria-label="Users & Roles governance figures"
                  [for each metric in metrics]
                    article.{styles.metric}
                      span.{styles.metricLabel}   {metric.label}
                      strong.{styles.metricValue} {metric.value}
                      span.{styles.metricNote}    {metric.note}
                nav.{styles.tabs} aria-label="Users & Roles sections"
                  [for each tab in tabs]
                    Link.{styles.tab} href={tab.href} aria-current={tab.current ? "page" : undefined}
                      text            {tab.label}
                [if gate] section.{styles.gate} aria-label={gate.title}
                  strong             "Role changes are guarded and audited"
                  p                  "Every write is re-authorized on the server. Self-elevation and removal of the last security administrator are refused by governed RPCs; backend role keys remain unchanged until an approved mapping migration exists."
                {children} (page body, see below)
              aside.{styles.rail} aria-label="Users & Roles — Governance on this surface"
                section.{styles.railCard}
                  h2.{styles.railTitle}   "Governance on this surface"
                  ul.{styles.governance}
                    [for each item in governance]
                      li             {item}
                section.{styles.railCard}
                  h2.{styles.railTitle}   "Reconstruction note"
                  p.{styles.note}        {reconstructionNote}
    [children passed into AdminDestinationFrame — the Access page body:]
    div.sq-banner
      div
        strong             "Access is enforced by Row Level Security, not UI."
        text               "54 policies realize the frozen RBAC matrix; role grants are audited automatically (this page's data itself passed through RLS to render)."
    [if gateError || capGateError] div.sq-banner.sq-banner--warning role="alert"
      div
        strong             "Permissions unavailable."
        text               "Your access-management permissions could not be verified. All write controls are unavailable; retry the page."
    [if view === "users"] Fragment
      [if profilesError] div.sq-banner.sq-banner--critical role="alert"
        div
          strong           "Couldn't load the authorized user roster. Nothing was changed. Try again."
      [if rolesError && !profilesError] div.sq-banner.sq-banner--warning role="alert"
        div
          strong           "Role details are unavailable."
          text             "The authorized user roster remains visible, but role labels and all access changes are unavailable."
      [if !profilesError] div.sq-tablewrap
        table.sq-table
          thead
            tr
              th scope="col"  "User"
              th scope="col"  "Email"
              th scope="col"  "Region"
              th scope="col"  "Roles"
          tbody
            [for each p in profiles]
              AdminRecordTableRow key={p.user_id} record={...}
                [AdminRecordTableRow's own JSX:]
                Fragment
                  tr.`${styles.recordRow}` tabIndex=0 aria-haspopup="dialog" aria-label={`Open record: ${p.full_name}`}
                    {children}
                  [if open] RecordDrawer (portal to document.body)
                    div.{styles.layer}
                      button.{styles.backdrop} aria-label="Close panel"
                      aside.{styles.drawer} role="dialog" aria-modal="true"
                        header.{styles.header}
                          div.{styles.heading}
                            h2               {record.title}
                            p                {record.subtitle}
                          button.{styles.closeButton} aria-label="Close"
                            span aria-hidden="true"  "×"
                        div.{styles.body}
                          DrawerGroup title="Record" fields=record.record
                            section.{styles.group}
                              h3             "Record"
                              [if fields.length>0] dl
                                [for each field in fields]
                                  div
                                    dt         {field.label}
                                    dd         {field.value}
                          DrawerGroup title="Governance on this surface" fields=governance-as-fields
                            section.{styles.group}
                              h3             "Governance on this surface"
                              dl (same pattern)
                          DrawerGroup title="Audit" fields=record.audit ?? [] disclosure=maybe
                            section.{styles.group}
                              h3             "Audit"
                              [if disclosure] p.{styles.disclosure}  {disclosure text: "Nothing recorded yet for this record."(from adminRecordDrawerCopy)}
                        footer.{styles.actions}
                          [if record.editHref] Link.sq-btn.sq-btn--prominent href={record.editHref}
                            text             "Edit through governed request"
                          [else] button.sq-btn.sq-btn--prominent disabled aria-disabled="true" title={editUnavailableReason}
                            text             "Edit through governed request"
                          Link.sq-btn href={record.auditHref}
                            text             "View in activity log"
                          button.sq-btn
                            text             "Close"
                  [children passed into AdminRecordTableRow — table cells:]
                  td
                    strong           {p.full_name}
                  td.sq-caption      {p.email}
                  td                 {p.region}
                  td
                    [if rolesError] text  "Unavailable"
                    [else for each roleKey in roleKeys]
                      span.`sq-lozenge ${...isAdmin ? "sq-lozenge--warning" : "sq-lozenge--info"}` style={marginInlineEnd:6}
                        text         {roleKey}
      p.sq-caption style={marginBlockStart:"var(--space-3)"}
        [if canManage] text  "This roster is filtered to your access: users outside your visibility are absent, not hidden rows. Access changes use only governed server actions."
        [else] text          "This roster is filtered to your access: users outside your visibility are absent, not hidden rows. This screen is read-only."
    [if view === "users" && canManage && user && !profilesError && !rolesError && !userAccessSourcesUnavailable] AccessManager users=... roles=... capabilities=... access=... currentUserId=... initialSelectedUserId=... labels={...}
      [AccessManager's own JSX:]
      section.sq-surface aria-labelledby="access-manager-h" style={...}
        h3#access-manager-h        "Access management"
        p.sq-caption               "Grant or revoke roles and direct capability overrides. Every change runs through the governed RPCs: the self-escalation guard blocks changes to your own access, the last remaining security administrator cannot be revoked, and every change is recorded in the activity log."
        div.sq-field style={maxInlineSize:420}
          label.sq-field__label for="access-user-select"  "Select a user"
          select.sq-input#access-user-select
            option value=""          "—"
            [for each u in users]
              option key={u.userId} value={u.userId}  {u.name}{u.email ? ` · ${u.email}` : ""}
        [if isSelf] div.sq-banner.sq-banner--critical role="alert"
          div
            strong                  "This is your own user. The self-escalation guard refuses access changes you make to yourself — another security administrator must make them."
        [if selected] Fragment
          div style={...}
            h4                      "Roles"
            div style={...}
              [for each grant in selected.roles]
                span.`sq-lozenge ${role?.isAdmin ? "sq-lozenge--warning" : "sq-lozenge--info"}`
                  text               {grant.roleKey}
                  span.sq-caption style={marginInlineStart:6}
                    text             "granted "{new Date(grant.grantedAt).toLocaleDateString()}
                  button.sq-btn style={...} disabled={disabled}
                    text             "Revoke"
            div style={...}
              select.sq-input#access-role-grant-select style={maxInlineSize:280} disabled={disabled}
                [for each r in grantableRoles]
                  option key={r.roleKey} value={r.roleKey}  {r.roleKey}{r.isAdmin ? " (admin)" : ""}
              button.sq-btn.sq-btn--prominent disabled={...}
                text                 "Grant role"
          div style={...}
            h4                       "Effective capabilities"
            p.sq-caption             "The user's effective access: capabilities derived from their roles plus direct grant overrides, each labelled with its source."
            [if selected.effective.length === 0] p.sq-caption   "This user currently has no effective capabilities — no roles and no direct grants."
            [else] div.sq-tablewrap
              table.sq-table
                thead
                  tr
                    th scope="col"    "Capability"
                    th scope="col"    "Source"
                    th scope="col"    "Actions"
                tbody
                  [for each cap in selected.effective]
                    tr
                      td
                        strong        {cap.capabilityKey}
                      td
                        [for each role in cap.viaRoles]
                          span.sq-lozenge.sq-lozenge--info style={marginInlineEnd:6}
                            text       "via role: "{role}
                        [if cap.direct] span.sq-lozenge.sq-lozenge--warning   "direct grant"
                      td
                        [if cap.direct] button.sq-btn disabled={disabled}
                          text         "Revoke"
            div style={...}
              select.sq-input#access-capability-grant-select style={maxInlineSize:360} disabled={disabled}
                [for each c in grantableCapabilities]
                  option key={c.capabilityKey} value={c.capabilityKey}  {c.capabilityKey}
              button.sq-btn.sq-btn--prominent disabled={...}
                text                 "Grant capability override"
          p.sq-caption               "Role and capability changes take effect on the target's next request. Nothing is applied silently: every change is confirmed here and recorded in the activity log with the actor, before/after state and requirement reference EXE-ACCESS."
        [if confirming] div.sq-banner.sq-banner--critical role="alert" style={...}
          div
            strong                   {confirmText: one of "Revoke the role "{key}" from this user? The change is recorded and takes effect on their next request." / "Grant the administrator role "{key}" to this user? This gives them admin-level access and is recorded." / "Revoke the direct capability override "{key}" from this user? Role-derived access is unaffected."}
          div style={...}
            button.sq-btn.sq-btn--prominent disabled={pending}
              text                   {pending ? "Applying…" : "Confirm"}
            button.sq-btn disabled={pending}
              text                   "Cancel"
        [if feedback.ok && !pending] span.sq-lozenge.sq-lozenge--success   "saved — effective on the user's next request"
        [if feedback.error] p.sq-caption role="alert" style={color:...}  {feedback.error}
    [if view === "users" && canManage && user && userAccessSourcesUnavailable] div.sq-banner.sq-banner--warning role="alert"
      div
        strong             "Access details are partially unavailable."
        text               "The user roster remains visible, but access changes are unavailable because one or more governed sources could not be read."
    [if view === "roles" && rolesError] div.sq-banner.sq-banner--critical role="alert"
      div
        strong             "Couldn't load the authorized role catalogue. No controls are available."
    [if view === "roles" && !rolesError] section.{styles.roleCatalogue} aria-labelledby="role-catalogue-title"
      div
        h2#role-catalogue-title    "Role catalogue"
        p.sq-caption               "Only roles visible to your session through Row Level Security are listed."
      div.{styles.roleCards}
        [for each role in roles]
          AdminRecordArticle className="sq-surface" key={role.role_key} record={...}
            [AdminRecordArticle's own JSX:]
            Fragment
              article.`${styles.recordArticle} sq-surface` tabIndex=0 aria-haspopup="dialog" aria-label={`Open record: ${title}`}
                {children}
              [if open] RecordDrawer (same structure as above, field values: "Role key", "Title", "Access class"/"Administrator role"/"Standard governed role")
            [children — article body:]
            strong                 {role.title || role.role_key}
            bdi.sq-caption dir="ltr"  {role.role_key}
            [if role.is_admin] span.sq-lozenge.sq-lozenge--warning   "Administrator role"
    [if view === "roles" && canManageRoleCaps && user && !rolesError && !roleCapabilitySourcesUnavailable] RoleCapabilityPanel roles=... permissions=... grants=... labels={...}
      [RoleCapabilityPanel's own JSX:]
      section.sq-surface aria-labelledby="role-cap-h" style={...}
        h3#role-cap-h              "Role capabilities (governed permission map)"
        p.sq-caption               "Grant or revoke a capability for an entire role. The self-escalation guard blocks granting, to a role you hold, any capability you lack — and admin.access.manage can never be granted to or revoked from a role you hold. RLS (security_admin) remains the write authority."
        div.sq-field style={maxInlineSize:420}
          label.sq-field__label for="role-cap-role-select"   "Select a role"
          select.sq-input#role-cap-role-select
            option value=""         "—"
            [for each r in roles]
              option key={r.roleKey} value={r.roleKey}  {r.roleKey}{r.isAdmin ? " (admin)" : ""}
        [if roleKey] Fragment
          h4                       "Granted capabilities"
          [if held.size === 0] p.sq-caption  "This role currently has no capability grants."
          [else] div style={...}
            [for each g in grants.filter(roleKey)]
              span.`sq-lozenge ${g.permissionKey === "admin.access.manage" ? "sq-lozenge--warning" : "sq-lozenge--info"}`
                text                {g.permissionKey}
                button.sq-btn style={...} disabled={pending}
                  text              "Revoke"
          div style={...}
            select.sq-input#role-cap-grant-select style={maxInlineSize:420} disabled={pending}
              [for each p in grantable]
                option key={p.permissionKey} value={p.permissionKey}  {p.permissionKey} — {p.title}
            button.sq-btn.sq-btn--prominent disabled={...}
              text                  "Grant capability to role"
          p.sq-caption              "Audit note: user_roles changes are recorded by the existing audit trigger; role_permissions audit coverage is migration 20260722120000 (authored, pending apply)."
        [if confirming] div.sq-banner.sq-banner--critical role="alert" style={...}
          div
            strong                  {confirmText: "Revoke "{permission}" from every user with role "{role}"? The change takes effect on their next request." / "Grant the separation-of-duties capability admin.access.manage to role "{role}"? Any holder of that role could then change access."}
          div style={...}
            button.sq-btn.sq-btn--prominent disabled={pending}
              text                  {pending ? "Applying…" : "Confirm"}
            button.sq-btn disabled={pending}
              text                  "Cancel"
        [if feedback.ok && !pending] div.sq-banner.sq-banner--success role="status"
          div                       {feedback.ok}
        [if feedback.error] div.sq-banner.sq-banner--critical role="alert"
          div                       {feedback.error}
    [if view === "roles" && canManageRoleCaps && user && roleCapabilitySourcesUnavailable] div.sq-banner.sq-banner--warning role="alert"
      div
        strong             "Role capability details are unavailable."
        text               "The role catalogue remains visible, but capability changes are unavailable because a governed source could not be read."

undefined-classes: sq-pagehead__route-tools, sq-pagehead--route (both from Shell.tsx, rendered here via Shell but only reached when title/topbar set — title="" on this route so not actually rendered, still present as tokens in the tree)
text-content:
Access is enforced by Row Level Security, not UI.
54 policies realize the frozen RBAC matrix; role grants are audited automatically (this page's data itself passed through RLS to render).
Permissions unavailable.
Your access-management permissions could not be verified. All write controls are unavailable; retry the page.
Couldn't load the authorized user roster. Nothing was changed. Try again.
Role details are unavailable.
The authorized user roster remains visible, but role labels and all access changes are unavailable.
User
Email
Region
Roles
Unavailable
This roster is filtered to your access: users outside your visibility are absent, not hidden rows. Access changes use only governed server actions.
This roster is filtered to your access: users outside your visibility are absent, not hidden rows. This screen is read-only.
Access details are partially unavailable.
The user roster remains visible, but access changes are unavailable because one or more governed sources could not be read.
Couldn't load the authorized role catalogue. No controls are available.
Role catalogue
Only roles visible to your session through Row Level Security are listed.
Administrator role
Role capability details are unavailable.
The role catalogue remains visible, but capability changes are unavailable because a governed source could not be read.
Users & Roles
Accounts, role assignment and access review
Administration
People & access
/admin/access
Role changes are guarded and audited
Every write is re-authorized on the server. Self-elevation and removal of the last security administrator are refused by governed RPCs; backend role keys remain unchanged until an approved mapping migration exists.
Users
Roles
Access review
Trusted devices
Governance on this surface
Row Level Security limits the roster before it reaches this page.
Role and capability changes use guarded server actions and append audit evidence.
Changes take effect on the target user's next authorized request.
Reconstruction note
The design's three presentation roles sit above the existing governed role catalogue. This route does not collapse or rename backend roles without an approved data and RLS migration.
SCR-ADM-090 · RBAC-001..014 · EXE-ACCESS
Record
Governance on this surface
Audit
Edit through governed request
View in activity log
Close
Access management
Grant or revoke roles and direct capability overrides. Every change runs through the governed RPCs: the self-escalation guard blocks changes to your own access, the last remaining security administrator cannot be revoked, and every change is recorded in the activity log.
Select a user
—
This is your own user. The self-escalation guard refuses access changes you make to yourself — another security administrator must make them.
Roles
granted
Revoke
Grant role
Effective capabilities
The user's effective access: capabilities derived from their roles plus direct grant overrides, each labelled with its source.
This user currently has no effective capabilities — no roles and no direct grants.
Capability
Source
Actions
via role:
direct grant
Grant capability override
Role and capability changes take effect on the target's next request. Nothing is applied silently: every change is confirmed here and recorded in the activity log with the actor, before/after state and requirement reference EXE-ACCESS.
Confirm
Applying…
Cancel
saved — effective on the user's next request
Role key
Title
Access class
Standard governed role
Role capabilities (governed permission map)
Grant or revoke a capability for an entire role. The self-escalation guard blocks granting, to a role you hold, any capability you lack — and admin.access.manage can never be granted to or revoked from a role you hold. RLS (security_admin) remains the write authority.
Select a role
Granted capabilities
This role currently has no capability grants.
Grant capability to role
Audit note: user_roles changes are recorded by the existing audit trigger; role_permissions audit coverage is migration 20260722120000 (authored, pending apply).
Revoke "{permission}" from every user with role "{role}"? The change takes effect on their next request.
Grant the separation-of-duties capability admin.access.manage to role "{role}"? Any holder of that role could then change access.

## /admin/audit
file: apps/web/src/app/(app)/admin/audit/page.tsx, apps/web/src/app/(app)/admin/audit/AuditReplayWorkspace.tsx, apps/web/src/components/Shell.tsx
structure:
AuditReplayPage (page.tsx)
  Shell current="/admin/audit" title="Inspection Flight Recorder" context=<Fragment>
    span.badge.badge-info      "MVP2-M2-05"
    span.badge.badge-compliant "ENG-12 · "{"append-only"}
  [Shell's own JSX:]
  Fragment
    [topbar undefined, skip]
    header.sq-pagehead.sq-pagehead--route
      div.sq-pagehead__row
        div.sq-pagehead__context
          h2                    "Inspection Flight Recorder"
          {context}
    div.sq-content
      AuditReplayWorkspace locale=... mode=... caseRef=... query=... at=... vs=... roles=... authorized=... partialScope=... semanticUnavailable=... sourceError=... sourceErrorMessage=... events=... expected=... ontologyLoaded=... historyTruncated=...
        [AuditReplayWorkspace's own JSX:]
        [if !props.authorized] section.panel.ar-denied role="alert"
          span aria-hidden="true"        "🛡"
          h2                             "You are not authorized to read audit events."
          p                              "RBAC / RLS · "{"zero disclosure"}
        [else] div.ar-workspace dir={ltr/rtl}
          a.sq-shell__skip href="#audit-chronology"   "Skip to event chronology"
          section.ar-casehead.panel
            div
              span.t-caption              "MVP2-CD-031-M2-05"
              h2                          "Inspection Flight Recorder"
              p.t-caption                 {caseRef || "Portfolio / current readable scope"}" · "{events.length}" · "{completenessAvailable ? found/expected : "Completeness"}
            div.ar-status
              span.badge.badge-compliant  "Append-only"
              span.badge.badge-info       {roles.join(" · ")}
          div.sq-banner.sq-banner--warning role="note"
            div
              strong                      "POLICY_HELD"
              text                        " · "{"Operational view only. Export, reveal, redaction, retention, watermark, purge and legal-evidence claims remain policy-held."}
          form.ar-filter.panel method="get"
            label.sq-field
              span.sq-field__label        "Case / object UUID"
              input.sq-input name="case" defaultValue={caseRef}
            label.sq-field
              span.sq-field__label        "Search events"
              input.sq-input name="q" defaultValue={query}
            input type="hidden" name="view" value={mode}
            button.btn.btn-primary.btn-lg.btn-touch type="submit"   "Apply"
          nav.ar-modes aria-label="Audit replay modes"
            [for each [id,label] in modes: recorder/reconstruct/compare/ledger/custody/print]
              a.`btn btn-touch ${mode === id ? "btn-primary btn-lg" : "btn-secondary"}` aria-current={mode===id?"page":undefined} href={`?view=${id}&case=...&q=...`}
                text                      {label}
          [if partialScope] div.sq-banner role="status"
            div
              strong                      "PARTIAL SCOPE."
              text                        " "{"Results reflect only your current RLS-readable scope."}
          [if semanticUnavailable] div.sq-banner.sq-banner--warning role="status"
            div
              strong                      "DEGRADED."
              text                        " "{"Semantic replay contracts are not applied in this environment. Generic immutable events remain visible and are not promoted to canonical facts."}
          [if historyTruncated] div.sq-banner.sq-banner--warning role="status"
            div                           "PARTIAL HISTORY. The bounded server read reached its safety cap. Reconstruction and completeness are not certified for this result."
          [if sourceError] div.sq-banner.sq-banner--critical role="alert"
            div                           {sourceErrorMessage}
          [if !sourceError && events.length === 0] section.panel.ar-empty
            span aria-hidden="true"       "⌕"
            h3                            "No audit facts are visible in your current scope."
          [if mode === "recorder" && events.length > 0] section#audit-chronology.ar-recorder
            div.ar-lanes.panel aria-label="Flight recorder"
              div.ar-lane.ar-lane--version    "Versions"
              div.ar-lane.ar-lane--workflow   "Workflow"
              div.ar-lane.ar-lane--device     "Device / sync"
              div.ar-lane.ar-lane--evidence   "Evidence"
            ol.ar-spine.panel
              [for each event in events]
                li.`ar-event ar-event--${event.provenance}`
                  time dateTime={event.occurredAt}   {new Date(...).toLocaleString(...)}
                  div
                    strong                 {event.eventType}
                    p                      {event.aggregateType}" · "
                      bdi                  {event.aggregateId ?? "—"}
                    span.`sq-lozenge ${event.provenance === "semantic" ? "sq-lozenge--success" : "sq-lozenge--warning"}`
                      text                 {event.provenance === "semantic" ? "Recorded semantic" : "Generic only"}
                  button.btn.btn-ghost.btn-touch type="button"   "Open provenance"
            aside.ar-dossier.panel
              h3                           "Point-in-time dossier"
              p                            {atState.length ? String(atState.length) : "No event existed at this moment."}
              dl
                dt                         "Governing versions"
                dd                         "MISSING"
                dt                         "Correlation"
                dd                         {events.some(hasCorrelationId) ? "Partial" : "MISSING"}
                dt                         "Legal status"
                dd                         "POLICY_HELD"" · DEC-006 / DEC2-009"
          [if mode === "reconstruct"] section.panel.ar-modepanel
            form method="get"
              input type="hidden" name="view" value="reconstruct"
              input type="hidden" name="case" value={caseRef}
              label.sq-field
                span.sq-field__label       "Reconstruct at"
                input.sq-input type="datetime-local" name="at" defaultValue={at?.slice(0,16)}
              button.btn.btn-primary.btn-lg.btn-touch   "Apply"
            h3                             {atState.length}" reconstructed aggregate states"
            [for each row in atState]
              article.ar-custody
                strong                     {row.key}
                span                       {row.eventIds.length}" source events · last "{row.lastOccurredAt}
                [if row.conflicts.length > 0] span.badge.badge-critical   "CONFLICT"
                pre                        {json(row.state)}
          [if mode === "compare"] section.panel.ar-modepanel
            form.ar-compareform method="get"
              input type="hidden" name="view" value="compare"
              input type="hidden" name="case" value={caseRef}
              label.sq-field
                span.sq-field__label       "Reconstruct at"
                input.sq-input type="datetime-local" name="at" defaultValue={at?.slice(0,16)}
              label.sq-field
                span.sq-field__label       "Compare with"
                input.sq-input type="datetime-local" name="vs" defaultValue={vs?.slice(0,16)}
              button.btn.btn-primary.btn-lg.btn-touch   "Apply"
            [for each row in comparison]
              article
                h3                         {row.key}" · "{row.changed ? "Changed" : "Unchanged"}
                div.ar-diff
                  div
                    h4                     "Before"
                    pre                    {json(row.before?.state)}
                  div
                    h4                     "After"
                    pre                    {json(row.after?.state)}
          [if mode === "ledger"] section.panel.ar-modepanel
            h3                             "Completeness · "{completenessAvailable ? found/expected : "MISSING"}
            [if !completenessAvailable] div.sq-banner.sq-banner--warning
              div                          "Select one non-truncated case with a published ontology. Portfolio or partial-page events never satisfy case completeness."
            div.ar-ledger
              [for each row in completeness.rows]
                div.ar-ledgerrow
                  bdi                      {row.requirementId}
                  strong                   {row.eventType}
                  span.`sq-lozenge ${row.found ? "sq-lozenge--success" : row.defaultStatus === "needs_contract" ? "sq-lozenge--warning" : "sq-lozenge--critical"}`
                    text                   {row.found ? "FOUND" : row.defaultStatus === "needs_contract" ? "NEEDS_CONTRACT" : "MISSING"}
          [if mode === "custody"] section.panel.ar-modepanel
            h3                             "Custody"
            [for each event in events]
              div.ar-custody
                bdi                        {event.id}
                span                       {event.eventType}
                span                       "Integrity: "{event.integrityStatus}
                span                       "Chain: "{event.chainStatus}
          [if mode === "print"] section.panel.ar-modepanel.ar-print
            h3                             "Print-safe"
            p role="note"                  "Operational view only. Export, reveal, redaction, retention, watermark, purge and legal-evidence claims remain policy-held."
            [for each event in events]
              p
                time                       {event.occurredAt}
                text                       " · "{event.eventType}" · "{event.provenance}" · "{event.integrityStatus}
          [if selected] div.ar-dialogbackdrop
            aside.ar-dialog.panel role="dialog" aria-modal="true" aria-labelledby="audit-event-title"
              button.btn.btn-ghost.ar-dialogclose.btn-touch type="button" aria-label="Close event detail"   "×"
              h2#audit-event-title          {selected.eventType}
              dl
                dt                         "Source"
                dd                         {selected.provenance}
                dt                         "Integrity"
                dd                         {selected.integrityStatus}
                dt                         "Chain"
                dd                         {selected.chainStatus}
                dt                         "Correlation"
                dd
                  bdi                      {selected.correlationId ?? "MISSING"}
              div.ar-diff
                div
                  h3                       "Before"
                  pre                      {json(selected.beforeState)}
                div
                  h3                       "After"
                  pre                      {json(selected.afterState)}
              h3                           "Semantic payload"
              pre                          {json(selected.payload)}

undefined-classes: sq-pagehead--route, ar-lane--version
text-content:
MVP2-M2-05
ENG-12 ·
append-only
Inspection Flight Recorder
You are not authorized to read audit events.
RBAC / RLS ·
zero disclosure
Skip to event chronology
MVP2-CD-031-M2-05
Inspection Flight Recorder
Portfolio / current readable scope
Completeness
Append-only
POLICY_HELD
Operational view only. Export, reveal, redaction, retention, watermark, purge and legal-evidence claims remain policy-held.
Case / object UUID
Search events
Apply
Flight recorder
Point in time
Compare
Completeness
Custody
Print-safe
PARTIAL SCOPE.
Results reflect only your current RLS-readable scope.
DEGRADED.
Semantic replay contracts are not applied in this environment. Generic immutable events remain visible and are not promoted to canonical facts.
PARTIAL HISTORY. The bounded server read reached its safety cap. Reconstruction and completeness are not certified for this result.
No audit facts are visible in your current scope.
Versions
Workflow
Device / sync
Evidence
Open provenance
Point-in-time dossier
No event existed at this moment.
Governing versions
MISSING
Correlation
Partial
Legal status
POLICY_HELD
· DEC-006 / DEC2-009
Recorded semantic
Generic only
Reconstruct at
Compare with
reconstructed aggregate states
source events
last
CONFLICT
Before
After
Changed
Unchanged
MISSING
Select one non-truncated case with a published ontology. Portfolio or partial-page events never satisfy case completeness.
FOUND
NEEDS_CONTRACT
Custody
Integrity:
Chain:
Print-safe
Semantic payload
Close event detail
Source
Integrity
Chain
Correlation

---

## /admin/bulk-violations
file: apps/web/src/app/(app)/admin/bulk-violations/page.tsx, apps/web/src/app/(app)/admin/bulk-violations/BulkViolationForm.tsx
structure:
Shell.current="/admin/bulk-violations" title="Bulk violation issuance"
  [if roleError]
    h1.sq-sr-only            "Bulk violation issuance"
    EmptyState icon=IconBlocked title="Permissions unavailable" body="Your permissions could not be verified. No establishment or violation data is shown; retry the page."
  [else if !isAuthorized]
    h1.sq-sr-only            "Bulk violation issuance"
    EmptyState icon=IconBlocked title="Authorized role required" body="Bulk violation issuance (DEC-L) is available to Operations and Compliance Admin roles only."
  [else, main render]
    context slot: span.badge.badge-info    "DEC-L"
    h1.sq-sr-only             "Bulk violation issuance"
    div.sq-banner.sq-banner--warning
      div
        strong                "Real issuance is blocked by DEC-032."
        (text)                " You may review the eligible establishments and mapped violations, but this route cannot create an inspection or violation while the submission digest defect remains open."
    [if factoriesError]
      div.sq-banner.sq-banner--warning role="alert"
        div                   "The establishment registry is unavailable in this environment."
    [if violationsError]
      div.sq-banner.sq-banner--warning role="alert"
        div                   "The violation catalogue is unavailable in this environment."
    [if packagesError]
      div.sq-banner.sq-banner--warning role="alert"
        div                   "Published package versions are unavailable in this environment."
    BulkViolationForm factories violations packages strings
      form.`stack ${styles.form}` style={gap:var(--space-6)} action=formAction
        input type=hidden name="request_id"
        section.panel.stack style={padding:var(--space-6)}
          label.sq-field style={maxInlineSize:none}
            span.sq-field__label      "Search establishments"
            input.sq-input placeholder="Name, CR number or code"
          label.sq-field style={maxInlineSize:none}
            span.sq-field__label      "Locked, published and active package version"
            select.sq-select name="package_version_id"
              option value=""         "— select an eligible package version"
              [for each item in packages]
                option key=item.id value=item.id   "{item.label}"
          p.t-caption.numeric        "{selected.size} selected"
          div.stack style={gap:var(--space-1), maxBlockSize:320, overflow:auto}
            [for each f in shown]
              label.sq-choice key=f.id style={display:flex, alignItems:center}
                input type=checkbox name="factory_id" value=f.id
                span               "{f.name} "
                  span.t-caption   "{f.factory_code ?? f.cr_number ?? "—"} · {f.city ?? "—"}{f.region ? `, ${f.region}` : ""}"
        section.panel.stack style={padding:var(--space-6)}
          label.sq-field style={maxInlineSize:none}
            span.sq-field__label     "Violation"
            select.sq-select name="violation_code"
              option value=""        "— select a violation"
              [for each v in violations]
                option key=v.code value=v.code    "{v.code} · {v.title} ({v.level})"
          label.sq-field style={maxInlineSize:none}
            span.sq-field__label     "Notes (optional)"
            textarea.sq-textarea name="notes" rows=2 placeholder="Recorded with the audit event"
        [if selected.size > 0 && chosenViolation]
          section.panel.stack style={padding:var(--space-6)}
            h4                     "Impact summary"
            p                      "Read-only preview: {n} establishment(s) are selected for one {level} violation ({code} · {penalty}). No inspection or violation can be created while DEC-032 remains open."
            label.sq-choice style={display:flex}
              input type=checkbox name="acknowledged"
              span                 "I have reviewed this blocked impact preview."
        [if state.error]
          div.sq-banner.sq-banner--critical role="alert"
            div                   "{strings.errors[state.error]}"
        div.sq-banner.sq-banner--warning role="status"
          div                     "Submission unavailable — DEC-032 blocks all real inspection submissions until the required database digest migration is approved and deployed. No violation will be issued from this page."
        [if results.length > 0]
          section.panel.stack style={padding:var(--space-6)}
            h4                    "Result"
            [if failedCount > 0]
              div.sq-banner.sq-banner--warning role="alert"
                div               "Not all targets succeeded — review the failed rows below before assuming this batch is complete."
            [else]
              div.sq-banner.sq-banner--success
                div               "All {n} violations issued successfully."
            div.sq-tablewrap tabIndex=0 aria-label="Result"
              table.sq-table
                tbody
                  [for each r in results]
                    tr key=r.factory_id
                      td.t-caption.numeric   "{r.factory_id}"
                      td
                        span.`sq-lozenge ${r.status === "success" ? "sq-lozenge--success" : "sq-lozenge--critical"}`   "{r.status === "success" ? strings.resultSuccess : strings.resultFailed}"
                      [if r.error_code]
                        td.t-caption          "{r.error_code}"
        button.`btn btn-primary btn-field ${styles.submit}` type=submit aria-disabled=!canSubmit disabled=!canSubmit title="{strings.blockedReason}"
          "{pending ? strings.submitting : strings.submit}"
undefined-classes: none
text-content:
Bulk violation issuance
Permissions unavailable
Your permissions could not be verified. No establishment or violation data is shown; retry the page.
Authorized role required
Bulk violation issuance (DEC-L) is available to Operations and Compliance Admin roles only.
DEC-L
Real issuance is blocked by DEC-032.
You may review the eligible establishments and mapped violations, but this route cannot create an inspection or violation while the submission digest defect remains open.
The establishment registry is unavailable in this environment.
The violation catalogue is unavailable in this environment.
Published package versions are unavailable in this environment.
Search establishments
Name, CR number or code
Locked, published and active package version
— select an eligible package version
{n} selected
— select a violation
Notes (optional)
Recorded with the audit event
Impact summary
Read-only preview: {n} establishment(s) are selected for one {level} violation ({code} · {penalty}). No inspection or violation can be created while DEC-032 remains open.
I have reviewed this blocked impact preview.
Submission unavailable — DEC-032 blocks all real inspection submissions until the required database digest migration is approved and deployed. No violation will be issued from this page.
Result
Not all targets succeeded — review the failed rows below before assuming this batch is complete.
All {n} violations issued successfully.
issued
failed
Issuance unavailable — DEC-032
Issuing…

## /admin/compliance-approvals
file: apps/web/src/app/(app)/admin/compliance-approvals/page.tsx, apps/web/src/app/(app)/admin/compliance-approvals/error.tsx, apps/web/src/app/(app)/admin/compliance-approvals/loading.tsx
structure:
[LOADING STATE — loading.tsx]
div.panel
  div.sq-state role="status" aria-live="polite"
    span.sq-state__glyph aria-hidden="true"   "◌"
    h4                                        "Loading Compliance Approval Queue"
    p.t-caption                               "Reading RLS-scoped requests, components and dependencies…"

[ERROR STATE — error.tsx]
div.sq-surface
  div.sq-state role="alert"
    span.sq-state__glyph aria-hidden="true"   "⚠"
    h4                                        "Awaiting Approval unavailable"
    p.sq-caption                              "No request state or workload has been inferred, and no decision was recorded."
    button.sq-btn.sq-btn--secondary type="button" onClick=reset   "Retry queue"

[MAIN PAGE — page.tsx]
Shell current="/admin/compliance-approvals" title="Compliance Approval Queue"
  context slot:
    span.badge.badge-info       "CCR maker-checker"
    span.t-caption              "Distinct from Inspection Review & Approval"
  div.sq-banner role="note"
    strong                      "Compliance configuration decisions only."
    (text)                      " This queue reviews CCR components and publication readiness. It does not contain inspection reports or Level 2 inspection reviews."
  div.sq-banner.sq-banner--warning role="note"    "Item-weight and score-exclusion rules (CR-471/472) are Not configured and are not accepted by the current request workflow."
  div.ccr-register-head
    div
      h3                        "Review workload"
      p.t-caption               "RLS-scoped requests are ordered by submitted time. Age is shown as a fact; no unapproved SLA or priority is inferred."
    Link.btn.btn-secondary.btn-touch href="/admin/compliance-requests"   "Request register"
  nav.cmp-approval-filters aria-label="Approval queue status"
    [for each [key, entry] in Object.entries(FILTERS)]
      Link key=key className={`btn btn-touch ${filterKey === key ? "btn-primary btn-lg" : "btn-secondary"}`} aria-current={filterKey === key ? "page" : undefined} href="/admin/compliance-approvals?view={key}"   "{ar ? mapped-arabic-label : entry.label}"
  [if ownRows.length]
    div.sq-banner.sq-banner--warning role="status"
      strong                    "{ownRows.length} own requests excluded."
      (text)                    " Makers cannot decide or publish their own requests. The database RPC enforces the same rule."
  [if enrichmentDegraded]
    div.sq-banner.sq-banner--warning role="alert"
      strong                    "Queue details are partially unavailable."
      (text)                    " Eligible requests are shown from the successful RLS-scoped queue read. Component progress or dependency counts are withheld where their governed read failed. "
      a.sq-link href="/admin/compliance-approvals?view={filterKey}"   "Retry details"
  [if queueReadFailed]
    div.panel
      div.sq-state role="alert"
        span.sq-state__glyph aria-hidden="true"   "⚠"
        h4                      "Approval Queue unavailable"
        p.t-caption             "The governed request read failed. Workload and eligibility have not been inferred."
        a.sq-link href="/admin/compliance-approvals?view={filterKey}"   "Retry queue"
  [else if rows.length === 0]
    div.panel
      div.sq-state role="status"
        span.sq-state__glyph aria-hidden="true"   "✓"
        h4                      "{copy.noPrefix} {filterLabel.toLocaleLowerCase()} {copy.noSuffix}" ("No {filter label lowercased} requests in your scope")
        p.t-caption             "The RLS-scoped read succeeded and returned zero eligible maker-checker assignments for this view."
  [else]
    div.cmp-approval-list
      [for each row in rows]
        article.panel.cmp-approval-card key=row.id
          header
            div
              p.sq-overline
                bdi              "{row.request_number}"
                (text)           " · {row.request_type === "create" ? "Create" : "Modify"} · Revision {row.current_revision}"
              h3                 "{row.title}"
            span.`sq-lozenge ccr-status ccr-status--${row.status}`   "{statusLabel(row.status, ar)}"
          dl.cmp-approval-facts
            div
              dt                 "Submitted"
              dd.numeric         "{timestamp(row.submitted_at, "Unavailable")}"
            div
              dt                 "Components"
              dd                 "{componentsAvailable ? current.length : "Unavailable"}"
            div
              dt                 "Decision progress"
              dd                 "{componentsAvailable ? progress || "No current components" : "Unavailable"}"
            div
              dt                 "Dependencies"
              dd                 "{dependenciesAvailable ? dependencyCount : "Unavailable"}"
            div
              dt                 "Coverage"
              dd                 "{componentsAvailable ? coverage || "No current components" : "Unavailable"}"
            div
              dt                 "Audit receipts"
              dd                 "{auditCount ?? "Unavailable"}"
                [if row.publication_audit_reference]
                  (text)         " · Publication receipt "
                  bdi            "{row.publication_audit_reference}"
          footer
            span.t-caption       "Correlation "
              bdi                "{row.correlation_id}"
              (text)             " · Opens the current immutable submitted revision; decisions remain database-RPC guarded."
            Link.btn.btn-primary.btn-lg.btn-touch href="/admin/compliance-requests/{row.id}?from=approval-queue"   "Open review workspace"
undefined-classes: none
text-content:
Loading Compliance Approval Queue
Reading RLS-scoped requests, components and dependencies…
Awaiting Approval unavailable
No request state or workload has been inferred, and no decision was recorded.
Retry queue
Compliance Approval Queue
CCR maker-checker
Distinct from Inspection Review & Approval
Compliance configuration decisions only.
This queue reviews CCR components and publication readiness. It does not contain inspection reports or Level 2 inspection reviews.
Item-weight and score-exclusion rules (CR-471/472) are Not configured and are not accepted by the current request workflow.
Review workload
RLS-scoped requests are ordered by submitted time. Age is shown as a fact; no unapproved SLA or priority is inferred.
Request register
Pending Review
Partially Approved
Ready to Publish
own requests excluded.
Makers cannot decide or publish their own requests. The database RPC enforces the same rule.
Queue details are partially unavailable.
Eligible requests are shown from the successful RLS-scoped queue read. Component progress or dependency counts are withheld where their governed read failed.
Retry details
Approval Queue unavailable
The governed request read failed. Workload and eligibility have not been inferred.
Retry queue
No
requests in your scope
The RLS-scoped read succeeded and returned zero eligible maker-checker assignments for this view.
Create
Modify
Revision
Unavailable
No current components
Unavailable
No current components
Unavailable
Unavailable
Correlation
Open review workspace
Publication receipt

## /admin/compliance-requests
file: apps/web/src/app/(app)/admin/compliance-requests/page.tsx, apps/web/src/app/(app)/admin/compliance-requests/new/page.tsx, apps/web/src/app/(app)/admin/compliance-requests/ActionForm.tsx
structure:
[LIST PAGE — page.tsx]
Shell current="/admin/compliance-requests" title="Compliance Configuration Requests"
  context slot:
    span.badge.badge-info       "CMP-REQ-CCR-001..010"
    span.t-caption              "Governed request register · RLS-scoped"
  div.ccr-toolbar
    div
      h3                        "Request register"
      p.t-caption               "Create and modify Regulations, Inspection Items, Violations and Penalties through immutable revisions and maker-checker review."
    [if canCreate]
      Link.btn.btn-primary.btn-lg.btn-touch href="/admin/compliance-requests/new"   "Create Request"
    [else]
      span.t-caption role="note"   "Request creation requires Compliance or Form Admin authority."
  [if error]
    div.panel
      div.sq-state role="alert"
        span.sq-state__glyph aria-hidden="true"   "⚠"
        h4                      "Request register unavailable"
        p.t-caption             "The read failed. Counts and status have not been inferred."
        a.sq-link href="/admin/compliance-requests"   "Retry"
  [else if rows.length === 0]
    div.panel
      div.sq-state role="status"
        span.sq-state__glyph aria-hidden="true"   "◇"
        h4                      "No configuration requests"
        p.t-caption             "The RLS-scoped read succeeded and returned zero requests. Create the first governed request when authorized."
        [if canCreate]
          Link.btn.btn-secondary.btn-touch href="/admin/compliance-requests/new"   "Create Request"
  [else]
    div.sq-tablewrap
      table.sq-table
        caption.sr-only          "Compliance Configuration Request register"
        thead
          tr
            th scope="col"       "Request"
            th scope="col"       "Type"
            th scope="col"       "Status"
            th scope="col"       "Revision"
            th scope="col"       "Created"
            th scope="col"       "Open"
        tbody
          [for each row in rows]
            tr key=row.id
              th scope="row"
                strong            "{row.request_number}"
                div.t-caption     "{row.title}"
              td                  "{row.request_type === "create" ? "Create" : "Modify"}"
              td
                span.`sq-lozenge ccr-status ccr-status--${row.status}`   "{statusLabel[row.status] ?? row.status}"
              td.numeric          "R{row.current_revision}"
              td.numeric          "{new Date(row.created_at).toISOString().slice(0,10)}"
              td
                Link.sq-link href="/admin/compliance-requests/{row.id}"   "Open workspace"

[CREATE PAGE — new/page.tsx]
Shell current="/admin/compliance-requests" title="Create Compliance Configuration Request"
  context slot: span.badge.badge-info   "Draft · Revision 1"
  p.t-caption
    Link.sq-link href="/admin/compliance-requests"   "← Request register"
  section.panel.ccr-form-card aria-labelledby="ccr-create-heading"
    h3 id="ccr-create-heading"    "Request foundation"
    p.t-caption                   "Create the governed envelope first. Components and dependencies are added in the request workspace."
    ActionForm action=createComplianceRequest className="ccr-form" redirectOnCreate
      [ActionForm's own render, recursed below, wraps these children:]
      label.sq-field
        span.sq-field__label      "Request type"
        select.sq-select name="request_type" required defaultValue={requestedType}
          option value="create"   "Create"
          option value="modify"   "Modify"
      label.sq-field
        span.sq-field__label      "Title"
        input.sq-input name="title" required maxLength=180 defaultValue={requestedTitle}
      label.sq-field.ccr-span
        span.sq-field__label      "Description"
        textarea.sq-textarea name="description" rows=4 defaultValue={requestedDescription}
      label.sq-field.ccr-span
        span.sq-field__label      "Initial comments"
        textarea.sq-textarea name="comments" rows=3
      div.ccr-span.ccr-actions
        button.btn.btn-primary.btn-lg.btn-touch type="submit"   "Create draft request"
        Link.btn.btn-secondary.btn-touch href="/admin/compliance-requests"   "Cancel"

[ActionForm.tsx recursed structure — className passed as "ccr-form"]
form.{className} action=formAction aria-busy={pending}
  {children}   (rendered as shown above, nested inside this form)
  [if state.error]
    p.t-caption.ccr-error role="alert"   "{state.error}"
  [if state.ok && !state.requestId]
    p.t-caption.ccr-success role="status"   "Saved."
undefined-classes: ccr-toolbar
text-content:
Compliance Configuration Requests
CMP-REQ-CCR-001..010
Governed request register · RLS-scoped
Request register
Create and modify Regulations, Inspection Items, Violations and Penalties through immutable revisions and maker-checker review.
Create Request
Request creation requires Compliance or Form Admin authority.
Request register unavailable
The read failed. Counts and status have not been inferred.
Retry
No configuration requests
The RLS-scoped read succeeded and returned zero requests. Create the first governed request when authorized.
Create Request
Compliance Configuration Request register
Request
Type
Status
Revision
Created
Open
Create
Modify
Open workspace
Create Compliance Configuration Request
Draft · Revision 1
← Request register
Request foundation
Create the governed envelope first. Components and dependencies are added in the request workspace.
Request type
Create
Modify
Title
Description
Initial comments
Create draft request
Cancel
Saved.

---

## /admin/devices
file: apps/web/src/app/(app)/admin/devices/page.tsx
structure:
Shell.current="/admin/devices" title={t("mvp3.devices.title","Trusted device and offline administration")} context={<span className="badge badge-info">}
  span.badge.badge-info    "M3-06 · CD-056 · " {deviceCountLabel}
  div.sq-banner
    div
      strong    "Only trusted enrolled devices may open official inspection packages."
      (text)    " A queued command is not a completed wipe; device acknowledgement remains a separate fact."
  [if devicesError]
    div.sq-banner.sq-banner--warning role="alert"    "MVP3 database contract is not applied in this environment. No data is inferred."
  section.panel.stack style={padding:"var(--space-6)", marginBlockStart:"var(--space-4)"}
    div.row style={justifyContent:"space-between"}
      h3    "Device trust register"
      span.badge
        [if devicesError]    "Unavailable"
        [else]    "{count} trusted"
    div.sq-tablewrap
      table.sq-table
        thead
          tr
            th scope="col"    "Device"
            th scope="col"    "Assigned inspector"
            th scope="col"    "Trust state"
            th scope="col"    "Last seen"
            th scope="col"    "Governed command"
        tbody
          [for each row in (devices ?? [])]
            tr key=row.id
              th scope="row"    {row.device_identifier}
                div.t-caption    {row.platform} " · MDM " {row.mdm_reference ?? "unverified"}
              td
                bdi    {row.assigned_user_id ?? "unassigned"}
              td
                span.`sq-lozenge ${row.trust_status === "trusted" ? "sq-lozenge--success" : "sq-lozenge--warning"}`    {row.trust_status.replaceAll("_"," ")}
              td    [if row.last_seen_at]{new Date(...).toLocaleString()} [else]"Never"
              td
                Mvp3ActionForm action={issueDeviceCommand} submitLabel="Queue command"
                  input type="hidden" name="deviceId" value={row.id}
                  label    "Command"
                    select name="command" required defaultValue=""
                      option value="" disabled    "—"
                      option value="suspend"    "Suspend"
                      option value="resume"    "Resume"
                      option value="expire_packages"    "Expire packages"
                      option value="remote_wipe"    "Remote wipe"
                  label    "Reason"
                    textarea name="reason" minLength={8} required
          [if !devicesError && !(devices ?? []).length]
            tr
              td colSpan={5}    "No RLS-visible enrolled devices."
  section.panel.stack style={padding:"var(--space-6)", marginBlockStart:"var(--space-4)"}
    h3    "Command evidence"
    [if commandsError]
      div.sq-banner.sq-banner--warning role="alert"    "Command evidence is unavailable. No command state is inferred."
    [for each row in (commands ?? [])]
      div.row key=row.id style={justifyContent:"space-between", flexWrap:"wrap"}
        span
          strong    {row.command}
          small.t-caption    " · " {row.reason}
        span.badge    {row.status}
    [if !commandsError && !(commands ?? []).length]
      p.t-caption    "No RLS-visible commands."
undefined-classes: none
text-content:
M3-06 · CD-056 ·
Register unavailable
controlled rows
Only trusted enrolled devices may open official inspection packages.
A queued command is not a completed wipe; device acknowledgement remains a separate fact.
MVP3 database contract is not applied in this environment. No data is inferred.
Device trust register
Unavailable
trusted
Device
Assigned inspector
Trust state
Last seen
Governed command
unassigned
Never
unverified
Command
—
Suspend
Resume
Expire packages
Remote wipe
Reason
No RLS-visible enrolled devices.
Command evidence
Command evidence is unavailable. No command state is inferred.
No RLS-visible commands.
Queue command (Mvp3ActionForm submitLabel prop)

## /admin/enforcement-recommendations
file: apps/web/src/app/(app)/admin/enforcement-recommendations/page.tsx, apps/web/src/app/(app)/admin/enforcement-recommendations/DecideForm.tsx
structure:
[if roleError]
  Shell current="/admin/enforcement-recommendations" title="Enforcement recommendations"
    h1.sq-sr-only    "Enforcement recommendations"
    EmptyState icon={IconBlocked size=28} title="Permissions unavailable" body="Your permissions could not be verified. No recommendation data or action is shown; retry the page."
[else if !isReader]
  Shell current="/admin/enforcement-recommendations" title="Enforcement recommendations"
    h1.sq-sr-only    "Enforcement recommendations"
    EmptyState icon={IconBlocked size=28} title="Authorized role required" body="This queue is available to Inspector, Planner, Ops, Compliance Admin, Auditor, Reviewer and Leadership roles."
[else]
  Shell current="/admin/enforcement-recommendations" title="Enforcement recommendations" context={<span className="badge badge-info">DEC-F</span>}
    span.badge.badge-info    "DEC-F"
    h1.sq-sr-only    "Enforcement recommendations"
    div.{styles.pageRoot}
      div.sq-banner.sq-banner--warning role="note"
        div
          strong    "Enforcement policy: Not configured."
          (text)    " " "The sponsor must supply the approved enforcement measure catalogue and authoritative legal-basis wording for each measure, including the published instrument and version. No amount, escalation ladder, citation or Arabic legal wording is asserted until supplied."
      div.sq-banner role="note"
        div
          strong    "Decision scope"
          (text)    " " "Decisions are temporarily read-only until the database exposes an atomic guarded decision transition. A future approval will record the recommendation decision only; it will not apply a penalty, close an establishment, issue a legal notice, or bypass governed enforcement configuration."
      [if !isDecider] readOnlyBanner
        div.sq-banner role="note"
          strong
            IconEye size=16
            (text)    " " "Read-only for your role"
          (text)    " " "You can view the recommendation queue; deciding requires an Operations or Compliance Admin role, enforced by row-level security."
      [if pendingError]
        div.sq-banner.sq-banner--warning role="alert"
          div    "The recommendation queue is unavailable in this environment. No count is claimed."
      section.panel.stack style={padding:"var(--space-6)"}
        h2    "Pending recommendations"
        [if !rows.length && !pendingError]
          div.sq-state.sq-state--inline role="status"
            span.sq-state__glyph aria-hidden="true"
              IconFolder size=28
            h3    "No pending recommendations"
        [else for each row in rows]
          div.sq-panel key=row.id style={padding:"var(--space-6)", display:"flex", flexDirection:"column", gap:"var(--space-3)"}
            div.row style={justifyContent:"space-between", flexWrap:"wrap"}
              div
                strong    {row.factories?.name ?? row.factory_id}
                div.t-caption    {row.factories?.city ?? "—"}[if row.factories?.region]{`, ${row.factories.region}`} " · " {row.factories?.factory_code ?? "unregistered/temporary"}
              span.badge.badge-warning    "Recommended measure" ": " {actionLabel(row.recommended_action)}
            [if row.recommendation_notes]
              p.t-caption    {row.recommendation_notes}
            p.t-caption.numeric    {new Date(row.recommended_at).toLocaleString(locale)}
            [if isDecider && canDecide]
              DecideForm id={row.id} strings={...}
                form.stack style={gap:"var(--space-3)"} action={formAction}
                  input type="hidden" name="id" value={id}
                  input type="hidden" name="idempotency_key" value={idempotencyKey}
                  div.row
                    label.sq-choice    (text)" " "Approve"
                      input type="radio" name="decision" value="approved" checked onChange
                    label.sq-choice    (text)" " "Reject"
                      input type="radio" name="decision" value="rejected" checked onChange
                  label.sq-field
                    span.sq-field__label    "Decision basis (required)"
                    textarea.sq-textarea name="decision_reason" rows={2} required maxLength={2000} placeholder="Recorded with the audit event"
                  [if state.error]
                    div.sq-banner.sq-banner--critical role="alert"
                      div    {strings.errors[state.error]}
                  [if state.ok]
                    div.sq-banner.sq-banner--success role="status"
                      div    "Decision recorded. The recommendation queue will refresh."
                  button type="submit" className="btn btn-primary btn-lg btn-touch" aria-disabled={pending} disabled={pending}    [if pending]"Recording…" [else]"Record decision"
            [else]
              p.t-caption    [if isDecider]"Decision unavailable — guarded database transition required." [else]"Awaiting an Operations or Compliance Admin decision."
      [if isDecider]
        section.panel.stack style={padding:"var(--space-6)", marginBlockStart:"var(--space-4)"}
          h2    "Recently decided"
          [if decidedError]
            div.sq-banner.sq-banner--warning role="alert"
              div    "Recent decisions are unavailable. No history count is claimed."
          [else if !(decided ?? []).length]
            p.t-caption    "No decisions recorded yet."
          [else]
            div.sq-tablewrap tabIndex={0} aria-label="Recently decided"
              table.sq-table
                tbody
                  [for each d in (decided ?? [])]
                    tr key=d.id
                      td    {(d.factories)?.name ?? "—"}
                      td    {actionLabel(d.recommended_action)}
                      td
                        span.`sq-lozenge ${d.status === "approved" ? "sq-lozenge--success" : "sq-lozenge--critical"}`    [if d.status === "approved"]"Approved" [else]"Rejected"
                      td.t-caption.numeric    [if d.decided_at]{new Date(d.decided_at).toLocaleString(locale)} [else]"—"
undefined-classes: styles.pageRoot (CSS-module class, own scoped .module.css — not in scope of the two global stylesheets; not a design-system gap)
text-content:
Enforcement recommendations
Permissions unavailable
Your permissions could not be verified. No recommendation data or action is shown; retry the page.
Authorized role required
This queue is available to Inspector, Planner, Ops, Compliance Admin, Auditor, Reviewer and Leadership roles.
DEC-F
Enforcement policy: Not configured.
The sponsor must supply the approved enforcement measure catalogue and authoritative legal-basis wording for each measure, including the published instrument and version. No amount, escalation ladder, citation or Arabic legal wording is asserted until supplied.
Decision scope
Decisions are temporarily read-only until the database exposes an atomic guarded decision transition. A future approval will record the recommendation decision only; it will not apply a penalty, close an establishment, issue a legal notice, or bypass governed enforcement configuration.
Read-only for your role
You can view the recommendation queue; deciding requires an Operations or Compliance Admin role, enforced by row-level security.
The recommendation queue is unavailable in this environment. No count is claimed.
Pending recommendations
No pending recommendations
unregistered/temporary
Recommended measure
:
Financial fine
Refer to committee
Warning
Factory closure
Unavailable recommendation category
Decision unavailable — guarded database transition required.
Awaiting an Operations or Compliance Admin decision.
Approve
Reject
Decision basis (required)
Recorded with the audit event
Decision recorded. The recommendation queue will refresh.
Recording…
Record decision
Recently decided
Recent decisions are unavailable. No history count is claimed.
No decisions recorded yet.
Approved
Rejected

## /admin/gis
file: apps/web/src/app/(app)/admin/gis/page.tsx, apps/web/src/app/(app)/admin/gis/GisStudio.tsx
structure:
Shell current="/admin/gis" title="GIS Studio — geofencing" context={<><span className="badge badge-info">SCR-ADM-070 · ENG-06 · SB20</span><span className="sq-version">{engRes.data?.version_label}</span></>}
  span.badge.badge-info    "SCR-ADM-070 · ENG-06 · SB20"
  span.sq-version    {engRes.data?.version_label}
  div.stack style={gap:"var(--space-6)"}
    div.sq-banner
      div
        strong    "GIS Studio."
        (text)    " " "These governed values stamp every geo event (config version recorded with each check-in — EV-005). Official coordinates remain GIS-Admin-owned; field observation never overwrites them (FND-007). Per-factory geofence radii (SB20) are edited on the map below."
    [if err]
      div.sq-banner.sq-banner--critical role="alert"
        div
          strong    "GIS data unavailable."
          (text)    " " {NEUTRAL_LOAD_ERROR}
    [if !err && factories.length === 0]
      EmptyState glyph="◎" title="No factories registered" body="The factory registry is empty — geofences appear here once factories are synced (FND-007)."
    [if !err && factories.length > 0]
      GisStudio factories={factories} gis={s} strings={strings}
        div.stack style={gap:"var(--space-6)"}
          div.row style={gap:"var(--space-4)", alignItems:"center", flexWrap:"wrap"}
            input.sq-input type="search" value={query} aria-label="Search factories" placeholder="Search by name, code, city or region…" onChange onKeyDown style={flex:1, minInlineSize:240}
            select.sq-select style={maxInlineSize:220} value={region} onChange aria-label="Region"(thRegion)
              option value=""    "All regions"
              [for each r in regions]
                option key=r value=r    {r}
            select.sq-select style={maxInlineSize:220} value={band} onChange aria-label="Risk band"(thBand)
              option value=""    "All risk bands"
              option value="high"    "high"
              option value="medium"    "medium"
              option value="low"    "low"
              option value="unbanded"    "unbanded"
            span.t-caption
              span.numeric    {filtered.length}
              (text)    " / "
              span.numeric    {factories.length}
              (text)    " " "factories shown"
              [if unlocated > 0]
                (text)    " · "
                span.numeric    {unlocated}
                (text)    " " "without coordinates (table only)"
          div style={display:"flex", gap:"var(--space-6)", alignItems:"stretch", flexWrap:"wrap"}
            div.sq-panel style={flex:1, minInlineSize:420, padding:0, overflow:"hidden"}
              Suspense fallback=EmptyState(glyph="…" title="Loading map" body="Preparing the KSA geofencing view (ENG-06)." bare role="status" ariaBusy)
                GeoMap center={[24.0,44.5]} zoom={5} markers={markers} height={560} selectedId={selectedId} focus={focus} onMarkerClick={select} onRadiusChange
            aside.sq-panel style={inlineSize:"var(--panel-w)", padding:"var(--space-6)", display:"flex", flexDirection:"column", gap:"var(--space-4)"}
              [if !selected]
                EmptyState glyph="◎" title="Select a factory pin" body="Click any pin to review its official coordinates and govern its geofence radius (SB20)." inline bare
              [if selected]
                div
                  h4    {selected.name}
                  div.row style={gap:"var(--space-2)", flexWrap:"wrap", marginBlockStart:"var(--space-2)"}
                    span.badge.badge-info    {selected.factory_code}
                    span.`lozengeFor(selected.risk_band)`    {bandLabel(selected.risk_band)}[if selected.risk_score != null]{` · ${selected.risk_score}`}
                  p.t-caption style={marginBlockStart:"var(--space-2)"}    {selected.region ?? "—"} " · " {selected.city ?? "—"}
                div
                  div.sq-field__label    "Official coordinates (GIS-Admin-owned, FND-007)"
                  p.numeric dir="ltr"    {selected.official_lat} ", " {selected.official_lng}
                  p.t-caption    "Field observation never overwrites the official pin."
                form.stack action={formAction} style={gap:"var(--space-3)"}
                  input type="hidden" name="factory_id" value={selected.id}
                  div.sq-field
                    label.sq-field__label htmlFor="gis-radius"    "Geofence radius (m) — SB20"
                    input#gis-radius.sq-input.numeric name="geofence_radius_m" type="number" min={1} step={1} required value={draftRadius} onChange placeholder={String(defaultFence)}
                    p.sq-field__hint    "Tip: with this factory selected, click the map to set the fence edge at that point. Blank override falls back to the engine default" " (" {defaultFence} " m)"
                  div.row style={gap:"var(--space-3)", alignItems:"center", flexWrap:"wrap"}
                    button.btn.btn-primary.btn-lg.btn-touch disabled={pending}    [if pending]"Saving…" [else]"Save radius"
                    [if state.error]
                      span.t-caption style={color:"var(--status-critical)"} role="alert"    {state.error}
                    [if state.ok]
                      span.badge.badge-compliant    "saved"
              div style={marginBlockStart:"auto"}
                div.sq-field__label    "Engine defaults (ENG-06 · read-only)"
                table.sq-table
                  tbody
                    tr
                      td    "Check-in accuracy"
                      td.numeric dir="ltr"    "≤ " {gis.gps_accuracy_checkin_max_m ?? "—"} " m"
                    tr
                      td    "Arrival detection"
                      td.numeric dir="ltr"    {gis.arrival_detection_radius_m ?? "—"} " m"
                    tr
                      td    "Default geofence"
                      td.numeric dir="ltr"    {defaultFence} " m"
                div.row style={gap:"var(--space-2)", marginBlockStart:"var(--space-3)", flexWrap:"wrap", alignItems:"center"}
                  span.badge.badge-critical    "high" " " span.numeric{bandCounts.high}
                  span.badge.badge-warning    "medium" " " span.numeric{bandCounts.medium}
                  span.badge.badge-compliant    "low" " " span.numeric{bandCounts.low}
                  [if bandCounts.unbanded > 0]
                    span.badge.badge-info    "unbanded" " " span.numeric{bandCounts.unbanded}
                  span.t-caption    "risk-band pin tones"
          div.sq-tablewrap
            table.sq-table
              thead
                tr
                  th scope="col"    "Code"
                  th scope="col"    "Factory"
                  th scope="col"    "Region"
                  th scope="col"    "City"
                  th scope="col"    "Risk band"
                  th scope="col"    "Geofence radius"
                  th scope="col"    "Official coordinates"
              tbody
                [if filtered.length === 0]
                  tr
                    td colSpan={7}
                      span.t-caption    "No factories match the current filters."
                [for each f in filtered]
                  tr key=f.id onClick={hasCoords ? select : undefined} aria-selected={isSel || undefined} style={cursor, background}
                    td.numeric    {f.factory_code}
                    td
                      strong    {f.name}
                    td    {f.region ?? "—"}
                    td    {f.city ?? "—"}
                    td
                      span.`lozengeFor(f.risk_band)`    {bandLabel(f.risk_band)}
                    td.numeric dir="ltr"    {f.geofence_radius_m ?? defaultFence} " m" [if f.geofence_radius_m == null]span.t-caption{" · " "default"}
                    td.numeric dir="ltr"    [if hasCoords]{`${f.official_lat}, ${f.official_lng}`} [else]"—"
    [if !err]
      div.sq-tablewrap
        table.sq-table
          thead
            tr
              th scope="col"    "Setting"
              th scope="col"    "Value"
              th scope="col"    "Contract"
          tbody
            [for each [k,v,c] in settingsRows]
              tr key=k
                td
                  strong    {k}
                td.numeric dir="ltr"    {v}
                td.t-caption    {c}
undefined-classes: none
text-content:
GIS Studio — geofencing
SCR-ADM-070 · ENG-06 · SB20
GIS Studio.
These governed values stamp every geo event (config version recorded with each check-in — EV-005). Official coordinates remain GIS-Admin-owned; field observation never overwrites them (FND-007). Per-factory geofence radii (SB20) are edited on the map below.
GIS data unavailable.
No factories registered
The factory registry is empty — geofences appear here once factories are synced (FND-007).
Loading map
Preparing the KSA geofencing view (ENG-06).
Search factories
Search by name, code, city or region…
All regions
All risk bands
factories shown
without coordinates (table only)
Select a factory pin
Click any pin to review its official coordinates and govern its geofence radius (SB20).
Official coordinates (GIS-Admin-owned, FND-007)
Field observation never overwrites the official pin.
Geofence radius (m) — SB20
Tip: with this factory selected, click the map to set the fence edge at that point. Blank override falls back to the engine default
Saving…
Save radius
saved
Engine defaults (ENG-06 · read-only)
Check-in accuracy
Arrival detection
Default geofence
high
medium
low
unbanded
risk-band pin tones
Code
Factory
Region
City
Risk band
Geofence radius
Official coordinates
No factories match the current filters.
default
GPS accuracy for check-in
ERR-GEO-001 threshold
Arrival detection radius
STM-JRN-002
Geofence default radius
per-factory override on the map
STM-JRN-003
Telemetry interval
ENG-06
Route deviation alert
SB14 step 5
Retention
FND-009 policy
Setting
Value
Contract

---

## /admin/integrations
file: apps/web/src/app/(app)/admin/integrations/page.tsx, apps/web/src/app/(app)/admin/_components/AdminDestinationFrame.tsx, apps/web/src/app/(app)/admin/_components/AdminRecordDrawer.tsx
structure:
AdminDestinationFrame current="/admin/integrations" title="..." subtitle="..." hub="..." routeLabel="/admin/integrations" designId="frame-24-admin-integration-management" drawerLabels={...} labels={...} metrics={[...]} tabs={[...]} governance={...} reconstructionNote="..." context={...}
  Shell current="/admin/integrations" title="" context={context}
    AdminRecordDrawerProvider labels={drawerLabels}
      div.styles.workspace data-saqeel-admin-destination="frame-24-admin-integration-management"
        div.styles.main
          header.styles.heading
            div
              nav.styles.breadcrumb aria-label={labels.breadcrumb}
                ol
                  li  "Administration"
                  li  "Connections & geography"
              h1.styles.title  "Integration Management"
              p.styles.subtitle  "External data sources and connected systems"
            span.sq-version
              bdi dir="ltr"  "/admin/integrations"
          section.styles.metrics aria-label="Integration Management governance figures"
            [for each metric in metrics]
              article.styles.metric
                span.styles.metricLabel  <metric.label>
                strong.styles.metricValue  <metric.value>
                span.styles.metricNote  <metric.note>
          nav.styles.tabs aria-label="Integration Management sections"
            [for each tab in tabs]
              Link.styles.tab href={tab.href} aria-current={tab.current ? "page" : undefined}
                <tab.label>
          {children}
            div.sq-banner
              div
                strong  "Configuration is not connectivity."
                " An endpoint becomes configured only with an approved contract and runtime address. Secrets are never displayed here."
            div.row style={marginBlock, gap, flexWrap}
              Link.btn.btn-secondary.btn-touch href="/admin/integrations/senai-data"  "SENAI data management"
              Link.btn.btn-secondary.btn-touch href="/admin/integrations/factory-data"  "Factory data integration and import"
            section.panel.stack style={padding} aria-labelledby="integration-registry"
              div.row style={justifyContent, flexWrap}
                div
                  h3#integration-registry  "Governed endpoint registry"
                  p.t-caption  "Contract version, runtime state and dependency truth—not secret material."
                span.badge  "<endpoints.length> endpoints"
              [if endpointsRead.error]
                div.sq-banner.sq-banner--warning role="alert"  "The endpoint registry could not be read. Event and export data below may still be available."
              div.sq-tablewrap
                table.sq-table
                  thead
                    tr
                      th scope="col"  "Name"
                      th scope="col"  "Type"
                      th scope="col"  "Contract"
                      th scope="col"  "Truth status"
                  tbody
                    [for each row in endpoints]
                      AdminRecordTableRow key={row.id} record={{...}}
                        th scope="row"  <row.display_name>
                          div.t-caption
                            bdi dir="ltr"  <row.endpoint_key>
                        td  <endpointKind>
                          div.t-caption
                            bdi dir="ltr"  <row.endpoint_kind>
                        td
                          span.sq-version
                            bdi dir="ltr"  <row.contract_version>
                        td
                          span.`sq-lozenge ${row.status === "configured" ? "sq-lozenge--success" : "sq-lozenge--warning"}`  <endpointStatus>
                          div.t-caption
                            bdi dir="ltr"  <row.status>
                            " · "
                            "recorded"
                            " "
                            time dateTime={row.updated_at}  <recordedAt>
                    [if !endpointsRead.error && endpoints.length === 0]
                      tr
                        td colSpan={4}  "No endpoints are registered. This is a verified empty read."
            div.sq-grid id="integration-events" style={marginBlockStart}
              section.panel.stack style={padding, minWidth}
                h3  "API and rule events"
                p.t-caption  "Append-only outcomes linked by correlation ID."
                [if eventsRead.error]
                  div.sq-banner.sq-banner--warning role="alert"  "API events could not be read. This is unavailable data, not an empty event history."
                [for each e in events.slice(0, 8)]
                  div.row key={e.id} style={justifyContent, alignItems, flexWrap, overflowWrap}
                    span
                      strong  <kindLabel(e.event_kind)>
                      small.t-caption  " · " <kindLabel(e.direction)>
                      small.t-caption style={display:block}
                        bdi dir="ltr"  <e.event_kind>
                        " · "
                        bdi dir="ltr"  <e.direction>
                        " · "
                        time dateTime={e.occurred_at}  <formatted date>
                    span
                      span.badge  <statusLabel(e.outcome)>
                      small.t-caption style={display:block}
                        bdi dir="ltr"  <e.outcome>
                [if !eventsRead.error && events.length === 0]
                  p.t-caption  "No RLS-visible events. This is a verified empty read."
              section.panel.stack style={padding, minWidth}
                h3  "Data-sharing exports"
                p.t-caption  "Prepared is not delivered. Delivery requires an artifact hash and receipt."
                [if exportsRead.error]
                  div.sq-banner.sq-banner--warning role="alert"  "Export jobs could not be read. This is unavailable data, not an empty export history."
                [for each e in exports.slice(0, 8)]
                  div.row key={e.id} style={justifyContent, alignItems, flexWrap, overflowWrap}
                    span
                      strong  <kindLabel(e.export_kind)>
                      small.t-caption  " · " <e.purpose>
                      small.t-caption style={display:block}
                        bdi dir="ltr"  <e.export_kind>
                        " · "
                        time dateTime={e.requested_at}  <formatted date>
                    span
                      span.badge  <statusLabel(e.status)>
                      small.t-caption style={display:block}
                        bdi dir="ltr"  <e.status>
                [if !exportsRead.error && exports.length === 0]
                  p.t-caption  "No RLS-visible export jobs. This is a verified empty read."
          aside.styles.rail aria-label="Integration Management — Governance on this surface"
            section.styles.railCard
              h2.styles.railTitle  "Governance on this surface"
              ul.styles.governance
                [for each item in governance]
                  li  <item>
            section.styles.railCard
              h2.styles.railTitle  "Reconstruction note"
              p.styles.note  <reconstructionNote>

  [AdminRecordTableRow definition, used above]
    Fragment
      tr.styles.recordRow ref tabIndex=0 aria-haspopup="dialog" aria-label="Open record: <record.title>" onClick onKeyDown
        {children}  (see th/td above)
      RecordDrawer record open onClose triggerRef
        [if open]
          Portal to document.body
            div.styles.layer
              button.styles.backdrop type="button" aria-label={labels.closePanel}
              aside.styles.drawer role="dialog" aria-modal="true" tabIndex=-1 data-admin-record-drawer
                header.styles.header
                  div.styles.heading
                    h2#titleId  <record.title>
                    p#subtitleId  <record.subtitle>
                  button.styles.closeButton type="button" aria-label={labels.close}
                    span aria-hidden="true"  "×"
                div.styles.body
                  DrawerGroup title={labels.record} fields={record.record}
                    section.styles.group
                      h3  <title>
                      [if fields.length > 0]
                        dl
                          [for each field in fields]
                            div
                              dt  <field.label>
                              dd  <field.value>
                  DrawerGroup title={labels.governance} fields={mapped governance}
                    (same structure as above)
                  DrawerGroup title={labels.audit} fields={record.audit ?? []} disclosure={...}
                    (same structure as above)
                footer.styles.actions
                  [if record.editHref] (not set — editUnavailableReason path used)
                    button.sq-btn.sq-btn--prominent type="button" disabled aria-disabled="true" title={record.editUnavailableReason}
                      <labels.editThroughRequest>
                  Link.sq-btn href={record.auditHref} onClick={onClose}
                    <labels.viewActivityLog>
                  button.sq-btn type="button" onClick={onClose}
                    <labels.close>
undefined-classes: none
text-content:
Administration
Breadcrumb
Governance on this surface
Reconstruction note
Integration Management
External data sources and connected systems
Connections & geography
/admin/integrations
Registered endpoints
Read from the governed endpoint registry
Configured endpoints
Contract and runtime address recorded
Recent API events
Bounded append-only read
Connections
SENAI data
Factory data
Sync history
Configuration, connectivity and delivery are distinct truth states.
Secrets are never rendered; only governed contract and runtime state is shown.
Unavailable providers fail closed and dependent features disclose the boundary.
The endpoint registry has no governed edit workflow on this route. Connection-specific data actions remain on their authorized destinations.
M3-00 · CD-050
Configuration is not connectivity.
An endpoint becomes configured only with an approved contract and runtime address. Secrets are never displayed here.
SENAI data management
Factory data integration and import
Governed endpoint registry
Contract version, runtime state and dependency truth—not secret material.
The endpoint registry could not be read. Event and export data below may still be available.
Name
Type
Contract
Truth status
Endpoint key
recorded
No endpoints are registered. This is a verified empty read.
API and rule events
Append-only outcomes linked by correlation ID.
API events could not be read. This is unavailable data, not an empty event history.
No RLS-visible events. This is a verified empty read.
Data-sharing exports
Prepared is not delivered. Delivery requires an artifact hash and receipt.
Export jobs could not be read. This is unavailable data, not an empty export history.
No RLS-visible export jobs. This is a verified empty read.
Prototype provider names, sync times and health labels are not copied. The register, event stream and export jobs below are RLS-scoped backend reads; missing tables or rows remain unavailable or verified-empty states.
×
Open Record: <record.title> (aria-label template)
Close (aria-label placeholder)

## /admin/items
file: apps/web/src/app/(app)/admin/items/page.tsx, apps/web/src/app/(app)/admin/items/Controls.tsx
structure:
Shell current="/admin/items" title="Inspection Item Catalogue" context={...}
  span.row style={gap, alignItems, flexWrap}
    span.badge.badge-info  "SCR-ADM-020 · ENG-01"
    span role="status" className="t-caption"  "catalogue read <time> — a source fact, not a freshness verdict"
    [if clauseUnavailable]
      span.badge.badge-warning
        span aria-hidden="true"  "⚠ "
        "clause list unavailable"
  {children}
    [if error]
      div.sq-banner.sq-banner--critical role="alert"
        div
          strong  "Couldn't load the item catalogue."
          " "
          <NEUTRAL_LOAD_ERROR text>
          " "
          "Reload the page to try again."
    [if clauseUnavailable && !error]
      div.sr-only role="status"  "The clause list couldn't be read. The catalogue below still rendered; only the clause control is unavailable."
    [if roleError]
      div.sq-banner.sq-banner--warning role="alert"
        strong  "Permissions unavailable"
        " "
        "Your configuration permissions could not be verified. Writes are disabled; retry the page."
    [else if !isWriter]
      div.sq-banner role="note"
        strong
          span aria-hidden="true"  "👁 "
          "Read-only catalogue"
        " "
        "Your role can inspect item semantics, usage and runtime previews. Creating or changing active state requires Compliance or Form Admin and is enforced by the server guard and RLS."
    nav.cmp-library-tabs aria-label="Compliance Library"
      a.btn.btn-secondary.sq-link.btn-touch href="/admin/regulations"  "Regulations"
      a.btn.btn-primary.btn-lg.btn-touch href="/admin/items" aria-current="page"  "Inspection Items"
      [if isWriter]
        a.btn.btn-secondary.sq-link.btn-touch href="/admin/compliance-requests/new"  "Create governed request"
    [if isWriter]
      div.sq-banner.sq-banner--warning role="note"
        strong  "Legacy compatibility authoring."
        " "
        "Direct item controls remain temporarily available for continuity. New or modified governed configuration should begin in a Compliance Configuration Request; this catalogue remains the published source of truth."
    section.panel.sq-permission.stack aria-labelledby="cd007-gov-h" style={padding}
      h3#cd007-gov-h style={margin:0}  "How this catalogue is governed"
      p.t-caption style={margin:0}  "Anyone signed in can read the catalogue; writes require compliance_admin or form_admin. Deactivation preserves history and records a reason. Editing archives the previous configuration before advancing the version, and every row change is audited."
    [if !error && isWriter]
      section.panel.stack aria-labelledby="cd007-create-h" style={padding}
        h3#cd007-create-h style={margin:0}  "Add an inspection item"
        NewItemForm clauses clauseUnavailable strings
          form.panel action={formAction} style={padding, display:flex, gap, alignItems, flexWrap}
            div.sq-field
              label.sq-field__label htmlFor="item-code"  "Code"
              input#item-code.sq-input.numeric name="code" placeholder="FS-110" required style={maxInlineSize}
            div.sq-field style={flex, minInlineSize}
              label.sq-field__label htmlFor="item-title"  "Title"
              input#item-title.sq-input name="title" placeholder="Inspection item title" required
            div.sq-field style={minInlineSize}
              label.sq-field__label htmlFor="item-clause"  "Clause (M09-002)"
              select#item-clause.sq-select name="clause_id" required defaultValue="" disabled={clauseUnavailable}
                option value="" disabled  "Select clause…" | "Clause list unavailable — try again"
                [for each c in clauses]
                  option value={c.id}  <c.label>
            div.sq-field
              label.sq-field__label htmlFor="item-weight"  "Weight"
              input#item-weight.sq-input.numeric name="score_weight" inputMode="decimal" placeholder="5" style={maxInlineSize} disabled={!scoring}
            div.sq-field style={minInlineSize}
              label.sq-field__label htmlFor="item-response"  "Response model (M09-019)"
              select#item-response.sq-select name="response_preset" required defaultValue="tri_state"
                option value="tri_state"  "compliant / non compliant / na"
                option value="binary"  "compliant / non compliant"
                option value="value_date"  "value date"
            div.sq-field style={minInlineSize}
              label.sq-field__label htmlFor="item-evidence"  "Evidence rule (M09-005)"
              select#item-evidence.sq-select name="evidence_preset" required defaultValue="none"
                option value="none"  "No base evidence rule"
                option value="photo_nc_mandatory"  "Photo mandatory on non-compliant"
                option value="video_nc_mandatory"  "Video mandatory on non-compliant"
                option value="document_nc_mandatory"  "Document mandatory on non-compliant"
                option value="comment_nc_mandatory"  "Comment mandatory on non-compliant"
              span.t-caption  "Configured policy — governed preset, not free text (M09-005/025)."
            label.row style={minBlockSize, gap, alignItems}
              input type="hidden" name="scoring_enabled" value={scoring?"true":"false"}
              input type="checkbox" checked={scoring} onChange
              " " "Scoring enabled" | "Scoring disabled"
            div.sq-field style={flex, minInlineSize}
              label.sq-field__label htmlFor="item-guidance"  "Guidance (EN)"
              input#item-guidance.sq-input name="guidance_en" placeholder="What the inspector verifies"
            button.btn.btn-primary.btn-lg.btn-touch disabled={pending || clauseUnavailable}
              "Creating…" | "Create item"
            [if state.error]
              span.t-caption style={color} role="alert"
                span aria-hidden="true"  "✕ "
                <state.error>
            [if state.ok]
              span.badge.badge-compliant role="status"
                span aria-hidden="true"  "✓ "
                "Item created"
    [if !error && rows.length > 0]
      section.stack aria-labelledby="cd007-preview-h"
        h3#cd007-preview-h style={margin:0}  "Runtime preview — what the inspector sees"
        ItemPreview items={previewItems} strings={previewStrings}
          [if items.length === 0]
            EmptyState glyph="👁" title={s.empty} inline
          [else]
            div.panel.stack style={padding, gap}
              div.sq-field style={maxInlineSize}
                label.sq-field__label htmlFor={selectId}  "Preview item"
                select#selectId.sq-select value={item.id} onChange
                  [for each i in items]
                    option value={i.id}  "<i.code> — <i.title>" + " (deactivated)" if !i.active
              div.panel style={padding, background}
                div.row style={gap, alignItems, flexWrap}
                  strong.numeric
                    bdi dir="ltr"  <item.code>
                  span  <item.title>
                  span.`sq-lozenge ${item.active ? "sq-lozenge--success" : "sq-lozenge--critical"}`
                    span aria-hidden="true"  "●" | "✕"
                    " " <active|deactivatedWord>
                [if !item.active]
                  p.t-caption  "This item is deactivated — hidden from new package versions; existing history is preserved."
                div.stack style={gap, marginBlockStart}
                  div
                    p.sq-overline  "Response the inspector records"
                    div.row role="group" aria-label="Response the inspector records" style={gap, flexWrap}
                      [for each r in item.responses]
                        button.btn.btn-secondary.btn-touch type="button" disabled aria-disabled="true"  <label(r)>
                    [if item.ncTarget]
                      p.t-caption  "Non-compliant maps to: {target}"
                    p.t-caption
                      span aria-hidden="true"  "◇ "
                      "Optional" | "Conditional" | "Required"
                    [if item.conditionalRule]
                      p.t-caption
                        bdi dir="ltr" className="numeric"  <item.conditionalRule>
                        " · mandatory when visible" (if mandatoryWhenVisible)
                  div
                    p.sq-overline  "Evidence policy"
                    p.t-caption  "{type} required when non-compliant (min {min})" | "No base evidence required"
                    p.t-caption
                      span  "configured policy — source: engine settings"
                  div
                    p.sq-overline  "Scoring"
                    p.t-caption
                      "scoring disabled; all responses excluded" | "weight {weight}" | "no score weight"
                      " · excluded from score on: {responses}" (if scoreExcludedOn.length > 0)
                  div
                    p.sq-overline  "Inspector guidance"
                    p.t-caption  <item.guidance> | "No guidance recorded"
              p.t-caption
                span aria-hidden="true"  "🔒 "
                "Read-only projection of stored configuration — nothing here is editable."
    [if !error && rows.length === 0]
      EmptyState glyph="🧾" title="No inspection items configured" body="Items belong to regulation clauses and are reused across packages (M09-002). Add the first item above."
    [if !error && rows.length > 0]
      section.stack aria-labelledby="cd007-catalogue-h"
        h3#cd007-catalogue-h style={margin:0}  "Catalogue"
        div.sq-tablewrap
          table.sq-table
            caption.sr-only  "Catalogue"
            thead
              tr
                th scope="col"  "Code"
                th scope="col"  "Title"
                th scope="col"  "Clause"
                th scope="col"  "Runtime semantics"
                th scope="col" className="sq-td-num"  "Weight"
                th scope="col"  "Published use"
                th scope="col"  "Status"
                th scope="col"  "Actions"
            tbody
              [for each i in rows]
                tr key={i.id}
                  td.numeric
                    strong
                      bdi dir="ltr"  <i.code>
                  td  <i.title>
                  td.numeric  <"<reg.code> §<clause_ref>"> | "—"
                  td.t-caption
                    <responses joined> | "—"
                    " · NC→<ncTarget>" (if ncTarget)
                    " · <evidence.type|'evidence'> on NC" (if ev?.mandatory)
                    " · score-excluded" (if excluded.length>0)
                    " · <rm.requirement>" (if rm.requirement)
                    " · <rm.conditional.visible_when>" (if present)
                    " · scoring off" (if scoring_enabled === false)
                  td.sq-td-num.numeric  <i.score_weight> | "—"
                  td
                    [if !isWriter]
                      span.t-caption  "Available to configuration writers"
                    [else if !usage]
                      span.badge.badge-warning
                        span aria-hidden="true"  "⚠ "
                        "unavailable — retry reload"
                    [else]
                      span.t-caption
                        span aria-hidden="true"  "✓ "
                        "{packages} package(s) · {versions} version(s)"
                  td
                    span.`sq-lozenge ${i.active ? "sq-lozenge--success" : "sq-lozenge--critical"}`
                      span aria-hidden="true"  "●" | "✕"
                      " " "active" | "deactivated"
                  td
                    div.row style={gap, alignItems, flexWrap}
                      a.btn.btn-secondary.sq-link.btn-touch href="/admin/items/{id}/runtime-preview"  "Inspector Runtime Preview"
                      [if isWriter]
                        a.btn.btn-secondary.sq-link.btn-touch href="/admin/compliance-requests/new?..."  "Request change"
                      [if isWriter]
                        ToggleActive itemId active strings
                          form.row action={formAction} style={gap, alignItems, flexWrap}
                            input type="hidden" name="item_id"
                            input type="hidden" name="next_active"
                            [if active]
                              label.sq-field
                                span.sq-field__label  "Deactivation reason"
                                input.sq-input name="deactivation_reason" required
                            button.btn.btn-primary.btn-touch disabled={pending} title={s.reasonNote}
                              "Saving…" | "Deactivate" | "Reactivate"
                            [if state.error]
                              span.t-caption style={color} role="alert"
                                span aria-hidden="true"  "✕ "
                                <state.error>
                      [else]
                        span.t-caption  "Read only"
                      [if isWriter]
                        a.btn.btn-secondary.sq-link.btn-touch href="/admin/items?audit={id}#cd007-audit-h"  "Audit"
                      [if isWriter]
                        EditItemForm item clauses strings
                          details.stack
                            summary.btn.btn-ghost.btn-touch  "Edit · v<item.version>"
                            form.stack action={formAction} style={gap, minInlineSize}
                              input type="hidden" name="item_id"
                              label.sq-field
                                span.sq-field__label  "Title"
                                input.sq-input name="title" defaultValue required
                              label.sq-field
                                span.sq-field__label  "Clause (M09-002)"
                                select.sq-select name="clause_id" defaultValue required
                                  [for each c in clauses]
                                    option value={c.id}  <c.label>
                              label.sq-field
                                span.sq-field__label  "Guidance (EN)"
                                textarea.sq-input name="guidance_en" defaultValue
                              button.btn.btn-primary.btn-touch disabled={pending}  "Saving…" | "Save new version"
                              [if state.error]
                                span.t-caption style={color} role="alert"  <state.error>
                              [if state.ok]
                                span.badge.badge-compliant role="status"  "✓ New item version saved"
    [if !error && rows.length > 0 && isWriter]
      section.panel.stack aria-labelledby="cd007-audit-h" style={padding}
        h3#cd007-audit-h style={margin:0}  "Scoped item audit"
        p.t-caption style={margin:0}  "Open Audit on one item to inspect its object-scoped configuration history; broad audit-table access is not granted."
        [if !auditItemId]
          p.t-caption role="status"  "No item selected."
        [else if !auditItem]
          div.sq-banner.sq-banner--warning role="alert"  "The selected item is no longer in the readable catalogue."
        [else if auditResult.error]
          div.sq-banner.sq-banner--warning role="alert"  "Audit unavailable — reload to retry; history is not reported as empty."
        [else]
          div.stack style={gap}
            h4 style={margin:0}
              bdi dir="ltr" className="numeric"  <auditItem.code>
              " — " <auditItem.title>
            [if auditEvents.length === 0]
              p.t-caption role="status"  "No scoped audit events returned — verified zero."
            [else]
              ol
                [for each e in auditEvents]
                  li
                    strong  <e.action>
                    " · "
                    bdi dir="ltr" className="numeric"  <e.occurred_at>
                    [if e.actor]
                      " · "
                      bdi dir="ltr"  <e.actor>
    p.t-caption  "Items belong to regulations and are reused across packages (M09-002/007); deactivation preserves history (M09-014). Writes require compliance_admin/form_admin — RLS is the authority. inspection_items row changes are audit-tracked (trg_audit_inspection_items)."
undefined-classes: none
text-content:
catalogue read {time} — a source fact, not a freshness verdict
clause list unavailable
Couldn't load the item catalogue.
Reload the page to try again.
The clause list couldn't be read. The catalogue below still rendered; only the clause control is unavailable.
Permissions unavailable
Your configuration permissions could not be verified. Writes are disabled; retry the page.
Read-only catalogue
Your role can inspect item semantics, usage and runtime previews. Creating or changing active state requires Compliance or Form Admin and is enforced by the server guard and RLS.
Regulations
Inspection Items
Create governed request
Legacy compatibility authoring.
Direct item controls remain temporarily available for continuity. New or modified governed configuration should begin in a Compliance Configuration Request; this catalogue remains the published source of truth.
How this catalogue is governed
Anyone signed in can read the catalogue; writes require compliance_admin or form_admin. Deactivation preserves history and records a reason. Editing archives the previous configuration before advancing the version, and every row change is audited.
Add an inspection item
Code
Title
Inspection item title
Clause (M09-002)
Select clause…
Clause list unavailable — try again
Weight
Response model (M09-019)
compliant / non compliant / na
compliant / non compliant
value date
Evidence rule (M09-005)
No base evidence rule
Photo mandatory on non-compliant
Video mandatory on non-compliant
Document mandatory on non-compliant
Comment mandatory on non-compliant
Configured policy — governed preset, not free text (M09-005/025).
Scoring enabled
Scoring disabled
Guidance (EN)
What the inspector verifies
Creating…
Create item
Item created
That item code already exists — codes are unique.
Runtime preview — what the inspector sees
Preview item
No items to preview yet.
This item is deactivated — hidden from new package versions; existing history is preserved.
Response the inspector records
Non-compliant maps to: {target}
Conditional
Required
Optional
mandatory when visible
Evidence policy
{type} required when non-compliant (min {min})
No base evidence required
configured policy — source: engine settings
Scoring
weight {weight}
no score weight
excluded from score on: {responses}
scoring disabled; all responses excluded
Inspector guidance
No guidance recorded
Read-only projection of stored configuration — nothing here is editable.
No inspection items configured
Items belong to regulation clauses and are reused across packages (M09-002). Add the first item above.
Catalogue
Code
Title
Clause
Runtime semantics
Weight
Published use
Status
Actions
NC→
evidence
on NC
score-excluded
Available to configuration writers
unavailable — retry reload
{packages} package(s) · {versions} version(s)
active
deactivated
Inspector Runtime Preview
Request change
Deactivation reason
Saving…
Deactivate
Reactivate
Read only
Audit
Edit · v
Title
Clause (M09-002)
Guidance (EN)
Saving…
Save new version
Item version saved
Scoped item audit
Open Audit on one item to inspect its object-scoped configuration history; broad audit-table access is not granted.
No item selected.
The selected item is no longer in the readable catalogue.
Audit unavailable — reload to retry; history is not reported as empty.
No scoped audit events returned — verified zero.
Items belong to regulations and are reused across packages (M09-002/007); deactivation preserves history (M09-014). Writes require compliance_admin/form_admin — RLS is the authority. inspection_items row changes are audit-tracked (trg_audit_inspection_items).

## /admin/localization
file: apps/web/src/app/(app)/admin/localization/page.tsx, apps/web/src/app/(app)/admin/localization/Manager.tsx, apps/web/src/app/(app)/admin/localization/LocaleSwitch.tsx, apps/web/src/app/(app)/admin/_components/AdminDestinationFrame.tsx, apps/web/src/app/(app)/admin/_components/AdminRecordDrawer.tsx
structure:
[if !canManageLocalization]
  Shell current="/admin/localization" title="Language & translations"
    EmptyState icon={IconShieldCheck} role="alert" title="This control-plane module is outside your role" body="No localization data has been loaded. Return to your assigned workspace or ask an administrator for the required role."
      a.btn.btn-secondary.sq-link.btn-touch href="/launch"  "Return to my workspace"
[else]
  AdminDestinationFrame current="/admin/localization" title="Lookup Management" subtitle="Shared reference data used across the platform" hub="Rules & content" routeLabel="/admin/localization" designId="frame-20-admin-lookup-management" drawerLabels={...} labels={...} metrics={[...]} tabs={[...]} governance={lookupGovernance} reconstructionNote="..." context={...}
    Shell current="/admin/localization" title="" context={context}
      AdminRecordDrawerProvider labels={drawerLabels}
        div.styles.workspace data-saqeel-admin-destination="frame-20-admin-lookup-management"
          div.styles.main
            header.styles.heading
              div
                nav.styles.breadcrumb aria-label="Breadcrumb"
                  ol
                    li  "Administration"
                    li  "Rules & content"
                h1.styles.title  "Lookup Management"
                p.styles.subtitle  "Shared reference data used across the platform"
              span.sq-version
                bdi dir="ltr"  "/admin/localization"
            section.styles.metrics aria-label="Lookup Management governance figures"
              [for each metric in metrics]
                article.styles.metric
                  span.styles.metricLabel  <metric.label>
                  strong.styles.metricValue  <metric.value>
                  span.styles.metricNote  <metric.note>
            nav.styles.tabs aria-label="Lookup Management sections"
              [for each tab in tabs]
                Link.styles.tab href={tab.href} aria-current={tab.current ? "page" : undefined}
                  <tab.label>
            {children}
              [if loadFailed]
                div.sq-banner.sq-banner--critical role="alert"  "Could not load the localization dictionary. Nothing was changed. Try again."
              [else]
                Manager rows labels locale drawerGovernance
                  [if rows.length === 0]
                    div.styles.emptyStack
                      EmptyState icon={IconGlobe} title={labels.emptyTitle} body={<>...}
                      AddKeyForm labels locale
                        form.panel.styles.addForm action={formAction}
                          input type="hidden" name="locale"
                          div.styles.addHeading
                            strong  <labels.addTitle>
                            [if onClose]
                              button.sq-link.styles.linkButton type="button" onClick={onClose}  <labels.closeAdd>
                          div.sq-field
                            label.sq-field__label htmlFor="l10n-add-key"  <labels.addKeyField>
                            input#l10n-add-key.sq-input.numeric name="key" placeholder="nav.planning" required
                          div.sq-field
                            label.sq-field__label htmlFor="l10n-add-en"  <labels.addEnField>
                            input#l10n-add-en.sq-input name="en" required
                          div.sq-field
                            label.sq-field__label htmlFor="l10n-add-ar"  <labels.addArField>
                            input#l10n-add-ar.sq-input name="ar" dir="rtl" lang="ar"
                          div.sq-field
                            label.sq-field__label htmlFor="l10n-add-context"  <labels.addContextField>
                            input#l10n-add-context.sq-input name="context" placeholder="SCR-ADM-100"
                          button.btn.btn-primary.btn-lg.btn-touch disabled={pending}  <labels.adding>|<labels.addBtn>
                          [if state.error]
                            span.t-caption.styles.criticalText role="alert"  <state.error>
                          [if state.ok && !pending]
                            span.badge.badge-compliant  <labels.added>
                  [else]
                    section.styles.registry aria-labelledby="translation-registry-title" data-saqeel-design="WA-DES-010" data-design-hash="..."
                      header.styles.registryHeader
                        div
                          p.styles.eyebrow  <labels.registryTitle>
                          h1#translation-registry-title  <labels.registryTitle>
                          p  <labels.registryBody>
                        div.styles.headerActions
                          button.btn.btn-primary.btn-touch type="button" onClick aria-expanded={addOpen} aria-controls="localization-add-key"  <labels.closeAdd>|<labels.openAdd>
                          button.btn.btn-secondary.btn-touch type="button" onClick  <labels.exportCsv>
                          SyncButton labels locale
                            form.styles.syncForm action={formAction}
                              input type="hidden" name="locale"
                              button.btn.btn-secondary.btn-touch disabled={pending}  <labels.syncing>|<labels.sync>
                              [if state.report && !pending]
                                span.t-caption
                                  <labels.syncReport> " +<n> · EN Δ <n> · ⌀ <n> · ↻ <n>"
                              [if state.error]
                                span.t-caption.styles.criticalText role="alert"  <state.error>
                      [if addOpen]
                        div id="localization-add-key"
                          AddKeyForm labels locale onClose
                            (same structure as AddKeyForm above)
                      div.styles.workspace
                        aside.panel.styles.statusPanel aria-label={labels.statusNavigation}
                          h2  <labels.statusNavigation>
                          nav.styles.statusNav
                            [for each item in filters]
                              button type="button" className={filter===item.id ? styles.activeFilter : undefined} onClick aria-pressed={filter===item.id}
                                span  <item.label>
                                span.numeric  <counts[item.id]>
                          div.styles.governance
                            strong  <labels.governanceTitle>
                            p  <labels.governanceBody>
                        div.styles.content
                          div.panel.styles.toolbar
                            input.sq-input value={query} onChange placeholder={labels.searchPlaceholder} aria-label={labels.searchPlaceholder}
                            span.t-caption
                              <labels.showing> " " <filtered.length>/<rows.length> " " <labels.filteredResults>
                          [if filtered.length === 0]
                            EmptyState icon={IconGlobe} title={labels.noMatchTitle} body={labels.noMatchBody}
                          [else]
                            div.styles.columnHeadings aria-hidden="true"
                              span  <labels.sourceHeading>
                              span  <labels.translationHeading>
                              span  <labels.stateHeading>
                            div.styles.list
                              [for each row in visibleRows]
                                Row key={row.key} row labels locale drawerGovernance
                                  AdminRecordArticle id={recordId} className={`styles.stringRow${orphaned ? styles.orphaned : ""}`} record={{...}}
                                    article.styles.recordArticle ref tabIndex=0 aria-haspopup="dialog" aria-label="Open record: <row.key>" onClick onKeyDown
                                      {children}
                                        div.styles.sourceCell dir="ltr"
                                          span.lz-key  <row.key>
                                          span.lz-src
                                            PhText text={row.en} errTokens
                                              [for each part in text.split(PH_SPLIT)]
                                                span  <part>  (className="lz-ph"/"lz-ph lz-ph--err" if placeholder token)
                                          [if row.context]
                                            span.lz-risk.lz-risk--muted  <row.context>
                                          [if row.orphaned]
                                            span.lz-risk.lz-risk--muted  "◌ " <labels.orphanNote>
                                        div.styles.translationCell dir="rtl"
                                          span.lz-key dir="ltr"  "AR"
                                          form.styles.translationForm action={saveAction}
                                            input type="hidden" name="key"
                                            input type="hidden" name="expected_updated_at"
                                            input type="hidden" name="locale"
                                            input.sq-input.lz-ar name="ar" dir="rtl" lang="ar" value={ar} onChange placeholder="—" aria-label="<labels.colAr>: <row.key>" style={flex, minInlineSize}
                                            button.btn.btn-primary.btn-touch disabled={savePending || phErr} aria-disabled={phErr}  <labels.saving>|<labels.save>
                                            [if saveState.ok && !savePending]
                                              span.badge.badge-compliant role="status"  <labels.saved>
                                          [if arLonger]
                                            span.lz-risk  "↔ " <labels.riskLong>
                                          [if phErr]
                                            span.lz-risk.lz-risk--critical role="alert"  "✕ " <labels.placeholderErr with token replaced>
                                          [if saveState.error]
                                            span.lz-risk.lz-risk--critical role="alert"  <saveState.error>
                                        div.styles.actionCell
                                          StatusLozenge row labels
                                            [if row.orphaned]
                                              span.badge  <labels.statusOrphaned>
                                            [else if missingAr(row)]
                                              span.badge.badge-critical  <labels.statusMissing>
                                            [else if row.status === "reviewed"]
                                              span.badge.badge-compliant  <labels.statusReviewed>
                                            [else]
                                              span.badge.badge-warning  <labels.statusDraft>
                                          [if canReview]
                                            div.lz-actions
                                              form action={revAction}
                                                input type="hidden" name="key"
                                                input type="hidden" name="expected_updated_at"
                                                input type="hidden" name="locale"
                                                button.btn.btn-secondary.btn-touch disabled={revPending}  <labels.marking>|<labels.markReviewed>
                                          HistoryPanel row labels locale
                                            div.styles.history
                                              button.sq-link.styles.linkButton type="button" onClick aria-expanded={open} aria-controls={panelId}  <labels.history>
                                              [if open]
                                                div.styles.historyList id={panelId} aria-live="polite"
                                                  [if loading]
                                                    span.t-caption  <labels.historyLoading>
                                                  [if err]
                                                    span.t-caption.styles.criticalText role="alert"  <err>
                                                  [if revs !== null && revs.length === 0]
                                                    span.t-caption  <labels.historyEmpty>
                                                  [for each r in revs ?? []]
                                                    div.styles.historyItem key={r.id}
                                                      span.t-caption.numeric  <r.changed_at> " · " <sourceLabel> " · " <statusLabel>
                                                      span.t-caption
                                                        <labels.changedBy> ": "
                                                        span.numeric  <r.changed_by> | <labels.systemActor>
                                                      span dir="rtl" lang="ar" style={font}  <r.ar> | "—"
                                                      form action={restAction}
                                                        input type="hidden" name="key"
                                                        input type="hidden" name="revision_id"
                                                        input type="hidden" name="expected_updated_at"
                                                        input type="hidden" name="locale"
                                                        button.btn.btn-primary.btn-touch style={paddingBlock, font} disabled={restPending}  <labels.restoring>|<labels.restore>
                                                  [if restState.ok]
                                                    span.badge.badge-compliant  <labels.restored>
                                                  [if restState.error]
                                                    span.t-caption.styles.criticalText role="alert"  <restState.error>
                                          [if revState.error]
                                            span.lz-risk.lz-risk--critical role="alert"  <revState.error>
                                    RecordDrawer record open onClose triggerRef
                                      (same structure as AdminRecordDrawer's RecordDrawer, shown in /admin/integrations audit)
                            nav.panel.styles.pagination aria-label={labels.page}
                              button.btn.btn-secondary.btn-touch type="button" disabled={currentPage===1} onClick  <labels.previous>
                              span  <labels.page> " " <currentPage> " / " <pageCount>
                              button.btn.btn-secondary.btn-touch type="button" disabled={currentPage===pageCount} onClick  <labels.next>
            aside.styles.rail aria-label="Lookup Management — Governance on this surface"
              section.styles.railCard
                h2.styles.railTitle  "Governance on this surface"
                ul.styles.governance
                  [for each item in governance]
                    li  <item>
              section.styles.railCard
                h2.styles.railTitle  "Reconstruction note"
                p.styles.note  <reconstructionNote>
    context (passed to AdminDestinationFrame)
      span.row style={gap, alignItems}
        span.badge.badge-info  "SCR-ADM-100 · SB19"
        LocaleSwitch locale
          button.sq-link type="button" lang={nextLocale} aria-label="Switch to English"|"التبديل إلى العربية" onClick style={padding, border, background, font, cursor}
            "English" | "العربية"
undefined-classes: none
text-content:
Language & translations
This control-plane module is outside your role
No localization data has been loaded. Return to your assigned workspace or ask an administrator for the required role.
Return to my workspace
Administration
Breadcrumb
Governance on this surface
Reconstruction note
Lookup Management
Shared reference data used across the platform
Rules & content
/admin/localization
Reference strings
RLS-visible, key-ordered registry
Translated (AR)
Reviewed
Revision status, not an inferred approval
Reference lists
Language & translations
Planning lookups
Every localized key preserves its English source and Arabic revision history.
Orphaned keys remain restorable and are never silently deleted.
Updates run through the existing revisioned server actions.
The canonical Lookup destination resolves to the existing localization and governed planning-lookup sources. No reference-list count or language completeness claim is fabricated.
SCR-ADM-100 · SB19
Switch to English
التبديل إلى العربية
English
العربية
Could not load the localization dictionary. Nothing was changed. Try again.
No UI strings yet
Keys land here from extraction sweeps over the codebase; translate to Arabic, then mark reviewed. Run the coverage sweep:
Add key
Key
English source
Arabic (optional)
Context (optional)
Add key (draft)
Adding…
added
Search key, English or Arabic…
All statuses
Draft
Reviewed
Missing Arabic
Export CSV
CSV importer is a follow-up.
Showing
Key
English (source)
Arabic
Status
Context
Actions
draft
reviewed
missing
Save
Saving…
saved
Mark reviewed
Marking…
Translation registry
Manage the English source and Arabic translation consumed by every localized application surface.
Close
Sync from code
Scanning code…
Sync: added
Translation status
All keys
Missing Arabic
Draft review
Reviewed
Orphaned
Versioned reference data
Changes are revisioned. Retired keys remain in history and can be restored; they are never silently deleted.
No strings match
Adjust the search or status filter.
English source
Arabic translation
State & actions
No longer found in the last code scan — kept and restorable, not deleted.
Switch to English
Placeholder {token} is missing from the Arabic — Save is disabled until placeholders match.
Registry updated
Not configured
admin panel
history
Loading history…
No changes recorded yet.
Restore
Restoring…
restored (as draft)
Arabic runs long — check narrow layouts
changed by
system
source sync
restore
Previous
Next
Page
filtered results
Add key
Close
AR
Previous
Next

---

## /admin/notifications
file: apps/web/src/app/(app)/admin/notifications/page.tsx, apps/web/src/app/(app)/admin/notifications/NotificationRulesManager.tsx, apps/web/src/components/EmptyState.tsx, apps/web/src/components/Shell.tsx (default export), apps/web/src/app/icons.tsx (IconEye, IconBell)

structure:
Shell current="/admin/notifications" title=title context=context
  [if title] header.sq-pagehead.sq-pagehead--route
    div.sq-pagehead__row
      div.sq-pagehead__context
        h2 "{title}" (t("admin.notif.title","Notification & SLA Rules"))
        {context}
          span.row (style gap/alignItems/flexWrap)
            span.badge.badge-info "SCR-ADM-080"
            [if rulesError]
              span.badge.badge-warning
                span aria-hidden="true" "⚠"
                " " "{t("admin.notif.degraded.chip","register unavailable")}"
  div.sq-content
    [if rulesError]
      div.sq-banner.sq-banner--warning role="alert"
        strong
          span aria-hidden="true" "⚠"
          " " "{t("admin.notif.degraded.title","The notification rule register couldn't be read.")}"
        " " "{t("admin.notif.degraded.body","Nothing is shown as zero — the count is unknown, not empty.")}"
    [if roleTableError]
      div.sq-banner.sq-banner--warning role="alert" "{l.rolesUnavailable}" (t("admin.notif.rolesUnavailable","Recipient roles are unavailable. Rule creation is disabled; existing rules remain readable."))
    [if roleError]
      div.sq-banner.sq-banner--warning role="alert"
        strong "{t("admin.permissionsUnavailable.title","Permissions unavailable")}"
        " " "{t("admin.permissionsUnavailable.body","Your configuration permissions could not be verified. Writes are disabled; retry the page.")}"
    [else if !isWriter]
      div.sq-banner role="note"
        strong
          IconEye size=16 (svg, no class)
          " " "{t("admin.notif.readonly.title","Read-only for your role")}"
        " " "{t("admin.notif.readonly.body","You can view configuration; creating, publishing and deactivating rules require an admin configuration role and are enforced by row-level security.")}"
    [if isWriter]
      NotificationRulesManager rows roles rolesAvailable l
        div.stack (style gap)
          section.panel.stack (style padding/gap)
            CreateForm roles rolesAvailable l
              form.stack action=action style gap aria-disabled=!rolesAvailable
                div (style grid)
                  label.sq-field
                    span "{l.eventKey}" (t("admin.notif.form.eventKey","Event"))
                    select name="event_key" required defaultValue=""
                      option value="" disabled "—"
                      [for each k in EVENT_KEYS]
                        option value=k "{k}"
                  label.sq-field
                    span "{l.channel}" (t("admin.notif.form.channel","Channel"))
                    select name="channel" required defaultValue="inapp"
                      [for each c in CHANNELS]
                        option value=c "{c}"
                  label.sq-field
                    span "{l.recipientRole}" (t("admin.notif.form.recipientRole","Recipient role"))
                    select name="recipient_role" required defaultValue="" disabled=!rolesAvailable
                      option value="" disabled "—"
                      [for each r in roles]
                        option value=r.role_key "{r.title}"
                  label.sq-field
                    span "{l.slaMinutes}" (t("admin.notif.form.slaMinutes","SLA timer (minutes)"))
                    input type="number" name="sla_minutes" min=1
                  label.sq-field
                    span "{l.escalationRole}" (t("admin.notif.form.escalationRole","Escalation role"))
                    select name="escalation_role" defaultValue="" disabled=!rolesAvailable
                      option value="" "—"
                      [for each r in roles]
                        option value=r.role_key "{r.title}"
                label.sq-field
                  span "{l.template}" (t("admin.notif.form.template","Template"))
                  textarea name="template" required rows=2 placeholder="e.g. Review decision recorded: {decision}"
                div.row (style gap/alignItems)
                  button.btn.btn-primary.btn-lg.btn-touch type="submit" disabled "{pending ? l.creating : l.create}" (t("admin.notif.creating","Creating…") / t("admin.notif.create","Create draft rule"))
                  Msg state=state
                    [if state.error]
                      p.t-caption role="alert" style color "{state.error}"
                    [else if state.notice]
                      p.t-caption role="status" "{state.notice}"
                    [else] null
          [if rows.length === 0]
            EmptyState icon=<IconBell size=28/> title=l.emptyTitle body=l.emptyBody role="status"
              div.panel
                div.sq-state role="status"
                  span.sq-state__glyph aria-hidden="true"
                    IconBell size=28 (svg, no class)
                  h4 "{l.emptyTitle}" (t("admin.notif.empty.title","No notification rules configured"))
                  [if body] p.t-caption "{l.emptyBody}" (t("admin.notif.empty.body","The read succeeded — the register is genuinely empty. Create the first rule above."))
          [else]
            div.sq-tablewrap
              table.sq-table
                thead
                  tr
                    th scope="col" "{l.colEvent}" (t("admin.notif.col.event","Event"))
                    th scope="col" "{l.colChannel}" (t("admin.notif.col.channel","Channel"))
                    th scope="col" "{l.colRecipient}" (t("admin.notif.col.recipient","Recipient"))
                    th scope="col" "{l.colSla}" (t("admin.notif.col.sla","SLA → escalation"))
                    th scope="col" "{l.colStatus}" (t("admin.notif.col.status","Status"))
                    th scope="col" "{l.colVersion}" (t("admin.notif.col.version","Version"))
                    th scope="col" "{l.colActions}" (t("admin.notif.col.actions","Actions"))
                tbody
                  [for each r in rows]
                    tr key=r.id
                      td.numeric "{r.event_key}"
                      td "{r.channel}"
                      td
                        [if r.recipient_role] "{r.recipient_role}"
                        [else] span.badge.badge-warning "{l.missingRecipient}" (t("admin.notif.missingRecipient","Missing recipient"))
                      td "{r.sla_minutes ? `${r.sla_minutes}m → ${r.escalation_role}` : "—"}"
                      td
                        span.`sq-lozenge ${r.status === "published" ? "sq-lozenge--success" : r.status === "deactivated" ? "sq-lozenge--critical" : "sq-lozenge--warning"}`
                          "{r.status === "published" ? l.statusPublished : r.status === "deactivated" ? l.statusDeactivated : l.statusDraft}"
                      td.numeric "{r.version_label}"
                      td
                        RowActions row=r l=l
                          [if row.status === "draft"]
                            div.stack style gap
                              form action=pubAction
                                input type="hidden" name="rule_id" value=row.id
                                button.btn.btn-primary.btn-touch type="submit" disabled "{pubPending ? l.publishing : l.publish}" (t("admin.notif.publishing","Publishing…") / t("admin.notif.publish","Validate and publish"))
                              Msg state=pubState (same structure as above)
                          [else if row.status === "published"]
                            div.stack style gap
                              form action=testAction
                                input type="hidden" name="rule_id" value=row.id
                                button.btn.btn-primary.btn-touch type="submit" disabled "{testPending ? l.testing : l.test}" (t("admin.notif.testing","Sending…") / t("admin.notif.test","Send test"))
                              Msg state=testState
                              form.row action=deactAction style gap
                                input type="hidden" name="rule_id" value=row.id
                                input type="text" name="deactivation_reason" placeholder=l.deactivationReason required (t("admin.notif.form.deactivationReason","Deactivation reason"))
                                button.btn.btn-primary.btn-touch type="submit" disabled "{deactPending ? l.deactivating : l.deactivate}" (t("admin.notif.deactivating","Deactivating…") / t("admin.notif.deactivate","Deactivate"))
                              Msg state=deactState
                          [else]
                            span.t-caption "{row.deactivation_reason ?? "—"}"
    [else]
      div.sq-tablewrap
        table.sq-table
          thead
            tr
              th scope="col" "{l.colEvent}"
              th scope="col" "{l.colChannel}"
              th scope="col" "{l.colRecipient}"
              th scope="col" "{l.colSla}"
              th scope="col" "{l.colStatus}"
              th scope="col" "{l.colVersion}"
          tbody
            [for each r in rows (rulesError ? null : rows.map)]
              tr key=r.id
                td.numeric "{r.event_key}"
                td "{r.channel}"
                td
                  [if r.recipient_role] "{r.recipient_role}"
                  [else] span.badge.badge-warning "{l.missingRecipient}"
                td "{r.sla_minutes ? `${r.sla_minutes}m → ${r.escalation_role}` : "—"}"
                td "{r.status}"
                td.numeric "{r.version_label}"
    p.t-caption style margin
      span aria-hidden="true" "ⓘ"
      " " "{t("admin.notif.escalationNote","SLA timers and escalation roles are stored as governed configuration. Automatic breach-firing (a scheduled process that escalates when a timer elapses) is separate runtime scope and is not built by this screen.")}"

undefined-classes: sq-pagehead--route

text-content:
Notification & SLA Rules
SCR-ADM-080
⚠
register unavailable
⚠
The notification rule register couldn't be read.
Nothing is shown as zero — the count is unknown, not empty.
Recipient roles are unavailable. Rule creation is disabled; existing rules remain readable.
Permissions unavailable
Your configuration permissions could not be verified. Writes are disabled; retry the page.
Read-only for your role
You can view configuration; creating, publishing and deactivating rules require an admin configuration role and are enforced by row-level security.
Event
Channel
Recipient role
SLA timer (minutes)
Escalation role
—
Template
e.g. Review decision recorded: {decision}
Creating…
Create draft rule
Event
Channel
Recipient
SLA → escalation
Status
Version
Actions
No notification rules configured
The read succeeded — the register is genuinely empty. Create the first rule above.
Missing recipient
m →
—
Publishing…
Validate and publish
Sending…
Send test
Deactivation reason
Deactivating…
Deactivate
—
ⓘ
SLA timers and escalation roles are stored as governed configuration. Automatic breach-firing (a scheduled process that escalates when a timer elapses) is separate runtime scope and is not built by this screen.

## /admin/operations
file: apps/web/src/app/(app)/admin/operations/page.tsx, apps/web/src/components/Mvp3ActionForm.tsx, apps/web/src/components/Shell.tsx (default export)
NOTE: this is the admin sub-dashboard KPI page — distinct from the main /operations route (which is leased to codex).

structure:
Shell current="/admin/operations" title=t("mvp3.operations.title","Platform operations and resilience") context=...
  header.sq-pagehead.sq-pagehead--route
    div.sq-pagehead__row
      div.sq-pagehead__context
        h2 "{title}"
        {context}
          span.badge.badge-info
            "M3-00 · CD-050 · "
            "{t("mvp3.operations.badge","fail-closed operations")}"
  div.sq-content
    [if sourceFailures.length]
      div.sq-banner.sq-banner--warning role="alert"
        div
          strong "{t("mvp3.operations.sourcesUnavailable","Some operational sources are unavailable.")}"
          " " "{t("mvp3.operations.sourcesUnavailableBody","Unavailable sources are identified below and are never represented as zero or empty.")}"
          span.t-caption style display/marginBlockStart "{sourceFailures.join(" · ")}"
    div.sq-grid
      section.panel style padding
        p.t-caption "{t("mvp3.operations.endpoints","Endpoint contracts")}"
        strong.kpi-value "{endpointsError ? t("common.unavailable","Unavailable") : endpointRows.length}"
        [if !endpointsError]
          p "{endpointRows.filter(x => x.status === "configured").length} {t("mvp3.operations.configured","configured")}"
      section.panel style padding
        p.t-caption "{t("mvp3.operations.openErrors","Open error records")}"
        strong.kpi-value "{errorsError ? t("common.unavailable","Unavailable") : (errors ?? []).filter(...).length}"
        [if !errorsError]
          p "{t("mvp3.operations.noThroughput","No throughput claim is derived from this count.")}"
      section.panel style padding
        p.t-caption "{t("mvp3.operations.publishedFlags","Published flag versions")}"
        strong.kpi-value "{flagsError ? t("common.unavailable","Unavailable") : (flags ?? []).filter(...).length}"
        [if !flagsError]
          p "{t("mvp3.operations.sod","Maker-checker enforced.")}"
    section.panel.stack style padding/marginBlockStart
      h3 "{t("mvp3.operations.errors","Error queue")}"
      [if errorsError]
        div.sq-banner.sq-banner--warning role="status" "{t("mvp3.operations.sourceUnavailable","This source is unavailable. No empty-state claim is made.")}"
      [else]
        div.sq-tablewrap
          table.sq-table
            thead
              tr
                th scope="col" "{t("common.source","Source")}"
                th scope="col" "{t("common.operation","Operation")}"
                th scope="col" "{t("common.status","Status")}"
                th scope="col" "{t("mvp3.operations.attempts","Attempts")}"
                th scope="col" "{t("common.action","Governed action")}"
            tbody
              [for each row in (errors ?? [])]
                tr key=row.id
                  th scope="row" "{row.source}"
                  td "{row.operation}"
                  td
                    span.badge.badge-warning "{row.status}"
                    div.t-caption "{row.last_error_code ?? "—"}"
                  td.numeric "{row.attempt_count}"
                  td
                    [if ["failed","dependency_blocked"].includes(row.status)]
                      Mvp3ActionForm action=requestErrorRetry submitLabel=t("mvp3.operations.retry","Request idempotent retry")
                        form.stack action=formAction style gap
                          {children}
                            input type="hidden" name="errorId" value=row.id
                          button.btn.btn-secondary.btn-touch type="submit" disabled "{pending ? "Working…" : submitLabel}"
                          [if state.message]
                            p role="status" className={state.ok ? "t-caption" : "sq-banner sq-banner--critical"} "{state.message}"
                    [else] "—"
              [if !(errors ?? []).length]
                tr
                  td colSpan=5 "{t("mvp3.operations.noErrors","No RLS-visible error records. This is not a platform-health assertion.")}"
    section.panel.stack style padding/marginBlockStart
      h3 "{t("mvp3.operations.flags","Feature flag versions")}"
      [if flagsError]
        div.sq-banner.sq-banner--warning role="status" "{t("mvp3.operations.sourceUnavailable","This source is unavailable. No empty-state claim is made.")}"
      [else]
        div.sq-tablewrap
          table.sq-table
            thead
              tr
                th scope="col" "{t("common.name","Flag")}"
                th scope="col" "{t("common.version","Version")}"
                th scope="col" "{t("common.status","State")}"
                th scope="col" "{t("mvp3.operations.value","Value")}"
                th scope="col" "{t("common.action","Checker action")}"
            tbody
              [for each row in (flags ?? [])]
                tr key=row.id
                  th scope="row" "{row.flag_key}"
                    div.t-caption "{row.description}"
                  td "{row.version}"
                  td
                    span.badge "{row.status}"
                  td "{row.enabled ? t("common.enabled","Enabled") : t("common.disabled","Disabled")}"
                  td
                    [if row.status === "draft"]
                      Mvp3ActionForm action=publishFeatureFlag submitLabel=t("mvp3.operations.publish","Approve and publish")
                        form.stack action=formAction style gap
                          {children}
                            input type="hidden" name="flagId" value=row.id
                          button.btn.btn-secondary.btn-touch type="submit" disabled "{pending ? "Working…" : submitLabel}"
                          [if state.message]
                            p role="status" className={state.ok ? "t-caption" : "sq-banner sq-banner--critical"} "{state.message}"
                    [else] "—"
              [if !(flags ?? []).length]
                tr
                  td colSpan=5 "{t("mvp3.operations.noFlags","No feature flag versions.")}"
    div.sq-banner.sq-banner--warning style marginBlockStart
      div
        strong "{t("mvp3.operations.policyHold","Retention, backup target and restore objectives remain policy-held.")}"
        " " "{t("mvp3.operations.policyHoldBody","No purge or successful restore claim is enabled until approved values and executed evidence exist.")}"

undefined-classes: sq-pagehead--route

text-content:
Platform operations and resilience
M3-00 · CD-050 ·
fail-closed operations
Some operational sources are unavailable.
Unavailable sources are identified below and are never represented as zero or empty.
Endpoint contracts
Unavailable
configured
Open error records
Unavailable
No throughput claim is derived from this count.
Published flag versions
Unavailable
Maker-checker enforced.
Error queue
This source is unavailable. No empty-state claim is made.
Source
Operation
Status
Attempts
Governed action
—
Request idempotent retry
Working…
No RLS-visible error records. This is not a platform-health assertion.
Feature flag versions
This source is unavailable. No empty-state claim is made.
Flag
Version
State
Value
Checker action
Enabled
Disabled
Approve and publish
Working…
—
No feature flag versions.
Retention, backup target and restore objectives remain policy-held.
No purge or successful restore claim is enabled until approved values and executed evidence exist.
Error queue
Feature flag versions
Endpoint contracts

## /admin/packages
file: apps/web/src/app/(app)/admin/packages/page.tsx, apps/web/src/app/(app)/admin/packages/ImpactPanel.tsx, apps/web/src/app/(app)/admin/packages/PublishControls.tsx, apps/web/src/app/(app)/admin/packages/DraftEditor.tsx, apps/web/src/app/(app)/admin/packages/PackagePreview.tsx, apps/web/src/app/(app)/admin/packages/TemplateRegistry.tsx, apps/web/src/app/(app)/admin/_components/AdminDestinationFrame.tsx, apps/web/src/app/(app)/admin/_components/AdminRecordDrawer.tsx, apps/web/src/app/(app)/admin/_components/adminRecordDrawerCopy.ts, apps/web/src/components/Shell.tsx (default export), apps/web/src/app/icons.tsx (IconLock)

structure:
AdminDestinationFrame current="/admin/packages" title subtitle hub routeLabel="/admin/packages" designId="frame-22-admin-survey-configuration" drawerLabels labels metrics tabs gate governance reconstructionNote context
  Shell current="/admin/packages" title="" context=context
    div.sq-content
      {children}
        AdminRecordDrawerProvider labels=drawerLabels
          div.styles.workspace data-saqeel-admin-destination="frame-22-admin-survey-configuration"
            div.styles.main
              header.styles.heading
                div
                  nav.styles.breadcrumb aria-label=labels.breadcrumb
                    ol
                      li "{labels.administration}" (t("navigation.administration","Administration"))
                      li "{hub}" (t("admin.revamp.hub.rules","Rules & content"))
                  h1.styles.title "{title}" (t("admin.revamp.survey.title","Survey Configuration"))
                  p.styles.subtitle "{subtitle}" (t("admin.revamp.survey.subtitle","Inspection forms, sections and response rules"))
                span.sq-version
                  bdi dir="ltr" "{routeLabel}" ("/admin/packages")
              section.styles.metrics aria-label="{title} governance figures"
                [for each metric in metrics]
                  article.styles.metric key=metric.label
                    span.styles.metricLabel "{metric.label}"
                    strong.styles.metricValue "{metric.value}"
                    span.styles.metricNote "{metric.note}"
              nav.styles.tabs aria-label="{title} sections"
                [for each tab in tabs]
                  Link.styles.tab href=tab.href aria-current=tab.current?"page":undefined key
                    "{tab.label}"
              [if gate]
                section.styles.gate aria-label=gate.title
                  strong "{gate.title}"
                  p "{gate.body}"
              {children}
                div.styles.pageStack id="package-register"
                  [if !packageUnavailable && canWrite]
                    TemplateRegistry templates strings
                      (full structure identical to /admin/templates' TemplateRegistry, see that route's audit)
                  section.panel.styles.hero aria-labelledby="pkg-overview"
                    div.styles.heroRow
                      div
                        h2 id="pkg-overview" style margin "{t("admin.pkg.overview.title","Version-governed inspection packages")}"
                        p.t-caption "{t("admin.pkg.overview.body","Drafts are editable. Publishing runs dependency validation and maker-checker approval; published and locked definitions remain immutable.")}"
                        p.t-caption role="status" "{t("admin.pkg.readAt","Read from source at")} " bdi dir="ltr" "{readAt}"
                      span.`sq-lozenge ${canWrite ? "sq-lozenge--success" : "sq-lozenge--info"}`
                        span aria-hidden="true" "{canWrite ? "✎ " : "◉ "}"
                        "{canWrite ? t("admin.pkg.writer","Configuration writer") : t("admin.pkg.reader","Read-only access")}"
                  [if packageUnavailable]
                    div.sq-banner.sq-banner--critical role="alert"
                      div
                        strong "{t("admin.pkg.error.title","Couldn't load the package library.")}"
                        " " "{t("admin.pkg.error.body", NEUTRAL_LOAD_ERROR)}"
                        " " a.sq-link href="/admin/packages" "{t("admin.pkg.retry","Reload to try again")}"
                        "."
                  [if !packageUnavailable && itemBankUnavailable]
                    div.sq-banner.sq-banner--warning role="status"
                      div
                        strong "{t("admin.pkg.itemsUnavailable.title","Item catalogue unavailable.")}"
                        " " "{t("admin.pkg.itemsUnavailable.body","Package versions and impact remain visible, but editing and field preview are paused because their item dependency could not be read. This is not an empty catalogue.")}"
                  [if !packageUnavailable && (roleRead.error || !canWrite)]
                    section.panel.styles.governance aria-labelledby="pkg-access"
                      h3 id="pkg-access" style margin "{t("admin.pkg.readonly.title","Read-only package access")}"
                      p.t-caption "{roleRead.error ? t("admin.pkg.readonly.unknown","Your write permissions could not be verified, so all mutation controls are hidden. Reload to retry; RLS remains authoritative.") : t("admin.pkg.readonly.body","You can inspect versions, previews and publish impact. Creating, saving and publishing require compliance_admin or form_admin; navigation access does not grant write permission.")}"
                  [if !packageUnavailable && pkgs.length === 0]
                    section.panel.styles.emptyState
                      div.sq-state
                        span.sq-state__glyph aria-hidden="true" "▦"
                        h3 "{t("admin.pkg.empty.title","No packages configured")}"
                        p.t-caption "{t("admin.pkg.empty.body","The package read succeeded and returned no rows. Package creation is not exposed by this route, so no unsupported create control is shown.")}"
                  [for each pkg in pkgs] (when !packageUnavailable)
                    details.panel.styles.packageGroup key=pkg.id open
                      summary
                        span.styles.packageHeading
                          span
                            strong
                              bdi dir="ltr" "{pkg.code}"
                              " — " "{pkg.title}"
                            br
                            span.t-caption "{pkg.scope ?? t("admin.pkg.scopeNone","No scope recorded")}"
                          span.badge.badge-info "{versions.length} " "{t("admin.pkg.versions","version(s)")}"
                      div.styles.packageBody
                        [if versions.length === 0]
                          div.sq-state
                            span.sq-state__glyph aria-hidden="true" "□"
                            strong "{t("admin.pkg.noVersions","No versions yet")}"
                        [else]
                          div.sq-tablewrap
                            table.styles.versionTable
                              caption.sr-only "{pkg.code} " "{t("admin.pkg.versions","versions")}"
                              thead
                                tr
                                  th scope="col" "{t("admin.pkg.col.version","Version")}"
                                  th scope="col" "{t("admin.pkg.col.state","State")}"
                                  th scope="col" "{t("admin.pkg.col.published","Published")}"
                                  th scope="col" "{t("admin.pkg.col.definition","Definition")}"
                              tbody
                                [for each version in versions]
                                  AdminRecordTableRow key=version.id record={...}
                                    tr id className=styles.recordRow tabIndex=0 aria-haspopup="dialog" aria-label onClick onKeyDown
                                      {children}
                                        td data-label "{version.version_label}" (bdi dir="ltr" className="sq-version")
                                        td data-label
                                          span.`sq-lozenge ${version.status === "draft" ? "sq-lozenge--warning" : "sq-lozenge--success"}`
                                            span aria-hidden="true" "{version.status === "draft" ? "✎ " : "✓ "}"
                                            "{stateLabel}"
                                          [if derivedSuperseded]
                                            span.t-caption " · " "{t("admin.pkg.derivedSuperseded","older than current publish (derived)")}"
                                        td data-label bdi dir="ltr" "{version.published_at ? version.published_at.slice(0,10) : "—"}"
                                        td data-label "{sectionCount} " "{t("admin.pkg.sections","section(s)")} · " "{itemCount} " "{t("admin.pkg.items","item(s)")}"
                                    RecordDrawer record open onClose triggerRef
                                      (same structure as AdminRecordDrawer's RecordDrawer, shown fully under /admin/integrations audit)
                        div.styles.versionList
                          [for each version, index in versions]
                            details id=`package-version-${version.id}` key=version.id className=`panel ${styles.versionCard}` open={version.status === "draft" || index === 0}
                              summary
                                span.styles.versionHeading
                                  strong bdi dir="ltr" "{version.version_label}"
                                  span.`sq-lozenge ${published ? "sq-lozenge--success" : "sq-lozenge--warning"}` "{t(`enum.${version.status}`, version.status.replace(/_/g,' '))}"
                              div.styles.versionBody
                                [if published]
                                  div.sq-banner.sq-banner--immutable
                                    div
                                      strong
                                        IconLock size=16 (svg no class)
                                        " " "{t("admin.pkg.immutable.title","Published version — immutable.")}"
                                      " " "{t("admin.pkg.immutable.body","The database rejects definition and label edits. Create a new draft to change this package while existing inspections stay pinned to their downloaded version.")}"
                                [if version.status === "draft" && canWrite && !itemBankUnavailable]
                                  DraftEditor versionId definition catalog violations templates strings=editorStrings preview
                                    (large studio: sections list, field canvas, item picker, package-item policy fieldset, validation panel, save button, preview pane, action-forms editor — full field-level structure in the harvested notification; retained verbatim in the working scratch file)
                                [else if !itemBankUnavailable]
                                  previewFor(definition) (PackagePreview tree — see below)
                                [else] null
                                ImpactPanel data=impact strings=impactStrings
                                  div.sq-panel.sq-impact style padding/display/flexDirection/gap/borderInlineStart
                                    h4 style font/margin "{s.title}" (t("admin.pkg.impact.title","Publish impact"))
                                    (in-flight pinned-visits section, referencing-packages section, diff-vs-published section — CodeList sub-blocks for added/removed/moved/formsAdded/formsRemoved)
                                [if published && canWrite]
                                  DeactivatePackage versionId strings=publishStrings
                                    form.row action=formAction style gap/alignItems/flexWrap
                                      input type="hidden" name="version_id" value=versionId
                                      label.sq-field span.sq-field__label "{s.effectiveTo}" (t("admin.pkg.deactivate.effectiveTo","Effective to")) input.sq-input type="date" name="effective_to" required
                                      label.sq-field span.sq-field__label "{s.deactivationReason}" (t("admin.pkg.deactivate.reason","Deactivation reason")) input.sq-input name="deactivation_reason" required
                                      button.btn.btn-primary.btn-touch disabled "{pending ? s.deactivating : s.deactivate}" (t("admin.pkg.deactivate.working","Deactivating…") / t("admin.pkg.deactivate.action","Deactivate version"))
                                      [if state.error] span.t-caption style color role="alert" "{state.error}"
                                      [if state.ok] span.badge.badge-compliant role="status" "✓ {s.deactivated}" (t("admin.pkg.deactivate.done","Package version deactivated"))
                                [if version.status === "draft" && canWrite]
                                  section.panel aria-label=t("admin.pkg.publish.heading","Publish gate") style padding
                                    ApprovePublish versionId strings=publishStrings
                                      form action=formAction aria-busy style display/flexDirection/gap/alignItems
                                        input type="hidden" name="version_id" value=versionId
                                        p.t-caption "{s.publishHint}" (t("admin.pkg.publish.hint","Publish rechecks item, evidence, condition, violation, penalty and action-form dependencies. The approver must differ from the creator (RBAC-002)."))
                                        button.btn.btn-primary.btn-lg.btn-touch disabled "{pending ? s.publishing : s.approvePublish}" (t("admin.pkg.publish.publishing","Publishing…") / t("admin.pkg.publish.approve","Approve & publish"))
                                        [if state.error] div.sq-banner.sq-banner--critical role="alert" div style whiteSpace "{state.error}"
                                        [if state.ok] div.sq-banner.sq-banner--success role="status" div span aria-hidden="true" "✓ " "{s.published}" (t("admin.pkg.publish.published","Version published. It is now immutable."))
                        [if canWrite]
                          section id=`package-new-draft-${pkg.id}` className="panel" style padding
                            NewDraftForm packageId=pkg.id strings=publishStrings
                              form.row action=formAction aria-busy style gap/alignItems/flexWrap
                                input type="hidden" name="package_id" value=packageId
                                div.sq-field
                                  label.sq-field__label htmlFor "{s.newDraftLabel}" (t("admin.pkg.newDraft.label","New draft version label"))
                                  input.sq-input.numeric id name="version_label" placeholder=s.versionPlaceholder (t("admin.pkg.newDraft.placeholder","Example: v2026.08")) required autoComplete="off"
                                div.sq-field
                                  label.sq-field__label htmlFor "{s.effectiveFrom}" (t("admin.pkg.newDraft.effectiveFrom","Effective from"))
                                  input.sq-input.numeric id type="date" name="effective_from" required
                                button.btn.btn-primary.btn-touch disabled "{pending ? s.creating : s.createDraft}" (t("admin.pkg.newDraft.creating","Creating…") / t("admin.pkg.newDraft.create","Create draft"))
                                [if state.error] span.t-caption style color role="alert" "{state.error}"
                                [if state.ok] span.badge.badge-compliant role="status" "✓ " "{s.draftCreated}" (t("admin.pkg.newDraft.created","Draft created"))
                  [if !packageUnavailable]
                    section.panel.styles.governance aria-labelledby="pkg-blockers"
                      h3 id="pkg-blockers" style margin "{t("admin.pkg.blockers.title","Boundaries kept visible")}"
                      p.t-caption "{t("admin.pkg.blockers.body","The designer now authors ordered bilingual sections, package-item policy, action forms, and governed template references. Publish revalidates dependencies and rejects circular conditions. Package footprint/fingerprint metrics and visual simulation remain unclaimed because no approved metric or simulator contract exists.")}"
                      p.t-caption role="status" "{t("admin.pkg.stale","Data may have changed since this source read; no freshness threshold is defined.")} " a.sq-link href="/admin/packages" "{t("admin.pkg.refresh","Refresh to reconcile")}" "."
            aside.styles.rail aria-label="{title} — {labels.governance}"
              section.styles.railCard
                h2.styles.railTitle "{labels.governance}" (t("admin.revamp.governance","Governance on this surface"))
                ul.styles.governance
                  [for each item in governance]
                    li key=item "{item}"
              section.styles.railCard
                h2.styles.railTitle "{labels.reconstruction}" (t("admin.revamp.reconstruction","Reconstruction note"))
                p.styles.note "{reconstructionNote}"

undefined-classes: sq-pagehead--route, ipad-preview, ipad-q (all module-scoped `styles.*` classnames from packages.module.css / AdminDestinationFrame.module.css / AdminRecordDrawer.module.css are CSS-module references, not global class-string literals, so they are excluded from this check)

text-content:
Administration
Rules & content
/admin/packages
Survey Configuration
Inspection forms, sections and response rules
Governance on this surface
Reconstruction note
Boundaries kept visible
The designer now authors ordered bilingual sections, package-item policy, action forms, and governed template references. Publish revalidates dependencies and rejects circular conditions. Package footprint/fingerprint metrics and visual simulation remain unclaimed because no approved metric or simulator contract exists.
Data may have changed since this source read; no freshness threshold is defined.
Refresh to reconcile
.
Packages
Sections & items
Action forms
Versions
Published packages are immutable
A package selected by a published visit cannot be structurally edited. Changes create additive drafts; existing and historical inspections remain pinned to their original package version.
The design's sample package names, counts and rule contents are not copied. This workspace renders the real package, item, template, impact and immutable-version sources already used by execution.
SCR-ADM-030/031 · ENG-02
Read from source at
Published packages
Currently effective versions only
Inspection items
RLS-visible governed catalogue
Draft packages
Not selectable by live visits
Governed template registry
Version-governed inspection packages
Drafts are editable. Publishing runs dependency validation and maker-checker approval; published and locked definitions remain immutable.
Configuration writer
Read-only access
Couldn't load the package library.
Reload to try again
Item catalogue unavailable.
Package versions and impact remain visible, but editing and field preview are paused because their item dependency could not be read. This is not an empty catalogue.
Read-only package access
Your write permissions could not be verified, so all mutation controls are hidden. Reload to retry; RLS remains authoritative.
You can inspect versions, previews and publish impact. Creating, saving and publishing require compliance_admin or form_admin; navigation access does not grant write permission.
No packages configured
The package read succeeded and returned no rows. Package creation is not exposed by this route, so no unsupported create control is shown.
No scope recorded
version(s)
No versions yet
Version
State
Published
Definition
older than current publish (derived)
section(s) ·
item(s)
Published version — immutable.
The database rejects definition and label edits. Create a new draft to change this package while existing inspections stay pinned to their downloaded version.
Publish impact
In-flight work on prior published versions
In-flight counts are unavailable or outside your read scope — this is not zero.
No active visits or inspections are pinned to a prior published version.
Existing work stays on the frozen version it downloaded; publishing never silently re-versions it.
Other published packages sharing these items
No other published package references items in this version.
Changes vs the currently published version
No published version exists yet — this would be the first.
This is the currently published version.
No item or action-form changes from the published version.
Added
Removed
Moved section
Forms added
Forms removed
Effective to
Deactivation reason
Deactivating…
Deactivate version
Package version deactivated
Publish rechecks item, evidence, condition, violation, penalty and action-form dependencies. The approver must differ from the creator (RBAC-002).
Publishing…
Approve & publish
Version published. It is now immutable.
New draft version label
Example: v2026.08
Effective from
Creating…
Create draft
Draft created

---

## /admin/regulations
file: apps/web/src/app/(app)/admin/regulations/page.tsx, apps/web/src/app/(app)/admin/regulations/Controls.tsx (RegulationDetail.tsx does not exist — the detail dossier is a logical mode of page.tsx via `?id=`, per code comment)
structure:
Shell[current="/admin/regulations" title context]
  context (shared by both modes):
    span.row
      span.badge.badge-info "SCR-ADM-010/011"
      a.sq-link[href="/admin/compliance-requests"] "Configuration Requests"
      span[role="status" aria-live="polite"].t-caption
        "read at " + bdi[dir="ltr"].numeric "{readAt}" + " — not refreshed since; no staleness verdict exists, the age is shown"
      [if regsError]
        span.badge.badge-warning
          span[aria-hidden="true"] "⚠"
          " " + "register unavailable"
  libraryTabs (shared):
    nav.cmp-library-tabs[aria-label="Compliance Library"]
      a.btn.btn-primary.btn-lg.btn-touch[href="/admin/regulations" aria-current="page"] "Regulations"
      a.btn.btn-secondary.sq-link.btn-touch[href="/admin/items"] "Inspection Items"
      [if isWriter]
        a.btn.btn-secondary.sq-link.btn-touch[href="/admin/compliance-requests/new"] "Create governed request"
  degradedBanner (shared):
    [if regsError]
      div.sq-banner.sq-banner--warning[role="alert"]
        strong: span[aria-hidden="true"]"⚠" + "The regulation register couldn't be read."
        " " + "Nothing is shown as zero — the count is unknown, not empty. Your session and navigation still work."
        " "
        a.sq-link[href] "Retry read"
  readOnlyBanner (shared):
    [if roleError]
      div.sq-banner.sq-banner--warning[role="alert"]
        strong "Permissions unavailable"
        " " + "Your configuration permissions could not be verified. Writes are disabled; retry the page."
    [else if !isWriter]
      div.sq-banner[role="note"]
        strong: span[aria-hidden="true"]"👁" + " " + ("Reviewer — read-only" [if isReviewer] else "Read-only for your role")
        " " + "You can view configuration; creating, adding clauses, and publishing require a Compliance or Form Admin role and are enforced by row-level security. The route guard and database permissions are independent controls."

  [if detailId] (DETAIL MODE, CD-006)
    Shell
      {degradedBanner}
      {readOnlyBanner}
      {libraryTabs}
      p.t-caption
        a.sq-link[href="/admin/regulations"] "← " + "Back to register"
      [if regsError] null
      [else if !reg]
        EmptyState[role="status" glyph="🔎" title="Regulation not found" body="The read succeeded but no regulation has this identifier. It may have been removed."]
      [else]
        section.panel.stack[aria-labelledby="reg-dossier-h"]
          div.row
            div.stack
              h2#reg-dossier-h
                span.numeric bdi[dir="ltr"] "{reg.code}"
                " — " + "{reg.title}"
              p.t-caption
                "{reg.issuing_authority || "—"}"
                [if reg.created_at] " · " + "created" + " " + bdi[dir="ltr"].numeric "{reg.created_at.slice(0,10)}"
                [if reg.effective_from] " · " + "Effective from" + " " + bdi[dir="ltr"].numeric "{reg.effective_from.slice(0,10)}"
                " · " + "Version label" + " " + bdi[dir="ltr"].numeric "{reg.version_label}"
            span.sq-lozenge (`sq-lozenge--success`/`sq-lozenge--critical`/`sq-lozenge--warning` per reg.status)
              span[aria-hidden="true"] "{●/✕/◷}"
              " " + ("Active" / "Deactivated" / "Scheduled")
          p.t-caption
            span[aria-hidden="true"] "ⓘ"
            " " + "Regulation-row changes are audit-tracked by the generic trigger. Clause additions on this dossier are audit-tracked too (trg_audit_regulation_clauses)."
        section.panel.stack[aria-labelledby="reg-attachments-h"]
          h3#reg-attachments-h "Source attachments"
          [if reg.attachments_status==="verified_unknown"]
            p.t-caption[role="status"] "Attachment footprint is unknown for this canonical version; no zero claim is made."
          [else if attachments.length===0]
            p.t-caption[role="status"] "No attachment metadata recorded — verified zero."
          [else]
            ul.stack
              [for each a in attachments]
                li
                  [if attachmentUrls[a.id]] a.sq-link[href target="_blank" rel="noreferrer"] strong "{a.file_name}"
                  [else] strong "{a.file_name}"
                  [if a.media_type] " · {a.media_type}"
                  [if a.sha256] " · " + bdi[dir="ltr"].numeric "SHA-256 {a.sha256.slice(0,12)}…"
          p.t-caption "Files are uploaded to governed private storage, checksummed, and retrieved through short-lived signed links."
        section.panel.stack[aria-labelledby="reg-clauses-h"]
          h3#reg-clauses-h "Clauses & mapped inspection items"
          [if clauses.length===0]
            div.sq-state.sq-state--inline[role="status"]
              span.sq-state__glyph[aria-hidden="true"] "📄"
              h4 "No clauses yet"
              p.t-caption "This regulation has no clauses. Add the first clause below — the read succeeded, it is genuinely empty."
          [else]
            div.sq-tablewrap
              table.sq-table
                thead: tr
                  th[scope="col"] "Clause"
                  th[scope="col"] "Title"
                  th[scope="col"] "Applicability"
                  th[scope="col"] "Legal source"
                  th[scope="col"] "Mapped items"
                tbody
                  [for each c in clauses]
                    tr
                      td.numeric strong bdi[dir="ltr"] "§{c.clause_ref ?? "—"}"
                      td "{c.title ?? "—"}"
                      td.t-caption "{c.applicability ?? "—"}"
                      td.t-caption "{c.legal_source ?? "—"}"
                      td
                        [if items===null] span.badge.badge-warning span[aria-hidden="true"]"⚠" + "mapped-item read failed — impact unknown, not zero"
                        [else if items.length===0] span.t-caption span[aria-hidden="true"]"○" + "no mapped items (verified zero)"
                        [else] [for each i in items] span.badge.badge-info[style marginInlineEnd:6] bdi[dir="ltr"] "{i.code}"
          p.t-caption
            span[aria-hidden="true"] "✓"
            " " + "Publish dependency gate is evaluated from the authoritative clause-to-item mappings shown above. Package versions freeze the referenced item snapshots at publication."
        [if isWriter]
          section.panel.stack[aria-labelledby="reg-actions-h"]
            h3#reg-actions-h "Governed configuration"
            div.sq-banner.sq-banner--immutable[role="note"]
              strong: span[aria-hidden="true"]"🔒" + " " + "Request-controlled content"
              " " + "Create and modify operations, including clauses, attachments, release dates, and successor versions, must be completed through a Compliance Configuration Request. The currently approved version remains available until that request is approved and published."
            div.row
              a.btn.btn-primary.btn-lg.btn-touch[href="/admin/compliance-requests/new"] "Create configuration request"
              a.btn.btn-secondary.sq-link.btn-touch[href="/admin/compliance-requests"] "View configuration requests"
            [if reg.status !== "deactivated"]
              div.sq-banner (+`sq-banner--warning` if unmapped>0 or clauses.length===0)[role]
                strong: span[aria-hidden="true"]"{⚠/✓}" + " " + "Publication dependency status"
                " " + ("Blocked: at least one clause is required." / "Blocked: {n} clause(s) have no mapped inspection item." / "Every clause has at least one mapped inspection item. Approval and publication still occur through the request workflow.")
            p.t-caption "Lifecycle changes are atomic and audited. Deactivation cascades future-use unavailability to dependent items, violations, and penalties while preserving historical versions. Reactivation never reactivates children."
            RegulationLifecycleControl[entityId operationalStatus labels]
              form.stack
                input[type="hidden" name="entity_id"]
                label.sq-field
                  span.sq-field__label "{activating ? "Activation reason" : "Deactivation reason"}"
                  textarea.sq-input[name="reason" required]
                button (`btn btn-primary btn-touch` if activating else `btn btn-ghost btn-touch`)[disabled]
                  "{pending ? "Applying…" : activating ? "Activate regulation" : "Deactivate regulation"}"
                [if errorMessage] span.t-caption[style color role="alert"] "{errorMessage}" (dynamic — one of the label strings above)
                [if state.ok]
                  span.badge.badge-compliant[role="status"]
                    span[aria-hidden="true"] "✓ "
                    "{idempotent ? "State already matched." : "Lifecycle changed to {status}."}"
                    [if cascaded && !activating] " Cascaded: {items} items, {violations} violations, {penalties} penalties."
                    [if activating] " Child configurations were not reactivated."
        section.panel.stack[aria-labelledby="reg-audit-h"]
          h3#reg-audit-h "Configuration audit timeline"
          [if !isWriter] p.t-caption "The scoped author timeline is available to configuration writers; this read-only persona is not granted that RPC."
          [else if auditError] div.sq-banner.sq-banner--warning[role="alert"] "The audit timeline is unavailable. Reload to retry; no empty-history claim is made."
          [else if auditEvents.length===0] p.t-caption[role="status"] "No scoped audit events returned — verified zero."
          [else]
            ol.stack
              [for each e in auditEvents]
                li strong "{e.action}" + " · " + bdi[dir="ltr"].numeric "{e.occurred_at}" + [if e.actor] " · " + bdi[dir="ltr"] "{e.actor}"
        section.panel.stack[aria-labelledby="reg-lineage-h"]
          h3#reg-lineage-h "Version lineage"
          ol.stack
            [for each version in lineage]
              li
                a.sq-link[href] bdi[dir="ltr"].numeric "{version.version_label}"
                " · " + "{version.status}"
                [if version.effective_from] " · " + bdi[dir="ltr"].numeric "{version.effective_from.slice(0,10)}"
                [if version.supersedes_id] " · " + "governed successor"
                [if version.deactivation_reason] div.t-caption "{version.deactivation_reason}"

  [else, !detailId] (LIST MODE, CD-005)
    Shell
      {degradedBanner}
      {readOnlyBanner}
      {libraryTabs}
      [if isWriter]
        div.sq-banner[role="note"]
          strong "Request-controlled content"
          " " + "This library is the read and discovery surface. Create and modify operations begin in a Compliance Configuration Request; approved historical versions remain unchanged."
          " "
          a.sq-link[href="/admin/compliance-requests/new"] "Create configuration request"
      [if regsError] null
      [else if rows.length===0]
        EmptyState[role="status" glyph="📜" title="No regulations configured" body=(isWriter ? "The read succeeded — the library is genuinely empty. Create the first governed configuration through a Compliance Configuration Request." : "The read succeeded — the library is genuinely empty (MVP1-M09-001: regulations are the parents of inspection items).")]
      [else]
        RegulationRegister[rows=lite strings]
          div.stack
            div.sq-commandbar[role="search"]
              div.sq-search
                input.sq-input[type="search" placeholder="Search code, title, authority…" aria-label="Search code, title, authority…"]
              div.row[role="group" aria-label="Filter by lifecycle"]
                button.sq-filterchip(+is-active)[aria-pressed] "All {n}"
                button.sq-filterchip(+is-active)[aria-pressed] "Published {n}"
                button.sq-filterchip(+is-active)[aria-pressed] "Draft {n}"
                button.sq-filterchip(+is-active)[aria-pressed] "Deactivated {n}"
            [if filtered.length===0]
              EmptyState[icon=IconSearch(28) title="No regulations match" body="The register itself is not empty — clear the search or lifecycle filter." inline role="status"]
            [else]
              ul.stack
                [for each r in filtered]
                  li.panel
                    div.row
                      div.stack
                        h3: span.numeric bdi[dir="ltr"] "{r.code}" + " — " + "{r.title}"
                        p.t-caption
                          "{r.issuing_authority || "—"}"
                          [if r.created_at] " · " + "created" + " " + bdi[dir="ltr"].numeric "{r.created_at.slice(0,10)}"
                      div.row
                        StatusChip[status s]
                          span.sq-lozenge (success/critical/warning per status)
                            span[aria-hidden="true"] "{●/✕/◷}"
                            " " + ("Active" / "Deactivated" / "Scheduled" / status)
                        a.btn.btn-secondary.sq-link.btn-touch[href] "Open dossier"
                    ImpactRail[r s]
                      div.panel
                        p.sq-overline "Impact footprint — from regulation to what actually gets inspected"
                        div.row
                          div.stack
                            span.sq-overline "REGULATION"
                            span.numeric bdi[dir="ltr"] "{r.code}"
                          div.stack
                            span.sq-overline "CLAUSES — read verified"
                            [if clausesUnknown] span.badge.badge-warning span[aria-hidden="true"]"⚠" + "clause read failed — count unknown, not zero"
                            [else if noClauses] span.t-caption span[aria-hidden="true"]"○" + "no clauses (verified zero)"
                            [else] span.t-caption span[aria-hidden="true"]"✓" + span.numeric bdi[dir="ltr"] "{r.clauseCount}"
                            [if r.status !== "deactivated" && noClauses] span.t-caption[style color] span[aria-hidden="true"]"⚠" + "draft with no clauses — incomplete; publishing it would be meaningless"
                          div.stack
                            span.sq-overline "MAPPED ITEMS — read verified"
                            [if itemsUnknown] span.badge.badge-warning span[aria-hidden="true"]"⚠" + "mapped-item read failed — impact unknown, not zero"
                            [else if noItems] span.t-caption span[aria-hidden="true"]"○" + "no mapped items (verified zero)"
                            [else] span.t-caption span[aria-hidden="true"]"✓" + span.numeric bdi[dir="ltr"] "{r.itemCount}"
                          div.stack
                            span.sq-overline "BEYOND ITEMS"
                            span.t-caption span[aria-hidden="true"]"⋯" + "Not evaluated — no verified source"

undefined-classes: none
text-content:
SCR-ADM-010/011
Configuration Requests
read at
 — not refreshed since; no staleness verdict exists, the age is shown
register unavailable
Regulations
Inspection Items
Create governed request
The regulation register couldn't be read.
Nothing is shown as zero — the count is unknown, not empty. Your session and navigation still work.
Retry read
Permissions unavailable
Your configuration permissions could not be verified. Writes are disabled; retry the page.
Reviewer — read-only
Read-only for your role
You can view configuration; creating, adding clauses, and publishing require a Compliance or Form Admin role and are enforced by row-level security. The route guard and database permissions are independent controls.
← 
Back to register
Regulation not found
The read succeeded but no regulation has this identifier. It may have been removed.
—
created
Effective from
Version label
Active
Deactivated
Scheduled
Regulation-row changes are audit-tracked by the generic trigger. Clause additions on this dossier are audit-tracked too (trg_audit_regulation_clauses).
Source attachments
Attachment footprint is unknown for this canonical version; no zero claim is made.
No attachment metadata recorded — verified zero.
SHA-256
…
Files are uploaded to governed private storage, checksummed, and retrieved through short-lived signed links.
Clauses & mapped inspection items
No clauses yet
This regulation has no clauses. Add the first clause below — the read succeeded, it is genuinely empty.
Clause
Title
Applicability
Legal source
Mapped items
§
—
—
—
—
mapped-item read failed — impact unknown, not zero
no mapped items (verified zero)
Publish dependency gate is evaluated from the authoritative clause-to-item mappings shown above. Package versions freeze the referenced item snapshots at publication.
Governed configuration
Request-controlled content
Create and modify operations, including clauses, attachments, release dates, and successor versions, must be completed through a Compliance Configuration Request. The currently approved version remains available until that request is approved and published.
Create configuration request
View configuration requests
Publication dependency status
Blocked: at least one clause is required.
Blocked: {n} clause(s) have no mapped inspection item.
Every clause has at least one mapped inspection item. Approval and publication still occur through the request workflow.
Lifecycle changes are atomic and audited. Deactivation cascades future-use unavailability to dependent items, violations, and penalties while preserving historical versions. Reactivation never reactivates children.
Activation reason
Deactivation reason
Applying…
Activate regulation
Deactivate regulation
✓ 
State already matched.
Lifecycle changed to {status}.
Cascaded: {items} items, {violations} violations, {penalties} penalties.
Child configurations were not reactivated.
Missing regulation reference.
A lifecycle reason is required.
You are not authorized to change regulation lifecycle state.
The regulation no longer exists or is outside your scope.
The lifecycle change could not be completed. Retry safely.
Configuration audit timeline
The scoped author timeline is available to configuration writers; this read-only persona is not granted that RPC.
The audit timeline is unavailable. Reload to retry; no empty-history claim is made.
No scoped audit events returned — verified zero.
Version lineage
governed successor
Request-controlled content
This library is the read and discovery surface. Create and modify operations begin in a Compliance Configuration Request; approved historical versions remain unchanged.
Create configuration request
No regulations configured
The read succeeded — the library is genuinely empty. Create the first governed configuration through a Compliance Configuration Request.
The read succeeded — the library is genuinely empty (MVP1-M09-001: regulations are the parents of inspection items).
Search code, title, authority…
All {n}
Published {n}
Draft {n}
Deactivated {n}
No regulations match
The register itself is not empty — clear the search or lifecycle filter.
—
created
Active
Deactivated
Scheduled
Open dossier
Impact footprint — from regulation to what actually gets inspected
REGULATION
CLAUSES — read verified
clause read failed — count unknown, not zero
no clauses (verified zero)
draft with no clauses — incomplete; publishing it would be meaningless
MAPPED ITEMS — read verified
mapped-item read failed — impact unknown, not zero
no mapped items (verified zero)
BEYOND ITEMS
Not evaluated — no verified source

## /admin/risk
file: apps/web/src/app/(app)/admin/risk/page.tsx, apps/web/src/app/(app)/admin/risk/RiskForm.tsx (RiskSectionNav.tsx exists but is not imported by page.tsx or RiskForm.tsx — unused, skipped)
structure:
AdminDestinationFrame[current="/admin/risk" title subtitle hub routeLabel="/admin/risk" designId drawerLabels labels metrics tabs gate governance reconstructionNote context] (opaque component — file not read; children below are its rendered content)
  context prop:
    span.badge.badge-info "SCR-ADM-060 · ENG-04"
    span.sq-version "{data?.version_label ?? notConfigured}"
  children:
    div.sq-banner
      div
        strong "This is the Risk Studio (MVP1 foundation scope)."
        " " + "Weights and bands are live configuration in"
        " "
        code "engine_settings"
        " " + "— scores must be reproducible from stored inputs + this version (EV-004). Writes require the risk_owner role; RLS rejects everyone else. Every save lands in the immutable audit trail."
    [if error]
      div.sq-banner.sq-banner--critical[role="alert"]
        div
          strong "Couldn't load risk configuration."
          " " + "The existing configuration was not verified. Nothing changed; retry or check your risk-owner access."
    [if !error && !data]
      EmptyState[glyph="⚖" title="No risk model stored" body="No risk configuration exists in your authorized scope. Create it through the governed provisioning process before using this studio."]
    [if !error && data && s]
      RiskForm[factors lowMax medMax updatedAt modelVersion drawerGovernance labels]
        form.panel[style]
          h4 "Factors & weights (must sum to 1.00)"
          [for each f in initialFactors]
            AdminRecordArticle[key id className="rk-driver" record={title,subtitle,record[],governance,audit[],editHref,auditHref}] (opaque component — AdminRecordDrawer.tsx not read)
              div.rk-driver__name: b "{f.name}"
              input.sq-input.numeric.rk-w[id name type="number" step="0.05" min="0" max="1" aria-label="{f.name}"]
              div.rk-bar[aria-hidden="true"]: span[style inlineSize]
          div.rk-sum[role="status" aria-live="polite"]
            [if sumOk] span.badge.badge-compliant "Σ weights = 1.00 ✓"
            [else] span.badge.badge-critical "Σ weights = {sum} — must equal 1.00 before saving"
          h4 "Bands"
          div.row
            div.sq-field: label.sq-field__label[htmlFor="low_max"] "Low ends at" + input.sq-input.numeric[id="low_max" name="low_max" type="number"]
            div.sq-field: label.sq-field__label[htmlFor="med_max"] "Medium ends at" + input.sq-input.numeric[id="med_max" name="med_max" type="number"]
            div.sq-field: label.sq-field__label[htmlFor="risk-high-band"] "High" + input.sq-input[id="risk-high-band" readOnly value="{medMax+1}–100"]
          div.rk-band
            span.rk-bandchip: span.rk-bandchip__dot[style background] + "Low" + " 0–{lowMax}"
            span.rk-bandchip: span.rk-bandchip__dot[style background] + "Medium" + " {lowMax+1}–{medMax}"
            span.rk-bandchip: span.rk-bandchip__dot[style background] + "High" + " {medMax+1}–100"
          [if !bandValidation.ok]
            p.t-caption.rk-validation[role="alert"] "Bands must use whole numbers and cover 0–100 without gaps."
          div.row[style]
            p.t-caption.numeric "last updated" + " {updatedAt formatted or —}"
            span.row[style]
              [if state.ok && !pending] span.badge.badge-compliant "saved — effective immediately"
              button.btn.btn-primary.btn-lg.btn-touch[disabled aria-disabled]
                "{pending ? "Saving…" : "Save configuration (risk_owner only)"}"
          label.rk-live-confirm
            input[type="checkbox" checked onChange]
            span "I understand this configuration becomes effective immediately for new score calculations."
          [if state.error] p.t-caption[role="alert" style color] "{state.error}" (dynamic string, not a literal)
          p.t-caption "Saving writes factors and bands to engine_settings after the weights-sum check, effective immediately for new score calculations — there is no draft or approval step on this screen."
    div[style maxInlineSize:720]
      NotYetBoundary[title consequence seam prerequisites notAvailableLabel detailLabel] (opaque component — file not read)
        title="Why this factory? — worked calculation trace"
        consequence="A line-by-line score trace isn't shown here — this screen configures the model, not individual factories."
        seam="NEEDS_FACTORY_SCORING_INPUTS — per-factory trace"
        prerequisites=["A selected factory and its stored scoring inputs","The per-factor normalized values used at scoring time"]
        notAvailableLabel="Not available yet"
        detailLabel="Why / prerequisites"

AdminDestinationFrame text props (rendered inside the opaque component, exact structure not verified since file not read):
  title="Risk Configuration"
  subtitle="Risk factors, evaluation method and weighting"
  hub="Risk & intelligence"
  labels.administration="Administration"
  labels.breadcrumb="Breadcrumb"
  labels.governance="Governance on this surface"
  labels.reconstruction="Reconstruction note"
  metrics[0]: label="Configured weight total", note="Derived from the stored factor weights"
  metrics[1]: label="Factors in current settings", note="No prototype factors are added"
  metrics[2]: label="Configuration version", note="Read from engine_settings"
  tabs[0].label="Risk factors", tabs[1].label="Governed models", tabs[2].label="Publish history"
  gate.title="The two risk lifecycles remain explicit"
  gate.body="MVP1 engine settings become effective only through the existing risk-owner action after validation and confirmation. Governed model drafts use the separate maker-checker route. This screen does not pretend the two contracts are one."
  governance[0]="The stored factor total must equal the engine's accepted invariant before a save."
  governance[1]="Risk-owner authorization and RLS are rechecked on every write."
  governance[2]="Scores remain reproducible from stored inputs and the configuration version."
  reconstructionNote="Prototype weights, bands and recalculation times are intentionally absent. This surface reads the live engine settings, while per-factory score explanation remains on the factory record where its scoring inputs exist."

undefined-classes: none
text-content:
Risk Configuration
Risk factors, evaluation method and weighting
Risk & intelligence
Administration
Breadcrumb
Governance on this surface
Reconstruction note
Configured weight total
Derived from the stored factor weights
Factors in current settings
No prototype factors are added
Configuration version
Read from engine_settings
Risk factors
Governed models
Publish history
The two risk lifecycles remain explicit
MVP1 engine settings become effective only through the existing risk-owner action after validation and confirmation. Governed model drafts use the separate maker-checker route. This screen does not pretend the two contracts are one.
The stored factor total must equal the engine's accepted invariant before a save.
Risk-owner authorization and RLS are rechecked on every write.
Scores remain reproducible from stored inputs and the configuration version.
Prototype weights, bands and recalculation times are intentionally absent. This surface reads the live engine settings, while per-factory score explanation remains on the factory record where its scoring inputs exist.
SCR-ADM-060 · ENG-04
Not configured
This is the Risk Studio (MVP1 foundation scope).
Weights and bands are live configuration in
engine_settings
— scores must be reproducible from stored inputs + this version (EV-004). Writes require the risk_owner role; RLS rejects everyone else. Every save lands in the immutable audit trail.
Couldn't load risk configuration.
The existing configuration was not verified. Nothing changed; retry or check your risk-owner access.
No risk model stored
No risk configuration exists in your authorized scope. Create it through the governed provisioning process before using this studio.
Factors & weights (must sum to 1.00)
Σ weights = 1.00 ✓
Σ weights = {sum} — must equal 1.00 before saving
Bands
Low ends at
Medium ends at
High
Low
Medium
High
Bands must use whole numbers and cover 0–100 without gaps.
last updated
saved — effective immediately
Saving…
Save configuration (risk_owner only)
I understand this configuration becomes effective immediately for new score calculations.
Saving writes factors and bands to engine_settings after the weights-sum check, effective immediately for new score calculations — there is no draft or approval step on this screen.
Why this factory? — worked calculation trace
A line-by-line score trace isn't shown here — this screen configures the model, not individual factories.
NEEDS_FACTORY_SCORING_INPUTS — per-factory trace
A selected factory and its stored scoring inputs
The per-factor normalized values used at scoring time
Not available yet
Why / prerequisites

## /admin/security-access
file: apps/web/src/app/(app)/admin/security-access/page.tsx
structure:
Shell[current="/admin/security-access" title context]
  context: span.badge.badge-info
    "M3-00 · CD-050 · "
    "purpose-bound evidence access"
  div.sq-banner
    div
      strong "Navigation is not authorization."
      " " + "Database grants and RLS enforce every read and action. This screen exposes only the signed-in actor's readable scope."
  [if error]
    div.sq-banner.sq-banner--warning[role="alert"] "MVP3 database contract is not applied in this environment. No data is inferred."
  div.sq-grid[style marginBlock]
    section.panel[style padding]
      p.t-caption "RLS-visible role holdings"
      strong.kpi-value "{roleCount ?? 0}"
      p "Holdings are not an effective-permission proof."
    section.panel[style padding]
      p.t-caption "Open reviews"
      strong.kpi-value "{(reviews ?? []).filter(open).length}"
      p "{overdue count} " + "overdue"
    section.panel[style padding]
      p.t-caption "Active evidence grants"
      strong.kpi-value "{(grants ?? []).filter(active).length}"
      p "Every grant has purpose and expiry."
  section.panel.stack[style padding]
    h3 "Access certification queue"
    div.sq-tablewrap
      table.sq-table
        thead: tr
          th[scope="col"] "Subject"
          th[scope="col"] "Scope and purpose"
          th[scope="col"] "Status"
          th[scope="col"] "Independent decision"
        tbody
          [for each row in (reviews ?? [])]
            tr
              th[scope="row"] bdi "{row.subject_user_id}"
              td
                strong "{row.scope}"
                div.t-caption "{row.purpose}"
              td
                span.sq-lozenge (`sq-lozenge--warning` if row.status==="open" else `sq-lozenge--success`) "{row.status}"
                div.t-caption "{new Date(row.due_at).toLocaleDateString()}"
              td
                [if row.status==="open"]
                  Mvp3ActionForm[action=decideAccessReview submitLabel="Record decision"] (opaque component — @/components/Mvp3ActionForm not read)
                    input[type="hidden" name="reviewId" value="{row.id}"]
                    label
                      "Decision"
                      select[name="decision" required defaultValue=""]
                        option[value="" disabled] "—"
                        option[value="retain"] "Retain"
                        option[value="revoke"] "Revoke"
                    label
                      "Reason"
                      textarea[name="reason" minLength={8} required]
                [else] "—"
          [if !error && !(reviews ?? []).length]
            tr
              td[colSpan={4}] "No RLS-visible access reviews."
  section.panel.stack[style padding marginBlockStart]
    h3 "Purpose-bound evidence grants"
    [for each row in (grants ?? [])]
      div.row
        span
          strong bdi "{row.grantee_user_id}"
          small.t-caption " · {row.purpose}"
        span.badge "{row.revoked_at ? "revoked" : new Date(row.expires_at).getTime() > now ? "active" : "expired"}"
    [if !(grants ?? []).length]
      p.t-caption "No RLS-visible evidence grants."

undefined-classes: none
text-content:
Security posture and access review
M3-00 · CD-050 · 
purpose-bound evidence access
Navigation is not authorization.
Database grants and RLS enforce every read and action. This screen exposes only the signed-in actor's readable scope.
MVP3 database contract is not applied in this environment. No data is inferred.
RLS-visible role holdings
Holdings are not an effective-permission proof.
Open reviews
overdue
Active evidence grants
Every grant has purpose and expiry.
Access certification queue
Subject
Scope and purpose
Status
Independent decision
Record decision
Decision
—
Retain
Revoke
Reason
No RLS-visible access reviews.
Purpose-bound evidence grants
revoked
active
expired
No RLS-visible evidence grants.

---

## /admin/templates
file: apps/web/src/app/(app)/admin/templates/page.tsx, apps/web/src/app/(app)/admin/packages/TemplateRegistry.tsx
structure:
Shell (current="/admin/templates", title={t("admin.templates.title","Template registry")})
  context: span.badge.badge-info "M09-006/008/009 · ENG-04"
  [if error]
    div.sq-banner.sq-banner--critical (role=alert)
      div
        strong "Couldn't load the template registry."
        {t("admin.templates.error.body", NEUTRAL_LOAD_ERROR)}
        a.sq-link (href="/admin/templates") "Reload to try again"
  [if !error && canWrite]
    TemplateRegistry (templates, strings)
      details.panel.stack
        summary
          strong "{heading}"
          " · M09-006/008/009"
        p.t-caption "{intro}"
        form.sq-grid-2 (action=createAction)
          label.sq-field > span.sq-field__label "Template key" + input.sq-input.numeric (name="template_key")
          label.sq-field > span.sq-field__label "Type" + select.sq-select (name="template_type")
            option "Form" / option "Report" / option "Action form" / option "Penalty"
          label.sq-field > span.sq-field__label "Version" + input.sq-input.numeric (placeholder="v1")
          label.sq-field > span.sq-field__label "Effective from" + input.sq-input (type=date)
          label.sq-field > span.sq-field__label "English title" + input.sq-input
          label.sq-field > span.sq-field__label "Arabic title" + input.sq-input (dir=rtl)
          label.sq-field (style gridColumn 1/-1) > span.sq-field__label "Schema (JSON object)" + textarea.sq-input.numeric (defaultValue='{"fields":[]}')
          button.btn.btn-primary.btn-lg.btn-touch "{creating ? 'Creating…' : 'Create draft template version'}"
          Feedback (state=createState, saved="Saved")
            [if state.error] span.t-caption (style color:critical) "{state.error}"
            [else if state.ok] span.badge.badge-compliant "✓ Saved"
            [else] null
        div.stack
          [for each template in templates]
            TemplateCard (template, strings)
              details.sq-panel
                summary
                  bdi[dir=ltr] "{template.template_key} · {template.version_label}"
                  " — {template.title_en} "
                  span.badge.badge-info "{template.status}"
                [if template.status === "draft"]
                  form.sq-grid-2 (action=editAction)
                    input[hidden] name="template_id"
                    label.sq-field > span.sq-field__label "English title" + input.sq-input
                    label.sq-field > span.sq-field__label "Arabic title" + input.sq-input (dir=rtl)
                    label.sq-field > span.sq-field__label "Schema (JSON object)" + textarea.sq-input.numeric
                    button.btn.btn-primary.btn-touch "{editing ? 'Saving…' : 'Save draft'}"
                    Feedback (state=editState) [same as above]
                  form.row (action=publishAction)
                    input[hidden] name="template_id"
                    button.btn.btn-primary.btn-lg.btn-touch "{publishing ? 'Publishing…' : 'Approve & publish'}"
                    Feedback (state=publishState) [same as above]
                [else if ["published","locked"].includes(template.status)]
                  form.row (action=deactivateAction)
                    input[hidden] name="template_id"
                    label.sq-field > span.sq-field__label "Effective to" + input.sq-input (type=date)
                    label.sq-field > span.sq-field__label "Reason" + input.sq-input
                    button.btn.btn-primary.btn-touch "{deactivating ? 'Deactivating…' : 'Deactivate'}"
                    Feedback (state=deactivateState) [same as above]
                [else]
                  p.t-caption "Immutable historical template version."
  [if !error && !canWrite]
    div.sq-banner (role=note)
      strong "Read-only template access"
      "Creating or changing templates requires compliance_admin or form_admin."
  [if !error && templates.length === 0]
    div.panel.sq-state
      span.sq-state__glyph (aria-hidden) "▦"
      h3 "No templates configured"
      p.t-caption "Templates are versioned bilingual schema objects referenced by packages and action forms."
undefined-classes: none
text-content:
Template registry
M09-006/008/009 · ENG-04
Governed template registry
Create versioned bilingual form, report, action-form, or penalty templates. Published versions are immutable and can be referenced by package action forms and penalty mappings.
Template key
Type
Version
Effective from
English title
Arabic title
Schema (JSON object)
Form
Report
Action form
Penalty
v1
{"fields":[]}
Creating…
Create draft template version
Saved
M09-006/008/009
Saving…
Save draft
Publishing…
Approve & publish
Effective to
Reason
Deactivating…
Deactivate
Immutable historical template version.
Couldn't load the template registry.
Reload to try again
Read-only template access
Creating or changing templates requires compliance_admin or form_admin.
▦
No templates configured
Templates are versioned bilingual schema objects referenced by packages and action forms.

## /admin/violations
file: apps/web/src/app/(app)/admin/violations/page.tsx, apps/web/src/app/(app)/admin/violations/Controls.tsx
structure:
Shell (current="/admin/violations", title={penaltyMode ? "Penalty Mapping" : "Violation Catalogue"})
  context: span.badge.badge-info "{penaltyMode ? 'SCR-ADM-041 · ENG-08' : 'SCR-ADM-040 · ENG-08'}"
  h1.sq-sr-only "{title}"
  div (className={styles.pageRoot})
    modeTabs: div.sq-segmented (role=tablist, aria-label="Catalogue view")
      a.btn.btn-touch.sq-link (className template, role=tab, href="/admin/violations") "Violation catalogue"
      a.btn.btn-touch.sq-link (className template, role=tab, href="/admin/violations?mode=penalty") "Penalty mapping"
    p.t-caption (role=status, aria-live=polite)
      "Read at" + bdi[dir=ltr].numeric "{readAt}" + " · " + "data may have changed since — reopen to refresh (no staleness verdict exists)."
    [if error || clauseError]
      div.sq-banner.sq-banner--critical (role=alert)
        div
          strong "Couldn't load the violation catalogue."
          {NEUTRAL_LOAD_ERROR}
          a.sq-link (href) "Retry"
    [if roleError && !error]
      div.sq-banner.sq-banner--warning (role=alert)
        div > strong "Permissions unavailable" + "Your configuration permissions could not be verified. Writes are disabled; retry the page."
    [else if !canWrite && !error]
      div.panel.sq-permission
        p.t-caption
          span (aria-hidden) "🔒"
          "Read-only view — configuration writes require the compliance-admin or form-admin role (RLS). Route visibility does not grant write authority."
    [if canWrite && !roleError]
      div.sq-banner.sq-banner--warning (role=note)
        div
          strong "Configuration Request required."
          "Violation and penalty creation, modification, publication, activation and deactivation are read-only here until the typed CCR validation and atomic dependency cascade are deployed. Use the Compliance Configuration Request workspace; this catalogue will not bypass it."
          a.sq-link (href="/admin/compliance-requests") "Open Compliance Configuration Requests"
    [if penaltyMode]
      section.panel.stack (aria-labelledby="pen-lens-h")
        h2#pen-lens-h "Mapping Validation Lens"
        p.t-caption "Creating a mapping validates legal basis, lifecycle, type, optional amount, timing, repeat policy, and an optional immutable template reference. No value is inferred or invented."
        ul.stack
          [for each of 4 checks c1..c4]
            li.t-caption
              span (aria-hidden) "✓"
              "Proven rule" + " — " + "{check text}"
              (instances: "The violation is not already mapped (one mapping per violation)."; "A second mapping is rejected by the database unique constraint."; "Legal basis is present before create (never invented)."; "Range and repeat presets are governed tokens, not amounts.")
      [if !error && codes.length === 0]
        EmptyState (glyph="⚖️", title="No violation codes to map", body="Create a violation code in the catalogue first; a penalty maps one-to-one onto it.")
      [for each v in codes]
        div.panel (key=v.id)
          div.stack (col1)
            span.sq-overline "Violation"
            strong > span.numeric "{v.code}" + " — {v.title}"
            div.row
              severityChip(v.level): span.{cls: "sq-lozenge sq-lozenge--critical|warning|info"} > span(aria-hidden){glyph ⛔|▲|◆} + "severity" + span.numeric "{level}"
              lifecycleChip(lc): span.{cls: "sq-lozenge sq-lozenge--success|info|warning"} > span(aria-hidden){glyph ✓|◷|⏻} + "{active|not yet active|deactivated}"
          div.stack (col2)
            span.sq-overline "Validation lens"
            [if activeMapping] span.badge.badge-compliant (role=status) > span(aria-hidden)"✓" + "one active mapping; one-to-one satisfied"
            [else if draft] span.badge.badge-warning (role=status) > span(aria-hidden)"◷" + "draft awaiting a distinct approver"
            [else] span.badge.badge-warning (role=status) > span(aria-hidden)"○" + "no mapping yet — one is required"
          div.stack (col3)
            span.sq-overline "Penalty mapping record"
            [if pm]
              div.stack
                span "Penalty" + strong.numeric "{pm.penalty_ref}"
                span.t-caption "Legal basis" + ": " + bdi[dir=ltr] "{pm.legal_basis}"
                span.t-caption "Range preset" + ": " + span.numeric "{schedule|None}" + " · " + "Repeat-rule preset" + ": " + span.numeric "{repeat_12mo|None}"
                span.t-caption > span.sq-version "{mapping_version}" + "{status} · {effective_from|—}{→ effective_to?}"
                span.t-caption "{penaltyType label}: {penalty_type}" + [if amount!=null]" · {amount label}: "+bdi.numeric + [if grace!=null]" · {gracePeriod label}: " + [if due!=null]" · {duePeriod label}: "
                [if draft && canConfigure] PublishMappingForm (mappingId, violationCode, strings) [see Controls tree]
                auditSummary(mappingAudit, "Mapping audit events") [see auditSummary tree]
            [else if canConfigure]
              AddMappingForm (violationId, violationCode, templates, strings) [see Controls tree]
            [else]
              span.t-caption "Unmapped — a compliance/form admin can add the mapping."
            [if canConfigure && !draft && pm] AddMappingForm (duplicate condition) [see Controls tree]
      p.t-caption "One violation = one penalty (M09-004) — the database rejects a second mapping. Presets are governed tokens, never monetary or legal values. The contract route /admin/penalties is not a live URL; this is its logical mode."
    [else]
      [if canConfigure && clauseError]
        div.sq-banner.sq-banner--warning (role=alert) > div > strong "Regulation clauses are unavailable" + "Violation creation is disabled because its required legal-anchor source could not be read. Retry before authoring."
      [else if canConfigure && clauseOptions.length > 0]
        NewViolationForm (clauses=clauseOptions, strings) [see Controls tree]
      [else if canConfigure]
        div.sq-banner (role=status) > div "No regulation clauses exist. Create and publish the legal source before creating a violation code."
      [else] null
      [if !error && codes.length === 0]
        EmptyState (glyph="⚖️", title="No violation codes configured", body="Violations generate automatically from configured responses (M09-003). Add the first catalogue code above.")
      [for each v in codes]
        div.panel (key=v.id, flexDirection column)
          div.row
            h2 > span.numeric "{v.code}" + " — {v.title}"
            div.row
              severityChip(v.level) [as above]
              lifecycleChip(lc) [as above]
              [if pm] span.badge.badge-compliant > span(aria-hidden)"✓" + "penalty mapped"
              [else] span.badge.badge-warning > span(aria-hidden)"○" + "unmapped"
          p.t-caption.sq-trace
            span.sq-overline "Legal trace" + ":"
            [if rc] bdi[dir=ltr] "{regcode} §{clause_ref}"
            [else] "No clause anchor"
          div.row
            span.badge.badge-info "v{configuration_version}"
            [if v.category] span.badge.badge-info "{v.category}"
            [if v.applicability] span.t-caption "{v.applicability}"
          p.t-caption > strong "Corrective action:" + " {corrective_action|—}" + [if grace_period_days!==null]" · Grace period: {days} days"
          [inline IIFE]
            details.t-caption
              summary "Trigger trace" + " · {traces.length} " + "item(s)"
              [if traces.length]
                ul
                  [for each item in traces (filtered itemTraces)]
                    li (key=item.code) > bdi[dir=ltr] "{item.code}" + " — {item.title}"
              [else]
                p "No item response mapping currently references this code."
          details.t-caption
            summary "Version history"
            ol
              [for each version in codes.filter(candidate => candidate.code === v.code).sort(...)]
                li (key=version.id) "v{configuration_version} · {status} · {active_from|—}" + [if deactivation_reason]" · {reason}"
          p.t-caption
            "Lifecycle derived from active-from" + " " + bdi[dir=ltr].numeric "{active_from|—}"
            [if v.active_to] " / " + "active-to" + " " + bdi[dir=ltr].numeric "{active_to}"
            " " + "as of today" + " " + bdi[dir=ltr].numeric "{today}" + "."
          div.row (aria-label="Usage and audit")
            [if evidence?.usage]
              span.t-caption[data-usage-state=available] > span(aria-hidden)"↗" + "Item references" + ": " + strong "{item_count}" + " · " + "Runtime references" + ": " + strong "{runtime_count}"
            [else if canWrite]
              span.t-caption[data-usage-state=unavailable] > span(aria-hidden)"⚠" + "Usage unavailable — no zero-count claim was made."
            [else]
              span.t-caption[data-usage-state=restricted] > span(aria-hidden)"🔒" + "Usage counts are available to configuration writers."
            auditSummary(codeAudit, "Violation audit events") [see below]
          [if canConfigure && !v.active_to] DeactivateViolationForm (violationId, violationCode, strings) [see Controls tree]
          [if canConfigure && v.status === "draft"] PublishViolationForm (violationId, violationCode, strings) [see Controls tree]
      p.t-caption "Violations generate automatically from configured responses; the inspector can never type or override one (M09-003/026). Legal basis belongs to the penalty mapping, not the code row. Config violation_codes is distinct from runtime violations, and its row changes are audit-tracked (trg_audit_violation_codes)."

auditSummary(events, label) function tree:
  [if events === undefined] span.t-caption > span(aria-hidden)"🔒" + "Audit history is available to configuration writers."
  [else if events === null] span.t-caption > span(aria-hidden)"⚠" + "Audit history unavailable — no zero-event claim was made."
  [else if events.length === 0] span.t-caption > span(aria-hidden)"○" + "No audit events returned for this object."
  [else]
    details.t-caption
      summary > span(aria-hidden)"✓" + "{label}" + ": " + strong "{events.length}"
      ol.stack
        [for each event in events]
          li (key=event.id)
            span.numeric "{event.action}" + " · "
            bdi[dir=ltr].numeric "{timestamp}"
            [if event.actor] " · " + "actor" + " " + bdi[dir=ltr].numeric "{event.actor}"

Controls.tsx component trees:
NewViolationForm
  form.panel (className template, aria-label="Create violation code")
    div.sq-field > label.sq-field__label "Code" + input.sq-input.numeric (placeholder="V-FS-12")
    div.sq-field > label.sq-field__label "Title" + input.sq-input (placeholder="Violation title")
    div.sq-field > label.sq-field__label "Level" + select.sq-select
      option (disabled) "Level…"
      option "L1" / option "L2" / option "L3"
    div.sq-field > label.sq-field__label "Clause" + select.sq-select
      option (disabled) "Select clause…"
      [for each c in clauses] option (key=c.id) "{c.label}"
    div.sq-field > label.sq-field__label "Active from" + input.sq-input.numeric (type=date)
    div.sq-field > label.sq-field__label "Corrective action" + input.sq-input
    div.sq-field > label.sq-field__label "Grace period (days)" + input.sq-input (type=number)
    div.sq-field > label.sq-field__label "Category" + input.sq-input
    div.sq-field > label.sq-field__label "Applicability" + input.sq-input
    div.sq-field > label.sq-field__label "Configuration version" + input.sq-input (type=number, defaultValue="1")
    button.btn.btn-primary.btn-lg.btn-touch "{pending ? 'Creating…' : 'Create violation code'}"
    [if state.error] span.sq-validation (role=alert) "{errors[state.error]}"
    [if state.ok] span.badge.badge-compliant (role=status) > span(aria-hidden)"✓" + "created"

AddMappingForm
  form.stack (aria-label="Map penalty to {violationCode}")
    input[hidden] name="violation_code_id"
    div.panel.stack (role=status, aria-live=polite, aria-label="Mapping Validation Lens")
      strong "Mapping Validation Lens"
      ul
        [for each of 4 checks]
          li > span(aria-hidden){✓|✕} + "{Pass|Needs attention}" + " — " + "{label}"
          (checks: checkUnmapped "The violation is not already mapped (one mapping per violation)." always true;
           checkUnique "A second mapping is rejected by the database unique constraint." always true;
           checkLegalBasis "Legal basis is present before create (never invented)." [cond legalBasis.trim()];
           checkPresets "Range and repeat presets are governed tokens, not amounts." [cond rangePreset && repeatPreset])
    div.row (className template)
      div.sq-field > label.sq-field__label "Penalty ref" + input.sq-input.numeric (placeholder="P-042")
      div.sq-field > label.sq-field__label "Legal basis" + input.sq-input (placeholder="SBC-801 §5.1 / M-43")
      div.sq-field > label.sq-field__label "Mapping version" + input.sq-input.numeric (placeholder="v3")
      div.sq-field > label.sq-field__label "Active from" + input.sq-input.numeric (type=date)
      div.sq-field > label.sq-field__label "Range preset" + select.sq-select
        option "Approved schedule" / option "None"
      div.sq-field > label.sq-field__label "Repeat-rule preset" + select.sq-select
        option "Repeat in 12mo → escalate one level" / option "None"
      div.sq-field > label.sq-field__label "Penalty type" + input.sq-input
      div.sq-field > label.sq-field__label "Amount (when applicable)" + input.sq-input (type=number)
      div.sq-field > label.sq-field__label "Grace period (days)" + input.sq-input (type=number)
      div.sq-field > label.sq-field__label "Due period (days)" + input.sq-input (type=number)
      div.sq-field > label.sq-field__label "Governed template" + select.sq-select
        option "None"
        [for each template in templates] option (key=template.id) "{template.label}"
      button.btn.btn-primary.btn-touch "{pending ? 'Mapping…' : `Map penalty to ${violationCode}`}"
      [if state.error] span.sq-validation (role=alert) "{errors[state.error]}"
      [if state.ok] span.badge.badge-compliant (role=status) > span(aria-hidden)"✓" + "mapped"

PublishViolationForm
  form.row
    input[hidden] name="violation_code_id"
    button.btn.btn-primary.btn-lg.btn-touch (aria-label="Approve & publish code {violationCode}") "{pending ? 'Publishing…' : 'Approve & publish code'}"
    [if state.error] span.sq-validation (role=alert) "{errors[state.error]}"
    [if state.ok] span.badge.badge-compliant (role=status) "✓ Violation code published"

PublishMappingForm
  form.row
    input[hidden] name="mapping_id"
    button.btn.btn-primary.btn-lg.btn-touch (aria-label="Approve and publish mapping {violationCode}") "{pending ? 'Publishing mapping…' : 'Approve and publish mapping'}"
    [if state.error] span.sq-validation (role=alert) "{errors[state.error]}"
    [if state.ok] span.badge.badge-compliant (role=status) "✓ mapping published"

DeactivateViolationForm
  form.row (className template, aria-label="Deactivate {violationCode}")
    input[hidden] name="violation_code_id"
    div.sq-field > label.sq-field__label "Active to" + input.sq-input.numeric (type=date)
    div.sq-field > label.sq-field__label "Deactivation reason" + input.sq-input
    button.btn.btn-ghost.btn-touch (aria-label="Deactivate {violationCode}") > span(aria-hidden)"⏻" + "{pending ? 'Deactivating…' : 'Deactivate'}"
    [if state.error] span.sq-validation (role=alert) "{errors[state.error]}"
    [if state.ok] span.badge.badge-compliant (role=status) > span(aria-hidden)"✓" + "deactivated"
undefined-classes: pageRoot, responsiveForm, responsiveRow (all CSS-module scoped classnames — not global class-string literals; excluded from the design-system-gap check)
text-content:
Code
Title
Violation title
Level
Level…
Clause
Select clause…
Active from
Corrective action
Grace period (days)
Category
Applicability
Configuration version
Creating…
Create violation code
created
Penalty ref
Legal basis
SBC-801 §5.1 / M-43
Mapping version
Range preset
Approved schedule
None
Repeat-rule preset
Repeat in 12mo → escalate one level
None
Mapping…
Map penalty to
mapped
Approve and publish mapping
Publishing mapping…
mapping published
Active to
Deactivating…
Deactivate
deactivated
Mapping Validation Lens
The violation is not already mapped (one mapping per violation).
A second mapping is rejected by the database unique constraint.
Legal basis is present before create (never invented).
Range and repeat presets are governed tokens, not amounts.
Pass
Needs attention
Deactivation reason
Penalty type
Amount (when applicable)
Due period (days)
Governed template
None
Approve & publish code
Publishing…
Violation code published
Violation and penalty configuration must use a governed Compliance Configuration Request. Direct writes remain disabled until typed validation and guarded transitions are deployed.
severity
active
not yet active
deactivated
Audit history is available to configuration writers.
Audit history unavailable — no zero-event claim was made.
No audit events returned for this object.
actor
Catalogue view
Violation catalogue
Penalty mapping
Penalty Mapping
Violation Catalogue
SCR-ADM-041 · ENG-08
SCR-ADM-040 · ENG-08
Read at
data may have changed since — reopen to refresh (no staleness verdict exists).
Couldn't load the violation catalogue.
Retry
Permissions unavailable
Your configuration permissions could not be verified. Writes are disabled; retry the page.
Read-only view — configuration writes require the compliance-admin or form-admin role (RLS). Route visibility does not grant write authority.
Configuration Request required.
Violation and penalty creation, modification, publication, activation and deactivation are read-only here until the typed CCR validation and atomic dependency cascade are deployed. Use the Compliance Configuration Request workspace; this catalogue will not bypass it.
Open Compliance Configuration Requests
Mapping Validation Lens
Creating a mapping validates legal basis, lifecycle, type, optional amount, timing, repeat policy, and an optional immutable template reference. No value is inferred or invented.
Proven rule
No violation codes to map
Create a violation code in the catalogue first; a penalty maps one-to-one onto it.
Violation
Validation lens
one active mapping; one-to-one satisfied
draft awaiting a distinct approver
no mapping yet — one is required
Penalty mapping record
Penalty
Unmapped — a compliance/form admin can add the mapping.
One violation = one penalty (M09-004) — the database rejects a second mapping. Presets are governed tokens, never monetary or legal values. The contract route /admin/penalties is not a live URL; this is its logical mode.
Regulation clauses are unavailable
Violation creation is disabled because its required legal-anchor source could not be read. Retry before authoring.
No regulation clauses exist. Create and publish the legal source before creating a violation code.
No violation codes configured
Violations generate automatically from configured responses (M09-003). Add the first catalogue code above.
penalty mapped
unmapped
Legal trace
No clause anchor
Corrective action:
Grace period
days
Trigger trace
item(s)
No item response mapping currently references this code.
Version history
Lifecycle derived from active-from
active-to
as of today
Usage and audit
Item references
Runtime references
Usage unavailable — no zero-count claim was made.
Usage counts are available to configuration writers.
Violation audit events
Mapping audit events
Violations generate automatically from configured responses; the inspector can never type or override one (M09-003/026). Legal basis belongs to the penalty mapping, not the code row. Config violation_codes is distinct from runtime violations, and its row changes are audit-tracked (trg_audit_violation_codes).
V-FS-12
P-042
v3

## /admin/workflows
file: apps/web/src/app/(app)/admin/workflows/page.tsx, apps/web/src/app/(app)/admin/workflows/Controls.tsx, apps/web/src/app/(app)/admin/workflows/WfDeck.tsx
NOTE: leased to kimi (LEASE-SAQEEL-ADMIN-BUILDERS-001) — audited read-only, not modified.
structure:
Shell (current="/admin/workflows", title="Workflow builder")
  context: span.badge.badge-info "SCR-ADM-050/051 · ENG-03"
  div.breadcrumb
    span "Workflow Settings"
    span.sep "/"
    span "Governed lifecycles"
  p.t-caption "States → transitions → guards & SLA · workflow_admin only · versioned"
  div.sq-banner > div
    strong "Governed change only."
    "Runtime evaluates transitions against the published version — no status bypass (RBAC-003). Changes flow draft → distinct-approver publish (RBAC-002 maker-checker, enforced by a DB constraint on"
    code "config_versions"
    "); published versions are immutable. Risk/SLA values live in"
    code "engine_settings"
    "and are not editable here."
  [if error]
    div.sq-banner.sq-banner--critical > div > strong "Couldn't load workflow configuration. Nothing was changed. Try again."
  [if !error && wfs.length === 0]
    EmptyState (glyph="🔀", title="No workflow configuration published", body="Workflow state machines are versioned config (ENG-03).")
  [for each w in wfs]
    div.panel (key=w.id, flexDirection column)
      div.row (justifyContent space-between)
        h3 "Object:" + " {p.object|—} " + span.sq-version "{w.version_label}"
        div.row
          span.sq-lozenge (className template) "{t(`enum.${w.status}`, status.replace(/_/g,' '))}"
          [if w.status==="draft" && !isOwnDraft]
            ApprovePublish (versionId=w.id, strings)
              form.row
                input[hidden] name="version_id"
                button.btn.btn-primary.btn-lg.btn-touch "{pending ? 'Publishing…' : 'Approve & publish'}"
                [if state.error] span.t-caption (style color:critical, role=alert) "{state.error}"
          [if isOwnDraft]
            span.badge.badge-warning (title="You proposed this draft (the maker). A different checker must approve it — separation of duties is enforced by a DB constraint.")
              "⛔" + " " + "You proposed this — a distinct checker must approve"
      p.t-caption
        "Proposed by" + " " + strong "{nameOf(created_by)|—}"
        [if w.created_at] " · " + span.numeric "{timestamp}"
        " → "
        [if w.approved_by] "approved by" + " " + strong "{nameOf(approved_by)}" + " " + span.badge.badge-compliant "distinct approver"
        [else] "awaiting a distinct approver (maker-checker, DB-enforced)"
      WfDeck (payload=w.payload, strings=deckStrings)
        div (className={styles.grid})
          div.stack
            section.panel (aria-label="Lifecycle")
              h3 "Lifecycle"
              div (className={styles.canvas})
                div (className={styles.lane})
                  [for each s,idx in lane]
                    div (key=s.key, style display:contents)
                      button (className={[styles.state, selectedState===s.key?styles.stateSelected:"", s.terminal?styles.stateTerminal:""].filter(Boolean).join(" ")}, aria-pressed)
                        div (className={styles.stateKey}) "{s.key}"
                        div.t-caption "{s.initial ? 'initial' : s.terminal ? 'terminal' : ' '}"
                      [if idx < lane.length - 1]
                        span (className={styles.arrow}, aria-hidden)
                          Chevron: svg (viewBox, fill=none, stroke=currentColor) > path
                [if branches.length > 0]
                  div (className={styles.branches}, aria-label="Branch transitions")
                    [for each {t,i} in branches]
                      button.badge (key, className template `badge ${terminal?"badge-critical":"badge-warning"}`) "{t.from} → {t.to}" + [if t.trigger]" ({t.trigger})"
            section.panel (aria-label="Transition inspector")
              div.row
                h3 "{inspected ? `Transition — ${from} → ${to}` : 'Transition inspector'}"
                span.grow
                [if inspected && selectedIdx != null] span.id-code.t-caption "TRN-{padded index}"
              [if inspected]
                div.stack
                  div (grid 1fr 1fr)
                    label (className={styles.fld}) > span "Allowed role" + select.select (disabled) > option "{actor|Not configured}"
                    label (className={styles.fld}) > span "Trigger" + select.select (disabled) > option "{trigger|Not configured}"
                  div
                    div.t-label "Guards"
                    div.stack
                      [if guards.length === 0] p.t-caption "—"
                      [else for each g in guards] label.check (key=g) > input[checkbox checked readOnly disabled] + "{g}"
                  div
                    div.t-label "Side effects"
                    div.row
                      [if fx.length === 0] span.t-caption "—"
                      [else for each f,k in fx] span.badge (key=k, className template `badge ${idempotencyKey?"badge-compliant":"badge-warning"}`) "{f.kind} · {idempotencyKey ? 'idempotent' : 'no idempotency key'}"
                  p.t-caption "Read-only view of the governed payload. Change it by proposing a draft and editing the state-machine payload below — publishing needs a distinct approver."
              [else]
                p.t-caption "Select a transition from the table below to inspect its role, trigger, guards and side effects."
              div.table-wrap
                table.table
                  thead > tr
                    th "Lifecycle"
                    th "Actor"
                    th "Guards"
                    th "Side effects"
                  tbody
                    [for each {t,i} in shown]
                      tr (key=i, className={selectedIdx===i?"is-selected":undefined}, aria-selected)
                        td "{t.from} → {t.to} " + span.t-caption "({t.trigger})"
                        td [if t.actor] "{t.actor}" [else] span.badge.badge-critical "✕ Actor"
                        td.t-caption "{guards.join(', ')|—}"
                        td.t-caption
                          [if fx.length === 0] "—"
                          [else for each f,k in fx] span.badge (key=k, className template `badge ${idempotencyKey?"badge-compliant":"badge-warning"}`) "{idempotencyKey ? `✓ ${kind} idempotent` : `⚠ ${kind} no idempotency key`}"
              p.t-caption "Select a state to filter its outgoing transitions; select a transition row to inspect it."
          aside.stack (className template)
            div.panel
              div.t-label "States"
              div.stack
                [for each s in def.states]
                  div.row (key=s.key)
                    span.badge (className template `badge ${stateBadge(initial,terminal)}`) "{s.key}"
                    span.grow
                    [if s.initial] span.t-caption "initial"
                    [if s.terminal] span.t-caption "terminal"
            div.panel (className template)
              div.row
                div.t-label "Validation (VAL-01..06)"
                span.grow
                span.badge (className template `badge ${validation.ok?"badge-compliant":"badge-critical"}`) "{validation.ok ? 'valid' : 'resolve before publishing'}"
              div.stack
                [for each c in validation.checks]
                  div.row (key=c.id)
                    span.exc (className template `exc ${c.ok?"exc-compliant":"exc-critical"}`) > span.exc-mark
                    span "{id-code c.id} {c.why}"
      [if w.status === "draft"]
        DraftPayloadEditor (versionId=w.id, payload=w.payload, strings)
          form
            input[hidden] name="version_id"
            div.sq-field > label.sq-field__label "State machine payload (object · states[] · transitions[])" + textarea.sq-input.numeric (rows=14, spellCheck=false)
            [if state.error] div.sq-banner.sq-banner--critical (role=alert) > div "{state.error}"
            div.row
              button.btn.btn-primary.btn-touch "{pending ? 'Saving…' : 'Save draft'}"
              [if state.ok] span.badge.badge-compliant "saved"
        NotYetBoundary (title="Simulation fixtures & persisted replay", consequence="The graph and validation ledger above are live; a persisted simulation/replay run (fixtures + audit) is not built yet, so no run history is shown.", seam="NEEDS_APPROVED_CONTRACT — simulation fixtures / replay persistence (GAP-02)", prerequisites=["A fixture store (sim_fixtures) and seed context","Persisted simulation runs (sim_runs) with audit"], notAvailableLabel="Not available yet", detailLabel="Why / prerequisites")
      [if w.status === "published"]
        ProposeDraftForm (baseVersionId=w.id, baseLabel=w.version_label, strings)
          form.row
            input[hidden] name="base_version_id"
            div.sq-field > label.sq-field__label "New version label" + input.sq-input.numeric (placeholder="{baseLabel}-next")
            button.btn.btn-primary.btn-touch "{pending ? 'Proposing…' : 'Propose draft from this version'}"
            [if state.error] span.t-caption (style color:critical, role=alert) "{state.error}"
            [if state.ok] span.badge.badge-compliant "draft created"
  section.panel (aria-label="SLA model")
    h3 "SLA model"
    [if calError]
      p.t-caption "Couldn't load the SLA calendars. Nothing was changed."
    [else if calendars.length === 0]
      p.t-caption "No SLA calendar is configured. Deadlines, working days and escalation are governed inputs (DEC-003) — until one is authorised, timers stay pending and no deadline is shown."
    [else]
      div.table-wrap
        table.table
          thead > tr
            th "Calendar"
            th "Working days"
            th "Working hours"
            th "Timezone"
            th "Activation"
          tbody
            [for each c in calendars]
              tr (key=c.id)
                td "{c.name} " + span.t-caption "{c.version_label}"
                td "{working_days.join(', ')|Not configured}"
                td "{working_start–working_end|Not configured}"
                td "{c.timezone|Not configured}"
                td > span.badge (className template `badge ${activation_authorized?"badge-compliant":"badge-warning"}`) "{activation_authorized ? 'Authorised' : 'Not authorised (DEC-003)'}"
    p.t-caption "Deadlines are computed only from an authorised working calendar. There is no scheduler: a breach is never executed silently, and no default duration is assumed."
undefined-classes: t-label, grid, canvas, lane, state, stateSelected, stateTerminal, stateKey, arrow, branches, fld, validation (all `styles.*` CSS-module scoped classnames except t-label which is a plain global classname NOT defined in either stylesheet — flagged as a real gap)
text-content:
Not configured
New version label
Proposing…
Propose draft from this version
draft created
State machine payload (object · states[] · transitions[])
Saving…
Save draft
saved
Publishing…
Approve & publish
Validation (VAL-01..06)
Lifecycle
Transition inspector
valid
resolve before publishing
initial
terminal
Actor
Guards
Side effects
idempotent
no idempotency key
Select a state to filter its outgoing transitions; select a transition row to inspect it.
—
States
Branch transitions
Transition
Allowed role
Requires
Trigger
Read-only view of the governed payload. Change it by proposing a draft and editing the state-machine payload below — publishing needs a distinct approver.
Select a transition from the table below to inspect its role, trigger, guards and side effects.
Workflow builder
SCR-ADM-050/051 · ENG-03
Workflow Settings
/
Governed lifecycles
States → transitions → guards & SLA · workflow_admin only · versioned
Governed change only.
Runtime evaluates transitions against the published version — no status bypass (RBAC-003). Changes flow draft → distinct-approver publish (RBAC-002 maker-checker, enforced by a DB constraint on
config_versions
); published versions are immutable. Risk/SLA values live in
engine_settings
and are not editable here.
Couldn't load workflow configuration. Nothing was changed. Try again.
No workflow configuration published
Workflow state machines are versioned config (ENG-03).
Object:
You proposed this draft (the maker). A different checker must approve it — separation of duties is enforced by a DB constraint.
⛔
You proposed this — a distinct checker must approve
Proposed by
approved by
distinct approver
awaiting a distinct approver (maker-checker, DB-enforced)
Simulation fixtures & persisted replay
The graph and validation ledger above are live; a persisted simulation/replay run (fixtures + audit) is not built yet, so no run history is shown.
NEEDS_APPROVED_CONTRACT — simulation fixtures / replay persistence (GAP-02)
A fixture store (sim_fixtures) and seed context
Persisted simulation runs (sim_runs) with audit
Not available yet
Why / prerequisites
SLA model
Couldn't load the SLA calendars. Nothing was changed.
No SLA calendar is configured. Deadlines, working days and escalation are governed inputs (DEC-003) — until one is authorised, timers stay pending and no deadline is shown.
Calendar
Working days
Working hours
Timezone
Activation
Authorised
Not authorised (DEC-003)
Deadlines are computed only from an authorised working calendar. There is no scheduler: a breach is never executed silently, and no default duration is assumed.
