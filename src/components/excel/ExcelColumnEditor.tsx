import { useState } from "react";
import { Eye, EyeOff, Trash2, Copy, Plus, Edit2, Check, X } from "lucide-react";
import { ColType, SheetData, detectColType } from "./useExcelStore";

interface Props {
  sheetData: SheetData;
  visibleCols: Record<number, boolean>;
  colRenames: Record<number, string>;
  onToggleCol: (i: number) => void;
  onRenameCol: (i: number, name: string) => void;
  onUpdateSheet: (updater: (s: SheetData) => SheetData) => void;
  onRenamesChange: (r: Record<number, string>) => void;
}

export function ExcelColumnEditor({
  sheetData,
  visibleCols,
  colRenames,
  onToggleCol,
  onRenameCol,
  onUpdateSheet,
  onRenamesChange,
}: Props) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingVal, setEditingVal] = useState("");
  const [newColName, setNewColName] = useState("");

  const { headers, rows, types } = sheetData;

  function startEdit(i: number) {
    setEditingIdx(i);
    setEditingVal(colRenames[i] ?? headers[i] ?? `Col ${i + 1}`);
  }

  function confirmRename(i: number) {
    onRenameCol(i, editingVal);
    setEditingIdx(null);
  }

  function deleteCol(i: number) {
    onUpdateSheet((s) => ({
      headers: s.headers.filter((_, ci) => ci !== i),
      rows: s.rows.map((r) => r.filter((_, ci) => ci !== i)),
      types: s.types.filter((_, ci) => ci !== i),
    }));
    const newRenames: Record<number, string> = {};
    Object.entries(colRenames).forEach(([k, v]) => {
      const ki = +k;
      if (ki < i) newRenames[ki] = v;
      else if (ki > i) newRenames[ki - 1] = v;
    });
    onRenamesChange(newRenames);
  }

  function duplicateCol(i: number) {
    const name = colRenames[i] ?? headers[i] ?? `Col ${i + 1}`;
    onUpdateSheet((s) => ({
      headers: [...s.headers.slice(0, i + 1), `${name}_cópia`, ...s.headers.slice(i + 1)],
      rows: s.rows.map((r) => [...r.slice(0, i + 1), r[i] ?? "", ...r.slice(i + 1)]),
      types: [...s.types.slice(0, i + 1), s.types[i] ?? "text", ...s.types.slice(i + 1)],
    }));
    const newRenames: Record<number, string> = {};
    Object.entries(colRenames).forEach(([k, v]) => {
      const ki = +k;
      if (ki <= i) newRenames[ki] = v;
      else newRenames[ki + 1] = v;
    });
    onRenamesChange(newRenames);
  }

  function changeType(i: number, t: ColType) {
    onUpdateSheet((s) => {
      const newTypes = [...s.types];
      newTypes[i] = t;
      return { ...s, types: newTypes };
    });
  }

  function addColumn() {
    if (!newColName.trim()) return;
    onUpdateSheet((s) => ({
      headers: [...s.headers, newColName.trim()],
      rows: s.rows.map((r) => [...r, ""]),
      types: [...s.types, "text"],
    }));
    setNewColName("");
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Colunas</div>

      <div className="flex flex-col gap-1.5">
        {headers.map((h, i) => {
          const display = colRenames[i] ?? (h || `Col ${i + 1}`);
          const visible = visibleCols[i] ?? true;
          return (
            <div key={i} className="flex items-center gap-2 p-2 bg-surface border border-border rounded">
              <button onClick={() => onToggleCol(i)} className="text-muted-foreground hover:text-foreground transition-colors">
                {visible ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
              </button>

              <div className="flex-1 min-w-0">
                {editingIdx === i ? (
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      value={editingVal}
                      onChange={(e) => setEditingVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") confirmRename(i);
                        if (e.key === "Escape") setEditingIdx(null);
                      }}
                      className="bg-background border border-brand/50 rounded px-1 py-0.5 text-[9px] focus:outline-none flex-1"
                    />
                    <button onClick={() => confirmRename(i)} className="text-brand"><Check className="size-2.5" /></button>
                    <button onClick={() => setEditingIdx(null)} className="text-muted-foreground"><X className="size-2.5" /></button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEdit(i)}
                    className="flex items-center gap-1 group text-[10px] text-foreground truncate w-full"
                  >
                    <span className="truncate">{display}</span>
                    <Edit2 className="size-2.5 shrink-0 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-opacity" />
                  </button>
                )}
              </div>

              <select
                value={types[i] ?? "text"}
                onChange={(e) => changeType(i, e.target.value as ColType)}
                className="bg-background border border-border rounded px-1 py-0.5 text-[8px] focus:outline-none focus:border-brand/50"
              >
                <option value="text">texto</option>
                <option value="number">número</option>
                <option value="date">data</option>
              </select>

              <button onClick={() => duplicateCol(i)} className="text-muted-foreground hover:text-foreground transition-colors" title="Duplicar">
                <Copy className="size-3" />
              </button>
              <button onClick={() => deleteCol(i)} className="text-muted-foreground hover:text-red-400 transition-colors" title="Excluir">
                <Trash2 className="size-3" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-border">
        <input
          value={newColName}
          onChange={(e) => setNewColName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addColumn(); }}
          placeholder="Nome da nova coluna..."
          className="flex-1 bg-background border border-border rounded px-2 py-1 text-[10px] focus:outline-none focus:border-brand/50 placeholder:text-muted-foreground/60"
        />
        <button
          onClick={addColumn}
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-brand text-brand-foreground hover:bg-brand/90 transition-colors"
        >
          <Plus className="size-3" />
          Criar
        </button>
      </div>
    </div>
  );
}
