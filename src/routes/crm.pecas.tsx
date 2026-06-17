import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { CRMLayout } from "@/components/crm/CRMLayout";
import { PageHeader } from "@/components/ui";
import { usePecas } from "@/hooks/usePecas";
import { PecasTable } from "@/components/crm/PecasTable";
import { Package } from "lucide-react";
import { colors, spacing, borderRadius } from "@/lib/colors";

export const Route = createFileRoute("/crm/pecas")({
  head: () => ({ meta: [{ title: "Peças e Materiais · CRM VargasTI" }] }),
  component: PecasPage,
});

interface Peca {
  id?: string;
  codigo: string;
  descricao: string;
  categoria: string;
  fabricante?: string;
  valor_custo: number;
  valor_venda: number;
  estoque: number;
  ativo: boolean;
}

function PecasPage() {
  const { user } = useAuth();
  const { pecas, addPeca, updatePeca, deletePeca } = usePecas(user?.id);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState<Peca>({
    codigo: "",
    descricao: "",
    categoria: "Hardware",
    fabricante: "",
    valor_custo: 0,
    valor_venda: 0,
    estoque: 0,
    ativo: true,
  });

  const categorias = ["Hardware", "Software", "Cabeamento", "Conectores", "Fontes", "Memória", "Armazenamento", "Outros"];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (editingId) {
        await updatePeca(editingId, formData);
        setMessage("✅ Peça atualizada!");
      } else {
        await addPeca(formData);
        setMessage("✅ Peça criada!");
      }

      setFormData({
        codigo: "",
        descricao: "",
        categoria: "Hardware",
        fabricante: "",
        valor_custo: 0,
        valor_venda: 0,
        estoque: 0,
        ativo: true,
      });
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      setMessage("❌ Erro ao salvar peça");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(peca: Peca) {
    setFormData(peca);
    setEditingId(peca.id || null);
    setShowForm(true);
  }

  function handleAddNew() {
    setFormData({
      codigo: "",
      descricao: "",
      categoria: "Hardware",
      fabricante: "",
      valor_custo: 0,
      valor_venda: 0,
      estoque: 0,
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
      <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
        <PageHeader
          title="Catálogo de Peças"
          subtitle="Gestão de peças, materiais e estoque"
          icon={<Package size={32} />}
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
              {editingId ? "Editar Peça" : "Nova Peça"}
            </h3>

            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.lg, marginBottom: spacing.lg }}>
                <div>
                  <label style={labelStyle}>Código *</label>
                  <input
                    type="text"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                    placeholder="Ex: MEM-8GB"
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

                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Descrição *</label>
                  <input
                    type="text"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Ex: Memória RAM 8GB DDR4"
                    style={inputStyle}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>Fabricante</label>
                  <input
                    type="text"
                    value={formData.fabricante || ""}
                    onChange={(e) => setFormData({ ...formData, fabricante: e.target.value })}
                    placeholder="Ex: Kingston"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Estoque (Qtd) *</label>
                  <input
                    type="number"
                    value={formData.estoque}
                    onChange={(e) => setFormData({ ...formData, estoque: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    style={inputStyle}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>Valor de Custo (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valor_custo}
                    onChange={(e) => setFormData({ ...formData, valor_custo: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    style={inputStyle}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>Valor de Venda (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valor_venda}
                    onChange={(e) => setFormData({ ...formData, valor_venda: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    style={inputStyle}
                    required
                  />
                </div>
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

        <PecasTable
          pecas={pecas}
          onAddPeca={handleAddNew}
          onEditPeca={handleEdit}
          onDeletePeca={deletePeca}
        />
      </div>
    </CRMLayout>
  );
}
