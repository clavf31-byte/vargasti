import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Upload, FileSpreadsheet, ArrowRightLeft, Check, X,
  Download, ChevronDown, ChevronRight, BarChart3,
} from "lucide-react";
import { detectColType, SheetData, CompareConfig, CompareResult } from "./useExcelStore";

interface Props {
  fileName1: string;
  sheetNames1: string[];
  sheetData1: Record<string, SheetData>;
  fileName2: string;
  sheetNames2: string[];
  sheetData2: Record<string, SheetData>;
  compareResult: CompareResult | null;
  onLoadFile2: (data: Record<string, SheetData>, names: string[], first: string, name: string) => void;
  onResetFile2: () => void;
  onCompare: (cfg: CompareConfig) => void;
  onClearResult: () => void;
}

type Mode = "same_file" | "second_file";

function exportCompareXlsx(result: CompareResult, baseName: string) {
  const wb = XLSX.utils.book_new();

  const summaryData = [
    ["Métrica", "Valor"],
    ["Base principal", result.sheet1Name],
    ["Base de comparação", result.sheet2Name],
    ["Total na base principal", result.total1],
    ["Total na base de comparação", result.total2],
    ["Encontrados", result.found],
    ["Não encontrados", result.notFound],
    ["Percentual encontrado", `${result.percent}%`],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), "Resumo");

  if (result.mergedHeaders.length) {
    const foundSheet = XLSX.utils.aoa_to_sheet([result.mergedHeaders, ...result.foundRows]);
    XLSX.utils.book_append_sheet(wb, foundSheet, "Encontrados");

    const notFoundSheet = XLSX.utils.aoa_to_sheet([result.mergedHeaders, ...result.notFoundRows]);
    XLSX.utils.book_append_sheet(wb, notFoundSheet, "Não_Encontrados");

    const allSheet = XLSX.utils.aoa_to_sheet([result.mergedHeaders, ...result.mergedRows]);
    XLSX.utils.book_append_sheet(wb, allSheet, "Resultado_Completo");
  }

  XLSX.writeFile(wb, `comparacao_${baseName.replace(/\.xlsx?$/i, "")}.xlsx`);
}

