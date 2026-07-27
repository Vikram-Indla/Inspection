"use client";

import Factory360ErrorState from "./Factory360ErrorState";

export default function FactoryRegistryError({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <Factory360ErrorState reset={reset} />;
}
