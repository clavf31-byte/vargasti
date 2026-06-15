import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader, StatCard, Card } from "@/components/ui";
import { colors, spacing } from "@/lib/colors";
import { BarChart, TrendingUp, Users, FileText, DollarSign } from "lucide-react";

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
    orcamentosPorStatus: { rascunho: 0, enviado: 0, aprovado: 0, rejeitado: 0 },
    clientes: 0,
    pagamentos: 0,
    pagamentoTotal: 0,
    ultimasTransacoes: [] as any[],
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
          supabase
            .from("orcamentos")
            .select("id, total, status")
            .eq("user_id", user.id),
          supabase.from("clientes").select("id").eq("user_id", user.id),
          supabase
            .from("pagamentos")
            .select("id, valor, data_pagamento")
            .eq("user_id", user.id)
            .order("data_pagamento", { ascending: false })
            .limit(5),
        ]);

        const orcamentosData = orcRes.data || [];
        const clientesData = clientRes.data || [];
        const pagamentosData = pagRes.data || [];

        const orcPorStatus = orcamentosData.reduce(
          (acc: any, orc: any) => {
            acc[orc.status] = (acc[orc.status] || 0) + 1;
            return acc;
          },
          { rascunho: 0, enviado: 0, aprovado: 0, rejeitado: 0 }
        );

        setStats({
          orcamentos: orcamentosData.length,
          orcamentosTotal: orcamentosData.reduce((sum, orc) => sum + (orc.total || 0), 0),
          orcamentosPorStatus: orcPorStatus,
          clientes: clientesData.length,
          pagamentos: pagamentosData.length,
          pagamentoTotal: pagamentosData.reduce((sum, pag) => sum + (pag.valor || 0), 0),
          ultimasTransacoes: pagamentosData,
        });
      } catch (e) {
        console.error("Erro:", e);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user]);

  return (
    <AppShell>
      <div style={{ padding: spacing.xl, maxWidth: "1600px", margin: "0 auto" }}>
        <PageHeader
          title="Dashboard"
          subtitle="Bem-vindo ao seu CRM VargasTI"
          icon="📊"
        />

        {loading ? (
          <p style={{ color: colors.textSecondary }}>Carregando dados...</p>
        ) : (
          <>
            {/* KPIs Principais */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: spacing.lg,
                marginBottom: spacing.xxl,
              }}
            >
              <StatCard
                label="Orçamentos"
                value={stats.orcamentos}
                color={colors.primaryLight}
                icon={<FileText />}
                onClick={() => navigate({ to: "/crm/orcamentos" })}
              />
              <StatCard
                label="Valor Total (Orç.)"
                value={`R$ ${stats.orcamentosTotal.toFixed(2)}`}
                color={colors.primary}
                icon={<TrendingUp />}
              />
              <StatCard
                label="Clientes"
                value={stats.clientes}
                color={colors.success}
                icon={<Users />}
                onClick={() => navigate({ to: "/crm/clientes" })}
              />
              <StatCard
                label="Pagamentos"
                value={stats.pagamentos}
                color={colors.warning}
                icon={<DollarSign />}
                onClick={() => navigate({ to: "/crm/pagamentos" })}
              />
              <StatCard
                label="Recebido"
                value={`R$ ${stats.pagamentoTotal.toFixed(2)}`}
                color={colors.success}
                icon={<BarChart />}
              />
            </div>

            {/* Status dos Orçamentos */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: spacing.lg,
                marginBottom: spacing.xxl,
              }}
            >
              <Card>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "12px",
                      color: colors.textSecondary,
                      marginBottom: spacing.sm,
                      textTransform: "uppercase",
                    }}
                  >
                    Rascunho
                  </div>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: 700,
                      color: colors.textSecondary,
                    }}
                  >
                    {stats.orcamentosPorStatus.rascunho}
                  </div>
                </div>
              </Card>
              <Card>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "12px",
                      color: colors.primary,
                      marginBottom: spacing.sm,
                      textTransform: "uppercase",
                    }}
                  >
                    Enviado
                  </div>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: 700,
                      color: colors.primary,
                    }}
                  >
                    {stats.orcamentosPorStatus.enviado}
                  </div>
                </div>
              </Card>
              <Card>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "12px",
                      color: colors.success,
                      marginBottom: spacing.sm,
                      textTransform: "uppercase",
                    }}
                  >
                    Aprovado
                  </div>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: 700,
                      color: colors.success,
                    }}
                  >
                    {stats.orcamentosPorStatus.aprovado}
                  </div>
                </div>
              </Card>
              <Card>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "12px",
                      color: colors.error,
                      marginBottom: spacing.sm,
                      textTransform: "uppercase",
                    }}
                  >
                    Rejeitado
                  </div>
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: 700,
                      color: colors.error,
                    }}
                  >
                    {stats.orcamentosPorStatus.rejeitado}
                  </div>
                </div>
              </Card>
            </div>

            {/* Últimas Transações */}
            <Card>
              <div style={{ marginBottom: spacing.lg }}>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "18px",
                    fontWeight: 600,
                    color: colors.text,
                  }}
                >
                  Últimas Transações
                </h2>
              </div>
              {stats.ultimasTransacoes.length === 0 ? (
                <p style={{ color: colors.textSecondary, margin: 0 }}>
                  Nenhuma transação registrada
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: spacing.sm }}>
                  {stats.ultimasTransacoes.map((trans) => (
                    <div
                      key={trans.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: spacing.md,
                        background: colors.background,
                        borderRadius: "8px",
                        borderLeft: `3px solid ${colors.success}`,
                      }}
                    >
                      <div>
                        <div style={{ color: colors.text, fontWeight: 600 }}>
                          Pagamento Recebido
                        </div>
                        <div style={{ color: colors.textSecondary, fontSize: "12px" }}>
                          {new Date(trans.data_pagamento).toLocaleDateString(
                            "pt-BR"
                          )}
                        </div>
                      </div>
                      <div style={{ color: colors.success, fontWeight: 700 }}>
                        R$ {trans.valor.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
