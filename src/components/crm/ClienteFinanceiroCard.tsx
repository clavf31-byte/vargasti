import { useEffect, useState } from "react";
import { useClienteFinanceiro } from "@/hooks/useClienteFinanceiro";
import { DollarSign, FileText, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClienteFinanceiroCardProps {
  clienteId: string;
}

export function ClienteFinanceiroCard({ clienteId }: ClienteFinanceiroCardProps) {
  const { financeiro, loadFinanceiro } = useClienteFinanceiro(clienteId);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinanceiro().finally(() => setLoading(false));
  }, [clienteId]);

  if (loading) {
    return <div className="bg-surface rounded-lg p-4 text-center text-sm text-muted-foreground">Carregando...</div>;
  }

  if (!financeiro) {
    return <div className="bg-surface rounded-lg p-4 text-center text-sm text-muted-foreground">Sem histórico financeiro</div>;
  }

  const totalAberto = Math.max(0, financeiro.total_orcamentos - financeiro.total_pago);

  return (
    <div className="card-graphite p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Histórico Financeiro</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface rounded-lg p-3 border border-border">
          <div className="flex items-center gap-1.5 mb-1.5">
            <FileText className="size-3.5 text-select" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Orçamentos</span>
          </div>
          <div className="text-lg font-bold text-foreground">{financeiro.qtd_orcamentos}</div>
          <div className="text-xs text-muted-foreground">R$ {financeiro.total_orcamentos.toFixed(2)}</div>
        </div>

        <div className="bg-surface rounded-lg p-3 border border-border">
          <div className="flex items-center gap-1.5 mb-1.5">
            <CheckCircle2 className="size-3.5 text-brand" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Notas Fiscais</span>
          </div>
          <div className="text-lg font-bold text-foreground">{financeiro.qtd_nf}</div>
          <div className="text-xs text-muted-foreground">R$ {financeiro.total_nf.toFixed(2)}</div>
        </div>

        <div className="rounded-lg p-3 bg-brand/10 border border-brand/30">
          <div className="flex items-center gap-1.5 mb-1.5">
            <DollarSign className="size-3.5 text-brand" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Pagos</span>
          </div>
          <div className="text-lg font-bold text-brand">R$ {financeiro.total_pago.toFixed(2)}</div>
          {financeiro.qtd_nf > 0 && <div className="text-[11px] text-muted-foreground">{financeiro.qtd_nf} recebimento(s)</div>}
        </div>

        <div className={cn("rounded-lg p-3 border", totalAberto > 0 ? "bg-destructive/10 border-destructive/30" : "bg-brand/10 border-brand/30")}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className={cn("size-3.5 rounded-full", totalAberto > 0 ? "bg-destructive" : "bg-brand")} />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Saldo</span>
          </div>
          <div className={cn("text-lg font-bold", totalAberto > 0 ? "text-destructive" : "text-brand")}>
            R$ {totalAberto.toFixed(2)}
          </div>
          <div className="text-[11px] text-muted-foreground">{totalAberto > 0 ? "Pendente de recebimento" : "Sem débitos"}</div>
        </div>
      </div>

      {financeiro.qtd_orcamentos > 0 && (
        <div className="pt-3 border-t border-border space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Ticket Médio:</span>
            <strong className="text-foreground">R$ {(financeiro.total_orcamentos / financeiro.qtd_orcamentos).toFixed(2)}</strong>
          </div>
          {financeiro.qtd_nf > 0 && (
            <div className="flex justify-between">
              <span>Taxa de Conversão:</span>
              <strong className="text-foreground">{((financeiro.qtd_nf / financeiro.qtd_orcamentos) * 100).toFixed(0)}%</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
