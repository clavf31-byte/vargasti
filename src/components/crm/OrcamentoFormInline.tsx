import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { OrcamentoItensTable } from "./OrcamentoItensTable";
import { OrcamentoItemForm } from "./OrcamentoItemForm";
import { ModeloSelectorModal } from "./ModeloSelectorModal";
import { useOrcamentoItens } from "@/hooks/useOrcamentoItens";
import { gerarNumeroOrcamento, previewNumeroOrcamento } from "@/hooks/useOrcamentoNumero";
import { X, Copy } from "lucide-react";

interface OrcamentoFormInlineProps {
  userId: string;
  clientes: Array<{ id: string; nome: string }>;
  onSuccess: () => void;
  isOpen: boolean;
  onClose: () => void;
  atendimento_id?: string;
  cliente_id_pre?: string;
}

export function OrcamentoFormInline({ userId, clientes, onSuccess, isOpen, onClose, atendimento_id, cliente_id_pre }: OrcamentoFormInlineProps) {
  const [formData, setFormData] = useState({
    numero_formatado: "",
    cliente_id: "",
    descricao: "",
    observacoes: "",
    local: "",
    data_agendamento: "",
    resumo_executivo: "",
    desconto: 0,
    impostos: 0,
    status_enum: "rascunho",
    data_vencimento: "",
  });
  const [orcamento_id, setOrcamento_id] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [showModeloSelector, setShowModeloSelector] = useState(false);
  const { itens, total, addItem, updateItem, removeItem, saveItens } = useOrcamentoItens();

  useEffect(() => {
    if (!isOpen) return;
    setFormData((f) => ({ ...f, numero_formatado: "", cliente_id: cliente_id_pre || "" }));
    setOrcamento_id(null);
    previewNumeroOrcamento(userId).then((num) =>
      setFormData((f) => ({ ...f, numero_formatado: num }))
    );
  }, [isOpen, userId, cliente_id_pre]);

  // Auto-save rascunho ao selecionar cliente
  const handleClienteChange = async (novoClienteId: string) => {
    setFormData((f) => ({ ...f, cliente_id: novoClienteId }));

    // Se já existe rascunho, não cria novo
    if (orcamento_id || !novoClienteId) return;

    try {
      const numero = await gerarNumeroOrcamento(userId);
      const { data: createdOrc, error: insertError } = await supabase.from("orcamentos").insert([{
        numero,
        numero_formatado: numero,
        cliente_id: novoClienteId,
        descricao: "",
        observacoes: "",
        local: "",
        data_agendamento: null,
        notas: "",
        resumo_executivo: "",
        total: 0,
        desconto: 0,
        impostos: 0,
        status: "rascunho",
        status_enum: "rascunho",
        data_vencimento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        user_id: userId,
        atendimento_id: atendimento_id || null,
      }]).select();

      if (insertError) throw insertError;
      if (createdOrc && createdOrc[0]) {
        setOrcamento_id(createdOrc[0].id);
      }
    } catch (err) {
      console.error("Erro ao criar rascunho:", err);
    }
  };

  // Usar modelo - carrega itens do modelo
  const handleUsarModelo = (modeloItens: any[]) => {
    for (const item of modeloItens) {
      addItem();
      const idx = itens.length;
      updateItem(idx, item);
    }
    setShowModeloSelector(false);
  };

  const subtotal = total;
  const totalComDescontoEImpostos = Math.max(0, subtotal - formData.desconto + formData.impostos);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const orc_id = orcamento_id || null;

      if (orc_id) {
        // Atualizar rascunho existente
        const { error: updateError } = await supabase
          .from("orcamentos")
          .update({
            descricao: formData.descricao,
            observacoes: formData.observacoes,
            local: formData.local,
            data_agendamento: formData.data_agendamento || null,
            notas: formData.descricao,
            resumo_executivo: formData.resumo_executivo,
            total: totalComDescontoEImpostos,
            desconto: formData.desconto,
            impostos: formData.impostos,
          })
          .eq("id", orc_id);

        if (updateError) throw updateError;
        if (itens.length > 0) await saveItens(orc_id);
      } else {
        // Criar novo se não existir rascunho
        const numero = await gerarNumeroOrcamento(userId);
        const { error: insertError } = await supabase.from("orcamentos").insert([{
          numero,
          numero_formatado: numero,
          cliente_id: formData.cliente_id,
          descricao: formData.descricao,
          observacoes: formData.observacoes,
          local: formData.local,
          data_agendamento: formData.data_agendamento || null,
          notas: formData.descricao,
          resumo_executivo: formData.resumo_executivo,
          total: totalComDescontoEImpostos,
          desconto: formData.desconto,
          impostos: formData.impostos,
          status: "rascunho",
          status_enum: formData.status_enum,
          data_vencimento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          user_id: userId,
          atendimento_id: atendimento_id || null,
        }]);
        if (insertError) throw insertError;

        const { data: createdOrc, error: fetchError } = await supabase
          .from("orcamentos").select("id").eq("numero_formatado", numero).eq("user_id", userId).single();
        if (fetchError) throw fetchError;

        if (itens.length > 0) await saveItens(createdOrc.id);
      }

      setFormData({ numero_formatado: "", cliente_id: "", descricao: "", observacoes: "", local: "", data_agendamento: "", resumo_executivo: "", desconto: 0, impostos: 0, status_enum: "rascunho", data_vencimento: "" });
      setOrcamento_id(null);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar orçamento");
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
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Cliente * {orcamento_id && <span className="text-xs text-brand">(rascunho criado)</span>}</label>
            <select
              value={formData.cliente_id}
              onChange={(e) => handleClienteChange(e.target.value)}
              className="input-base w-full"
              required
            >
              <option value="">Selecione um cliente</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Descrição do Problema *</label>
          <textarea
            value={formData.descricao}
            onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
            rows={3}
            className="input-base w-full resize-y"
            placeholder="Descreva o problema, defeito ou necessidade..."
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Observações Adicionais</label>
          <textarea
            value={formData.observacoes}
            onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
            rows={2}
            className="input-base w-full resize-y"
            placeholder="Notas técnicas, histórico, limitações, etc..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Local</label>
            <input
              type="text"
              value={formData.local}
              onChange={(e) => setFormData({ ...formData, local: e.target.value })}
              placeholder="Ex: Escritório, Casa do cliente, etc..."
              className="input-base w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Data de Agendamento</label>
            <input
              type="date"
              value={formData.data_agendamento}
              onChange={(e) => setFormData({ ...formData, data_agendamento: e.target.value })}
              className="input-base w-full"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Resumo Executivo (aparece na tela de aprovação)
          </label>
          <textarea
            value={formData.resumo_executivo}
            onChange={(e) => setFormData({ ...formData, resumo_executivo: e.target.value })}
            rows={2}
            className="input-base w-full resize-y"
            placeholder="Ex: Seu notebook vai funcionar novamente. Vamos reparar o carregador danificado e fazer testes."
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            💡 Se deixar vazio, será gerado automaticamente a partir dos itens
          </p>
        </div>

        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowModeloSelector(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-muted-foreground border border-border rounded-lg hover:bg-surface-2 transition-colors"
          >
            <Copy className="size-3.5" /> Usar Modelo
          </button>
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

      {showModeloSelector && (
        <ModeloSelectorModal
          userId={userId}
          onSelect={handleUsarModelo}
          onClose={() => setShowModeloSelector(false)}
        />
      )}
    </div>
  );
}
