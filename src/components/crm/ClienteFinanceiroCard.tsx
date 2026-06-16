import { useEffect, useState } from "react";
import { useClienteFinanceiro } from "@/hooks/useClienteFinanceiro";
import { colors, spacing, borderRadius } from "@/lib/colors";
import { DollarSign, FileText, CheckCircle2 } from "lucide-react";

interface ClienteFinanceiroCardProps {
  clienteId: string;
}

export function ClienteFinanceiroCard({ clienteId }: ClienteFinanceiroCardProps) {
  const { financeiro, loadFinanceiro } = useClienteFinanceiro(clienteId);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      await loadFinanceiro();
      setLoading(false);
    };
    load();
  }, [clienteId]);

  if (loading) {
    return (
      <div
        style={{
          padding: spacing.lg,
          color: colors.textSecondary,
          textAlign: "center",
          background: colors.backgroundSecondary,
          borderRadius: borderRadius.md,
        }}
      >
        Carregando...
      </div>
    );
  }

  if (!financeiro) {
    return (
      <div
        style={{
          padding: spacing.lg,
          color: colors.textSecondary,
          textAlign: "center",
          background: colors.backgroundSecondary,
          borderRadius: borderRadius.md,
        }}
      >
        Sem histórico financeiro
      </div>
    );
  }

  const totalAberto = Math.max(0, financeiro.total_orcamentos - financeiro.total_pago);

  return (
    <div
      style={{
        background: "rgba(6, 34, 53, 0.6)",
        border: "1px solid rgba(19, 200, 211, 0.16)",
        borderRadius: borderRadius.md,
        padding: spacing.lg,
      }}
    >
      <h3
        style={{
          margin: `0 0 ${spacing.lg} 0`,
          fontSize: "16px",
          fontWeight: 600,
          color: colors.text,
        }}
      >
        💰 Histórico Financeiro
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: spacing.lg,
        }}
      >
        {/* Orçamentos */}
        <div
          style={{
            padding: spacing.lg,
            background: colors.background,
            borderRadius: borderRadius.md,
            border: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm }}>
            <FileText size={16} style={{ color: colors.primary }} />
            <div style={{ fontSize: "12px", color: colors.textSecondary, fontWeight: 600 }}>
              ORÇAMENTOS
            </div>
          </div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: colors.text, marginBottom: spacing.xs }}>
            {financeiro.qtd_orcamentos}
          </div>
          <div style={{ fontSize: "13px", color: colors.textSecondary }}>
            R$ {financeiro.total_orcamentos.toFixed(2)}
          </div>
        </div>

        {/* Notas Fiscais */}
        <div
          style={{
            padding: spacing.lg,
            background: colors.background,
            borderRadius: borderRadius.md,
            border: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm }}>
            <CheckCircle2 size={16} style={{ color: colors.success }} />
            <div style={{ fontSize: "12px", color: colors.textSecondary, fontWeight: 600 }}>
              NOTAS FISCAIS
            </div>
          </div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: colors.text, marginBottom: spacing.xs }}>
            {financeiro.qtd_nf}
          </div>
          <div style={{ fontSize: "13px", color: colors.textSecondary }}>
            R$ {financeiro.total_nf.toFixed(2)}
          </div>
        </div>

        {/* Pagamentos Recebidos */}
        <div
          style={{
            padding: spacing.lg,
            background: "rgba(102, 187, 106, 0.1)",
            borderRadius: borderRadius.md,
            border: "1px solid rgba(102, 187, 106, 0.3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm }}>
            <DollarSign size={16} style={{ color: colors.success }} />
            <div style={{ fontSize: "12px", color: colors.textSecondary, fontWeight: 600 }}>
              PAGOS
            </div>
          </div>
          <div style={{ fontSize: "18px", fontWeight: 700, color: colors.success, marginBottom: spacing.xs }}>
            R$ {financeiro.total_pago.toFixed(2)}
          </div>
          <div style={{ fontSize: "11px", color: colors.textSecondary }}>
            {financeiro.qtd_nf > 0 && `${financeiro.qtd_nf} recebimento(s)`}
          </div>
        </div>

        {/* Saldo em Aberto */}
        <div
          style={{
            padding: spacing.lg,
            background: totalAberto > 0 ? "rgba(239, 68, 68, 0.1)" : "rgba(102, 187, 106, 0.1)",
            borderRadius: borderRadius.md,
            border: totalAberto > 0 ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(102, 187, 106, 0.3)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: spacing.sm, marginBottom: spacing.sm }}>
            <div
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                background: totalAberto > 0 ? colors.error : colors.success,
              }}
            />
            <div style={{ fontSize: "12px", color: colors.textSecondary, fontWeight: 600 }}>
              SALDO
            </div>
          </div>
          <div
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: totalAberto > 0 ? colors.error : colors.success,
              marginBottom: spacing.xs,
            }}
          >
            R$ {totalAberto.toFixed(2)}
          </div>
          <div style={{ fontSize: "11px", color: colors.textSecondary }}>
            {totalAberto > 0 ? "Pendente de recebimento" : "Sem débitos"}
          </div>
        </div>
      </div>

      {/* Resumo */}
      {financeiro.qtd_orcamentos > 0 && (
        <div
          style={{
            marginTop: spacing.lg,
            paddingTop: spacing.lg,
            borderTop: `1px solid ${colors.border}`,
            fontSize: "12px",
            color: colors.textSecondary,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: spacing.xs }}>
            <span>Ticket Médio:</span>
            <strong style={{ color: colors.text }}>
              R$ {(financeiro.total_orcamentos / financeiro.qtd_orcamentos).toFixed(2)}
            </strong>
          </div>
          {financeiro.qtd_nf > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Taxa de Conversão:</span>
              <strong style={{ color: colors.text }}>
                {((financeiro.qtd_nf / financeiro.qtd_orcamentos) * 100).toFixed(0)}%
              </strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
