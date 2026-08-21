"use client";
import { useState } from "react";
import DataTable, { type DataColumn } from "@/components/saqeel/data-table/data-table";
import SaqeelSelect, { type SelectOption } from "@/components/saqeel/select/select";
import { Mono } from "@/components/saqeel/type";
import type { Messages } from "@/i18n/messages";
import styles from "./factory360-cr.module.css";

export type CrVisitDisplay = {
  readonly id: string;
  readonly reference: string;
  readonly date: string;
  readonly type: string;
  readonly typeLabel: string;
  readonly planningStatus: string;
  readonly planningLabel: string;
  readonly operationalLabel: string;
  readonly locationSourceLabel: string;
  readonly coords: string;
};

export default function CrVisits({ rows, statusOptions, typeOptions, strings }: {
  rows: readonly CrVisitDisplay[];
  statusOptions: readonly SelectOption[];
  typeOptions: readonly SelectOption[];
  strings: Messages["factoriesCr"]["visits"];
}) {
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const filtered = rows.filter(row => (!status || row.planningStatus === status) && (!type || row.type === type));

  const columns: DataColumn<CrVisitDisplay>[] = [
    { key: "reference", header: strings.reference, isRowHeader: true, cell: row => <Mono>{row.reference}</Mono> },
    { key: "date", header: strings.date, cell: row => row.date, numeric: true },
    { key: "type", header: strings.type, cell: row => row.typeLabel },
    { key: "planning", header: strings.planningStatus, cell: row => row.planningLabel },
    { key: "operational", header: strings.operationalStatus, cell: row => row.operationalLabel },
    { key: "locationSource", header: strings.locationSource, cell: row => row.locationSourceLabel },
    { key: "coords", header: strings.coordinates, align: "end", numeric: true, cell: row => <Mono>{row.coords}</Mono> },
  ];

  return (
    <div className={styles.subgroup}>
      <div className={styles.filters}>
        <SaqeelSelect options={statusOptions} value={status} onChange={setStatus} label={strings.filterStatus} />
        <SaqeelSelect options={typeOptions} value={type} onChange={setType} label={strings.filterType} />
      </div>
      <DataTable
        rows={filtered}
        columns={columns}
        getRowId={row => row.id}
        caption={strings.heading}
        empty={{ icon: "visits", title: strings.filteredEmpty }}
      />
    </div>
  );
}
