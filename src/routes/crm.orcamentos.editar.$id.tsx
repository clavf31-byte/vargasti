import client from "@/config/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader, Card, Button } from "@/components/ui";
import { OrcamentoItensTable } from "@/components/crm/OrcamentoItensTable";
import { OrcamentoItemForm } from "@/components/crm/OrcamentoItemForm";
import { useOrcamentoItens } from "@/hooks/useOrcamentoItens";
import { colors, spacing, borderRadius } from "@/lib/colors";
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

  useEffect(() => {
    if (!user || !id) return;
    loadData();
  }, [user, id]);

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
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.cliente_id) {
      setError("Selecione um cliente");
      return;
    }
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

      // Cria pagamento pendente ao aprovar (fallback frontend; trigger no banco também faz isso)
      if (aprovandoAgora) {
        try {
          const { data: existing } = await supabase
            .from("pagamentos")
            .select("id")
            .eq("orcamento_id", id)
            .maybeSingle();

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
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%",
    padding: spacing.md,
    background: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    color: colors.text,
    fontSize: "14px",
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    display: "block" as const,
    fontSize: "14px",
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: 600 as const,
  };

  if (loading) {
    return (
      <AppShell>
        <div style={{ padding: spacing.xl }}>
          <p style={{ color: colors.textSecondary }}>Carregando...</p>
        </div>
      </AppShell>
    );
  }

  if (!orcamento) {
    return (
      <AppShell>
        <div style={{ padding: spacing.xl }}>
          <p style={{ color: colors.error }}>Orçamento não encontrado</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ padding: spacing.xl, maxWidth: "900px", margin: "0 auto" }}>
        <button
          onClick={() => navigate({ to: `/crm/orcamentos/${id}` })}
          style={{
            display: "flex",
            alignItems: "center",
            gap: spacing.sm,
            background: "transparent",
            border: "none",
            color: colors.primary,
            cursor: "pointer",
            marginBottom: spacing.lg,
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          <ChevronLeft size={18} />
          Voltar
        </button>

        <PageHeader title="Editar Orçamento" subtitle={orcamento.numero_formatado} icon={<FileEdit size={32} color={colors.primary} />} />

        <form onSubmit={handleSave}>
          <Card style={{ marginBottom: spacing.lg }}>
            {error && (
              <div style={{ background: "rgba(211,47,47,0.1)", border: `1px solid ${colors.error}`, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.lg, color: colors.error, fontSize: "14px" }}>
                {error}
              </div>
            )}
            {message && (
              <div style={{ background: "rgba(76,175,80,0.1)", border: `1px solid ${colors.success}`, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.lg, color: colors.success, fontSize: "14px" }}>
                {message}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.lg, marginBottom: spacing.lg }}>
              <div>
                <label style={labelStyle}>Cliente *</label>
                <select
                  value={formData.cliente_id}
                  onChange={(e) => setFormData({ ...formData, cliente_id: e.target.value })}
                  style={inputStyle}
                  required
                >
                  <option value="">Selecione um cliente</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Status</label>
                <select
                  value={formData.status_enum}
                  onChange={(e) => setFormData({ ...formData, status_enum: e.target.value })}
                  style={inputStyle}
                >
                  <option value="rascunho">Rascunho</option>
                  <option value="enviado">Enviado</option>
                  <option value="aprovado">Aprovado</option>
                  <option value="rejeitado">Rejeitado</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: spacing.lg }}>
              <label style={labelStyle}>Descrição / Notas</label>
              <textarea
                value={formData.notas}
                onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                style={{ ...inputStyle, minHeight: "80px", fontFamily: "inherit" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.lg }}>
              <div>
                <label style={labelStyle}>Desconto (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.desconto}
                  onChange={(e) => setFormData({ ...formData, desconto: parseFloat(e.target.value) || 0 })}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Impostos (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.impostos}
                  onChange={(e) => setFormData({ ...formData, impostos: parseFloat(e.target.value) || 0 })}
                  style={inputStyle}
                />
              </div>
            </div>
          </Card>

          <Card style={{ marginBottom: spacing.lg }}>
            <OrcamentoItensTable
              itens={itens}
              onAddItem={() => setShowItemForm(true)}
              onUpdateItem={updateItem}
              onRemoveItem={removeItem}
            />
          </Card>

          {/* Totais */}
          <Card style={{ marginBottom: spacing.lg }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: spacing.lg }}>
              <div>
                <div style={{ fontSize: "12px", color: colors.textSecondary, marginBottom: spacing.xs }}>Subtotal</div>
                <div style={{ fontSize: "16px", fontWeight: 600, color: colors.text }}>R$ {subtotal.toFixed(2)}</div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: colors.textSecondary, marginBottom: spacing.xs }}>Desconto</div>
                <div style={{ fontSize: "16px", fontWeight: 600, color: colors.error }}>-R$ {formData.desconto.toFixed(2)}</div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: colors.textSecondary, marginBottom: spacing.xs }}>Impostos</div>
                <div style={{ fontSize: "16px", fontWeight: 600, color: colors.text }}>+R$ {formData.impostos.toFixed(2)}</div>
              </div>
              <div>
                <div style={{ fontSize: "12px", color: colors.textSecondary, marginBottom: spacing.xs }}>Total</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: colors.primary }}>R$ {totalFinal.toFixed(2)}</div>
              </div>
            </div>
          </Card>

          <div style={{ display: "flex", gap: spacing.md }}>
            <Button variant="secondary" onClick={() => navigate({ to: `/crm/orcamentos/${id}` })}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </div>
        </form>

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
      </div>
    </AppShell>
  );
}
