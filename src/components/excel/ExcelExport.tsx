import { useState } from "react";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";
import { SheetData } from "./useExcelStore";

type ExportScope = "all" | "filtered" | "visible" | "notfound";

interface Props {
  fileName: string;
  activeSheet: string;
  sheetData: SheetData;
  filteredRows: string[][];
  visibleCols: Record<number, boolean>;
  colRenames: Record<number, string>;
  procvNotFoundRows: number[];
}

export function ExcelExport({
  fileName,
  activeSheet,
  sheetData,
  filteredRows,
  visibleCols,
  colRenames,
  procvNotFoundRows,
}: Props) {
  const [scope, setScope] = useState<ExportScope>("filtered");
  const [format, setFormat] = useState<"xlsx" | "csv">("xlsx");

  const { headers, rows } = sheetData;
  const visibleIdxs = headers.map((_, i) => i).filter((i) => visibleCols[i] ?? true);

  function getDisplayHeader(i: number) {
    return colRenames[i] ?? headers[i] ?? `Col ${i + 1}`;
  }

  function getExportRows(): string[][] {
    switch (scope) {
      case "all": return rows;
      case "filtered": return filteredRows;
      case "visible": return filteredRows;
      case "notfound": return procvNotFoundRows.map((i) => rows[i]).filter(Boolean);
      default: return filteredRows;
    }
  }

  function getExportCols(): number[] {
    if (scope === "visible") return visibleIdxs;
    return headers.map((_, i) => i);
  }

  function exportData() {
    const exportRows = getExportRows();
    const exportCols = getExportCols();
    const hdrs = exportCols.map(getDisplayHeader);
    const data = exportRows.map((r) => exportCols.map((ci) => r[ci] ?? ""));

    if (format === "xlsx") {
      const ws = XLSX.utils.aoa_to_sheet([hdrs, ...data]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, activeSheet || "Sheet1");
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const exportName = (fileName || "exportado").replace(/\.[^.]+$/, "") + ".xlsx";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = exportName;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const csv = [hdrs, ...data]
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeSheet || "dados"}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  const notFoundCount = procvNotFoundRows.length;

  const scopes: { value: ExportScope; label: string; count: number }[] = [
    { value: "all", label: "Todos os dados", count: rows.length },
    { value: "filtered", label: "Apenas filtrados", count: filteredRows.length },
    { value: "visible", label: "Colunas visíveis (filtrados)", count: filteredRows.length },
    { value: "notfound", label: "Não encontrados no PROCV", count: notFoundCount },
  ];

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Exportar</div>

      <div className="flex flex-col gap-1.5">
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider">O que exportar</div>
        {scopes.map((s) => (
          <button
            key={s.value}
            onClick={() => setScope(s.value)}
            disabled={s.value === "notfound" && notFoundCount === 0}
            className={`flex items-center justify-between px-3 py-2 rounded text-[10px] border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              scope === s.value
                ? "border-brand/50 bg-brand/10 text-brand"
                : "border-border text-foreground hover:border-brand/30"
            }`}
          >
            <span>{s.label}</span>
            <span className="text-muted-foreground text-[9px]">{s.count} linhas</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Formato</div>
        <div className="flex gap-2">
          {(["xlsx", "csv"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`px-3 py-1.5 rounded text-[10px] border transition-colors ${
                format === f ? "border-brand/50 bg-brand/10 text-brand" : "border-border text-muted-foreground hover:border-brand/30"
              }`}
            >
              .{f}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={exportData}
        className="flex items-center gap-2 px-4 py-2 rounded text-[10px] bg-brand text-brand-foreground hover:bg-brand/90 transition-colors w-fit"
      >
        <Download className="size-3.5" />
        Exportar {format === "xlsx" ? "Excel" : "CSV"}
      </button>
    </div>
  );
}
