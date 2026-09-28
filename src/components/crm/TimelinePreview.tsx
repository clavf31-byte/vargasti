import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Wrench, DollarSign } from "lucide-react";

interface TimelinePreviewProps {
  orcamentoId: string;
  userId: string;
}

type EtapaStatus = "concluido" | "em_progresso" | "aguardando";

export function TimelinePreview({ orcamentoId, userId }: TimelinePreviewProps) {
  const [statuses, setStatuses] = useState<{
    orc: EtapaStatus;
    os: EtapaStatus;
    pag: EtapaStatus;
  }>({
    orc: "aguardando",
    os: "aguardando",
    pag: "aguardando",
  });

  useEffect(() => {
    loadStatuses();
  }, [orcamentoId, userId]);

  async function loadStatuses() {
    try {
      const { data: orc } = await supabase
        .from("orcamentos")
        .select("status_enum")
        .eq("id", orcamentoId)
        .eq("user_id", userId)
        .single();

      const { data: os } = await supabase
        .from("ordens_servico")
        .select("status")
        .eq("orcamento_id", orcamentoId)
        .eq("user_id", userId)
        .maybeSingle();

      const { data: pag } = await supabase
        .from("pagamentos")
        .select("status")
        .eq("orcamento_id", orcamentoId)
        .eq("user_id", userId)
        .maybeSingle();

      const getOrcStatus = (s?: string): EtapaStatus => {
        if (!s) return "aguardando";
        if (s === "aprovado") return "concluido";
        if (["rascunho", "enviado"].includes(s)) return "em_progresso";
        return "aguardando";
      };

      const getOsStatus = (s?: string): EtapaStatus => {
        if (!s) return "aguardando";
        if (s === "concluida") return "concluido";
        if (s === "aberta") return "em_progresso";
        return "aguardando";
      };

      const getPagStatus = (s?: string): EtapaStatus => {
        if (!s) return "aguardando";
        if (s === "pago") return "concluido";
        if (s === "pendente") return "em_progresso";
        return "aguardando";
      };

      setStatuses({
        orc: getOrcStatus(orc?.status_enum),
        os: getOsStatus(os?.status),
        pag: getPagStatus(pag?.status),
      });
    } catch (err) {
      console.error("Erro ao carregar timeline preview:", err);
    }
  }

  const getColor = (status: EtapaStatus) => {
    if (status === "concluido") return "#22c55e";
    if (status === "em_progresso") return "#f59e0b";
    return "#8da2b4";
  };

  const getCircle = (status: EtapaStatus) => {
    if (status === "concluido" || status === "em_progresso") {
      return (
        <div
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            background: getColor(status),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "white",
            flexShrink: 0,
          }}
        >
          {status === "concluido" ? "✓" : "•"}
        </div>
      );
    }
    return (
      <div
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          border: `2px solid ${getColor(status)}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      />
    );
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "flex-start",
        gap: "2rem",
        padding: "0.5rem 0",
        fontSize: "11px",
        color: "#8da2b4",
      }}
    >
      {/* Orçamento */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
        {getCircle(statuses.orc)}
        <span style={{ fontWeight: 500, whiteSpace: "nowrap" }}>Orçamento</span>
      </div>

      {/* Seta */}
      <span style={{ color: "#0bd0d7", fontSize: "16px", marginBottom: "1rem" }}>→</span>

      {/* OS */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
        {getCircle(statuses.os)}
        <span style={{ fontWeight: 500, whiteSpace: "nowrap" }}>OS</span>
      </div>

      {/* Seta */}
      <span style={{ color: "#0bd0d7", fontSize: "16px", marginBottom: "1rem" }}>→</span>

      {/* Pagamento */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
        {getCircle(statuses.pag)}
        <span style={{ fontWeight: 500, whiteSpace: "nowrap" }}>Pagamento</span>
      </div>
    </div>
  );
}
