/** Dashboard widget frame with per-widget fault isolation (MVP1-FND-012). */
export interface WidgetFrameProps {
  title: React.ReactNode;
  chrome?: React.ReactNode;
  failed?: boolean;
  fallback?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}
export declare function WidgetFrame(props: WidgetFrameProps): JSX.Element;
