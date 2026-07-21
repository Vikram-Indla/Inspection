/** Signature block — name+role, signed state, timestamp; the only keep-together atomic block in print. Acknowledgement-only pattern (DEC-009). */
export interface SignatureProps {
  name: React.ReactNode;
  role: React.ReactNode;
  signed?: boolean;
  timestamp?: React.ReactNode;
  preview?: React.ReactNode;
  className?: string;
}
export declare function Signature(props: SignatureProps): JSX.Element;
