import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useState, useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  Upload, Download, ChevronLeft, FileSpreadsheet, Search,
  Edit2, Check, X, Eye, EyeOff, Clock, Trash2,
} from "lucide-react";

export const Route = createFileRoute("/ferramentas/excel")({
  head: () => ({ meta: [{ title: "Excel Treatment · VargasTI Lab" }] }),
  component: ExcelTool,
});

interface SheetData {
  headers: string[];
  rows: string[][];
}

interface HistoryItem {
  id: string;
  fileName: string;
  rows: number;
  cols: number;
  importedAt: string;
}

function ExcelTool() {
  const [fileName, setFileName] = useState("");
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState("");
  const [sheetData, setSheetData] = useState<Record<string, SheetData>>({});
  const [dragging, setDragging] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [visibleCols, setVisibleCols] = useState<Record<number, boolean>>({});
  const [colRenames, setColRenames] = useState<Record<number, string>>({});
  const [editingHeader, setEditingHeader] = useState<number | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [renamingValue, setRenamingValue] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try { return JSON.parse(localStorage.getItem("excel-history") || "[]"); } catch { return []; }
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const workbookRef = useRef<XLSX.WorkBook | null>(null);

  function saveHistory(item: HistoryItem) {
    const updated = [item, ...history].slice(0, 20);
    setHistory(updated);
    localStorage.setItem("excel-history", JSON.stringify(updated));
  }

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
        const raw: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        const [firstRow = [], ...rows] = raw;
        parsed[name] = { headers: firstRow.map(String), rows: rows.map((r) => r.map(String)) };
      });
      setSheetNames(names);
      setActiveSheet(names[0]);
      setSheetData(parsed);
      setGlobalFilter("");
      setVisibleCols({});
      setColRenames({});

      const first = parsed[names[0]];
      if (first) {
        saveHistory({
          id: Date.now().toString(),
          fileName: file.name,
          rows: first.rows.length,
          cols: first.headers.length,
          importedAt: new Date().toISOString(),
        });
      }
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
    setFileName(""); setSheetData({}); setSheetNames([]); setActiveSheet("");
    setGlobalFilter(""); setVisibleCols({}); setColRenames({});
    setEditingHeader(null); setEditingCell(null);
    workbookRef.current = null;
    if (fileRef.current) fileRef.current.value = "";
  }

  function toggleCol(idx: number) {
    setVisibleCols((prev) => ({ ...prev, [idx]: !(prev[idx] ?? true) }));
  }

  function isColVisible(idx: number) {
    return visibleCols[idx] ?? true;
  }

  function getDisplayHeader(idx: number, original: string) {
    return colRenames[idx] ?? (original || `Col ${idx + 1}`);
  }

  function startRenameHeader(idx: number, original: string) {
    setEditingHeader(idx);
    setRenamingValue(colRenames[idx] ?? original);
  }

  function confirmRename(idx: number) {
    setColRenames((prev) => ({ ...prev, [idx]: renamingValue }));
    setEditingHeader(null);
  }

  function startEditCell(row: number, col: number, value: string) {
    setEditingCell({ row, col });
    setEditingValue(value);
  }

  function confirmEditCell() {
    if (!editingCell || !activeSheet) return;
    setSheetData((prev) => {
      const sheet = prev[activeSheet];
      if (!sheet) return prev;
      const rows = sheet.rows.map((r, ri) =>
        ri === editingCell.row ? r.map((v, ci) => (ci === editingCell.col ? editingValue : v)) : r
      );
      return { ...prev, [activeSheet]: { ...sheet, rows } };
    });
    setEditingCell(null);
  }

  function exportExcel() {
    const current = sheetData[activeSheet];
    if (!current) return;
    const visibleIdxs = current.headers.map((_, i) => i).filter(isColVisible);
    const headers = visibleIdxs.map((i) => getDisplayHeader(i, current.headers[i]));
    const rows = getFilteredRows().map((r) => visibleIdxs.map((i) => r[i] ?? ""));
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeSheet || "Sheet1");
    XLSX.writeFile(wb, fileName || "exportado.xlsx");
  }

  function exportCSV() {
    const current = sheetData[activeSheet];
    if (!current) return;
    const visibleIdxs = current.headers.map((_, i) => i).filter(isColVisible);
    const headers = visibleIdxs.map((i) => getDisplayHeader(i, current.headers[i]));
    const rows = getFilteredRows().map((r) => visibleIdxs.map((i) => r[i] ?? ""));
    const data = [headers, ...rows];
    const csv = data.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${activeSheet || "dados"}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  function getFilteredRows() {
    const current = sheetData[activeSheet];
    if (!current) return [];
    if (!globalFilter) return current.rows;
    const q = globalFilter.toLowerCase();
    return current.rows.filter((row) => row.some((cell) => cell.toLowerCase().includes(q)));
  }

  const current = sheetData[activeSheet];
  const filteredRows = getFilteredRows();
  const visibleHeaderIdxs = current?.headers.map((_, i) => i).filter(isColVisible) ?? [];

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-2.5rem)]">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-surface shrink-0">
          <Link to="/ferramentas" className="p-1 rounded text-muted-foreground hover:text-brand hover:bg-brand/10 transition-colors">
            <ChevronLeft className="size-3.5" />
          </Link>
          <div className="text-[9px] text-muted-foreground uppercase tracking-widest">excel treatment</div>
          {fileName && (
            <div className="flex items-center gap-1 ml-2 px-2 py-0.5 bg-brand/10 border border-brand/20 rounded text-[10px] text-brand">
              <FileSpreadsheet className="size-3" />
              <span className="max-w-[160px] truncate">{fileName}</span>
            </div>
          )}
          {current && (
            <span className="text-[9px] text-muted-foreground">
              {filteredRows.length}/{current.rows.length} linhas · {visibleHeaderIdxs.length}/{current.headers.length} colunas
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowHistory((v) => !v)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] border transition-colors ${showHistory ? "border-brand/30 text-brand bg-brand/5" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              <Clock className="size-3" />
              Histórico
            </button>
            {fileName && (
              <>
                <button onClick={reset} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] border border-border text-muted-foreground hover:text-foreground transition-colors">
                  <Upload className="size-3" /> Novo
                </button>
                <button onClick={exportCSV} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] border border-border text-foreground hover:border-brand/30 transition-colors">
                  <Download className="size-3" /> CSV
                </button>
                <button onClick={exportExcel} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-brand text-brand-foreground hover:bg-brand/90 transition-colors">
                  <Download className="size-3" /> Excel
                </button>
              </>
            )}
          </div>
        </div>

        {showHistory ? (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-2xl">
              <div className="text-xs font-medium text-muted-foreground mb-3">Histórico de Importações</div>
              {history.length === 0 ? (
                <p className="text-[10px] text-muted-foreground">Nenhum histórico ainda.</p>
              ) : (
                <div className="space-y-1.5">
                  {history.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 bg-surface border border-border rounded px-3 py-2 text-[10px]">
                      <FileSpreadsheet className="size-3 text-brand shrink-0" />
                      <span className="text-foreground truncate flex-1">{item.fileName}</span>
                      <span className="text-muted-foreground shrink-0">{item.rows} linhas · {item.cols} cols</span>
                      <span className="text-muted-foreground shrink-0">
                        {new Date(item.importedAt).toLocaleDateString("pt-BR")}
                      </span>
                      <button
                        onClick={() => {
                          const updated = history.filter((h) => h.id !== item.id);
                          setHistory(updated);
                          localStorage.setItem("excel-history", JSON.stringify(updated));
                        }}
                        className="text-muted-foreground hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : !fileName ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => fileRef.current?.click()}
              className={`w-full max-w-md border-2 border-dashed rounded p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
                dragging ? "border-brand bg-brand/5" : "border-border hover:border-brand/40 hover:bg-surface"
              }`}
            >
              <FileSpreadsheet className="size-10 text-brand opacity-70" />
              <div className="text-center">
                <p className="text-xs text-foreground">Arraste ou clique para importar</p>
                <p className="text-[10px] text-muted-foreground mt-1">.xlsx · .xls · .csv</p>
              </div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) parseFile(f); }} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Controls bar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-surface/50 shrink-0 flex-wrap">
              {sheetNames.length > 1 && (
                <select value={activeSheet} onChange={(e) => setActiveSheet(e.target.value)}
                  className="bg-background border border-border rounded px-2 py-1 text-[10px] text-foreground focus:outline-none focus:border-brand/50">
                  {sheetNames.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              )}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
                <input value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Filtrar linhas..."
                  className="bg-background border border-border rounded pl-6 pr-3 py-1 text-[10px] focus:outline-none focus:border-brand/50 placeholder:text-muted-foreground w-40" />
              </div>
              <div className="flex gap-1 flex-wrap">
                {current?.headers.map((h, i) => (
                  <button key={i} onClick={() => toggleCol(i)}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] border transition-colors ${
                      isColVisible(i) ? "border-brand/30 text-brand bg-brand/5" : "border-border text-muted-foreground/50 line-through"
                    }`}
                  >
                    {isColVisible(i) ? <Eye className="size-2" /> : <EyeOff className="size-2" />}
                    {getDisplayHeader(i, h)}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            {current && (
              <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-[10px] border-collapse">
                  <thead className="bg-surface sticky top-0 z-10">
                    <tr>
                      <th className="px-2 py-1.5 text-muted-foreground border-b border-border w-8 text-right text-[9px]">#</th>
                      {current.headers.map((h, i) => (
                        isColVisible(i) && (
                          <th key={i} className="px-2 py-1.5 border-b border-border whitespace-nowrap">
                            {editingHeader === i ? (
                              <div className="flex items-center gap-1">
                                <input autoFocus value={renamingValue} onChange={(e) => setRenamingValue(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === "Enter") confirmRename(i); if (e.key === "Escape") setEditingHeader(null); }}
                                  className="bg-background border border-brand/50 rounded px-1 py-0.5 text-[9px] text-brand focus:outline-none w-24" />
                                <button onClick={() => confirmRename(i)} className="text-brand hover:text-brand/80"><Check className="size-2.5" /></button>
                                <button onClick={() => setEditingHeader(null)} className="text-muted-foreground hover:text-foreground"><X className="size-2.5" /></button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 group cursor-pointer" onClick={() => startRenameHeader(i, h)}>
                                <span className="text-muted-foreground uppercase tracking-wider text-[9px]">{getDisplayHeader(i, h)}</span>
                                <Edit2 className="size-2 text-muted-foreground/0 group-hover:text-muted-foreground/70 transition-opacity" />
                              </div>
                            )}
                          </th>
                        )
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredRows.map((row, ri) => (
                      <tr key={ri} className="hover:bg-surface/50 transition-colors">
                        <td className="px-2 py-1 text-muted-foreground text-right text-[9px]">{ri + 1}</td>
                        {current.headers.map((_, ci) => (
                          isColVisible(ci) && (
                            <td key={ci} className="px-2 py-1 text-foreground max-w-[180px]"
                              onDoubleClick={() => startEditCell(ri, ci, row[ci] ?? "")}>
                              {editingCell?.row === ri && editingCell?.col === ci ? (
                                <input autoFocus value={editingValue} onChange={(e) => setEditingValue(e.target.value)}
                                  onBlur={confirmEditCell}
                                  onKeyDown={(e) => { if (e.key === "Enter") confirmEditCell(); if (e.key === "Escape") setEditingCell(null); }}
                                  className="bg-background border border-brand/50 rounded px-1 py-0.5 text-[10px] text-brand focus:outline-none w-full min-w-[80px]" />
                              ) : (
                                <span className="truncate block">{row[ci] ?? ""}</span>
                              )}
                            </td>
                          )
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
