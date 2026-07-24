"use client";
// M10 / canonical §19 — one provider/widget failure must not blank unrelated
// planning content. A client widget that throws during render is contained to
// its own honest fallback; the rest of the page keeps working.
import { Component, type ReactNode } from "react";

type Props = { label: string; children: ReactNode };
type State = { failed: boolean };

export default class WidgetBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error("[widget-boundary] contained widget failure:", error);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="sq-banner sq-banner--warning" role="status">
          <div>{this.props.label}</div>
        </div>
      );
    }
    return this.props.children;
  }
}
