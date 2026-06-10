import { useState, useRef, useEffect } from "react";
import { Bot, Send, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { FilterRule, SheetData } from "./useExcelStore";
import { runExcelAgent, AgentAction } from "@/lib/api/excelAgent.functions";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: AgentAction[];
};

const ACTION_LABELS: Record<string, string> = {
  sort: "Ordenado",
  filter: "Filtrado",
  clear_filters: "Filtros removidos",
  add_column: "Coluna adicionada",
  update_cells: "Células atualizadas",
  switch_sheet: "Aba alterada",
  summarize: "Resumo gerado",
};

interface Props {
  sheetData: SheetData;
  allSheetData: Record<string, SheetData>;
  sheetNames: string[];
  activeSheet: string;
  totalRows: number;
  onSort: (colIndex: number, direction: "asc" | "desc") => void;
  onFilter: (filters: FilterRule[], logic: "AND" | "OR") => void;
  onClearFilters: () => void;
  onAddColumn: (name: string, values: string[]) => void;
  onUpdateCells: (changes: { row: number; col: number; value: string }[]) => void;
  onSwitchSheet: (name: string) => void;
}

export function ExcelAgent({
  sheetData,
  allSheetData,
  sheetNames,
  activeSheet,
  totalRows,
  onSort,
  onFilter,
  onClearFilters,
  onAddColumn,
  onUpdateCells,
  onSwitchSheet,
}: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const allSheetsMeta = sheetNames.map((n) => ({
        name: n,
        rows: allSheetData[n]?.rows.length ?? 0,
        cols: allSheetData[n]?.headers.length ?? 0,
      }));

      const result = await runExcelAgent({
        data: {
          headers: sheetData.headers,
          types: sheetData.types,
          rows: sheetData.rows,
          totalRows,
          message: userMsg.content,
          history,
          activeSheet,
          allSheets: allSheetsMeta,
        },
      });

      for (const action of result.actions ?? []) {
        applyAction(action, { onSort, onFilter, onClearFilters, onAddColumn, onUpdateCells, onSwitchSheet });
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: result.text || "Ação executada.",
          actions: result.actions,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Erro: ${err instanceof Error ? err.message : "Falha ao comunicar com o agente."}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const suggestions = [
    `Ordene por "${sheetData.headers[0] ?? "coluna"}"`,
    "Filtre linhas com valores vazios",
    "Mostre um resumo dos dados",
  ];

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="size-10 rounded-full bg-brand/10 border border-brand/20 grid place-items-center">
              <Sparkles className="size-5 text-brand" />
            </div>
            <div>
              <p className="text-xs text-foreground">Agente de Planilha</p>
              <p className="text-[10px] text-muted-foreground mt-1 max-w-xs">
                Descreva o que quer fazer. Ex: "Filtre onde valor maior que 100", "Ordene por data",
                "Adicione coluna com total".
              </p>
            </div>
            <div className="flex flex-col gap-1.5 w-full max-w-xs">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setInput(s);
                    inputRef.current?.focus();
                  }}
                  className="text-[10px] text-left px-3 py-2 rounded border border-border hover:border-brand/30 hover:bg-brand/5 text-muted-foreground hover:text-brand transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded px-3 py-2 text-[11px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-brand text-white"
                  : "bg-surface border border-border text-foreground"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1 mb-1.5">
                  <Bot className="size-3 text-brand" />
                  <span className="text-[9px] text-brand uppercase tracking-widest">agente</span>
                </div>
              )}
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.actions && msg.actions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {msg.actions.map((a, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand/10 border border-brand/20 rounded text-[9px] text-brand"
                    >
                      ✓ {ACTION_LABELS[a.type] ?? a.type}
                      {a.type === "add_column" && ` "${a.name}"`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface border border-border rounded px-3 py-2 flex items-center gap-2">
              <Loader2 className="size-3 text-brand animate-spin" />
              <span className="text-[10px] text-muted-foreground">Processando...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border p-3 shrink-0">
        <div className="flex gap-2 items-end">
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              title="Limpar conversa"
              className="p-1.5 rounded border border-border text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <RotateCcw className="size-3" />
            </button>
          )}
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Descreva o que fazer com os dados..."
            rows={2}
            className="flex-1 bg-background border border-border rounded px-3 py-2 text-[11px] focus:outline-none focus:border-brand/50 placeholder:text-muted-foreground resize-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-2 rounded bg-brand text-white hover:bg-brand/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <Send className="size-3.5" />
          </button>
        </div>
        <p className="text-[9px] text-muted-foreground mt-1.5">
          {totalRows} linhas · {sheetData.headers.length} colunas · Enter para enviar
        </p>
      </div>
    </div>
  );
}

type Callbacks = {
  onSort: (colIndex: number, direction: "asc" | "desc") => void;
  onFilter: (filters: FilterRule[], logic: "AND" | "OR") => void;
  onClearFilters: () => void;
  onAddColumn: (name: string, values: string[]) => void;
  onUpdateCells: (changes: { row: number; col: number; value: string }[]) => void;
  onSwitchSheet: (name: string) => void;
};

function applyAction(action: AgentAction, cb: Callbacks) {
  switch (action.type) {
    case "sort":
      cb.onSort(action.colIndex, action.direction);
      break;
    case "filter":
      cb.onFilter(
        action.filters.map((f) => ({
          id: f.id,
          col: f.col,
          type: f.type,
          operator: f.operator,
          value: f.value,
        })),
        action.logic,
      );
      break;
    case "clear_filters":
      cb.onClearFilters();
      break;
    case "add_column":
      cb.onAddColumn(action.name, action.values);
      break;
    case "update_cells":
      cb.onUpdateCells(action.changes);
      break;
    case "switch_sheet":
      cb.onSwitchSheet(action.sheetName);
      break;
  }
}
