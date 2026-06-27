import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OrcamentoItensTable } from "./OrcamentoItensTable";
import { OrcamentoItemForm } from "./OrcamentoItemForm";
import { useOrcamentoItens } from "@/hooks/useOrcamentoItens";
import { gerarNumeroOrcamento, previewNumeroOrcamento } from "@/hooks/useOrcamentoNumero";
import { X } from "lucide-react";

interface OrcamentoFormInlineProps {
  userId: string;
  clientes: Array<{ id: string; nome: string }>;
  onSuccess: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function OrcamentoFormInline({ userId, clientes, onSuccess, isOpen, onClose }: OrcamentoFormInlineProps) {
  const [formData, setFormData] = useState({
    numero_formatado: "",
    cliente_id: "",
    descricao: "",
    desconto: 0,
    impostos: 0,
    status_enum: "rascunho",
    data_vencimento: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const { itens, total, addItem, updateItem, removeItem, saveItens } = useOrcamentoItens();

  useEffect(() => {
    if (!isOpen) return;
    setFormData((f) => ({ ...f, numero_formatado: "" }));
    previewNumeroOrcamento(userId).then((num) =>
      setFormData((f) => ({ ...f, numero_formatado: num }))
    );
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const subtotal = total;
  const totalComDescontoEImpostos = Math.max(0, subtotal - formData.desconto + formData.impostos);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const numero = await gerarNumeroOrcamento(userId);
      const { error: insertError } = await supabase.from("orcamentos").insert([{
        numero,
        numero_formatado: numero,
        cliente_id: formData.cliente_id,
        notas: formData.descricao,
        total: totalComDescontoEImpostos,
        desconto: formData.desconto,
        impostos: formData.impostos,
        status: "rascunho",
        status_enum: formData.status_enum,
        data_vencimento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        user_id: userId,
      }]);
      if (insertError) throw insertError;

      const { data: createdOrc, error: fetchError } = await supabase
        .from("orcamentos").select("id").eq("numero_formatado", numero).eq("user_id", userId).single();
      if (fetchError) throw fetchError;

      if (itens.length > 0) await saveItens(createdOrc.id);

      setFormData({ numero_formatado: "", cliente_id: "", descricao: "", desconto: 0, impostos: 0, status_enum: "rascunho", data_vencimento: "" });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar orçamento");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-graphite p-6">
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">Criar Novo Orçamento</h2>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="size-5" />
        </button>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Número</label>
            <input
              type="text"
              value={formData.numero_formatado || "Gerando..."}
              disabled
              className="input-base w-full opacity-50 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Cliente *</label>
            <select
              value={formData.cliente_id}
              onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
              className="input-base w-full"
              required
            >
              <option value="">Selecione um cliente</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Descrição</label>
          <textarea
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            rows={3}
            className="input-base w-full resize-y"
          />
        </div>

        <OrcamentoItensTable
          itens={itens}
          onAddItem={() => setShowItemForm(true)}
          onUpdateItem={updateItem}
          onRemoveItem={removeItem}
        />

        {showItemForm && (
          <OrcamentoItemForm
            onAdd={(item) => {
              addItem();
              const lastIdx = itens.length;
              updateItem(lastIdx, item);
              setShowItemForm(false);
            }}
            onClose={() => setShowItemForm(false)}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Desconto (R$)</label>
            <input
              type="number"
              step="0.01"
              value={formData.desconto}
              onChange={(e) => setFormData({ ...formData, desconto: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              className="input-base w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Impostos (R$)</label>
            <input
              type="number"
              step="0.01"
              value={formData.impostos}
              onChange={(e) => setFormData({ ...formData, impostos: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              className="input-base w-full"
            />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Este orçamento terá validade de <strong className="text-foreground">7 dias</strong> a partir da criação.
        </p>

        <div className="rounded-lg p-4 bg-select/5 border border-select/20 grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Subtotal</div>
            <div className="text-base font-semibold text-foreground">R$ {subtotal.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Desconto</div>
            <div className="text-base font-semibold text-destructive">-R$ {formData.desconto.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Impostos</div>
            <div className="text-base font-semibold text-warning">+R$ {formData.impostos.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Total Geral</div>
            <div className="text-xl font-bold text-select">R$ {totalComDescontoEImpostos.toFixed(2)}</div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border rounded-lg text-sm text-foreground hover:bg-surface-2 transition-colors">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !formData.cliente_id}
            className="flex-1 py-2.5 bg-brand text-brand-foreground rounded-lg text-sm font-semibold hover:bg-brand/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Criando..." : "Criar Orçamento"}
          </button>
        </div>
      </form>
    </div>
  );
}
