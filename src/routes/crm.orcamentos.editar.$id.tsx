import client from "@/config/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/shared";
import { OrcamentoItensTable } from "@/components/crm/OrcamentoItensTable";
import { OrcamentoItemForm } from "@/components/crm/OrcamentoItemForm";
import { useOrcamentoItens } from "@/hooks/useOrcamentoItens";
import { ChevronLeft, FileEdit } from "lucide-react";

export const Route = createFileRoute("/crm/orcamentos/editar/$id")({
  head: () => ({ meta: [{ title: `Editar Orçamento · CRM ${client.name}` }] }),
  component: EditarOrcamentoPage,
});

type Orcamento = {
  id: string;
  numero_formatado: string;
  cliente_id: string;
  total: number;
  desconto?: number;
  impostos?: number;
  data_vencimento: string;
  notas: string;
  status_enum: string;
};

function EditarOrcamentoPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = Route.useParams();

  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [clientes, setClientes] = useState<Array<{ id: string; nome: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const { itens, total: subtotal, addItem, updateItem, removeItem, saveItens } = useOrcamentoItens(id);

  const [formData, setFormData] = useState({
    cliente_id: "",
    status_enum: "rascunho",
    desconto: 0,
    impostos: 0,
    data_vencimento: "",
    notas: "",
  });

  const totalFinal = Math.max(0, subtotal - formData.desconto + formData.impostos);

  useEffect(() => { if (!user || !id) return; loadData(); }, [user, id]);

  async function loadData() {
    setLoading(true);
    try {
      const [orcRes, clientRes] = await Promise.all([
        supabase.from("orcamentos").select("*").eq("id", id).eq("user_id", user!.id).single(),
        supabase.from("clientes").select("id, nome").eq("user_id", user!.id).order("nome"),
      ]);
      if (orcRes.error) throw orcRes.error;
      const orc = orcRes.data as Orcamento;
      setOrcamento(orc);
      setClientes(clientRes.data || []);
      setFormData({
        cliente_id: orc.cliente_id || "",
        status_enum: orc.status_enum || "rascunho",
        desconto: orc.desconto || 0,
        impostos: orc.impostos || 0,
        data_vencimento: orc.data_vencimento || "",
        notas: orc.notas || "",
      });
    } catch (err) {
      setError("Erro ao carregar orçamento");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.cliente_id) { setError("Selecione um cliente"); return; }
    setSaving(true);
    setError(null);
    setMessage(null);

    const aprovandoAgora = formData.status_enum === "aprovado" && orcamento?.status_enum !== "aprovado";

    try {
      await saveItens(id);

      const { error: err } = await supabase
        .from("orcamentos")
        .update({
          cliente_id: formData.cliente_id,
          status: formData.status_enum,
          status_enum: formData.status_enum,
          desconto: formData.desconto,
          impostos: formData.impostos,
          data_vencimento: formData.data_vencimento || null,
          notas: formData.notas,
          total: totalFinal,
        })
        .eq("id", id)
        .eq("user_id", user!.id);

      if (err) throw err;

      if (aprovandoAgora) {
        try {
          const { data: existing } = await supabase.from("pagamentos").select("id").eq("orcamento_id", id).maybeSingle();
          if (!existing) {
            await supabase.from("pagamentos").insert({
              orcamento_id: id,
              user_id: user!.id,
              valor: totalFinal,
              status: "pendente",
              data_pagamento: new Date().toISOString().split("T")[0],
              referencia: orcamento!.numero_formatado,
            });
          }
        } catch (_) {}
      }

      setMessage("Orçamento atualizado com sucesso!");
      setTimeout(() => navigate({ to: `/crm/orcamentos/${id}` }), 1200);
    } catch (err) {
      setError("Erro ao salvar orçamento");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <AppShell><div className="p-6 text-sm text-muted-foreground">Carregando...</div></AppShell>;
  }

  if (!orcamento) {
    return <AppShell><div className="p-6 text-sm text-destructive">Orçamento não encontrado</div></AppShell>;
  }

  return (
    <AppShell>
      <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">
        <button
          onClick={() => navigate({ to: `/crm/orcamentos/${id}` })}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-select hover:text-select/80 transition-colors"
        >
          <ChevronLeft className="size-4" /> Voltar
        </button>

        <PageHeader category="CRM" title="Editar Orçamento" icon={FileEdit} subtitle={orcamento.numero_formatado} />

        <form onSubmit={handleSave} className="space-y-4">
          <div className="card-graphite p-6 space-y-4">
            {error && <div className="px-3 py-2 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg">{error}</div>}
            {message && <div className="px-3 py-2 text-sm text-brand bg-brand/10 border border-brand/30 rounded-lg">{message}</div>}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Cliente *</label>
                <select value={formData.cliente_id} onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })} className="input-base w-full" required>
                  <option value="">Selecione um cliente</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Status</label>
                <select value={formData.status_enum} onChange={(e) => setFormData({ ...formData, status_enum: e.target.value })} className="input-base w-full">
                  <option value="rascunho">Rascunho</option>
                  <option value="enviado">Enviado</option>
                  <option value="aprovado">Aprovado</option>
                  <option value="rejeitado">Rejeitado</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Descrição / Notas</label>
              <textarea value={formData.notas} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} rows={3} className="input-base w-full resize-y" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Desconto (R$)</label>
                <input type="number" step="0.01" min="0" value={formData.desconto} onChange={(e) => setFormData({ ...formData, desconto: parseFloat(e.target.value) || 0 })} className="input-base w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Impostos (R$)</label>
                <input type="number" step="0.01" min="0" value={formData.impostos} onChange={(e) => setFormData({ ...formData, impostos: parseFloat(e.target.value) || 0 })} className="input-base w-full" />
              </div>
            </div>
          </div>

          <div className="card-graphite p-6">
            <OrcamentoItensTable itens={itens} onAddItem={() => setShowItemForm(true)} onUpdateItem={updateItem} onRemoveItem={removeItem} />
          </div>

          <div className="card-graphite p-4 grid grid-cols-4 gap-4">
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
              <div className="text-base font-semibold text-foreground">+R$ {formData.impostos.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Total</div>
              <div className="text-xl font-bold text-select">R$ {totalFinal.toFixed(2)}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => navigate({ to: `/crm/orcamentos/${id}` })} className="flex-1 py-2.5 border border-border rounded-lg text-sm text-foreground hover:bg-surface-2 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-brand text-brand-foreground rounded-lg text-sm font-semibold hover:bg-brand/90 disabled:opacity-50 transition-colors">
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>

        {showItemForm && (
          <OrcamentoItemForm
            onAdd={(item) => { addItem(); updateItem(itens.length, item); setShowItemForm(false); }}
            onClose={() => setShowItemForm(false)}
          />
        )}
      </div>
    </AppShell>
  );
}
