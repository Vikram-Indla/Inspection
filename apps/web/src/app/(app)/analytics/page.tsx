import Shell from "@/components/Shell";
import UnresolvedDestination from "@/components/UnresolvedDestination";

// Saqeel Revamp.dc.html · Analytics is deliberately an unresolved destination.
// The canonical IA requires a real route and an honest evidence-gap surface;
// it does not authorize invented metrics or a duplicate strategic dashboard.
export default function AnalyticsPage() {
  return (
    <Shell current="/analytics" title="">
      <UnresolvedDestination
        bannerTitle="Unresolved shell — REPOSITORY EVIDENCE NOT FOUND"
        bannerBody="The source HTML provides a navigation label and description only. No dedicated analytics route was located in the repository."
        title="Analytics — scope not yet established"
        intro="The navigation item is required and therefore present and reachable. The page itself is not fabricated: charting primitives exist in the repository, but no analytics service contract or screen was found."
        evidence={[
          { text: "components/charts exists and is used by dashboard widgets" },
          { text: "Dashboard analytics currently live inside the /dashboard route" },
          { text: "No /analytics route, page or service contract located" },
        ]}
        gaps={[
          { text: "Whether Analytics is a distinct destination or the strategic dashboard under another name" },
          { text: "The question set it must answer, and for whom" },
          { text: "Data source: live operational tables, a warehouse, or a materialised view" },
          { text: "Export, scheduling and subscription expectations" },
          { text: "Whether saved analyses are shared artefacts with governance" },
        ]}
        questions={[
          { text: "Does Analytics differ from the strategic dashboard, and how?" },
          { text: "Is there an existing report catalogue this must reproduce?" },
          { text: "Who owns definitions when a metric appears in both places?" },
        ]}
        guard="Fabricating an analytics module would create a false expectation of delivery. The destination is reachable, honest about its status, and carries the questions needed to resolve it."
      />
    </Shell>
  );
}
