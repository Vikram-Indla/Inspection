import Shell from "@/components/Shell";
import UnresolvedDestination from "@/components/UnresolvedDestination";

export const dynamic = "force-dynamic";

export default function Reviews() {
  return (
    <Shell current="/reviews" title="">
      <UnresolvedDestination
        bannerTitle="Unresolved shell — no review workflow is invented on this screen"
        bannerBody="The supplied source exposes Review & Approval as a placeholder. A legal decision workflow will not be authored from a designer's assumption."
        title="Review & Approval — information architecture pending confirmation"
        intro="This destination decides submitted inspection reports. It is a different concept from the Approval Queue, which decides compliance configuration requests. The two are never merged."
        evidence={[
          { text: "The /reviews route and governed per-report review implementation exist in the repository." },
          { text: "The accepted queue, workspace, and immutable version-comparison contracts remain preserved behind their governed routes." },
          { text: "The supplied revamp source intentionally marks this top-level destination unresolved." },
        ]}
        gaps={[
          { text: "The source does not define a final top-level queue composition." },
          { text: "The source does not define the final decision controls for this shell." },
          { text: "The source does not confirm the downstream publication summary." },
        ]}
        questions={[
          { text: "Which accepted review queue composition should become the golden top-level frame?" },
          { text: "Which canonical role label should be presented as the reviewer in the new shell?" },
          { text: "Which downstream effects belong in the top-level summary without duplicating Enforcement?" },
        ]}
        guard="No speculative decision buttons, SLA values, comment rules, or publication effects are shown. Existing governed detail routes and backend guards remain intact."
      />
    </Shell>
  );
}
