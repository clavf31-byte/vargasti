import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/crm/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · CRM VargasTI" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    orcamentos: 0,
    orcamentosTotal: 0,
    clientes: 0,
    pagamentos: 0,
    pagamentoTotal: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadStats = async () => {
      try {
        const [orcRes, clientRes, pagRes] = await Promise.all([
          supabase.from("orcamentos").select("id, total").eq("user_id", user.id),
          supabase.from("clientes").select("id").eq("user_id", user.id),
          supabase.from("pagamentos").select("id, valor").eq("user_id", user.id),
        ]);

        const orcamentosData = orcRes.data || [];
        const clientesData = clientRes.data || [];
        const pagamentosData = pagRes.data || [];

        setStats({
          orcamentos: orcamentosData.length,
          orcamentosTotal: orcamentosData.reduce((sum, orc) => sum + (orc.total || 0), 0),
          clientes: clientesData.length,
          pagamentos: pagamentosData.length,
          pagamentoTotal: pagamentosData.reduce((sum, pag) => sum + (pag.valor || 0), 0),
        });
      } catch (e) {
        console.error("Erro:", e);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user]);

  const StatCard = ({ label, value, color, onClick }: any) => (
    <div
      onClick={onClick}
      style={{
        background: "linear-gradient(135deg, #0b2538 0%, #061b2a 100%)",
        border: "1px solid rgba(19, 200, 211, 0.16)",
        borderRadius: "12px",
        padding: "1.5rem",
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.2s",
      }}
      onMouseEnter={(e) => onClick && (e.currentTarget.style.transform = "translateY(-4px)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      <div style={{ fontSize: "12px", color: "#8da2b4", textTransform: "uppercase", marginBottom: "0.75rem" }}>
        {label}
      </div>
      <div style={{ fontSize: "32px", fontWeight: 700, color: color }}>
        {value}
      </div>
    </div>
  );

  return (
    <div style={{ padding: "2rem", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ marginBottom: "3rem" }}>
        <h1 style={{ margin: "0 0 0.5rem 0", color: "#eaf3f8", fontSize: "40px" }}>Dashboard</h1>
        <p style={{ margin: 0, color: "#8da2b4", fontSize: "14px" }}>
          Bem-vindo ao seu CRM
        </p>
      </div>

      {loading ? (
        <p style={{ color: "#8da2b4" }}>Carregando dados...</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.5rem",
          }}
        >
          <StatCard
            label="Orçamentos"
            value={stats.orcamentos}
            color="#13c8d3"
            onClick={() => navigate({ to: "/crm/orcamentos" })}
          />
          <StatCard
            label="Valor Total (Orç.)"
            value={`R$ ${stats.orcamentosTotal.toFixed(2)}`}
            color="#04d9ff"
          />
          <StatCard
            label="Clientes"
            value={stats.clientes}
            color="#66bb6a"
            onClick={() => navigate({ to: "/crm/clientes" })}
          />
          <StatCard
            label="Pagamentos"
            value={stats.pagamentos}
            color="#ffd700"
            onClick={() => navigate({ to: "/crm/pagamentos" })}
          />
          <StatCard
            label="Recebido"
            value={`R$ ${stats.pagamentoTotal.toFixed(2)}`}
            color="#76ff03"
          />
        </div>
      )}
    </div>
  );
}
