import { Plus, X } from "lucide-react";
import { FilterRule, ColType } from "./useExcelStore";

const TEXT_OPS = [
  { value: "contains", label: "Contém" },
  { value: "not_contains", label: "Não contém" },
  { value: "equals", label: "Igual a" },
  { value: "not_equals", label: "Diferente de" },
  { value: "starts_with", label: "Começa com" },
  { value: "ends_with", label: "Termina com" },
  { value: "empty", label: "Vazio" },
  { value: "not_empty", label: "Não vazio" },
];

const NUM_OPS = [
  { value: "equals", label: "=" },
  { value: "not_equals", label: "≠" },
  { value: "gt", label: ">" },
  { value: "lt", label: "<" },
  { value: "between", label: "Entre" },
  { value: "empty", label: "Vazio" },
  { value: "not_empty", label: "Não vazio" },
];

const DATE_OPS = [
  { value: "date_exact", label: "Data exata" },
  { value: "before", label: "Antes de" },
  { value: "after", label: "Depois de" },
  { value: "between_dates", label: "Entre datas" },
  { value: "month", label: "Mês (1-12)" },
  { value: "year", label: "Ano" },
  { value: "empty", label: "Vazio" },
  { value: "not_empty", label: "Não vazio" },
];

function getOps(type: ColType) {
  if (type === "number") return NUM_OPS;
  if (type === "date") return DATE_OPS;
  return TEXT_OPS;
}

interface Props {
  headers: string[];
  types: ColType[];
  filters: FilterRule[];
  filterLogic: "AND" | "OR";
  onFiltersChange: (f: FilterRule[]) => void;
  onLogicChange: (l: "AND" | "OR") => void;
}

export function ExcelFilters({ headers, types, filters, filterLogic, onFiltersChange, onLogicChange }: Props) {
  function addFilter() {
    const newFilter: FilterRule = {
      id: Date.now().toString(),
      col: 0,
      type: types[0] ?? "text",
      operator: "contains",
      value: "",
    };
    onFiltersChange([...filters, newFilter]);
  }

  function updateFilter(id: string, patch: Partial<FilterRule>) {
    onFiltersChange(filters.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function removeFilter(id: string) {
    onFiltersChange(filters.filter((f) => f.id !== id));
  }

  function handleColChange(id: string, colIdx: number) {
    const type = types[colIdx] ?? "text";
    const ops = getOps(type);
    updateFilter(id, { col: colIdx, type, operator: ops[0].value, value: "", value2: undefined });
  }

  const noValue = ["empty", "not_empty"];
  const twoValues = ["between", "between_dates"];

  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Filtros</span>
        {filters.length > 1 && (
          <div className="flex items-center gap-1">
            {(["AND", "OR"] as const).map((l) => (
              <button
                key={l}
                onClick={() => onLogicChange(l)}
                className={`px-1.5 py-0.5 rounded text-[9px] border transition-colors ${
                  filterLogic === l ? "border-brand/50 bg-brand/10 text-brand" : "border-border text-muted-foreground"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {filters.map((f) => {
          const ops = getOps(f.type);
          return (
            <div key={f.id} className="flex flex-col gap-1 p-2 bg-surface border border-border rounded">
              <div className="flex items-center gap-1">
                <select
                  value={f.col}
                  onChange={(e) => handleColChange(f.id, +e.target.value)}
                  className="flex-1 bg-background border border-border rounded px-1.5 py-0.5 text-[9px] focus:outline-none focus:border-brand/50"
                >
                  {headers.map((h, i) => (
                    <option key={i} value={i}>{h || `Col ${i + 1}`}</option>
                  ))}
                </select>
                <button onClick={() => removeFilter(f.id)} className="text-muted-foreground hover:text-red-400 transition-colors">
                  <X className="size-3" />
                </button>
              </div>
              <select
                value={f.operator}
                onChange={(e) => updateFilter(f.id, { operator: e.target.value })}
                className="bg-background border border-border rounded px-1.5 py-0.5 text-[9px] focus:outline-none focus:border-brand/50"
              >
                {ops.map((op) => (
                  <option key={op.value} value={op.value}>{op.label}</option>
                ))}
              </select>
              {!noValue.includes(f.operator) && (
                <input
                  value={f.value}
                  onChange={(e) => updateFilter(f.id, { value: e.target.value })}
                  placeholder={f.type === "date" ? "dd/mm/aaaa" : "Valor..."}
                  className="bg-background border border-border rounded px-1.5 py-0.5 text-[9px] focus:outline-none focus:border-brand/50 placeholder:text-muted-foreground/60"
                />
              )}
              {twoValues.includes(f.operator) && (
                <input
                  value={f.value2 ?? ""}
                  onChange={(e) => updateFilter(f.id, { value2: e.target.value })}
                  placeholder={f.type === "date" ? "dd/mm/aaaa" : "Até..."}
                  className="bg-background border border-border rounded px-1.5 py-0.5 text-[9px] focus:outline-none focus:border-brand/50 placeholder:text-muted-foreground/60"
                />
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={addFilter}
        className="flex items-center gap-1 px-2 py-1 rounded text-[9px] border border-dashed border-border text-muted-foreground hover:border-brand/40 hover:text-brand transition-colors"
      >
        <Plus className="size-3" />
        Adicionar filtro
      </button>

      {filters.length > 0 && (
        <button
          onClick={() => onFiltersChange([])}
          className="text-[9px] text-muted-foreground hover:text-red-400 transition-colors text-left"
        >
          Limpar todos
        </button>
      )}
    </div>
  );
}
