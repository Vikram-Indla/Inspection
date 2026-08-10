"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import RouteError from "@/components/saqeel/route-error/route-error";

export type ErrorBoundaryStrings = {
  title: string;
  body: string;
  retryLabel: string;
  referenceLabel: string;
};

type BoundaryProps = {
  children: ReactNode;
  strings: ErrorBoundaryStrings;
};

type BoundaryState = { failure: string | null };

/**
 * Renders a failure state instead of an empty subtree when a client island
 * throws.
 *
 * A route-level `error.tsx` only catches what escapes the segment; an island
 * that throws inside an interaction can still leave the user looking at
 * nothing. This keeps the failure visible and names it, which is the difference
 * between a bug report and a blank screen.
 */
export default class ErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failure: null };

  static getDerivedStateFromError(error: unknown): BoundaryState {
    return { failure: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[saqeel error-boundary]", error.message, info.componentStack);
  }

  render(): ReactNode {
    const { failure } = this.state;
    if (failure === null) return this.props.children;
    return (
      <RouteError
        title={this.props.strings.title}
        body={this.props.strings.body}
        retryLabel={this.props.strings.retryLabel}
        referenceLabel={this.props.strings.referenceLabel}
        reference={failure}
        onRetry={() => this.setState({ failure: null })}
      />
    );
  }
}
