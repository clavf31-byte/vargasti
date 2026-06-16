import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CRMLayout } from "@/components/crm/CRMLayout";
import { PageHeader } from "@/components/ui";
import { useServicos } from "@/hooks/useServicos";
import { ServicosTable } from "@/components/crm/ServicosTable";
import { Wrench } from "lucide-react";
import { colors, spacing, borderRadius } from "@/lib/colors";

export const Route = createFileRoute("/crm/servicos")({
  head: () => ({ meta: [{ title: "Serviços · CRM VargasTI" }] }),
  component: ServicosPage,
});

interface Servico {
  id?: string;
  nome: string;
  categoria: string;
  valor_padrao: number;
  unidade: string;
  descricao?: string;
  ativo: boolean;
}

function ServicosPage() {
  const { user } = useAuth();
  const { servicos, addServico, updateServico, deleteServico } = useServicos(user?.id);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState<Servico>({
    nome: "",
    categoria: "Serviços Técnicos",
    valor_padrao: 0,
    unidade: "Hora",
    descricao: "",
    ativo: true,
  });

  const categorias = [
    "Serviços Técnicos",
    "Instalação",
    "Redes",
    "Deslocamento",
    "Manutenção",
    "Suporte",
    "Consultoria",
  ];
  const unidades = ["Hora", "Unidade", "Dia", "Semana", "Mês"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (editingId) {
        await updateServico(editingId, formData);
        setMessage("✅ Serviço atualizado!");
      } else {
        await addServico(formData);
        setMessage("✅ Serviço criado!");
      }

      setFormData({
        nome: "",
        categoria: "Serviços Técnicos",
        valor_padrao: 0,
        unidade: "Hora",
        descricao: "",
        ativo: true,
      });
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      setMessage("❌ Erro ao salvar serviço");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(servico: Servico) {
    setFormData(servico);
    setEditingId(servico.id || null);
    setShowForm(true);
  }

  function handleAddNew() {
    setFormData({
      nome: "",
      categoria: "Serviços Técnicos",
      valor_padrao: 0,
      unidade: "Hora",
      descricao: "",
      ativo: true,
    });
    setEditingId(null);
    setShowForm(true);
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
    fontWeight: 600,
  };

  return (
    <CRMLayout>
      <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
        <PageHeader
          title="Serviços"
          subtitle="Cadastro e gestão de serviços oferecidos"
          icon={<Wrench size={32} />}
          iconClass="text-brand"
        />

        {message && (
          <div
            style={{
              background: message.startsWith("✅")
                ? "rgba(76, 175, 80, 0.1)"
                : "rgba(239, 68, 68, 0.1)",
              border: message.startsWith("✅")
                ? "1px solid rgba(76, 175, 80, 0.3)"
                : "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "6px",
              padding: "12px",
              marginBottom: "1.5rem",
              color: message.startsWith("✅") ? "#66bb6a" : "#ef5350",
              fontSize: "14px",
            }}
          >
            {message}
          </div>
        )}

        {showForm && (
          <div
            style={{
              background: "rgba(6, 34, 53, 0.6)",
              border: "1px solid rgba(19, 200, 211, 0.16)",
              borderRadius: "12px",
              padding: "2rem",
              marginBottom: "2rem",
            }}
          >
            <h3 style={{ marginBottom: "1.5rem", fontSize: "16px", fontWeight: 600, color: colors.text }}>
              {editingId ? "Editar Serviço" : "Novo Serviço"}
            </h3>

            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.lg, marginBottom: spacing.lg }}>
                <div>
                  <label style={labelStyle}>Nome *</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Hora Técnica Presencial"
                    style={inputStyle}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>Categoria *</label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    style={inputStyle}
                  >
                    {categorias.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={labelStyle}>Valor Padrão (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valor_padrao}
                    onChange={(e) => setFormData({ ...formData, valor_padrao: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    style={inputStyle}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>Unidade *</label>
                  <select
                    value={formData.unidade}
                    onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                    style={inputStyle}
                  >
                    {unidades.map((un) => (
                      <option key={un} value={un}>
                        {un}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: spacing.lg }}>
                <label style={labelStyle}>Descrição</label>
                <textarea
                  value={formData.descricao || ""}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição detalhada do serviço"
                  style={{
                    ...inputStyle,
                    minHeight: "100px",
                    fontFamily: "inherit",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: spacing.md, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  style={{
                    padding: "10px 16px",
                    background: "transparent",
                    border: `1px solid ${colors.border}`,
                    borderRadius: borderRadius.md,
                    color: colors.text,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "10px 16px",
                    background: colors.primary,
                    border: "none",
                    borderRadius: borderRadius.md,
                    color: "#fff",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontWeight: 600,
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? "Salvando..." : editingId ? "Atualizar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        )}

        <ServicosTable
          servicos={servicos}
          onAddServico={handleAddNew}
          onEditServico={handleEdit}
          onDeleteServico={deleteServico}
        />
      </div>
    </CRMLayout>
  );
}
