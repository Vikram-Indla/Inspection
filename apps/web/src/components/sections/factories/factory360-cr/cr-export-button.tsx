"use client";
import Button from "@/components/saqeel/button/button";

export default function CrExportButton({ label }: { label: string }) {
  return <Button variant="secondary" icon="export" onClick={() => window.print()} label={label}>{label}</Button>;
}
