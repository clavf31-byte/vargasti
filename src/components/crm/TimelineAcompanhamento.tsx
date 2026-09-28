import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  FileText, Wrench, DollarSign, CheckCircle2, Clock, AlertCircle, ChevronRight
} from "lucide-react";

type Etapa = {
  id: string;
  titulo: string;
  icon: React.ReactNode;
  status: "concluido" | "em_progresso" | "aguardando";
  statusLabel: string;
  statusColor: string;
  data?: string;
  detalhes?: string;
};

interface TimelineAcompanhamentoProps {
  orcamentoId: string;
}

export function TimelineAcompanhamento({ orcamentoId }: TimelineAcompanhamentoProps) {
  const { user } = useAuth();
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !orcamentoId) return;
    loadTimeline();
  }, [user, orcamentoId]);

  async function loadTimeline() {
    try {
      // Buscar orçamento
      const { data: orc } = await supabase
        .from("orcamentos")
        .select("id, numero_formatado, status_enum, total, data_criacao, approved_at")
        .eq("id", orcamentoId)
        .eq("user_id", user!.id)
        .single();

      // Buscar OS relacionada
      const { data: os } = await supabase
        .from("ordens_servico")
        .select("id, numero_formatado, status, data_inicio, data_conclusao")
        .eq("orcamento_id", orcamentoId)
        .eq("user_id", user!.id)
        .maybeSingle();

      // Buscar pagamento relacionado
      const { data: pag } = await supabase
        .from("pagamentos")
        .select("id, valor, status, data_pagamento")
        .eq("orcamento_id", orcamentoId)
        .eq("user_id", user!.id)
        .maybeSingle();

      // Montar etapas
      const novasEtapas: Etapa[] = [
        {
          id: "orcamento",
          titulo: "Orçamento",
          icon: <FileText size={20} />,
          status: getStatusOrçamento(orc?.status_enum),
          statusLabel: getStatusLabel(orc?.status_enum),
          statusColor: getStatusColor(orc?.status_enum),
          data: orc ? new Date(orc.data_criacao).toLocaleDateString("pt-BR") : undefined,
          detalhes: orc ? `${orc.numero_formatado} • R$ ${orc.total.toFixed(2)}` : undefined,
        },
        {
          id: "os",
          titulo: "Ordem de Serviço",
          icon: <Wrench size={20} />,
          status: os ? getStatusOS(os.status) : "aguardando",
          statusLabel: os ? getStatusLabel(os.status) : "Aguardando",
          statusColor: os ? getStatusColor(os.status) : "#8da2b4",
          data: os ? new Date(os.data_inicio).toLocaleDateString("pt-BR") : undefined,
          detalhes: os ? `${os.numero_formatado} • Criada automaticamente` : "Será criada quando orçamento for aprovado",
        },
        {
          id: "pagamento",
          titulo: "Pagamento",
          icon: <DollarSign size={20} />,
          status: pag ? getStatusPagamento(pag.status) : "aguardando",
          statusLabel: pag ? getStatusLabel(pag.status) : "Aguardando",
          statusColor: pag ? getStatusColor(pag.status) : "#8da2b4",
          data: pag ? new Date(pag.data_pagamento).toLocaleDateString("pt-BR") : undefined,
          detalhes: pag ? `R$ ${pag.valor.toFixed(2)}` : "Será criado quando OS for concluída",
        },
      ];

      setEtapas(novasEtapas);
    } catch (err) {
      console.error("Erro ao carregar timeline:", err);
    } finally {
      setLoading(false);
    }
  }

  const getStatusOrçamento = (status?: string) => {
    if (!status) return "aguardando";
    if (status === "aprovado") return "concluido";
    if (status === "rascunho" || status === "enviado") return "em_progresso";
    return "aguardando";
  };

  const getStatusOS = (status?: string) => {
    if (!status) return "aguardando";
    if (status === "concluida") return "concluido";
    if (status === "aberta") return "em_progresso";
    return "aguardando";
  };

  const getStatusPagamento = (status?: string) => {
    if (!status) return "aguardando";
    if (status === "pago") return "concluido";
    if (status === "pendente") return "em_progresso";
    return "aguardando";
  };

  const getStatusLabel = (status?: string) => {
    const labels: Record<string, string> = {
      rascunho: "Rascunho",
      enviado: "Enviado",
      aprovado: "Aprovado",
      rejeitado: "Rejeitado",
      faturado: "Faturado",
      aberta: "Em progresso",
      concluida: "Concluída",
      cancelada: "Cancelada",
      pendente: "Pendente",
      pago: "Pago",
      cancelado: "Cancelado",
    };
    return labels[status || ""] || "—";
  };

  const getStatusColor = (status?: string) => {
    const colors: Record<string, string> = {
      rascunho: "#a855f7",
      enviado: "#3b82f6",
      aprovado: "#22c55e",
      rejeitado: "#ef4444",
      faturado: "#0bd0d7",
      aberta: "#f59e0b",
      concluida: "#22c55e",
      cancelada: "#6b7280",
      pendente: "#f59e0b",
      pago: "#22c55e",
      cancelado: "#6b7280",
    };
    return colors[status || ""] || "#8da2b4";
  };

  const getStatusIcon = (status: Etapa["status"]) => {
    if (status === "concluido") return <CheckCircle2 size={20} style={{ color: "#22c55e" }} />;
    if (status === "em_progresso") return <Clock size={20} style={{ color: "#f59e0b" }} />;
    return <AlertCircle size={20} style={{ color: "#8da2b4" }} />;
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#8da2b4" }}>
        Carregando timeline...
      </div>
    );
  }

  return (
    <div style={{ padding: "0" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr auto 1fr",
          gap: "1rem",
          alignItems: "stretch",
          marginBottom: "2rem",
        }}
      >
        {etapas.map((etapa, idx) => (
          <div key={etapa.id}>
            {/* Card da Etapa */}
            <div
              style={{
                background: "rgba(6, 34, 53, 0.6)",
                border: `2px solid ${etapa.statusColor}20`,
                borderRadius: "12px",
                padding: "1.5rem",
                textAlign: "center",
                position: "relative",
              }}
            >
              {/* Ícone da etapa */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "1rem",
                  color: etapa.statusColor,
                }}
              >
                {etapa.icon}
              </div>

              {/* Título */}
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#eaf3f8",
                  marginBottom: "0.5rem",
                }}
              >
                {etapa.titulo}
              </h3>

              {/* Status Visual */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  marginBottom: "1rem",
                  fontSize: "12px",
                  color: etapa.statusColor,
                  fontWeight: 600,
                }}
              >
                {getStatusIcon(etapa.status)}
                {etapa.statusLabel}
              </div>

              {/* Dados */}
              {etapa.data && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "#8da2b4",
                    marginBottom: "0.5rem",
                    borderTop: "1px solid rgba(19, 200, 211, 0.16)",
                    paddingTop: "1rem",
                  }}
                >
                  {etapa.data}
                </div>
              )}

              {etapa.detalhes && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "#0bd0d7",
                    fontWeight: 500,
                  }}
                >
                  {etapa.detalhes}
                </div>
              )}

              {!etapa.data && (
                <div
                  style={{
                    fontSize: "12px",
                    color: "#8da2b4",
                    fontStyle: "italic",
                    marginTop: "0.5rem",
                  }}
                >
                  {etapa.detalhes}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Setas de conexão (ficam entre os cards) */}
        {[0, 1].map((idx) => (
          <div
            key={`arrow-${idx}`}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0bd0d7",
            }}
          >
            <ChevronRight size={24} />
          </div>
        ))}
      </div>

      {/* Resumo no rodapé */}
      <div
        style={{
          background: "rgba(13, 208, 215, 0.05)",
          border: "1px solid rgba(13, 208, 215, 0.2)",
          borderRadius: "8px",
          padding: "1rem",
          fontSize: "12px",
          color: "#8da2b4",
          textAlign: "center",
        }}
      >
        <p>
          ✨ Este é o fluxo automático: ao aprovar o orçamento, a OS será criada automaticamente. Quando a OS
          for concluída, o pagamento será criado e ficará pendente.
        </p>
      </div>
    </div>
  );
}
