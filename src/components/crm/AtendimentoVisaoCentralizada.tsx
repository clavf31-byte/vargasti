import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Eye, ArrowRight } from "lucide-react";

interface AtendimentoData {
  id: string;
  numero_formatado: string;
  titulo: string;
  cliente_nome?: string;
  status: string;
  equipamento?: string;
  defeito?: string;
  data_inicio?: string;
  created_at: string;
  orcamento_id?: string;
  ordem_servico_id?: string;
  pagamento_id?: string;
}

interface OrcamentoData {
  id: string;
  numero_formatado: string;
  total: number;
  status_enum: string;
  data_criacao: string;
}

interface OSData {
  id: string;
  numero_formatado: string;
  status: string;
  data_inicio: string;
  data_conclusao?: string;
}

interface PagamentoData {
  id: string;
  valor: number;
  status: string;
  data_pagamento?: string;
}

export function AtendimentoVisaoCentralizada({ atendimento: atendData }: { atendimento: AtendimentoData }) {
  const [orcamento, setOrcamento] = useState<OrcamentoData | null>(null);
  const [os, setOS] = useState<OSData | null>(null);
  const [pagamento, setPagamento] = useState<PagamentoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDados();
  }, [atendData.id]);

  async function loadDados() {
    setLoading(true);
    try {
      if (atendData.orcamento_id) {
        const { data } = await supabase
          .from("orcamentos")
          .select("id, numero_formatado, total, status_enum, data_criacao")
          .eq("id", atendData.orcamento_id)
          .single();
        if (data) setOrcamento(data);
      }

      if (atendData.ordem_servico_id) {
        const { data } = await supabase
          .from("ordens_servico")
          .select("id, numero_formatado, status, data_inicio, data_conclusao")
          .eq("id", atendData.ordem_servico_id)
          .single();
        if (data) setOS(data);
      }

      if (atendData.pagamento_id) {
        const { data } = await supabase
          .from("pagamentos")
          .select("id, valor, status, data_pagamento")
          .eq("id", atendData.pagamento_id)
          .single();
        if (data) setPagamento(data);
      }
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      "aprovado": "bg-green-500/20 text-green-300 border-green-500/30",
      "aberta": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      "concluida": "bg-green-500/20 text-green-300 border-green-500/30",
      "em_andamento": "bg-blue-500/20 text-blue-300 border-blue-500/30",
      "pendente": "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
      "pago": "bg-green-500/20 text-green-300 border-green-500/30",
    };
    return colors[status] || "bg-slate-500/20 text-slate-300 border-slate-500/30";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      "aprovado": "✓ Aprovado",
      "aberta": "● Aberta",
      "concluida": "✓ Concluída",
      "em_andamento": "● Em progresso",
      "pendente": "● Pendente",
      "pago": "✓ Pago",
    };
    return labels[status] || status;
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">{atendData.numero_formatado}</h1>
        <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
          <span>{atendData.cliente_nome || "—"}</span>
          {atendData.equipamento && <span>•</span>}
          <span className="font-semibold text-foreground">{atendData.equipamento || "—"}</span>
        </div>
        {atendData.defeito && (
          <p className="text-sm text-muted-foreground italic">{atendData.defeito}</p>
        )}
      </div>

      {/* TIMELINE VISUAL */}
      <div className="bg-slate-900/20 border border-slate-700/30 rounded-lg p-6">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
          <div className="flex flex-col items-center min-w-fit">
            <div className="text-xs text-muted-foreground mb-1">Entrada</div>
            <div className="size-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">✓</div>
          </div>
          <ArrowRight className="text-muted-foreground/30 size-4 shrink-0" />

          {orcamento ? (
            <>
              <div className="flex flex-col items-center min-w-fit">
                <div className="text-xs text-muted-foreground mb-1">Orçamento</div>
                <div className={`size-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  orcamento.status_enum === "aprovado" ? "bg-green-500" : "bg-yellow-500"
                }`}>
                  {orcamento.status_enum === "aprovado" ? "✓" : "●"}
                </div>
              </div>
              <ArrowRight className="text-muted-foreground/30 size-4 shrink-0" />
            </>
          ) : null}

          {os ? (
            <>
              <div className="flex flex-col items-center min-w-fit">
                <div className="text-xs text-muted-foreground mb-1">OS</div>
                <div className={`size-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  os.status === "concluida" ? "bg-green-500" : "bg-blue-500"
                }`}>
                  {os.status === "concluida" ? "✓" : "●"}
                </div>
              </div>
              <ArrowRight className="text-muted-foreground/30 size-4 shrink-0" />
            </>
          ) : null}

          {pagamento ? (
            <>
              <div className="flex flex-col items-center min-w-fit">
                <div className="text-xs text-muted-foreground mb-1">Pagamento</div>
                <div className={`size-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  pagamento.status === "pago" ? "bg-green-500" : "bg-yellow-500"
                }`}>
                  {pagamento.status === "pago" ? "✓" : "●"}
                </div>
              </div>
              <ArrowRight className="text-muted-foreground/30 size-4 shrink-0" />
            </>
          ) : null}

          <div className="flex flex-col items-center min-w-fit">
            <div className="text-xs text-muted-foreground mb-1">Finalizado</div>
            <div className={`size-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
              atendData.status === "concluido" ? "bg-green-500" : "bg-slate-600"
            }`}>
              {atendData.status === "concluido" ? "✓" : "○"}
            </div>
          </div>
        </div>
      </div>

      {/* CARDS RESUMIDOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Equipamento */}
        <div className="bg-slate-900/40 border border-slate-700/30 rounded-lg p-4 space-y-3">
          <div className="text-xs font-bold text-muted-foreground uppercase">Equipamento</div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">{atendData.equipamento || "—"}</p>
            {atendData.defeito && (
              <p className="text-xs text-muted-foreground line-clamp-2">{atendData.defeito}</p>
            )}
          </div>
        </div>

        {/* Orçamento */}
        {orcamento && (
          <div className="bg-slate-900/40 border border-slate-700/30 rounded-lg p-4 space-y-3">
            <div className="text-xs font-bold text-muted-foreground uppercase">Orçamento {orcamento.numero_formatado}</div>
            <div className="space-y-2">
              <p className="text-lg font-bold text-brand">R$ {orcamento.total.toFixed(2)}</p>
              <div className={`inline-flex px-2 py-1 rounded text-xs font-bold border ${getStatusColor(orcamento.status_enum)}`}>
                {getStatusLabel(orcamento.status_enum)}
              </div>
            </div>
            <a href={`/crm/orcamentos/${orcamento.id}`} className="text-xs text-select hover:text-select/80 flex items-center gap-1">
              Ver detalhes <Eye className="size-3" />
            </a>
          </div>
        )}

        {/* OS */}
        {os && (
          <div className="bg-slate-900/40 border border-slate-700/30 rounded-lg p-4 space-y-3">
            <div className="text-xs font-bold text-muted-foreground uppercase">OS {os.numero_formatado}</div>
            <div className="space-y-2">
              <div className={`inline-flex px-2 py-1 rounded text-xs font-bold border ${getStatusColor(os.status)}`}>
                {getStatusLabel(os.status)}
              </div>
              {os.data_conclusao && (
                <p className="text-xs text-muted-foreground">
                  Concluída em {new Date(os.data_conclusao).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
            <a href={`/crm/os/${os.id}`} className="text-xs text-select hover:text-select/80 flex items-center gap-1">
              Ver detalhes <Eye className="size-3" />
            </a>
          </div>
        )}

        {/* Financeiro */}
        {pagamento && (
          <div className="bg-slate-900/40 border border-slate-700/30 rounded-lg p-4 space-y-3">
            <div className="text-xs font-bold text-muted-foreground uppercase">Financeiro</div>
            <div className="space-y-2">
              <p className="text-lg font-bold text-brand">R$ {pagamento.valor.toFixed(2)}</p>
              <div className={`inline-flex px-2 py-1 rounded text-xs font-bold border ${getStatusColor(pagamento.status)}`}>
                {getStatusLabel(pagamento.status)}
              </div>
            </div>
            <a href={`/crm/pagamentos/${pagamento.id}`} className="text-xs text-select hover:text-select/80 flex items-center gap-1">
              Ver detalhes <Eye className="size-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
