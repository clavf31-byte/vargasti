import { ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { obterTarefasServico } from "@/hooks/useServicoTarefas";

interface OrcamentoItemTarefasProps {
  servicoId?: string;
  isExpanded?: boolean;
}

export function OrcamentoItemTarefas({ servicoId, isExpanded: initialExpanded = false }: OrcamentoItemTarefasProps) {
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (servicoId && isExpanded) {
      carregarTarefas();
    }
  }, [servicoId, isExpanded]);

  async function carregarTarefas() {
    if (!servicoId) return;
    setLoading(true);
    const data = await obterTarefasServico(servicoId);
    setTarefas(data);
    setLoading(false);
  }

  if (!servicoId || tarefas.length === 0) return null;

  return (
    <>
      <tr>
        <td colSpan={5} className="px-3 py-0">
          <button
            onClick={() => {
              const newExpanded = !isExpanded;
              setIsExpanded(newExpanded);
              if (newExpanded && tarefas.length === 0) {
                carregarTarefas();
              }
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:bg-surface/50 transition-colors"
          >
            <ChevronDown
              className={`size-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
            <span className="font-medium">📋 {tarefas.length} tarefa{tarefas.length !== 1 ? "s" : ""} incluída{tarefas.length !== 1 ? "s" : ""}</span>
          </button>
        </td>
      </tr>

      {isExpanded && (
        <tr>
          <td colSpan={5} className="px-3 py-0">
            <div className="bg-blue-50 border-l-4 border-cyan-400 py-2 ml-8">
              {loading ? (
                <div className="text-xs text-muted-foreground px-3">Carregando tarefas...</div>
              ) : (
                <div className="space-y-1">
                  {tarefas.map((tarefa) => (
                    <div key={tarefa.id} className="flex items-start gap-2 px-3 text-xs text-foreground">
                      <span className="text-cyan-400 font-bold mt-0.5">✓</span>
                      <span>{tarefa.descricao}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
