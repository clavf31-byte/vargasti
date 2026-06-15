import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PageHeader, Card, StatCard } from "@/components/ui";
import { colors, spacing, borderRadius } from "@/lib/colors";
import { Search, Trash2 } from "lucide-react";

export const Route = createFileRoute("/crm/pagamentos")({
  head: () => ({ meta: [{ title: "Pagamentos · CRM VargasTI" }] }),
  component: PagamentosPage,
});

type Pagamento = {
  id: string;
  orcamento_id: string;
  valor: number;
  data_pagamento: string;
  metodo?: string | null;
  referencia?: string | null;
};

function PagamentosPage() {
  const { user } = useAuth();
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [filtrados, setFiltrados] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadPagamentos = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("pagamentos")
        .select("*")
        .eq("user_id", user.id)
        .order("data_pagamento", { ascending: false });

      setPagamentos((data as Pagamento[]) || []);
    } catch (e) {
      console.error("Erro:", e);
    }
  };

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadPagamentos();
    setLoading(false);
  }, [user]);

  // Filtrar pagamentos
  useEffect(() => {
    let resultado = pagamentos;

    if (searchTerm) {
      resultado = resultado.filter(
        (p) =>
          p.orcamento_id.includes(searchTerm) ||
          p.referencia?.includes(searchTerm) ||
          p.metodo?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFiltrados(resultado);
  }, [pagamentos, searchTerm]);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este pagamento?")) return;
    try {
      await supabase.from("pagamentos").delete().eq("id", id);
      loadPagamentos();
    } catch (e) {
      console.error("Erro:", e);
      alert("Erro ao deletar pagamento");
    }
  };

  const totalPago = pagamentos.reduce((sum, p) => sum + (p.valor || 0), 0);
  const totalFiltrado = filtrados.reduce((sum, p) => sum + (p.valor || 0), 0);

  return (
    <div style={{ padding: spacing.xl, maxWidth: "1600px", margin: "0 auto" }}>
      <PageHeader
        title="Pagamentos"
        subtitle={`${pagamentos.length} total • ${filtrados.length} exibindo`}
        icon="💰"
      />

      {/* KPIs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: spacing.lg,
          marginBottom: spacing.xxl,
        }}
      >
        <StatCard
          label="Total Recebido"
          value={`R$ ${totalPago.toFixed(2)}`}
          color={colors.success}
        />
        <StatCard
          label="Pagamentos"
          value={pagamentos.length}
          color={colors.primary}
        />
      </div>

      {/* Busca */}
      <Card>
        <div style={{ position: "relative" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: spacing.md,
              top: "50%",
              transform: "translateY(-50%)",
              color: colors.textSecondary,
            }}
          />
          <input
            type="text"
            placeholder="Buscar por orçamento, referência ou método..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: `${spacing.sm} ${spacing.md} ${spacing.sm} 40px`,
              background: colors.background,
              border: `1px solid ${colors.border}`,
              borderRadius: borderRadius.md,
              color: colors.text,
              fontSize: "14px",
            }}
          />
        </div>
      </Card>

      {/* Tabela */}
      {loading ? (
        <p style={{ color: colors.textSecondary }}>Carregando...</p>
      ) : filtrados.length === 0 ? (
        <Card>
          <p style={{ color: colors.textSecondary, margin: 0, textAlign: "center" }}>
            {pagamentos.length === 0
              ? "Nenhum pagamento registrado"
              : "Nenhum pagamento encontrado"}
          </p>
        </Card>
      ) : (
        <Card>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
              }}
            >
              <thead>
                <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                  <th
                    style={{
                      padding: spacing.md,
                      textAlign: "left",
                      color: colors.textSecondary,
                      fontWeight: 600,
                      fontSize: "12px",
                    }}
                  >
                    Orçamento
                  </th>
                  <th
                    style={{
                      padding: spacing.md,
                      textAlign: "left",
                      color: colors.textSecondary,
                      fontWeight: 600,
                      fontSize: "12px",
                    }}
                  >
                    Valor
                  </th>
                  <th
                    style={{
                      padding: spacing.md,
                      textAlign: "left",
                      color: colors.textSecondary,
                      fontWeight: 600,
                      fontSize: "12px",
                    }}
                  >
                    Data
                  </th>
                  <th
                    style={{
                      padding: spacing.md,
                      textAlign: "left",
                      color: colors.textSecondary,
                      fontWeight: 600,
                      fontSize: "12px",
                    }}
                  >
                    Método
                  </th>
                  <th
                    style={{
                      padding: spacing.md,
                      textAlign: "left",
                      color: colors.textSecondary,
                      fontWeight: 600,
                      fontSize: "12px",
                    }}
                  >
                    Referência
                  </th>
                  <th
                    style={{
                      padding: spacing.md,
                      textAlign: "center",
                      color: colors.textSecondary,
                      fontWeight: 600,
                      fontSize: "12px",
                    }}
                  >
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((pag) => (
                  <tr
                    key={pag.id}
                    style={{
                      borderBottom: `1px solid ${colors.borderLight}`,
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        colors.backgroundTertiary;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <td
                      style={{
                        padding: spacing.md,
                        color: colors.primary,
                        fontWeight: 600,
                      }}
                    >
                      {pag.orcamento_id.slice(0, 8)}...
                    </td>
                    <td
                      style={{
                        padding: spacing.md,
                        color: colors.success,
                        fontWeight: 600,
                      }}
                    >
                      R$ {pag.valor.toFixed(2)}
                    </td>
                    <td
                      style={{
                        padding: spacing.md,
                        color: colors.textSecondary,
                      }}
                    >
                      {new Date(pag.data_pagamento).toLocaleDateString("pt-BR")}
                    </td>
                    <td
                      style={{
                        padding: spacing.md,
                        color: colors.textSecondary,
                      }}
                    >
                      {pag.metodo || "—"}
                    </td>
                    <td
                      style={{
                        padding: spacing.md,
                        color: colors.textSecondary,
                      }}
                    >
                      {pag.referencia || "—"}
                    </td>
                    <td
                      style={{
                        padding: spacing.md,
                        textAlign: "center",
                      }}
                    >
                      <button
                        onClick={() => handleDelete(pag.id)}
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
                        <Trash2 size={14} />
                        Deletar
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
  );
}
