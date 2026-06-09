import { useRef, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  Upload, ChevronLeft, FileSpreadsheet, Search, Clock, Trash2, PanelLeftClose, PanelLeft,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useExcelStore, detectColType, SheetData } from "./useExcelStore";
import { ExcelTable } from "./ExcelTable";
import { ExcelFilters } from "./ExcelFilters";
import { ExcelColumnEditor } from "./ExcelColumnEditor";
import { ExcelProcv } from "./ExcelProcv";
import { ExcelActions } from "./ExcelActions";
import { ExcelExport } from "./ExcelExport";
import { ExcelAgent } from "./ExcelAgent";
import { useState } from "react";

type Tab = "import" | "table" | "filters" | "columns" | "procv" | "actions" | "export" | "agent";

export function ExcelEditor() {
  const store = useExcelStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("import");
  const [showHistory, setShowHistory] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(true);
  const [dragging, setDragging] = useState(false);

  function parseFile(file: File) {
    store.setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target?.result, { type: "binary" });
      const names = wb.SheetNames;
      const parsed: Record<string, SheetData> = {};
      names.forEach((name) => {
        const ws = wb.Sheets[name];
        const raw: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        const [firstRow = [], ...rows] = raw;
        const headers = firstRow.map(String);
        const dataRows = rows.map((r) => r.map(String));
        const types = headers.map((_, ci) => detectColType(dataRows.map((r) => r[ci] ?? "")));
        parsed[name] = { headers, rows: dataRows, types };
      });
      store.loadSheetData(parsed, names, names[0]);
      store.saveHistory({
        id: Date.now().toString(),
        fileName: file.name,
        rows: parsed[names[0]]?.rows.length ?? 0,
        cols: parsed[names[0]]?.headers.length ?? 0,
        importedAt: new Date().toISOString(),
      });
      setTab("table");
    };
    reader.readAsBinaryString(file);
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, []);

  const current = store.sheetData[store.activeSheet];
  const { rows: filteredRows, indices: filteredIndices } = store.getFilteredRows();
  const procvNotFoundSet = new Set(store.procvResults.notFoundRows);

  const displayHeaders = current?.headers.map((h, i) => store.getDisplayHeader(i)) ?? [];

  const tabs: { id: Tab; label: string }[] = [
    { id: "import", label: "Importar" },
    { id: "table", label: "Tabela" },
    { id: "filters", label: `Filtros${store.filters.length > 0 ? ` (${store.filters.length})` : ""}` },
    { id: "columns", label: "Colunas" },
    { id: "procv", label: "PROCV" },
    { id: "actions", label: "Ações" },
    { id: "export", label: "Exportar" },
    { id: "agent", label: "Agente IA" },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-2.5rem)]">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-surface shrink-0">
        <Link to="/ferramentas" className="p-1 rounded text-muted-foreground hover:text-brand hover:bg-brand/10 transition-colors">
          <ChevronLeft className="size-3.5" />
        </Link>
        <div className="text-[9px] text-muted-foreground uppercase tracking-widest">editor de excel</div>
        {store.fileName && (
          <div className="flex items-center gap-1 ml-2 px-2 py-0.5 bg-brand/10 border border-brand/20 rounded text-[10px] text-brand">
            <FileSpreadsheet className="size-3" />
            <span className="max-w-[160px] truncate">{store.fileName}</span>
          </div>
        )}
        {current && (
          <span className="text-[9px] text-muted-foreground">
            {filteredRows.length}/{current.rows.length} linhas · {current.headers.length} cols
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
          {store.fileName && (
            <button
              onClick={() => { store.reset(); setTab("import"); }}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              <Upload className="size-3" />
              Novo
            </button>
          )}
        </div>
      </div>

      {showHistory ? (
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-2xl">
            <div className="text-xs font-medium text-muted-foreground mb-3">Histórico de Importações</div>
            {store.history.length === 0 ? (
              <p className="text-[10px] text-muted-foreground">Nenhum histórico ainda.</p>
            ) : (
              <div className="space-y-1.5">
                {store.history.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-surface border border-border rounded px-3 py-2 text-[10px]">
                    <FileSpreadsheet className="size-3 text-brand shrink-0" />
                    <span className="text-foreground truncate flex-1">{item.fileName}</span>
                    <span className="text-muted-foreground shrink-0">{item.rows} linhas · {item.cols} cols</span>
                    <span className="text-muted-foreground shrink-0">
                      {new Date(item.importedAt).toLocaleDateString("pt-BR")}
                    </span>
                    <button
                      onClick={() => {
                        const updated = store.history.filter((h) => h.id !== item.id);
                        localStorage.setItem("excel-history", JSON.stringify(updated));
                        window.location.reload();
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
      ) : (
        <>
          <div className="flex items-center gap-0 px-4 border-b border-border bg-surface shrink-0 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                disabled={t.id !== "import" && !store.fileName}
                className={`px-3 py-2 text-[10px] border-b-2 transition-colors whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed ${
                  tab === t.id
                    ? "border-brand text-brand"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {tab === "import" && (
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
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) parseFile(f); }}
                  />
                </div>
              </div>
            )}

            {tab === "table" && current && (
              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-surface/50 shrink-0 flex-wrap">
                  {store.sheetNames.length > 1 && (
                    <select
                      value={store.activeSheet}
                      onChange={(e) => store.setActiveSheet(e.target.value)}
                      className="bg-background border border-border rounded px-2 py-1 text-[10px] focus:outline-none focus:border-brand/50"
                    >
                      {store.sheetNames.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  )}
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
                    <input
                      value={store.globalSearch}
                      onChange={(e) => store.setGlobalSearch(e.target.value)}
                      placeholder="Busca global..."
                      className="bg-background border border-border rounded pl-6 pr-3 py-1 text-[10px] focus:outline-none focus:border-brand/50 placeholder:text-muted-foreground w-40"
                    />
                  </div>
                  <div className="flex items-center gap-3 ml-auto text-[9px] text-muted-foreground">
                    <span className="bg-surface border border-border rounded px-2 py-0.5">
                      Total: <strong className="text-foreground">{current.rows.length}</strong>
                    </span>
                    <span className="bg-surface border border-border rounded px-2 py-0.5">
                      Filtradas: <strong className="text-brand">{filteredRows.length}</strong>
                    </span>
                    <span className="bg-surface border border-border rounded px-2 py-0.5">
                      Editadas: <strong className="text-foreground">{store.editedCells.size}</strong>
                    </span>
                    {store.procvResults.found > 0 && (
                      <>
                        <span className="bg-surface border border-border rounded px-2 py-0.5">
                          PROCV: <strong className="text-green-400">{store.procvResults.found}</strong>
                        </span>
                        <span className="bg-surface border border-border rounded px-2 py-0.5">
                          Não enc.: <strong className="text-red-400">{store.procvResults.notFound}</strong>
                        </span>
                      </>
                    )}
                    <button
                      onClick={() => setFilterPanelOpen((v) => !v)}
                      className="flex items-center gap-1 px-2 py-1 rounded border border-border hover:border-brand/30 hover:text-brand transition-colors"
                    >
                      {filterPanelOpen ? <PanelLeftClose className="size-3" /> : <PanelLeft className="size-3" />}
                      Filtros
                    </button>
                  </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                  {filterPanelOpen && (
                    <div className="w-64 shrink-0 border-r border-border overflow-y-auto">
                      <ExcelFilters
                        headers={current.headers}
                        types={current.types}
                        filters={store.filters}
                        filterLogic={store.filterLogic}
                        onFiltersChange={store.setFilters}
                        onLogicChange={store.setFilterLogic}
                      />
                    </div>
                  )}
                  <ExcelTable
                    headers={current.headers}
                    displayHeaders={displayHeaders}
                    types={current.types}
                    rows={filteredRows}
                    originalIndices={filteredIndices}
                    editedCells={store.editedCells}
                    visibleCols={store.visibleCols}
                    sortCol={store.sortCol}
                    sortDir={store.sortDir}
                    procvNotFoundRows={procvNotFoundSet}
                    onSortChange={(col) => {
                      if (store.sortCol === col) {
                        store.setSortDir(store.sortDir === "asc" ? "desc" : "asc");
                      } else {
                        store.setSortCol(col);
                        store.setSortDir("asc");
                      }
                    }}
                    onCellEdit={store.updateCell}
                  />
                </div>
              </div>
            )}

            {tab === "filters" && current && (
              <div className="flex-1 overflow-y-auto max-w-xl">
                <ExcelFilters
                  headers={current.headers}
                  types={current.types}
                  filters={store.filters}
                  filterLogic={store.filterLogic}
                  onFiltersChange={store.setFilters}
                  onLogicChange={store.setFilterLogic}
                />
              </div>
            )}

            {tab === "columns" && current && (
              <div className="flex-1 overflow-y-auto max-w-2xl">
                <ExcelColumnEditor
                  sheetData={current}
                  visibleCols={store.visibleCols}
                  colRenames={store.colRenames}
                  onToggleCol={store.toggleCol}
                  onRenameCol={(i, name) => store.setColRenames((prev) => ({ ...prev, [i]: name }))}
                  onUpdateSheet={store.updateSheetData}
                  onRenamesChange={store.setColRenames}
                />
              </div>
            )}

            {tab === "procv" && current && (
              <div className="flex-1 overflow-y-auto max-w-2xl">
                <ExcelProcv
                  mainHeaders={current.headers}
                  procvSheet={store.procvSheet}
                  procvSheetName={store.procvSheetName}
                  procvConfig={store.procvConfig}
                  procvResults={store.procvResults}
                  onProcvSheetLoad={(sheet, name) => {
                    store.setProcvSheet(sheet);
                    store.setProcvSheetName(name);
                  }}
                  onConfigChange={store.setProcvConfig}
                  onApply={store.applyProcv}
                />
              </div>
            )}

            {tab === "actions" && current && (
              <div className="flex-1 overflow-y-auto max-w-2xl">
                <ExcelActions
                  sheetData={current}
                  onUpdateSheet={store.updateSheetData}
                />
              </div>
            )}

            {tab === "export" && current && (
              <div className="flex-1 overflow-y-auto max-w-2xl">
                <ExcelExport
                  fileName={store.fileName}
                  activeSheet={store.activeSheet}
                  sheetData={current}
                  filteredRows={filteredRows}
                  visibleCols={store.visibleCols}
                  colRenames={store.colRenames}
                  procvNotFoundRows={store.procvResults.notFoundRows}
                />
              </div>
            )}

            {tab === "agent" && current && (
              <ExcelAgent
                sheetData={current}
                totalRows={current.rows.length}
                onSort={(col, dir) => {
                  store.setSortCol(col);
                  store.setSortDir(dir);
                }}
                onFilter={(filters, logic) => {
                  store.setFilters(filters);
                  store.setFilterLogic(logic);
                }}
                onClearFilters={() => store.setFilters([])}
                onAddColumn={(name, values) =>
                  store.updateSheetData((sheet) => ({
                    ...sheet,
                    headers: [...sheet.headers, name],
                    rows: sheet.rows.map((r, i) => [...r, values[i] ?? ""]),
                    types: [...sheet.types, detectColType(values)],
                  }))
                }
                onUpdateCells={(changes) =>
                  changes.forEach((c) => store.updateCell(c.row, c.col, c.value))
                }
              />
            )}

            {tab !== "import" && tab !== "agent" && !current && (
              <div className="flex-1 flex items-center justify-center text-[10px] text-muted-foreground">
                Importe um arquivo para continuar.
              </div>
            )}

            {tab === "agent" && !current && (
              <div className="flex-1 flex items-center justify-center text-[10px] text-muted-foreground">
                Importe um arquivo para usar o agente.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