export function ExcelCompare({
  fileName1, sheetNames1, sheetData1,
  fileName2, sheetNames2, sheetData2,
  compareResult,
  onLoadFile2, onResetFile2, onCompare, onClearResult,
}: Props) {
  const file2Ref = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("same_file");
  const [dragging2, setDragging2] = useState(false);

  const [sheet1, setSheet1] = useState(sheetNames1[0] ?? "");
  const [sheet2, setSheet2] = useState(sheetNames1[1] ?? sheetNames1[0] ?? "");
  const [key1, setKey1] = useState(0);
  const [key2, setKey2] = useState(0);
  const [returnCols, setReturnCols] = useState<number[]>([]);

  const [showFound, setShowFound] = useState(true);
  const [showNotFound, setShowNotFound] = useState(true);

  const s1 = sheetData1[sheet1];
  const s2 = mode === "same_file" ? sheetData1[sheet2] : sheetData2[sheet2];

  function parseFile2(file: File) {
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
      onLoadFile2(parsed, names, names[0], file.name);
      setSheet2(names[0]);
      setKey2(0);
      setReturnCols([]);
    };
    reader.readAsBinaryString(file);
  }

  function handleCompare() {
    const effectiveSheet2 = mode === "same_file" ? sheet2 : sheet2;
    onCompare({ mode, sheet1, key1, sheet2: effectiveSheet2, key2, returnCols });
  }

  function toggleReturnCol(idx: number) {
    setReturnCols((prev) =>
      prev.includes(idx) ? prev.filter((c) => c !== idx) : [...prev, idx]
    );
  }

  const canCompare = !!s1 && !!s2 && (mode === "second_file" ? !!fileName2 : true);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-5xl">

      {/* Modo */}
      <div className="flex gap-2">
        {(["same_file", "second_file"] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); onClearResult(); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
              mode === m
                ? "border-brand/40 bg-brand/10 text-brand"
                : "border-border text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            <ArrowRightLeft className="size-3.5" />
            {m === "same_file" ? "Duas abas do mesmo arquivo" : "Dois arquivos Excel"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Arquivo 1 */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border/50 bg-surface-2/40 flex items-center gap-2">
            <div className="size-5 rounded bg-brand/10 border border-brand/20 grid place-items-center">
              <span className="text-[9px] text-brand font-bold">1</span>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Arquivo Principal</p>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-xl">
              <FileSpreadsheet className="size-3.5 text-warning shrink-0" />
              <span className="text-xs text-foreground truncate flex-1">{fileName1 || "Nenhum arquivo"}</span>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Aba</label>
              <select
                value={sheet1}
                onChange={(e) => { setSheet1(e.target.value); setKey1(0); setReturnCols([]); onClearResult(); }}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-brand/40 appearance-none"
              >
                {sheetNames1.map((n) => (
                  <option key={n} value={n}>
                    {n} ({sheetData1[n]?.rows.length ?? 0} linhas)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Coluna-chave</label>
              <select
                value={key1}
                onChange={(e) => { setKey1(Number(e.target.value)); onClearResult(); }}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-brand/40 appearance-none"
              >
                {(s1?.headers ?? []).map((h, i) => (
                  <option key={i} value={i}>{h}</option>
                ))}
              </select>
            </div>

            {s1 && (
              <div className="text-[10px] text-muted-foreground bg-surface-2/50 rounded-lg px-3 py-2">
                {s1.rows.length} linhas · {s1.headers.length} colunas
              </div>
            )}
          </div>
        </div>

        {/* Arquivo 2 */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border/50 bg-surface-2/40 flex items-center gap-2">
            <div className="size-5 rounded bg-info/10 border border-info/20 grid place-items-center">
              <span className="text-[9px] text-info font-bold">2</span>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
              {mode === "same_file" ? "Aba de Comparação" : "Arquivo de Comparação"}
            </p>
          </div>
          <div className="p-4 space-y-3">
            {mode === "second_file" && !fileName2 && (
              <div
                onDrop={(e) => { e.preventDefault(); setDragging2(false); const f = e.dataTransfer.files[0]; if (f) parseFile2(f); }}
                onDragOver={(e) => { e.preventDefault(); setDragging2(true); }}
                onDragLeave={() => setDragging2(false)}
                onClick={() => file2Ref.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-3 cursor-pointer transition-all ${
                  dragging2 ? "border-info bg-info/5" : "border-border hover:border-info/40 hover:bg-info/[0.03]"
                }`}
              >
                <Upload className={`size-6 transition-colors ${dragging2 ? "text-info" : "text-muted-foreground/40"}`} />
                <p className="text-xs text-muted-foreground text-center">
                  Arraste ou clique para importar<br />
                  <span className="text-[10px] text-muted-foreground/60">.xlsx · .xls · .csv</span>
                </p>
                <input ref={file2Ref} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) parseFile2(f); }} />
              </div>
            )}

            {mode === "second_file" && fileName2 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-xl">
                <FileSpreadsheet className="size-3.5 text-info shrink-0" />
                <span className="text-xs text-foreground truncate flex-1">{fileName2}</span>
                <button onClick={onResetFile2} className="text-muted-foreground hover:text-destructive transition-colors">
                  <X className="size-3.5" />
                </button>
              </div>
            )}

            {mode === "same_file" && (
              <div className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-xl">
                <FileSpreadsheet className="size-3.5 text-info shrink-0" />
                <span className="text-xs text-foreground truncate flex-1">{fileName1}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Aba</label>
              <select
                value={sheet2}
                onChange={(e) => { setSheet2(e.target.value); setKey2(0); setReturnCols([]); onClearResult(); }}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-brand/40 appearance-none"
              >
                {(mode === "same_file" ? sheetNames1 : sheetNames2).map((n) => {
                  const src = mode === "same_file" ? sheetData1 : sheetData2;
                  return (
                    <option key={n} value={n}>
                      {n} ({src[n]?.rows.length ?? 0} linhas)
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest">Coluna-chave</label>
              <select
                value={key2}
                onChange={(e) => { setKey2(Number(e.target.value)); onClearResult(); }}
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-brand/40 appearance-none"
              >
                {(s2?.headers ?? []).map((h, i) => (
                  <option key={i} value={i}>{h}</option>
                ))}
              </select>
            </div>

            {s2 && (
              <div className="text-[10px] text-muted-foreground bg-surface-2/50 rounded-lg px-3 py-2">
                {s2.rows.length} linhas · {s2.headers.length} colunas
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Colunas a retornar */}
      {s2 && s2.headers.length > 0 && (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border/50 bg-surface-2/40">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
              Colunas a trazer do arquivo de comparação
            </p>
          </div>
          <div className="p-4">
            <div className="flex flex-wrap gap-2">
              {s2.headers.map((h, i) => (
                <button
                  key={i}
                  onClick={() => toggleReturnCol(i)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-medium transition-colors ${
                    returnCols.includes(i)
                      ? "border-brand/40 bg-brand/10 text-brand"
                      : "border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                  }`}
                >
                  {returnCols.includes(i) && <Check className="size-3" />}
                  {h}
                </button>
              ))}
            </div>
            {returnCols.length === 0 && (
              <p className="text-[10px] text-muted-foreground/60 mt-2">
                Nenhuma coluna selecionada — a comparação mostrará apenas encontrados/não encontrados.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Botão comparar */}
      <button
        onClick={handleCompare}
        disabled={!canCompare}
        className="flex items-center gap-2 px-4 py-2.5 bg-brand text-brand-foreground rounded-xl text-sm font-semibold hover:bg-brand/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ArrowRightLeft className="size-4" />
        Comparar Dados
      </button>

      {/* Resultado */}
      {compareResult && (
        <div className="space-y-4">
          {/* Cards de resumo */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {[
              { label: "Base Principal", value: compareResult.total1, cls: "text-foreground" },
              { label: "Base Comparação", value: compareResult.total2, cls: "text-info" },
              { label: "Encontrados", value: compareResult.found, cls: "text-brand" },
              { label: "Não Encontrados", value: compareResult.notFound, cls: "text-destructive" },
              { label: "Percentual", value: `${compareResult.percent}%`, cls: compareResult.percent >= 80 ? "text-brand" : compareResult.percent >= 50 ? "text-warning" : "text-destructive" },
            ].map(({ label, value, cls }) => (
              <div key={label} className="bg-surface border border-border rounded-xl px-3 py-2.5">
                <div className={`text-xl font-bold tabular-nums ${cls}`}>{value}</div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-wide mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Barra de progresso */}
          <div className="bg-surface border border-border rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span>Correspondência</span>
              <span className="font-medium text-foreground">{compareResult.percent}%</span>
            </div>
            <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${compareResult.percent >= 80 ? "bg-brand" : compareResult.percent >= 50 ? "bg-warning" : "bg-destructive"}`}
                style={{ width: `${compareResult.percent}%` }}
              />
            </div>
            <div className="flex gap-4 text-[9px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-brand inline-block" />{compareResult.found} encontrados</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-destructive inline-block" />{compareResult.notFound} não encontrados</span>
            </div>
          </div>

          {/* Exportação */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => exportCompareXlsx(compareResult, fileName1)}
              className="flex items-center gap-2 px-3 py-2 bg-brand/10 border border-brand/20 text-brand rounded-xl text-xs font-medium hover:bg-brand/20 transition-colors"
            >
              <Download className="size-3.5" />
              Exportar resultado completo
            </button>
            <button
              onClick={() => {
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([compareResult.mergedHeaders, ...compareResult.foundRows]), "Encontrados");
                XLSX.writeFile(wb, `encontrados_${fileName1.replace(/\.xlsx?$/i, "")}.xlsx`);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-surface border border-border text-muted-foreground rounded-xl text-xs font-medium hover:text-foreground hover:bg-surface-2 transition-colors"
            >
              <Download className="size-3.5" />
              Só encontrados
            </button>
            <button
              onClick={() => {
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([compareResult.mergedHeaders, ...compareResult.notFoundRows]), "Não_Encontrados");
                XLSX.writeFile(wb, `nao_encontrados_${fileName1.replace(/\.xlsx?$/i, "")}.xlsx`);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-surface border border-border text-muted-foreground rounded-xl text-xs font-medium hover:text-foreground hover:bg-surface-2 transition-colors"
            >
              <Download className="size-3.5" />
              Só não encontrados
            </button>
          </div>

          {/* Tabela encontrados */}
          {compareResult.foundRows.length > 0 && (
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setShowFound((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="size-3.5 text-brand" />
                  <span className="text-xs font-semibold text-foreground">Encontrados ({compareResult.found})</span>
                </div>
                {showFound ? <ChevronDown className="size-3.5 text-muted-foreground" /> : <ChevronRight className="size-3.5 text-muted-foreground" />}
              </button>
              {showFound && (
                <div className="overflow-x-auto border-t border-border">
                  <ResultTable headers={compareResult.mergedHeaders} rows={compareResult.foundRows.slice(0, 100)} found />
                </div>
              )}
            </div>
          )}

          {/* Tabela não encontrados */}
          {compareResult.notFoundRows.length > 0 && (
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setShowNotFound((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <X className="size-3.5 text-destructive" />
                  <span className="text-xs font-semibold text-foreground">Não Encontrados ({compareResult.notFound})</span>
                </div>
                {showNotFound ? <ChevronDown className="size-3.5 text-muted-foreground" /> : <ChevronRight className="size-3.5 text-muted-foreground" />}
              </button>
              {showNotFound && (
                <div className="overflow-x-auto border-t border-border">
                  <ResultTable headers={compareResult.mergedHeaders} rows={compareResult.notFoundRows.slice(0, 100)} found={false} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultTable({ headers, rows, found }: { headers: string[]; rows: string[][]; found: boolean }) {
  return (
    <table className="w-full text-[10px]">
      <thead>
        <tr className="bg-surface-2/60">
          {headers.map((h, i) => (
            <th key={i} className="px-3 py-2 text-left text-muted-foreground font-medium border-b border-border/50 whitespace-nowrap">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={ri} className={`border-b border-border/30 hover:bg-white/[0.015] transition-colors ${!found ? "bg-destructive/5" : ""}`}>
            {headers.map((_, ci) => (
              <td key={ci} className={`px-3 py-1.5 text-foreground whitespace-nowrap max-w-[200px] truncate ${!found && ci === 0 ? "text-destructive/80" : ""}`}>
                {row[ci] ?? ""}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
