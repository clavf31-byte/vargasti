import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import { Upload, Download, ChevronLeft, FileSpreadsheet } from "lucide-react";

export const Route = createFileRoute("/ferramentas/excel")({
  head: () => ({ meta: [{ title: "Excel Import/Export · VargasTI" }] }),
  component: ExcelTool,
});

interface SheetData {
  headers: string[];
  rows: string[][];
}

function ExcelTool() {
  const [fileName, setFileName] = useState("");
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState("");
  const [sheetData, setSheetData] = useState<Record<string, SheetData>>({});
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const workbookRef = useRef<XLSX.WorkBook | null>(null);

  function parseFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const wb = XLSX.read(data, { type: "binary" });
      workbookRef.current = wb;
      const names = wb.SheetNames;
      const parsed: Record<string, SheetData> = {};
      names.forEach((name) => {
        const ws = wb.Sheets[name];
        const raw: string[][] = XLSX.utils.sheet_to_json(ws, {
          header: 1,
          defval: "",
        });
        const [firstRow = [], ...rows] = raw;
        parsed[name] = {
          headers: firstRow.map(String),
          rows: rows.map((r) => r.map(String)),
        };
      });
      setSheetNames(names);
      setActiveSheet(names[0]);
      setSheetData(parsed);
    };
    reader.readAsBinaryString(file);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, []);

  function reset() {
    setFileName("");
    setSheetData({});
    setSheetNames([]);
    setActiveSheet("");
    workbookRef.current = null;
    if (fileRef.current) fileRef.current.value = "";
  }

  function exportExcel() {
    if (!workbookRef.current) return;
    XLSX.writeFile(workbookRef.current, fileName || "exportado.xlsx");
  }

  function exportCSV() {
    const current = sheetData[activeSheet];
    if (!current) return;
    const rows = [current.headers, ...current.rows];
    const csv = rows
      .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeSheet || "dados"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const current = sheetData[activeSheet];

  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-2">
          <Link
            to="/ferramentas"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <PageHeader
            title="Excel Import / Export"
            subtitle="Importe, visualize e exporte planilhas."
          />
        </div>

        {!fileName ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-16 flex flex-col items-center justify-center gap-4 cursor-pointer transition-colors ${
              dragging
                ? "border-brand bg-brand/5"
                : "border-border hover:border-brand/40 hover:bg-white/5"
            }`}
          >
            <div className="size-16 rounded-full bg-brand/10 border border-brand/20 grid place-items-center">
              <FileSpreadsheet className="size-8 text-brand" />
            </div>
            <div className="text-center">
              <p className="text-foreground font-medium">
                Arraste ou clique para importar
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Suporta .xlsx, .xls e .csv
              </p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) parseFile(file);
              }}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 bg-surface border border-border rounded-lg px-4 py-3">
              <span className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                <FileSpreadsheet className="size-3.5" />
                {fileName}
              </span>

              {sheetNames.length > 1 && (
                <select
                  value={activeSheet}
                  onChange={(e) => setActiveSheet(e.target.value)}
                  className="text-xs bg-secondary border border-border rounded px-2 py-1 text-foreground"
                >
                  {sheetNames.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              )}

              {current && (
                <span className="text-[10px] font-mono text-muted-foreground">
                  {current.rows.length} linhas · {current.headers.length} colunas
                </span>
              )}

              <div className="ml-auto flex gap-2 flex-wrap">
                <button
                  onClick={reset}
                  className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-md px-3 py-1.5 transition-colors flex items-center gap-1.5"
                >
                  <Upload className="size-3.5" /> Novo arquivo
                </button>
                <button
                  onClick={exportExcel}
                  className="text-xs bg-brand text-brand-foreground rounded-md px-3 py-1.5 hover:bg-brand/90 transition-colors flex items-center gap-1.5"
                >
                  <Download className="size-3.5" /> Excel
                </button>
                <button
                  onClick={exportCSV}
                  className="text-xs bg-surface border border-border text-foreground rounded-md px-3 py-1.5 hover:bg-white/5 transition-colors flex items-center gap-1.5"
                >
                  <Download className="size-3.5" /> CSV
                </button>
              </div>
            </div>

            {current && (
              <div className="bg-surface border border-border rounded-lg overflow-auto max-h-[60vh]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 sticky top-0 z-10">
                    <tr>
                      <th className="px-3 py-2 text-[10px] font-mono text-muted-foreground border-b border-border w-10 text-right">
                        #
                      </th>
                      {current.headers.map((h, i) => (
                        <th
                          key={i}
                          className="px-3 py-2 text-[10px] font-mono text-muted-foreground uppercase border-b border-border whitespace-nowrap"
                        >
                          {h || `Col ${i + 1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {current.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="px-3 py-2 text-muted-foreground font-mono text-right">
                          {i + 1}
                        </td>
                        {current.headers.map((_, j) => (
                          <td
                            key={j}
                            className="px-3 py-2 text-foreground whitespace-nowrap max-w-[200px] truncate"
                          >
                            {row[j] ?? ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
