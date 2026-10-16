import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { obterModelos } from "@/hooks/useOrcamentoModelos";

interface ModeloSelectorModalProps {
  userId: string;
  onSelect: (itens: any[]) => void;
  onClose: () => void;
}

export function ModeloSelectorModal({ userId, onSelect, onClose }: ModeloSelectorModalProps) {
  const [modelos, setModelos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarModelos();
  }, [userId]);

  async function carregarModelos() {
    setLoading(true);
    const data = await obterModelos(userId);
    setModelos(data);
    setLoading(false);
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="card-graphite p-6 w-full max-w-500px max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Usar Modelo de Orçamento
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-8">
            Carregando modelos...
          </div>
        ) : modelos.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>Nenhum modelo criado.</p>
            <p className="text-xs mt-2">
              Acesse <strong>Modelos de Orçamento</strong> para criar um.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {modelos.map((modelo) => (
              <button
                key={modelo.id}
                onClick={() => {
                  onSelect(modelo.itens || []);
                  onClose();
                }}
                className="w-full text-left p-3 border border-border rounded-lg hover:bg-surface/50 hover:border-select/30 transition-colors"
              >
                <div className="font-medium text-foreground">{modelo.nome}</div>
                {modelo.descricao && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {modelo.descricao}
                  </div>
                )}
                {modelo.itens && modelo.itens.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                    {modelo.itens.map((item: any, idx: number) => (
                      <div key={idx}>✓ {item.descricao}</div>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
