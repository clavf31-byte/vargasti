import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertCircle, CheckCircle2, Clock, DollarSign, FileText, Wrench
} from "lucide-react";

type Etapa = {
  id: string;
  titulo: string;
  descricao: string;
  icon: React.ReactNode;
  status: "concluido" | "em_progresso" | "aguardando";
  statusColor: string;
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
          descricao: orc ? `${orc.numero_formatado} • R$ ${orc.total.toFixed(2)}` : "—",
          icon: <FileText size={24} />,
          status: getStatusOrçamento(orc?.status_enum),
          statusColor: getStatusColor(orc?.status_enum),
        },
        {
          id: "os",
          titulo: "Ordem de Serviço",
          descricao: os ? `${os.numero_formatado}` : "Será criada automaticamente",
          icon: <Wrench size={24} />,
          status: os ? getStatusOS(os.status) : "aguardando",
          statusColor: os ? getStatusColor(os.status) : "#8da2b4",
        },
        {
          id: "pagamento",
          titulo: "Pagamento",
          descricao: pag ? `R$ ${pag.valor.toFixed(2)}` : "Será criado ao concluir",
          icon: <DollarSign size={24} />,
          status: pag ? getStatusPagamento(pag.status) : "aguardando",
          statusColor: pag ? getStatusColor(pag.status) : "#8da2b4",
        },
      ];

      setEtapas(novasEtapas);
    } catch (err) {
      console.error("Erro ao carregar timeline:", err);
    } finally {
      setLoading(false);
    }
  }

  const getStatusOrçamento = (status?: string | null) => {
    if (!status) return "aguardando";
    if (status === "aprovado") return "concluido";
    if (status === "rascunho" || status === "enviado") return "em_progresso";
    return "aguardando";
  };

  const getStatusOS = (status?: string | null) => {
    if (!status) return "aguardando";
    if (status === "concluida") return "concluido";
    if (status === "aberta") return "em_progresso";
    return "aguardando";
  };

  const getStatusPagamento = (status?: string | null) => {
    if (!status) return "aguardando";
    if (status === "pago") return "concluido";
    if (status === "pendente") return "em_progresso";
    return "aguardando";
  };

  const getStatusLabel = (status?: string | null) => {
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

  const getStatusColor = (status?: string | null) => {
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
    <div style={{ padding: "2rem", background: "rgba(6, 34, 53, 0.6)", borderRadius: "12px" }}>
      <h3 style={{ fontSize: "12px", fontWeight: 700, color: "#8da2b4", marginBottom: "2rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Progresso
      </h3>

      {/* Timeline Horizontal */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          position: "relative",
          paddingBottom: "2rem",
        }}
      >
        {/* Linha conectora de fundo */}
        <div
          style={{
            position: "absolute",
            top: "30px",
            left: "0",
            right: "0",
            height: "2px",
            background: "rgba(13, 208, 215, 0.2)",
            zIndex: 0,
          }}
        />

        {etapas.map((etapa, idx) => {
          const isConcluido = etapa.status === "concluido";
          const isEmProgresso = etapa.status === "em_progresso";

          return (
            <div
              key={etapa.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                flex: 1,
                position: "relative",
                zIndex: 1,
              }}
            >
              {/* Círculo do progresso */}
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: isConcluido || isEmProgresso ? etapa.statusColor : "transparent",
                  border: `2px solid ${etapa.statusColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.5rem",
                  color: isConcluido || isEmProgresso ? "white" : etapa.statusColor,
                  flexShrink: 0,
                  boxShadow: (isConcluido || isEmProgresso) ? `0 0 20px ${etapa.statusColor}40` : "none",
                }}
              >
                {etapa.icon}
              </div>

              {/* Label e descrição */}
              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#eaf3f8",
                    margin: "0 0 0.5rem 0",
                  }}
                >
                  {etapa.titulo}
                </p>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#8da2b4",
                    margin: "0",
                  }}
                >
                  {etapa.descricao}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
