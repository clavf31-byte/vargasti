import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  created_at: string;
};

function PagamentosPage() {
  const { user } = useAuth();
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadPagamentos();
  }, [user]);

  async function loadPagamentos() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pagamentos")
        .select("*")
        .eq("user_id", user!.id)
        .order("data_pagamento", { ascending: false });

      if (error) throw error;
      setPagamentos((data as Pagamento[]) || []);
    } catch (e) {
      console.error("Erro ao carregar pagamentos:", e);
    } finally {
      setLoading(false);
    }
  }

  const totalPago = pagamentos.reduce((sum, p) => sum + (p.valor || 0), 0);

  return (
    <AppShell>
      <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
        <PageHeader
          title="Pagamentos"
          subtitle={`${pagamentos.length} pagamento${pagamentos.length !== 1 ? "s" : ""} registrado${pagamentos.length !== 1 ? "s" : ""}`}
        />

        {/* Resumo */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1.5rem",
          marginBottom: "2rem"
        }}>
          <div style={{
            background: "linear-gradient(135deg, #0b2538 0%, #061b2a 100%)",
            border: "1px solid rgba(19, 200, 211, 0.16)",
            borderRadius: "12px",
            padding: "1.5rem",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "12px", color: "#8da2b4", textTransform: "uppercase", marginBottom: "0.75rem" }}>Total Recebido</div>
            <div style={{ fontSize: "32px", fontWeight: 700, color: "#66bb6a" }}>R$ {totalPago.toFixed(2)}</div>
          </div>
          <div style={{
            background: "linear-gradient(135deg, #0b2538 0%, #061b2a 100%)",
            border: "1px solid rgba(19, 200, 211, 0.16)",
            borderRadius: "12px",
            padding: "1.5rem",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "12px", color: "#8da2b4", textTransform: "uppercase", marginBottom: "0.75rem" }}>Pagamentos</div>
            <div style={{ fontSize: "32px", fontWeight: 700, color: "#13c8d3" }}>{pagamentos.length}</div>
          </div>
        </div>

        {loading ? (
          <p style={{ color: "#8da2b4" }}>Carregando pagamentos...</p>
        ) : pagamentos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#8da2b4" }}>
            <CreditCard style={{ width: "48px", height: "48px", opacity: 0.2, margin: "0 auto 1rem" }} />
            <p>Nenhum pagamento registrado</p>
            <p style={{ fontSize: "12px" }}>Os pagamentos aparecerão aqui quando registrados</p>
          </div>
        ) : (
          <div style={{
            background: "rgba(6, 34, 53, 0.6)",
            border: "1px solid rgba(19, 200, 211, 0.16)",
            borderRadius: "12px",
            overflow: "hidden"
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "rgba(19, 200, 211, 0.08)", borderBottom: "1px solid rgba(19, 200, 211, 0.16)" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#8da2b4", fontWeight: 600 }}>Orçamento</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#8da2b4", fontWeight: 600 }}>Valor</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#8da2b4", fontWeight: 600 }}>Data</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#8da2b4", fontWeight: 600 }}>Método</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", color: "#8da2b4", fontWeight: 600 }}>Referência</th>
                </tr>
              </thead>
              <tbody>
                {pagamentos.map((pagamento) => (
                  <tr key={pagamento.id} style={{ borderBottom: "1px solid rgba(19, 200, 211, 0.08)" }}>
                    <td style={{ padding: "12px 16px", color: "#13c8d3", fontWeight: 600 }}>{pagamento.orcamento_id.slice(0, 8)}</td>
                    <td style={{ padding: "12px 16px", color: "#66bb6a", fontWeight: 500 }}>R$ {(pagamento.valor || 0).toFixed(2)}</td>
                    <td style={{ padding: "12px 16px", color: "#8da2b4", fontSize: "13px" }}>
                      {new Date(pagamento.data_pagamento).toLocaleDateString("pt-BR")}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#8da2b4", fontSize: "13px" }}>{pagamento.metodo || "—"}</td>
                    <td style={{ padding: "12px 16px", color: "#8da2b4", fontSize: "13px" }}>{pagamento.referencia || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
