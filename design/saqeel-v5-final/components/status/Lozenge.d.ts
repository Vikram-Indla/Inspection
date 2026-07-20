/** Status lozenge — five separate state domains, glyph + label, never color alone (MVP1-FND-002/011).
 * @startingPoint section="Primitives" subtitle="Five-domain status system" viewport="700x150" */
export interface LozengeProps {
  /** State domain glyph: plan ▣, ops ●, review ◆, virtual ▲, sync ⟳ */
  domain?: "plan" | "ops" | "review" | "virtual" | "sync";
  tone?: "success" | "warning" | "critical" | "info";
  /** Pulsing glyph for live states */
  live?: boolean;
  children?: React.ReactNode;
  className?: string;
}
export declare function Lozenge(props: LozengeProps): JSX.Element;
