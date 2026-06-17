import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader, Card, Button } from "@/components/ui";
import { colors, spacing, borderRadius } from "@/lib/colors";
import { Plus, Edit2, Trash2 } from "lucide-react";

export const Route = createFileRoute("/crm/contratos/modelos")({
  head: () => ({ meta: [{ title: "Modelos de Contratos · CRM VargasTI" }] }),
  component: ModelosPage,
});

interface Template {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  created_at: string;
}

function ModelosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ nome: "", descricao: "", conteudo: "" });

  const loadTemplates = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("contract_templates")
        .select("id, nome, descricao, ativo, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (e) {
      console.error("Erro:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, [user]);

  const handleCreate = async () => {
    if (!user || !newTemplate.nome.trim()) return;
    try {
      const { error } = await supabase.from("contract_templates").insert([
        {
          user_id: user.id,
          nome: newTemplate.nome,
          descricao: newTemplate.descricao,
          conteudo: newTemplate.conteudo,
          variaveis: [], // Parse variáveis do conteúdo depois
        },
      ]);
      if (error) throw error;
      setNewTemplate({ nome: "", descricao: "", conteudo: "" });
      setIsFormOpen(false);
      loadTemplates();
    } catch (e) {
      console.error("Erro ao criar:", e);
      alert("Erro ao criar modelo");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza?")) return;
    try {
      await supabase.from("contract_templates").delete().eq("id", id);
      loadTemplates();
    } catch (e) {
      alert("Erro ao deletar");
    }
  };

  return (
    <AppShell>
      <div style={{ padding: spacing.xl, maxWidth: "1200px", margin: "0 auto" }}>
        <PageHeader
          title="Modelos de Contrato"
          subtitle={`${templates.length} modelo(s) criado(s)`}
          action={
            <Button
              variant="primary"
              onClick={() => setIsFormOpen(!isFormOpen)}
            >
              {isFormOpen ? "Cancelar" : <><Plus size={18} /> Novo Modelo</>}
            </Button>
          }
          icon="📋"
        />

        {isFormOpen && (
          <Card style={{ marginBottom: spacing.xl }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.lg, marginBottom: spacing.lg }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", marginBottom: spacing.sm, fontWeight: 600 }}>
                  Nome do Modelo *
                </label>
                <input
                  type="text"
                  placeholder="ex: Contrato de Suporte TI"
                  value={newTemplate.nome}
                  onChange={(e) => setNewTemplate({ ...newTemplate, nome: e.target.value })}
                  style={{
                    width: "100%",
                    padding: spacing.md,
                    border: `1px solid ${colors.border}`,
                    borderRadius: borderRadius.md,
                    fontSize: "14px",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "14px", marginBottom: spacing.sm, fontWeight: 600 }}>
                  Descrição
                </label>
                <input
                  type="text"
                  placeholder="Descreva o contrato"
                  value={newTemplate.descricao}
                  onChange={(e) => setNewTemplate({ ...newTemplate, descricao: e.target.value })}
                  style={{
                    width: "100%",
                    padding: spacing.md,
                    border: `1px solid ${colors.border}`,
                    borderRadius: borderRadius.md,
                    fontSize: "14px",
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", marginBottom: spacing.sm, fontWeight: 600 }}>
                Conteúdo do Contrato *
              </label>
              <p style={{ fontSize: "12px", color: colors.textSecondary, marginBottom: spacing.sm }}>
                Use variáveis como: {"{{cliente_nome}}"}, {"{{data}}"}, {"{{valor}}"}, etc.
              </p>
              <textarea
                placeholder="Cole aqui o conteúdo do seu contrato..."
                value={newTemplate.conteudo}
                onChange={(e) => setNewTemplate({ ...newTemplate, conteudo: e.target.value })}
                style={{
                  width: "100%",
                  minHeight: "200px",
                  padding: spacing.md,
                  border: `1px solid ${colors.border}`,
                  borderRadius: borderRadius.md,
                  fontSize: "14px",
                  fontFamily: "monospace",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: spacing.md, marginTop: spacing.lg }}>
              <Button variant="primary" onClick={handleCreate}>
                Criar Modelo
              </Button>
              <Button variant="secondary" onClick={() => setIsFormOpen(false)}>
                Cancelar
              </Button>
            </div>
          </Card>
        )}

        {loading ? (
          <p style={{ color: colors.textSecondary }}>Carregando...</p>
        ) : templates.length === 0 ? (
          <Card>
            <p style={{ color: colors.textSecondary, margin: 0, textAlign: "center" }}>
              Nenhum modelo criado ainda
            </p>
          </Card>
        ) : (
          <Card>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                    <th style={{ padding: spacing.md, textAlign: "left", color: colors.textSecondary, fontWeight: 600 }}>
                      Nome
                    </th>
                    <th style={{ padding: spacing.md, textAlign: "left", color: colors.textSecondary, fontWeight: 600 }}>
                      Descrição
                    </th>
                    <th style={{ padding: spacing.md, textAlign: "center", color: colors.textSecondary, fontWeight: 600 }}>
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((t) => (
                    <tr key={t.id} style={{ borderBottom: `1px solid ${colors.borderLight}` }}>
                      <td style={{ padding: spacing.md, color: colors.text, fontWeight: 500 }}>{t.nome}</td>
                      <td style={{ padding: spacing.md, color: colors.textSecondary }}>{t.descricao || "-"}</td>
                      <td style={{ padding: spacing.md, textAlign: "center", display: "flex", gap: spacing.sm, justifyContent: "center" }}>
                        <button
                          onClick={() => navigate({ to: `/crm/contratos/modelos/${t.id}` })}
                          style={{
                            background: colors.background,
                            border: `1px solid ${colors.border}`,
                            color: colors.primary,
                            padding: `${spacing.sm} ${spacing.md}`,
                            borderRadius: borderRadius.sm,
                            cursor: "pointer",
                            fontSize: "12px",
                            display: "flex",
                            gap: "4px",
                            alignItems: "center",
                          }}
                          title="Clique para editar o modelo"
                        >
                          <Edit2 size={14} /> Editar
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          style={{
                            background: colors.background,
                            border: `1px solid ${colors.error}`,
                            color: colors.error,
                            padding: `${spacing.sm} ${spacing.md}`,
                            borderRadius: borderRadius.sm,
                            cursor: "pointer",
                            fontSize: "12px",
                            display: "flex",
                            gap: "4px",
                            alignItems: "center",
                          }}
                        >
                          <Trash2 size={14} /> Deletar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
