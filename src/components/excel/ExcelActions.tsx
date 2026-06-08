import { useState } from "react";
import { SheetData, normalizeDate } from "./useExcelStore";

interface Props {
  sheetData: SheetData;
  onUpdateSheet: (updater: (s: SheetData) => SheetData) => void;
}

type ModalType = "replace" | "split" | "join" | null;

export function ExcelActions({ sheetData, onUpdateSheet }: Props) {
  const [modal, setModal] = useState<ModalType>(null);
  const [replaceCol, setReplaceCol] = useState(0);
  const [replaceFrom, setReplaceFrom] = useState("");
  const [replaceTo, setReplaceTo] = useState("");
  const [splitCol, setSplitCol] = useState(0);
  const [splitDelim, setSplitDelim] = useState(";");
  const [joinCols, setJoinCols] = useState<number[]>([]);
  const [joinSep, setJoinSep] = useState(" ");
  const [joinNewName, setJoinNewName] = useState("");

  const { headers } = sheetData;

  function removeEmpty() {
    onUpdateSheet((s) => ({
      ...s,
      rows: s.rows.filter((r) => r.some((c) => c.trim() !== "")),
    }));
  }

  function removeDuplicates() {
    onUpdateSheet((s) => {
      const seen = new Set<string>();
      return {
        ...s,
        rows: s.rows.filter((r) => {
          const key = r.join("\0");
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }),
      };
    });
  }

  function uppercaseAll() {
    onUpdateSheet((s) => ({ ...s, rows: s.rows.map((r) => r.map((c) => c.toUpperCase())) }));
  }

  function lowercaseAll() {
    onUpdateSheet((s) => ({ ...s, rows: s.rows.map((r) => r.map((c) => c.toLowerCase())) }));
  }

  function trimAll() {
    onUpdateSheet((s) => ({ ...s, rows: s.rows.map((r) => r.map((c) => c.trim().replace(/\s+/g, " "))) }));
  }

  function applyReplace() {
    onUpdateSheet((s) => ({
      ...s,
      rows: s.rows.map((r) =>
        r.map((c, ci) => (ci === replaceCol ? c.split(replaceFrom).join(replaceTo) : c))
      ),
    }));
    setModal(null);
    setReplaceFrom("");
    setReplaceTo("");
  }

  function applySplit() {
    onUpdateSheet((s) => {
      const colName = s.headers[splitCol] ?? `Col ${splitCol + 1}`;
      const allParts = s.rows.map((r) => (r[splitCol] ?? "").split(splitDelim));
      const maxParts = Math.max(...allParts.map((p) => p.length), 0);
      const newHeaders = [
        ...s.headers.slice(0, splitCol),
        ...Array.from({ length: maxParts }, (_, i) => `${colName}_${i + 1}`),
        ...s.headers.slice(splitCol + 1),
      ];
      const newTypes = [
        ...s.types.slice(0, splitCol),
        ...Array.from({ length: maxParts }, () => "text" as const),
        ...s.types.slice(splitCol + 1),
      ];
      const newRows = s.rows.map((r, ri) => {
        const parts = allParts[ri];
        const padded = [...parts, ...Array(maxParts - parts.length).fill("")];
        return [...r.slice(0, splitCol), ...padded, ...r.slice(splitCol + 1)];
      });
      return { headers: newHeaders, rows: newRows, types: newTypes };
    });
    setModal(null);
  }

  function toggleJoinCol(i: number) {
    setJoinCols((prev) =>
      prev.includes(i) ? prev.filter((c) => c !== i) : [...prev, i]
    );
  }

  function applyJoin() {
    if (joinCols.length < 2) return;
    const newName = joinNewName.trim() || joinCols.map((i) => headers[i] ?? `Col ${i + 1}`).join("+");
    onUpdateSheet((s) => {
      const newHeaders = [...s.headers.filter((_, i) => !joinCols.includes(i)), newName];
      const newTypes = [...s.types.filter((_, i) => !joinCols.includes(i)), "text" as const];
      const newRows = s.rows.map((r) => {
        const joined = joinCols.map((i) => r[i] ?? "").join(joinSep);
        return [...r.filter((_, i) => !joinCols.includes(i)), joined];
      });
      return { headers: newHeaders, rows: newRows, types: newTypes };
    });
    setModal(null);
    setJoinCols([]);
    setJoinNewName("");
  }

  function convertToNumber() {
    onUpdateSheet((s) => ({
      ...s,
      rows: s.rows.map((r) => r.map((c) => {
        const n = parseFloat(c.replace(",", "."));
        return isNaN(n) ? c : String(n);
      })),
    }));
  }

  function convertToDate() {
    onUpdateSheet((s) => ({
      ...s,
      rows: s.rows.map((r) => r.map((c) => {
        const d = normalizeDate(c);
        if (!d) return c;
        const dd = String(d.getDate()).padStart(2, "0");
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        return `${dd}/${mm}/${d.getFullYear()}`;
      })),
    }));
  }

  const actions = [
    { label: "Remover linhas vazias", fn: removeEmpty },
    { label: "Remover duplicados", fn: removeDuplicates },
    { label: "UPPERCASE", fn: uppercaseAll },
    { label: "lowercase", fn: lowercaseAll },
    { label: "Remover espaços extras", fn: trimAll },
    { label: "Substituir texto...", fn: () => setModal("replace") },
    { label: "Separar coluna...", fn: () => setModal("split") },
    { label: "Juntar colunas...", fn: () => setModal("join") },
    { label: "Texto para número", fn: convertToNumber },
    { label: "Texto para data (dd/mm/aaaa)", fn: convertToDate },
  ];

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Ações Rápidas</div>

      <div className="grid grid-cols-2 gap-1.5">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={a.fn}
            className="px-3 py-2 rounded text-[10px] border border-border text-foreground hover:border-brand/40 hover:bg-brand/5 hover:text-brand transition-colors text-left"
          >
            {a.label}
          </button>
        ))}
      </div>

      {modal === "replace" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded p-5 w-80 flex flex-col gap-3">
            <div className="text-xs font-medium">Substituir texto</div>
            <select
              value={replaceCol}
              onChange={(e) => setReplaceCol(+e.target.value)}
              className="bg-background border border-border rounded px-2 py-1.5 text-[10px] focus:outline-none focus:border-brand/50"
            >
              <option value={-1}>Todas as colunas</option>
              {headers.map((h, i) => <option key={i} value={i}>{h || `Col ${i + 1}`}</option>)}
            </select>
            <input
              value={replaceFrom}
              onChange={(e) => setReplaceFrom(e.target.value)}
              placeholder="De..."
              className="bg-background border border-border rounded px-2 py-1.5 text-[10px] focus:outline-none focus:border-brand/50 placeholder:text-muted-foreground/60"
            />
            <input
              value={replaceTo}
              onChange={(e) => setReplaceTo(e.target.value)}
              placeholder="Para..."
              className="bg-background border border-border rounded px-2 py-1.5 text-[10px] focus:outline-none focus:border-brand/50 placeholder:text-muted-foreground/60"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setModal(null)} className="px-3 py-1.5 rounded text-[10px] border border-border text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
              <button onClick={applyReplace} className="px-3 py-1.5 rounded text-[10px] bg-brand text-brand-foreground hover:bg-brand/90 transition-colors">Aplicar</button>
            </div>
          </div>
        </div>
      )}

      {modal === "split" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded p-5 w-80 flex flex-col gap-3">
            <div className="text-xs font-medium">Separar coluna por delimitador</div>
            <select
              value={splitCol}
              onChange={(e) => setSplitCol(+e.target.value)}
              className="bg-background border border-border rounded px-2 py-1.5 text-[10px] focus:outline-none focus:border-brand/50"
            >
              {headers.map((h, i) => <option key={i} value={i}>{h || `Col ${i + 1}`}</option>)}
            </select>
            <input
              value={splitDelim}
              onChange={(e) => setSplitDelim(e.target.value)}
              placeholder="Delimitador (ex: ; , |)"
              className="bg-background border border-border rounded px-2 py-1.5 text-[10px] focus:outline-none focus:border-brand/50 placeholder:text-muted-foreground/60"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setModal(null)} className="px-3 py-1.5 rounded text-[10px] border border-border text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
              <button onClick={applySplit} className="px-3 py-1.5 rounded text-[10px] bg-brand text-brand-foreground hover:bg-brand/90 transition-colors">Separar</button>
            </div>
          </div>
        </div>
      )}

      {modal === "join" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded p-5 w-80 flex flex-col gap-3">
            <div className="text-xs font-medium">Juntar colunas</div>
            <div className="flex flex-wrap gap-1.5">
              {headers.map((h, i) => (
                <button
                  key={i}
                  onClick={() => toggleJoinCol(i)}
                  className={`px-2 py-0.5 rounded text-[9px] border transition-colors ${
                    joinCols.includes(i) ? "border-brand/50 bg-brand/10 text-brand" : "border-border text-muted-foreground"
                  }`}
                >
                  {h || `Col ${i + 1}`}
                </button>
              ))}
            </div>
            <input
              value={joinSep}
              onChange={(e) => setJoinSep(e.target.value)}
              placeholder="Separador (ex: espaço, -)"
              className="bg-background border border-border rounded px-2 py-1.5 text-[10px] focus:outline-none focus:border-brand/50 placeholder:text-muted-foreground/60"
            />
            <input
              value={joinNewName}
              onChange={(e) => setJoinNewName(e.target.value)}
              placeholder="Nome da nova coluna (opcional)"
              className="bg-background border border-border rounded px-2 py-1.5 text-[10px] focus:outline-none focus:border-brand/50 placeholder:text-muted-foreground/60"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setModal(null); setJoinCols([]); }} className="px-3 py-1.5 rounded text-[10px] border border-border text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
              <button onClick={applyJoin} disabled={joinCols.length < 2} className="px-3 py-1.5 rounded text-[10px] bg-brand text-brand-foreground hover:bg-brand/90 disabled:opacity-50 transition-colors">Juntar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
