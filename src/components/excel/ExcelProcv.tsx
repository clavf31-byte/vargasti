import { useRef } from "react";
import * as XLSX from "xlsx";
import { Upload, Play } from "lucide-react";
import { ProcvConfig, ProcvResults, SheetData, detectColType } from "./useExcelStore";

interface Props {
  mainHeaders: string[];
  procvSheet: { headers: string[]; rows: string[][] } | null;
  procvSheetName: string;
  procvConfig: ProcvConfig | null;
  procvResults: ProcvResults;
  onProcvSheetLoad: (sheet: { headers: string[]; rows: string[][] }, name: string) => void;
  onConfigChange: (c: ProcvConfig) => void;
  onApply: () => void;
}

export function ExcelProcv({
  mainHeaders,
  procvSheet,
  procvSheetName,
  procvConfig,
  procvResults,
  onProcvSheetLoad,
  onConfigChange,
  onApply,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  function loadFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target?.result, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
      const [first = [], ...rest] = raw;
      onProcvSheetLoad({ headers: first.map(String), rows: rest.map((r) => r.map(String)) }, file.name);
      onConfigChange({ mainKey: 0, lookupKey: 0, columns: [] });
    };
    reader.readAsBinaryString(file);
  }

  function toggleLookupCol(ci: number) {
    if (!procvConfig) return;
    const cols = procvConfig.columns.includes(ci)
      ? procvConfig.columns.filter((c) => c !== ci)
      : [...procvConfig.columns, ci];
    onConfigChange({ ...procvConfig, columns: cols });
  }

  const canApply = procvSheet && procvConfig && procvConfig.columns.length > 0;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">PROCV — Cruzamento de Planilhas</div>

      <div
        className="border-2 border-dashed border-border rounded p-6 flex flex-col items-center gap-3 cursor-pointer hover:border-brand/40 hover:bg-surface transition-all"
        onClick={() => fileRef.current?.click()}
      >
        <Upload className="size-6 text-muted-foreground" />
        <div className="text-center">
          <p className="text-[10px] text-foreground">{procvSheet ? procvSheetName : "Importar segunda planilha"}</p>
          {procvSheet && (
            <p className="text-[9px] text-muted-foreground mt-0.5">
              {procvSheet.rows.length} linhas · {procvSheet.headers.length} colunas — clique para trocar
            </p>
          )}
          {!procvSheet && <p className="text-[9px] text-muted-foreground mt-0.5">.xlsx · .xls · .csv</p>}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) loadFile(f); }}
        />
      </div>

      {procvSheet && procvConfig && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-muted-foreground uppercase tracking-wider">Coluna-chave (planilha principal)</label>
              <select
                value={procvConfig.mainKey}
                onChange={(e) => onConfigChange({ ...procvConfig, mainKey: +e.target.value })}
                className="bg-background border border-border rounded px-2 py-1 text-[10px] focus:outline-none focus:border-brand/50"
              >
                {mainHeaders.map((h, i) => (
                  <option key={i} value={i}>{h || `Col ${i + 1}`}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[9px] text-muted-foreground uppercase tracking-wider">Coluna-chave (segunda planilha)</label>
              <select
                value={procvConfig.lookupKey}
                onChange={(e) => onConfigChange({ ...procvConfig, lookupKey: +e.target.value })}
                className="bg-background border border-border rounded px-2 py-1 text-[10px] focus:outline-none focus:border-brand/50"
              >
                {procvSheet.headers.map((h, i) => (
                  <option key={i} value={i}>{h || `Col ${i + 1}`}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Colunas a trazer da segunda planilha</div>
            <div className="flex flex-wrap gap-1.5">
              {procvSheet.headers.map((h, i) => {
                if (i === procvConfig.lookupKey) return null;
                const selected = procvConfig.columns.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() => toggleLookupCol(i)}
                    className={`px-2 py-0.5 rounded text-[9px] border transition-colors ${
                      selected ? "border-brand/50 bg-brand/10 text-brand" : "border-border text-muted-foreground hover:border-brand/30"
                    }`}
                  >
                    {h || `Col ${i + 1}`}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={onApply}
            disabled={!canApply}
            className="flex items-center gap-2 px-3 py-1.5 rounded text-[10px] bg-brand text-brand-foreground hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-fit"
          >
            <Play className="size-3" />
            Executar PROCV
          </button>
        </>
      )}

      {(procvResults.found > 0 || procvResults.notFound > 0) && (
        <div className="flex items-center gap-3 p-3 bg-surface border border-border rounded">
          <div className="text-center">
            <div className="text-lg font-semibold text-brand">{procvResults.found}</div>
            <div className="text-[9px] text-muted-foreground">Encontrados</div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-center">
            <div className="text-lg font-semibold text-red-400">{procvResults.notFound}</div>
            <div className="text-[9px] text-muted-foreground">Não encontrados</div>
          </div>
        </div>
      )}
    </div>
  );
}
