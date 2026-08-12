import { type ReactNode } from "react";

export default function FactoryContext({ outlook, trust }: {
  outlook: ReactNode;
  trust: ReactNode;
}) {
  return (
    <>
      {outlook}
      {trust}
    </>
  );
}
