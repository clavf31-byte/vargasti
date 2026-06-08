import { useState } from "react";
import { ArrowUp, ArrowDown, ChevronsUpDown, Check, X } from "lucide-react";
import { ColType } from "./useExcelStore";

interface Props {
  headers: string[];
  displayHeaders: string[];
  types: ColType[];
  rows: string[][];
  originalIndices: number[];
  editedCells: Set<string>;
  visibleCols: Record<number, boolean>;
  sortCol: number | null;
  sortDir: "asc" | "desc";
  procvNotFoundRows: Set<number>;
  onSortChange: (col: number) => void;
  onCellEdit: (row: number, col: number, value: string) => void;
}

export function ExcelTable({
  headers,
  displayHeaders,
  types,
  rows,
  originalIndices,
  editedCells,
  visibleCols,
  sortCol,
  sortDir,
  procvNotFoundRows,
  onSortChange,
  onCellEdit,
}: Props) {
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editingValue, setEditingValue] = useState("");

  function startEdit(row: number, col: number, value: string) {
    setEditingCell({ row, col });
    setEditingValue(value);
  }

  function confirmEdit(origRow: number, col: number) {
    onCellEdit(origRow, col, editingValue);
    setEditingCell(null);
  }

  function cancelEdit() {
    setEditingCell(null);
  }

  const visibleIdxs = headers.map((_, i) => i).filter((i) => visibleCols[i] ?? true);

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-left text-[10px] border-collapse">
        <thead className="bg-surface sticky top-0 z-10">
          <tr>
            <th className="px-2 py-1.5 text-muted-foreground border-b border-r border-border w-8 text-right text-[9px]">#</th>
            {visibleIdxs.map((ci) => (
              <th key={ci} className="px-2 py-1.5 border-b border-r border-border whitespace-nowrap">
                <button
                  className="flex items-center gap-1 group text-left"
                  onClick={() => onSortChange(ci)}
                >
                  <span className="text-muted-foreground uppercase tracking-wider text-[9px]">
                    {displayHeaders[ci]}
                  </span>
                  <span className="text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors">
                    {sortCol === ci ? (
                      sortDir === "asc" ? <ArrowUp className="size-2.5" /> : <ArrowDown className="size-2.5" />
                    ) : (
                      <ChevronsUpDown className="size-2.5" />
                    )}
                  </span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, ri) => {
            const origIdx = originalIndices[ri];
            const isNotFound = procvNotFoundRows.has(origIdx);
            return (
              <tr
                key={ri}
                className={`hover:bg-surface/50 transition-colors ${isNotFound ? "bg-red-500/5" : ""}`}
              >
                <td className="px-2 py-1 text-muted-foreground text-right text-[9px] border-r border-border">
                  {origIdx + 1}
                </td>
                {visibleIdxs.map((ci) => {
                  const cellKey = `${origIdx}-${ci}`;
                  const isEdited = editedCells.has(cellKey);
                  const isEditing = editingCell?.row === ri && editingCell?.col === ci;
                  return (
                    <td
                      key={ci}
                      className={`px-2 py-1 max-w-[200px] border-r border-border ${isEdited ? "bg-brand/5" : ""}`}
                      onDoubleClick={() => startEdit(ri, ci, row[ci] ?? "")}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            autoFocus
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") confirmEdit(origIdx, ci);
                              if (e.key === "Escape") cancelEdit();
                            }}
                            className="bg-background border border-brand/50 rounded px-1 py-0.5 text-[10px] text-brand focus:outline-none w-full min-w-[80px]"
                          />
                          <button onClick={() => confirmEdit(origIdx, ci)} className="text-brand">
                            <Check className="size-2.5" />
                          </button>
                          <button onClick={cancelEdit} className="text-muted-foreground">
                            <X className="size-2.5" />
                          </button>
                        </div>
                      ) : (
                        <span className={`truncate block ${isEdited ? "text-brand" : "text-foreground"}`}>
                          {row[ci] ?? ""}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="flex items-center justify-center h-32 text-[10px] text-muted-foreground">
          Nenhuma linha encontrada.
        </div>
      )}
    </div>
  );
}
