/** @startingPoint section="Signature" subtitle="Evidence with capture provenance and verification" viewport="700x300" */
export interface EvidenceStackProps {
  items?: Array<{
    kind?: "photo" | "video" | "document" | "signature" | "comment";
    src?: string; caption?: string;
    time?: string; inspector?: string;
    /** LTR-embedded coordinate string */
    coords?: string;
    finding?: string; violation?: string;
    verification?: "verified" | "unverified" | "rejected";
    /** audit provenance line (device, hash, chain) */
    provenance?: string;
  }>;
  variant?: "list" | "grid" | "compact" | "detailed";
  onOpen?: (item: any) => void;
}
